const router = require('express').Router();
const db = require('../db');
const { authMiddleware, requireMenu } = require('../middleware/auth');

// ── GET /api/kontak ───────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM kontak_info ORDER BY urutan ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data kontak' });
  }
});

// ── PUT /api/kontak ───────────────────────────────────────────────────────────
router.put('/', authMiddleware, requireMenu('kontak:edit'), async (req, res) => {
  const items = req.body; // Expecting array of { label, value, deskripsi, icon, urutan }
  
  if (!Array.isArray(items)) {
    return res.status(400).json({ error: 'Data harus berupa array' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Simple strategy: Clear and re-insert
    await conn.query('DELETE FROM kontak_info');

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      await conn.query(
        'INSERT INTO kontak_info (label, value, deskripsi, icon, urutan) VALUES (?, ?, ?, ?, ?)',
        [item.label, item.value, item.deskripsi, item.icon, i]
      );
    }

    await conn.query(
      'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
      ['Mengupdate informasi kontak', 'kontak', 'general', 'Informasi Kontak', req.user.id]
    );

    await conn.commit();
    const [rows] = await db.query('SELECT * FROM kontak_info ORDER BY urutan ASC');
    res.json(rows);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Gagal mengupdate informasi kontak' });
  } finally {
    conn.release();
  }
});

module.exports = router;
