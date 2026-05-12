const db = require('../src/db');

async function run() {
  try {
    await db.query("INSERT INTO permissions (`key`, label) VALUES ('kontak:edit', 'Mengedit Informasi Kontak') ON DUPLICATE KEY UPDATE label='Mengedit Informasi Kontak'");
    console.log('Permission kontak:edit added/updated');
    
    // Also give it to superadmin by default
    const [roles] = await db.query("SELECT id FROM roles WHERE name = 'superadmin'");
    if (roles.length > 0) {
      const [perms] = await db.query("SELECT id FROM permissions WHERE `key` = 'kontak:edit'");
      if (perms.length > 0) {
        await db.query("INSERT IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)", [roles[0].id, perms[0].id]);
        console.log('Permission granted to superadmin');
        
        // Update superadmin's granted_menus in users table
        const [superadmins] = await db.query("SELECT id, granted_menus FROM users WHERE role = 'superadmin'");
        for (const user of superadmins) {
            let menus = [];
            try {
                menus = JSON.parse(user.granted_menus || '[]');
            } catch (e) { menus = []; }
            if (!menus.includes('kontak:edit')) {
                menus.push('kontak:edit');
                await db.query("UPDATE users SET granted_menus = ? WHERE id = ?", [JSON.stringify(menus), user.id]);
            }
        }
      }
    }
  } catch (err) {
    console.error(err);
  } finally {
    process.exit();
  }
}

run();
