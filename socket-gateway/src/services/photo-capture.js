// Photo capture service - trigger photo capture in a session

function triggerCapture(io, sessionCode, captureData) {
  const room = `session_${sessionCode}`;
  io.to(room).emit('photo:captured', {
    sessionId: sessionCode,
    imageData: captureData,
    timestamp: Date.now(),
  });
  console.log(`Photo capture triggered for session ${sessionCode}`);
}

module.exports = { triggerCapture };
