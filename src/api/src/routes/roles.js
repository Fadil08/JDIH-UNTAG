const router = require('express').Router();
const db = require('../db');
const { authMiddleware, requireMenu } = require('../middleware/auth');

// ── Helper: log aktivitas ─────────────────────────────────────────────────────
async function log(conn, { action, targetId, targetTitle, performedBy }) {
  await conn.query(
    'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
    [action, 'role', String(targetId), targetTitle, performedBy]
  );
}

// ── GET /api/roles (List all roles) ──────────────────────────────────────────
router.get('/', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM roles ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data peran' });
  }
});

// ── GET /api/roles/with-permissions (Roles with their permissions) ────────────
router.get('/with-permissions', authMiddleware, requireMenu('roleManagement:view'), async (req, res) => {
  try {
    const [roles] = await db.query('SELECT * FROM roles ORDER BY id ASC');
    const [perms] = await db.query(`
      SELECT rp.role_id, p.key 
      FROM role_permissions rp
      JOIN permissions p ON rp.permission_id = p.id
    `);

    const result = roles.map(role => ({
      ...role,
      permissions: perms.filter(p => p.role_id === role.id).map(p => p.key)
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data peran dan izin' });
  }
});

// ── GET /api/permissions (All available permissions) ───────────────────────────
router.get('/permissions', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM permissions ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data izin' });
  }
});

// ── POST /api/roles (Create new role) ──────────────────────────────────────────
router.post('/', authMiddleware, requireMenu('roleManagement:create'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { name, label, description, permissions } = req.body;
    if (!name || !label) return res.status(400).json({ error: 'Nama dan Label wajib diisi' });

    const [result] = await conn.query(
      'INSERT INTO roles (name, label, description, is_system) VALUES (?, ?, ?, 0)',
      [name.toLowerCase().replace(/\s+/g, '_'), label, description || '']
    );
    const roleId = result.insertId;

    if (Array.isArray(permissions) && permissions.length > 0) {
      const [permRows] = await conn.query('SELECT id FROM permissions WHERE `key` IN (?)', [permissions]);
      const mapping = permRows.map(p => [roleId, p.id]);
      if (mapping.length > 0) {
        await conn.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [mapping]);
      }
    }

    await log(conn, {
      action: `Menambah peran baru "${label}" dengan ${Array.isArray(permissions) ? permissions.length : 0} izin`,
      targetId: roleId,
      targetTitle: label,
      performedBy: req.user.id,
    });

    await conn.commit();
    res.status(201).json({ id: roleId, success: true });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Gagal membuat peran baru' });
  } finally {
    conn.release();
  }
});

// ── PUT /api/roles/:id (Update role) ──────────────────────────────────────────
router.put('/:id', authMiddleware, requireMenu('roleManagement:edit'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { label, description, permissions } = req.body;

    // Ambil nama role lama untuk konteks log
    const [existingRole] = await conn.query('SELECT * FROM roles WHERE id = ?', [req.params.id]);
    if (existingRole.length === 0) return res.status(404).json({ error: 'Peran tidak ditemukan' });

    await conn.query(
      'UPDATE roles SET label=?, description=? WHERE id=? AND is_system=0',
      [label, description || '', req.params.id]
    );

    // Sinkronisasi permissions
    await conn.query('DELETE FROM role_permissions WHERE role_id = ?', [req.params.id]);
    if (Array.isArray(permissions) && permissions.length > 0) {
      const [permRows] = await conn.query('SELECT id FROM permissions WHERE `key` IN (?)', [permissions]);
      const mapping = permRows.map(p => [req.params.id, p.id]);
      if (mapping.length > 0) {
        await conn.query('INSERT INTO role_permissions (role_id, permission_id) VALUES ?', [mapping]);
      }
    }

    // Sinkronisasi hak akses ke tabel users
    const [roleRow] = await conn.query('SELECT name FROM roles WHERE id = ?', [req.params.id]);
    if (roleRow.length > 0) {
      const roleName = roleRow[0].name;
      const menusJson = JSON.stringify(Array.isArray(permissions) ? permissions : []);
      await conn.query('UPDATE users SET granted_menus = ? WHERE role = ?', [menusJson, roleName]);
    }

    await log(conn, {
      action: `Mengupdate peran "${existingRole[0].label}" → izin diperbarui (${Array.isArray(permissions) ? permissions.length : 0} izin aktif)`,
      targetId: req.params.id,
      targetTitle: label || existingRole[0].label,
      performedBy: req.user.id,
    });

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Gagal memperbarui peran' });
  } finally {
    conn.release();
  }
});

// ── DELETE /api/roles/:id ──────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, requireMenu('roleManagement:delete'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.query('SELECT * FROM roles WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Peran tidak ditemukan' });
    if (existing[0].is_system) return res.status(400).json({ error: 'Peran sistem tidak dapat dihapus' });

    await conn.query('DELETE FROM roles WHERE id = ?', [req.params.id]);
    await log(conn, {
      action: `Menghapus peran "${existing[0].label}"`,
      targetId: req.params.id,
      targetTitle: existing[0].label,
      performedBy: req.user.id,
    });

    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus peran' });
  } finally {
    conn.release();
  }
});

module.exports = router;
