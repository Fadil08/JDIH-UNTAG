const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function migrate() {
  const { DB_HOST, DB_PORT, DB_USER, DB_PASS, DB_NAME } = process.env;

  console.log('Menghubungkan ke MySQL server...');
  const connection = await mysql.createConnection({
    host: DB_HOST || 'localhost',
    port: parseInt(DB_PORT || '3306', 10),
    user: DB_USER || 'root',
    password: DB_PASS || '123',
    multipleStatements: true
  });

  try {
    console.log(`Membuat database ${DB_NAME} jika belum ada...`);
    await connection.query(`CREATE DATABASE IF NOT EXISTS ${DB_NAME} CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
    console.log(`Menggunakan database ${DB_NAME}...`);
    await connection.query(`USE ${DB_NAME}`);

    const schemaPath = path.join(__dirname, '../../../../database/schema.sql');
    console.log(`Mengeksekusi schema dari: ${schemaPath}`);
    let schemaSql = fs.readFileSync(schemaPath, 'utf8');
    schemaSql = schemaSql.replace(/USE `?jdih_untag`?;/g, `USE \`${DB_NAME}\`;`);
    await connection.query(schemaSql);
    console.log('Schema berhasil dieksekusi.');

    const seedPath = path.join(__dirname, '../../../../database/seed.sql');
    console.log(`Mengeksekusi seed dari: ${seedPath}`);
    let seedSql = fs.readFileSync(seedPath, 'utf8');
    seedSql = seedSql.replace(/USE `?jdih_untag`?;/g, `USE \`${DB_NAME}\`;`);
    await connection.query(seedSql);
    console.log('Seed berhasil dieksekusi.');

    console.log('Migrasi database selesai secara keseluruhan!');
  } catch (error) {
    console.error('Terjadi kesalahan saat migrasi:', error);
  } finally {
    await connection.end();
  }
}

migrate();
