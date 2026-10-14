require('dotenv').config();

const config = {
  port: process.env.SOCKET_GATEWAY_PORT || 13001,
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  dbHost: process.env.DB_HOST || '192.168.110.220',
  dbPort: process.env.DB_PORT || 25432,
  dbUser: process.env.DB_USER || 'postgres',
  dbPassword: process.env.DB_PASSWORD || 'admin123',
  dbName: process.env.DB_NAME || 'photobox',
  corsOrigins: process.env.CORS_ORIGINS || 'http://localhost:5173',
};

module.exports = config;
