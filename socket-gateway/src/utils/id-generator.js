const { randomUUID } = require('crypto');

// Active socket registry: socketId → { userId, lastPing }
const activeSockets = new Map();

function generateSocketId() {
    return randomUUID();
}

function registerSocket(socket, userId) {
    const socketId = socket.id;

    // If user already has an active socket, kick the old one (takeover)
    for (const [sid, data] of activeSockets.entries()) {
        if (data.userId === userId && sid !== socketId) {
            const oldSocket = socket.nsp.sockets.get(sid);
            if (oldSocket) {
                oldSocket.disconnect(true);
                activeSockets.delete(sid);
                console.log(`Kicked old socket ${sid} for user ${userId}`);
            }
        }
    }

    activeSockets.set(socketId, { userId, lastPing: Date.now() });
    return socketId;
}

function updatePing(socketId) {
    const data = activeSockets.get(socketId);
    if (data) {
        data.lastPing = Date.now();
    }
}

function removeSocket(socketId, userId) {
    const data = activeSockets.get(socketId);
    if (data && data.userId === userId) {
        activeSockets.delete(socketId);
    }
}

module.exports = { generateSocketId, registerSocket, updatePing, removeSocket, activeSockets };
