# PostgreSQL
CREATE USER photobox WITH PASSWORD 'photobox';
CREATE DATABASE photobox OWNER photobox;

GRANT ALL PRIVILEGES ON DATABASE photobox TO photobox;
