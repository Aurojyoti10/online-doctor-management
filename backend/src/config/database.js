const mysql = require('mysql2/promise');

const databasePort = Number.parseInt(process.env.DB_PORT, 10);

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  port: Number.isNaN(databasePort) ? 3306 : databasePort,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

module.exports = pool;
