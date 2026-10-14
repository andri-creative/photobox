const { Client } = require('pg');
const config = require('../config/env');

const client = new Client({
  host: config.dbHost,
  port: parseInt(config.dbPort, 10),
  user: config.dbUser,
  password: config.dbPassword,
  database: config.dbName,
});

async function connect() {
  await client.connect();
  console.log('Socket gateway: PostgreSQL connected');
}

async function getActiveToken(sessionId, token) {
  const result = await client.query(
    `SELECT id, session_id, token, guest_id, used, created_at
     FROM tokens
     WHERE session_id = $1 AND token = $2
     LIMIT 1`,
    [sessionId, token]
  );
  return result.rows[0] || null;
}

async function markTokenUsed(tokenId, guestId) {
  await client.query(
    `UPDATE tokens SET used = TRUE, guest_id = $2 WHERE id = $1`,
    [tokenId, guestId]
  );
}

const TOKEN_TTL_MS = 30 * 60 * 1000;

async function validateJoinToken(sessionId, token, userId) {
  const tokenRecord = await getActiveToken(sessionId, token);
  if (!tokenRecord) {
    return { valid: false, error: 'INVALID_OR_USED_TOKEN' };
  }

  if (tokenRecord.used) {
    return { valid: false, error: 'TOKEN_ALREADY_USED' };
  }

  const createdAt = new Date(tokenRecord.created_at).getTime();
  if (Date.now() - createdAt > TOKEN_TTL_MS) {
    return { valid: false, error: 'TOKEN_EXPIRED' };
  }

  await markTokenUsed(tokenRecord.id, userId);
  return { valid: true, tokenRecord };
}

async function close() {
  await client.end();
}

module.exports = { connect, getActiveToken, markTokenUsed, validateJoinToken, close };
