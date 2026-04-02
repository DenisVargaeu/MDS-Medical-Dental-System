const mysql = require('mysql2/promise');
require('dotenv').config();

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  database: process.env.DB_NAME || 'mds_db',
  waitForConnections: true,
  connectionLimit: 20,
  queueLimit: 0,
  charset: 'utf8mb4',
  timezone: '+00:00'
});

pool.getConnection()
  .then(conn => {
    console.log('[DB] Connected to MySQL successfully');
    conn.release();
  })
  .catch(err => {
    console.error('[DB] Connection failed:', err.message);
  });

module.exports = pool;
