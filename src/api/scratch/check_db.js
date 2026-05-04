const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'd:/aplikasi/JDIH Untag/src/api/.env' });

async function check() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '123',
    database: process.env.DB_NAME || 'jdih_untag'
  });

  try {
    const [rows] = await connection.query("DESCRIBE artikel");
    console.table(rows);
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

check();
