const router = require('express').Router();
const db = require('../db');
const bcrypt = require('bcryptjs');
const { authMiddleware, requireSuperAdmin, requireMenu } = require('../middleware/auth');

const ALL_MENUS = [
  'dashboard:view',
  'dokumen:view', 'dokumen:create', 'dokumen:edit', 'dokumen:delete', 'dokumen:review',
  'kategori:view', 'kategori:create', 'kategori:edit', 'kategori:delete',
  'status:view', 'status:create', 'status:edit', 'status:delete',
  'berita:view', 'berita:create', 'berita:edit', 'berita:delete',
  'galeri:view', 'galeri:create', 'galeri:delete',
  'statistik:view',
  'userManagement:view', 'userManagement:create', 'userManagement:edit', 'userManagement:delete',
  'roleManagement:view', 'roleManagement:create', 'roleManagement:edit', 'roleManagement:delete',
  'tentang:view', 'tentang:edit',
  'kontak:edit',
  'settings:view', 'settings:edit',
  'activityLog:view',
];

function formatUser(row) {
  const grantedMenus = Array.isArray(row.granted_menus) ? row.granted_menus : (() => {
    try { return JSON.parse(row.granted_menus || '[]'); } catch { return []; }
  })();
  return {
    id: row.id,
    username: row.username,
    nama: row.nama,
    role: row.role,
    grantedMenus: row.role === 'superadmin' ? ALL_MENUS : grantedMenus,
    isActive: Boolean(row.is_active),
    addedBy: row.added_by,
    addedByNama: row.added_by_nama || null,
    createdAt: row.created_at,
  };
}

