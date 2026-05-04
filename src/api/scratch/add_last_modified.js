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
    console.log('Adding last_modified_by to artikel table...');
    await connection.query("ALTER TABLE artikel ADD COLUMN last_modified_by INT UNSIGNED NULL AFTER created_by");
    await connection.query("ALTER TABLE artikel ADD CONSTRAINT fk_artikel_last_modified FOREIGN KEY (last_modified_by) REFERENCES users(id) ON DELETE SET NULL");
    console.log('Success!');
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await connection.end();
  }
}

fix();
