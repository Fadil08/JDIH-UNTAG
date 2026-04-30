require('dotenv').config();
const db = require('./src/db.js');
async function run() {
  try {
    const conn = await db.getConnection();
    const perms = [
      ['settings:view', 'Lihat Pengaturan'],
      ['settings:edit', 'Ubah Pengaturan']
    ];
    for (const [key, label] of perms) {
      await conn.query('INSERT IGNORE INTO permissions (`key`, label) VALUES (?, ?)', [key, label]);
    }
    
    // Also add them to superadmin role (role_id = 1)
    for (const [key, label] of perms) {
      const [perm] = await conn.query('SELECT id FROM permissions WHERE `key` = ?', [key]);
      if (perm.length > 0) {
        await conn.query('INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (1, ?)', [perm[0].id]);
      }
    }
    
    // And update superadmin's granted_menus
    const [saUsers] = await conn.query('SELECT id, granted_menus FROM users WHERE role = "superadmin"');
    for (const user of saUsers) {
      let menus = [];
      try { menus = JSON.parse(user.granted_menus || '[]'); } catch(e) {}
      if (!menus.includes('settings:view')) menus.push('settings:view');
      if (!menus.includes('settings:edit')) menus.push('settings:edit');
      await conn.query('UPDATE users SET granted_menus = ? WHERE id = ?', [JSON.stringify(menus), user.id]);
    }
    
    console.log('Permissions inserted.');
    process.exit(0);
  } catch(e) {
    console.error(e);
    process.exit(1);
  }
}
run();
