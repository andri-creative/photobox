// Tracks users present in each session room
const sessionUsers = new Map(); // sessionCode → Map<userId, { username, joinedAt }>

function addUser(sessionCode, userId, username) {
  if (!sessionUsers.has(sessionCode)) {
    sessionUsers.set(sessionCode, new Map());
  }
  const users = sessionUsers.get(sessionCode);
  users.set(userId, { username, joinedAt: Date.now() });
  return users;
}

function removeUser(sessionCode, userId) {
  const users = sessionUsers.get(sessionCode);
  if (users) {
    users.delete(userId);
    if (users.size === 0) {
      sessionUsers.delete(sessionCode);
    }
  }
}

function getRoomUsers(sessionCode) {
  const users = sessionUsers.get(sessionCode);
  if (!users) return [];
  return Array.from(users.entries()).map(([id, data]) => ({
    userId: id,
    username: data.username,
    joinedAt: data.joinedAt,
  }));
}

module.exports = { addUser, removeUser, getRoomUsers };
