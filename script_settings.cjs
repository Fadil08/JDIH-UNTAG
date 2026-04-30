require('dotenv').config({ path: './src/api/.env' });
const db = require('./src/api/src/db.js');
async function run() {
  try {
    const conn = await db.getConnection();
    await conn.query(`
      CREATE TABLE IF NOT EXISTS settings (
        setting_key VARCHAR(50) PRIMARY KEY,
        setting_value TEXT,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Settings table created.');
    
    // Insert default values
    const defaults = [
      ['app_name', 'JDIH UNTAG Banyuwangi'],
      ['unit_name', 'Biro Hukum dan Organisasi'],
      ['app_description', 'Jaringan Dokumentasi dan Informasi Hukum Universitas 17 Agustus 1945 Banyuwangi'],
      ['contact_email', 'jdih@untag-banyuwangi.ac.id'],
      ['contact_phone', '(0333) 123456'],
      ['logo_url', '']
    ];
    
    for (const [key, val] of defaults) {
      await conn.query('INSERT IGNORE INTO settings (setting_key, setting_value) VALUES (?, ?)', [key, val]);
    }
    console.log('Default settings inserted.');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
