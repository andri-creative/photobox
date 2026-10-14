const { createServer } = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const express = require('express');
const config = require('../config/env');
const { authMiddleware, rateLimitMiddleware, heartbeatCheck } = require('../middleware/auth');
const { registerSocket, removeSocket, updatePing, activeSockets } = require('../utils/id-generator');
const { validateJoinToken } = require('../services/token-validator');
const { addUser, removeUser, getRoomUsers } = require('../services/presence');
const { setLastFrame } = require('../services/camera-stream');
const { triggerCapture } = require('../services/photo-capture');

function setupSocket(io) {
  const roomCache = new Map(); // sessionCode → active socket info

  io.on('connection', async (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // Heartbeat
    socket.on('ping', (data) => {
      updatePing(socket.id);
      socket.emit('pong', { serverTime: Date.now() });
    });

    // Session join
    socket.on('session:join', async (data) => {
      const { sessionId, token, userId } = data;
      try {
        const result = await validateJoinToken(sessionId, token, userId);
        if (!result.valid) {
          return socket.emit('session:join:error', {
            error: result.error,
          });
        }

        const room = `session_${sessionId}`;
        socket.join(room);
        addUser(sessionId, userId, socket.user?.username);

        socket.emit('session:join:success', {
          sessionId,
          sessionCode: sessionId,
          usersInRoom: getRoomUsers(sessionId),
        });

        socket.to(room).emit('user:joined', {
          userId,
          username: socket.user?.username,
          socketId: socket.id,
        });
        console.log(`User ${userId} joined session ${sessionId}`);
      } catch (err) {
        console.error('Session join error:', err);
        socket.emit('session:join:error', { error: 'INTERNAL_ERROR' });
      }
    });

    // Session leave
    socket.on('session:leave', (data) => {
      const { sessionId } = data;
      if (sessionId) {
        const room = `session_${sessionId}`;
        socket.leave(room);
        removeUser(sessionId, socket.user?.id);
        socket.to(room).emit('user:left', {
          userId: socket.user?.id,
          socketId: socket.id,
        });
        console.log(`User ${socket.user?.id} left session ${sessionId}`);
      }
    });

    // Position update
    socket.on('position:update', (data) => {
      const { sessionId, x, y, scale } = data;
      if (sessionId) {
        const room = `session_${sessionId}`;
        socket.to(room).emit('position:changed', {
          userId: socket.user?.id,
          username: socket.user?.username,
          x,
          y,
          scale,
          serverTime: Date.now(),
        });
      }
    });

    // Camera feed (host sends frames, gateway forwards to guests)
    socket.on('camera:feed', (data) => {
      const { sessionId, frame, seq } = data;
      if (sessionId) {
        setLastFrame(sessionId, { frame, seq });
        const room = `session_${sessionId}`;
        socket.to(room).emit('camera:feed', {
          frame,
          seq,
          timestamp: Date.now(),
        });
      }
    });

    // Background changed
    socket.on('background:changed', (data) => {
      const { sessionId, bgUrl } = data;
      if (sessionId) {
        const room = `session_${sessionId}`;
        socket.to(room).emit('background:changed', {
          bgUrl,
          timestamp: Date.now(),
        });
      }
    });

    // Photo capture trigger
    socket.on('photo:capture', (data) => {
      const { sessionId, imageData } = data;
      if (sessionId) {
        triggerCapture(io, sessionId, imageData);
      }
    });

    // Disconnect
    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${socket.id}`);
      removeSocket(socket.id, socket.user?.id);
      for (const [sessionCode] of roomCache.entries()) {
        removeUser(sessionCode, socket.user?.id);
      }
    });
  });

  // Heartbeat stale check
  heartbeatCheck(io, activeSockets);
}

function createGateway() {
  const app = express();
  app.use(cors({ origin: config.corsOrigins }));
  app.get('/health', (req, res) => res.json({ status: 'ok' }));

  const server = createServer(app);
  const io = new Server(server, {
    cors: { origin: config.corsOrigins, credentials: true },
  });

  // Socket.IO auth middleware
  io.use(async (socket, next) => {
    try {
      await new Promise((resolve, reject) => {
        authMiddleware(socket, (err) => (err ? reject(err) : resolve()));
      });
      await new Promise((resolve, reject) => {
        rateLimitMiddleware(socket, (err) => (err ? reject(err) : resolve()));
      });
      next();
    } catch (err) {
      next(new Error(err.message));
    }
  });

  setupSocket(io);

  server.listen(config.port, () => {
    console.log(`Socket gateway running on port ${config.port}`);
  });

  return { io, server, app };
}

module.exports = { createGateway };
