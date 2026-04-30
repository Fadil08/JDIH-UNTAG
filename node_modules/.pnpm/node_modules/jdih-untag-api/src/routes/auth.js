const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ error: 'Username dan password wajib diisi' });
  }

  try {
    const [rows] = await db.query(
      'SELECT * FROM users WHERE username = ? AND is_active = 1 LIMIT 1',
      [username]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) {
      return res.status(401).json({ error: 'Username atau password salah' });
    }

    const grantedMenus = Array.isArray(user.granted_menus) ? user.granted_menus : (() => {
      try { return JSON.parse(user.granted_menus || '[]'); } catch { return []; }
    })();

    const payload = {
      id: user.id,
      username: user.username,
      nama: user.nama,
      role: user.role,
      granted_menus: grantedMenus,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: process.env.JWT_EXPIRES_IN || '8h',
    });

    // Catat aktivitas login
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
    await db.query(
      'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
      [`Login berhasil dari IP ${ip}`, 'auth', String(user.id), user.username, user.id]
    );

    res.json({
      token,
      user: payload,
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

// ── GET /api/auth/me ─────────────────────────────────────────────────────────
router.get('/me', require('../middleware/auth').authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT id, username, nama, role, granted_menus, is_active, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) return res.status(404).json({ error: 'User tidak ditemukan' });

    const user = rows[0];
    user.granted_menus = Array.isArray(user.granted_menus) ? user.granted_menus : (() => {
      try { return JSON.parse(user.granted_menus || '[]'); } catch { return []; }
    })();

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
      'settings:view', 'settings:edit',
      'activityLog:view'
    ];

    const isAdmin = ['superadmin', 'admin'].includes(user.role);
    res.json({
      ...user,
      isAdmin,
      grantedMenus: user.role === 'superadmin' ? ALL_MENUS : user.granted_menus,
    });
  } catch (err) {
    console.error('Get me error:', err);
    res.status(500).json({ error: 'Terjadi kesalahan pada server' });
  }
});

module.exports = router;
