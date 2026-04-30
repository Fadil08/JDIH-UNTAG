const router = require('express').Router();
const db = require('../db');
const { authMiddleware, requireMenu } = require('../middleware/auth');

// ── Helper: log aktivitas ─────────────────────────────────────────────────────
async function log(conn, { action, targetId, targetTitle, performedBy }) {
  await conn.query(
    'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
    [action, 'kategori', String(targetId), targetTitle, performedBy]
  );
}

// ── GET /api/kategori ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM kategori ORDER BY nama ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data kategori' });
  }
});

// ── GET /api/kategori/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM kategori WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Kategori tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data kategori' });
  }
});

// ── POST /api/kategori ────────────────────────────────────────────────────────
router.post('/', authMiddleware, requireMenu('kategori:create'), async (req, res) => {
  const { nama } = req.body;
  if (!nama?.trim()) return res.status(400).json({ error: 'Nama kategori wajib diisi' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.query('INSERT INTO kategori (nama) VALUES (?)', [nama.trim()]);
    await log(conn, {
      action: `Menambah kategori`,
      targetId: result.insertId,
      targetTitle: nama.trim(),
      performedBy: req.user.id,
    });
    await conn.commit();

    const [rows] = await db.query('SELECT * FROM kategori WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Gagal menambah kategori' });
  } finally {
    conn.release();
  }
});

// ── PUT /api/kategori/:id ─────────────────────────────────────────────────────
router.put('/:id', authMiddleware, requireMenu('kategori:edit'), async (req, res) => {
  const { nama } = req.body;
  if (!nama?.trim()) return res.status(400).json({ error: 'Nama kategori wajib diisi' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Ambil nama lama untuk konteks log
    const [existing] = await conn.query('SELECT * FROM kategori WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Kategori tidak ditemukan' });

    await conn.query('UPDATE kategori SET nama = ? WHERE id = ?', [nama.trim(), req.params.id]);
    await log(conn, {
      action: `Mengubah kategori "${existing[0].nama}" menjadi "${nama.trim()}"`,
      targetId: req.params.id,
      targetTitle: nama.trim(),
      performedBy: req.user.id,
    });
    await conn.commit();

    const [rows] = await db.query('SELECT * FROM kategori WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Gagal mengupdate kategori' });
  } finally {
    conn.release();
  }
});

// ── DELETE /api/kategori/:id ──────────────────────────────────────────────────
router.delete('/:id', authMiddleware, requireMenu('kategori:delete'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Cek apakah ada dokumen yang pakai kategori ini
    const [dokumen] = await conn.query('SELECT COUNT(*) AS cnt FROM dokumen WHERE kategori_id = ?', [req.params.id]);
    if (dokumen[0].cnt > 0) {
      return res.status(400).json({ error: 'Kategori tidak dapat dihapus karena masih digunakan oleh dokumen' });
    }

    const [existing] = await conn.query('SELECT * FROM kategori WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Kategori tidak ditemukan' });

    await conn.query('DELETE FROM kategori WHERE id = ?', [req.params.id]);
    await log(conn, {
      action: `Menghapus kategori`,
      targetId: req.params.id,
      targetTitle: existing[0].nama,
      performedBy: req.user.id,
    });
    await conn.commit();

    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus kategori' });
  } finally {
    conn.release();
  }
});

module.exports = router;
