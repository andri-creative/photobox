// Forward camera frames between host and guests
// Host sends frames → gateway broadcasts to all guests in the session

const sessionFrameCache = new Map(); // sessionCode → { lastFrame, seq }

function setLastFrame(sessionCode, frameData) {
  sessionFrameCache.set(sessionCode, {
    lastFrame: frameData,
    seq: frameData.seq,
    timestamp: Date.now(),
  });
}

function getLastFrame(sessionCode) {
  return sessionFrameCache.get(sessionCode) || null;
}

module.exports = { setLastFrame, getLastFrame };
