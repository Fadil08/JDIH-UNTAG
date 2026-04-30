const mysql = require('mysql2/promise');
require('dotenv').config({ path: './.env' });

async function run() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    database: process.env.DB_NAME || 'jdih_untag',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASS || '',
  });

  console.log('Connected to DB');
  
  // 1. Create table status_dokumen
  await conn.query(`
    CREATE TABLE IF NOT EXISTS status_dokumen (
      id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
      nama VARCHAR(255) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
  `);
  console.log('Table status_dokumen checked/created');

  // 2. Insert default statuses if table is empty
  const [rows] = await conn.query('SELECT COUNT(*) as cnt FROM status_dokumen');
  if (rows[0].cnt === 0) {
    const defaultStatuses = [
      ['Berlaku'], ['Tidak Berlaku'], ['Dicabut'], ['Diubah'], ['Mencabut'], ['Mengubah'], ['Menjabarkan']
    ];
    await conn.query('INSERT INTO status_dokumen (nama) VALUES ?', [defaultStatuses]);
    console.log('Inserted default statuses');
  }

  // 3. Alter dokumen table to remove ENUM constraint on status
  try {
    await conn.query(`ALTER TABLE dokumen MODIFY COLUMN status VARCHAR(255) NOT NULL DEFAULT 'Berlaku'`);
    console.log('Altered dokumen.status to VARCHAR(255)');
  } catch (err) {
    console.log('Error altering dokumen:', err.message);
  }

  // 4. Add permission for status_dokumen
  try {
    await conn.query(`INSERT IGNORE INTO permissions (\`key\`, label) VALUES 
      ('status:view', 'Status Dokumen - Lihat'), 
      ('status:create', 'Status Dokumen - Tambah'), 
      ('status:edit', 'Status Dokumen - Edit'), 
      ('status:delete', 'Status Dokumen - Hapus')`);
    
    // Grant to superadmin and admin
    const roles = ['superadmin', 'admin'];
    const perms = ['status:view', 'status:create', 'status:edit', 'status:delete'];
    
    for (const roleName of roles) {
      const [roleRows] = await conn.query('SELECT id FROM roles WHERE name = ?', [roleName]);
      if (roleRows.length > 0) {
        for (const p of perms) {
          const [pRows] = await conn.query('SELECT id FROM permissions WHERE \`key\` = ?', [p]);
          if (pRows.length > 0) {
            await conn.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)', [roleRows[0].id, pRows[0].id]);
          }
        }
      }
    }
    console.log('Added permissions for status_dokumen');
  } catch (err) {
    console.log('Error adding permissions:', err.message);
  }

  // 5. Update auth ALL_MENUS simulation (we will do this in the code too)
  await conn.end();
  console.log('Done!');
}

run().catch(err => { console.error(err); process.exit(1); });