// ── GET /api/users ────────────────────────────────────────────────────────────
router.get('/', authMiddleware, requireMenu('userManagement:view'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT u.*, ab.nama AS added_by_nama
      FROM users u
      LEFT JOIN users ab ON u.added_by = ab.id
      ORDER BY u.created_at DESC
    `);
    res.json(rows.map(formatUser));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data pengguna' });
  }
});

// ── GET /api/users/permissions ────────────────────────────────────────────────
router.get('/permissions', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });

    const user = rows[0];
    const isAdmin = ['superadmin', 'admin'].includes(user.role);
    const grantedMenus = user.role === 'superadmin'
      ? ALL_MENUS
      : (Array.isArray(user.granted_menus) ? user.granted_menus : (() => { try { return JSON.parse(user.granted_menus || '[]'); } catch { return []; } })());

    res.json({ isAdmin, grantedMenus });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data permissions' });
  }
});

// ── GET /api/users/:id ────────────────────────────────────────────────────────
router.get('/:id', authMiddleware, requireMenu('userManagement:view'), async (req, res) => {
  try {
    const [rows] = await db.query('SELECT u.*, ab.nama AS added_by_nama FROM users u LEFT JOIN users ab ON u.added_by = ab.id WHERE u.id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    res.json(formatUser(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data pengguna' });
  }
});

// ── POST /api/users ───────────────────────────────────────────────────────────
router.post('/', authMiddleware, requireMenu('userManagement:create'), async (req, res) => {
  const { username, password, nama, role, grantedMenus, isActive } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username dan password wajib diisi' });
  try {
    const [roleRow] = await db.query('SELECT name FROM roles WHERE name = ?', [role]);
    if (roleRow.length === 0) {
      return res.status(400).json({ error: 'Role tidak valid' });
    }

    const [existing] = await db.query('SELECT id FROM users WHERE username = ?', [username]);
    if (existing.length > 0) return res.status(400).json({ error: 'Username sudah digunakan' });

    const hash = await bcrypt.hash(password, 12);
    const menus = Array.isArray(grantedMenus) ? grantedMenus : [];

    const [result] = await db.query(
      'INSERT INTO users (username, password_hash, nama, role, granted_menus, is_active, added_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [username, hash, nama || null, role || 'staff', JSON.stringify(menus), isActive !== false ? 1 : 0, req.user.id]
    );

    await db.query(
      'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
      ['Menambah pengguna', 'user', String(result.insertId), username, req.user.id]
    );

    const [rows] = await db.query('SELECT u.*, ab.nama AS added_by_nama FROM users u LEFT JOIN users ab ON u.added_by = ab.id WHERE u.id = ?', [result.insertId]);
    res.status(201).json(formatUser(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menambah pengguna' });
  }
});

// ── PUT /api/users/:id ────────────────────────────────────────────────────────
router.put('/:id', authMiddleware, requireMenu('userManagement:edit'), async (req, res) => {
  const { nama, role, grantedMenus, isActive } = req.body;
  try {
    const [existing] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });

    if (role) {
      const [roleRow] = await db.query('SELECT name FROM roles WHERE name = ?', [role]);
      if (roleRow.length === 0) {
        return res.status(400).json({ error: 'Role tidak valid' });
      }
    }

    const menus = Array.isArray(grantedMenus) ? grantedMenus : [];
    await db.query(
      'UPDATE users SET nama=?, role=?, granted_menus=?, is_active=? WHERE id=?',
      [nama || null, role || existing[0].role, JSON.stringify(menus), isActive !== false ? 1 : 0, req.params.id]
    );
    await db.query(
      'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
      ['Mengupdate pengguna', 'user', req.params.id, existing[0].username, req.user.id]
    );

    const [rows] = await db.query('SELECT u.*, ab.nama AS added_by_nama FROM users u LEFT JOIN users ab ON u.added_by = ab.id WHERE u.id = ?', [req.params.id]);
    res.json(formatUser(rows[0]));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengupdate pengguna' });
  }
});

// ── PUT /api/users/:id/password ────────────────────────────────────────────────
router.put('/:id/password', authMiddleware, requireMenu('userManagement:edit'), async (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 6) return res.status(400).json({ error: 'Password minimal 6 karakter' });
  try {
    const [userRows] = await db.query('SELECT username FROM users WHERE id = ?', [req.params.id]);
    if (userRows.length === 0) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });

    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.query('UPDATE users SET password_hash=? WHERE id=?', [hash, req.params.id]);
    if (result.affectedRows === 0) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });

    await db.query(
      'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
      ['Mengubah password pengguna', 'user', req.params.id, userRows[0].username, req.user.id]
    );

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengubah password' });
  }
});

// ── DELETE /api/users/:id ─────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, requireMenu('userManagement:delete'), async (req, res) => {
  if (String(req.params.id) === String(req.user.id)) {
    return res.status(400).json({ error: 'Tidak dapat menghapus akun sendiri' });
  }
  try {
    const [rows] = await db.query('SELECT * FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Pengguna tidak ditemukan' });
    if (rows[0].role === 'superadmin') return res.status(400).json({ error: 'Tidak dapat menghapus akun superadmin' });

    await db.query('DELETE FROM users WHERE id = ?', [req.params.id]);
    await db.query(
      'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
      ['Menghapus pengguna', 'user', req.params.id, rows[0].username, req.user.id]
    );
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus pengguna' });
  }
});

// ── GET /api/users/activity-log ────────────────────────────────────────────────
router.get('/activity-log/all', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT al.*, u.username AS performed_by_username, u.nama AS performed_by_nama
      FROM activity_log al
      LEFT JOIN users u ON al.performed_by = u.id
      ORDER BY al.performed_at DESC
      LIMIT 100
    `);
    res.json(rows.map(r => ({
      id: r.id,
      action: r.action,
      targetType: r.target_type,
      targetId: r.target_id,
      targetTitle: r.target_title,
      performedBy: r.performed_by_username || String(r.performed_by),
      performedByNama: r.performed_by_nama,
      performedAt: r.performed_at,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil activity log' });
  }
});

module.exports = router;
