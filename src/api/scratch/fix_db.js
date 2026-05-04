const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'd:/aplikasi/JDIH Untag/src/api/.env' });

async function fix() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '123',
    database: process.env.DB_NAME || 'jdih_untag'
  });

  try {
    console.log('Adding created_by to artikel table...');
    await connection.query("ALTER TABLE artikel ADD COLUMN created_by INT UNSIGNED NULL AFTER tanggal_publikasi");
    await connection.query("ALTER TABLE artikel ADD CONSTRAINT fk_artikel_created_by FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL");
    console.log('Success!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

fix();
