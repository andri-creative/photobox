const jwt = require('jsonwebtoken');
const config = require('../config/env');

const rateLimit = new Map(); // userId → { count, resetTime }
const HEARTBEAT_TIMEOUT = 30 * 1000;

function authMiddleware(socket, next) {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('AUTH_TOKEN_MISSING'));
  }
  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    if (decoded.exp * 1000 < Date.now()) {
      return next(new Error('TOKEN_EXPIRED'));
    }
    socket.user = {
      id: decoded.userID,
      username: decoded.username,
      role: decoded.role,
    };
    next();
  } catch (err) {
    next(new Error('INVALID_TOKEN'));
  }
}

function rateLimitMiddleware(socket, next) {
  const userId = socket.user?.id;
  if (!userId) return next(new Error('NO_USER'));

  const now = Date.now();
  const windowMs = 60 * 1000;
  const maxAttempts = 3;

  let entry = rateLimit.get(userId);
  if (!entry || now > entry.resetTime) {
    entry = { count: 0, resetTime: now + windowMs };
    rateLimit.set(userId, entry);
  }

  entry.count++;
  if (entry.count > maxAttempts) {
    return next(new Error('RATE_LIMITED'));
  }
  next();
}

function heartbeatCheck(io, activeSockets) {
  setInterval(() => {
    const now = Date.now();
    activeSockets.forEach((data, socketId) => {
      if (now - data.lastPing > HEARTBEAT_TIMEOUT) {
        const socket = io.sockets.sockets.get(socketId);
        if (socket) {
          socket.disconnect(true);
          activeSockets.delete(socketId);
          console.log(`Removed stale socket ${socketId}`);
        }
      }
    });
  }, 10000);
}

module.exports = { authMiddleware, rateLimitMiddleware, heartbeatCheck };
