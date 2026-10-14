const { createGateway } = require('./server/socket');
const db = require('./services/token-validator');

async function main() {
  try {
    await db.connect();
    createGateway();
  } catch (err) {
    console.error('Failed to start socket gateway:', err);
    process.exit(1);
  }
}

main();
