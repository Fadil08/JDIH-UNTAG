require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'jdih_untag',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || '',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  timezone: '+07:00',
});

// Test koneksi saat startup
pool.getConnection()
  .then(conn => {
    console.log('✅ Database MySQL terkoneksi');
    conn.release();
  })
  .catch(err => {
    console.error('❌ Gagal koneksi ke database:', err.message);
    process.exit(1);
  });

module.exports = pool;
