const router = require('express').Router();
const db = require('../db');
const { authMiddleware, requireMenu } = require('../middleware/auth');

// ── Helper: log aktivitas ─────────────────────────────────────────────────────
async function log(conn, { action, targetId, targetTitle, performedBy }) {
  await conn.query(
    'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
    [action, 'status', String(targetId), targetTitle, performedBy]
  );
}

// ── GET /api/status ─────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM status_dokumen ORDER BY id ASC');
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data status' });
  }
});

// ── GET /api/status/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM status_dokumen WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Status tidak ditemukan' });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data status' });
  }
});

// ── POST /api/status ────────────────────────────────────────────────────────
router.post('/', authMiddleware, requireMenu('status:create'), async (req, res) => {
  const { nama, warna } = req.body;
  if (!nama?.trim()) return res.status(400).json({ error: 'Nama status wajib diisi' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const defaultWarna = warna?.trim() || '#64748b';
    const [result] = await conn.query('INSERT INTO status_dokumen (nama, warna) VALUES (?, ?)', [nama.trim(), defaultWarna]);
    await log(conn, {
      action: `Menambah status`,
      targetId: result.insertId,
      targetTitle: nama.trim(),
      performedBy: req.user.id,
    });
    await conn.commit();

    const [rows] = await db.query('SELECT * FROM status_dokumen WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Gagal menambah status' });
  } finally {
    conn.release();
  }
});

// ── PUT /api/status/:id ─────────────────────────────────────────────────────
router.put('/:id', authMiddleware, requireMenu('status:edit'), async (req, res) => {
  const { nama, warna } = req.body;
  if (!nama?.trim()) return res.status(400).json({ error: 'Nama status wajib diisi' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // Ambil nama lama untuk konteks log
    const [existing] = await conn.query('SELECT * FROM status_dokumen WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Status tidak ditemukan' });

    const defaultWarna = warna?.trim() || '#64748b';
    await conn.query('UPDATE status_dokumen SET nama = ?, warna = ? WHERE id = ?', [nama.trim(), defaultWarna, req.params.id]);
    await log(conn, {
      action: `Mengubah status "${existing[0].nama}" menjadi "${nama.trim()}"`,
      targetId: req.params.id,
      targetTitle: nama.trim(),
      performedBy: req.user.id,
    });
    await conn.commit();

    const [rows] = await db.query('SELECT * FROM status_dokumen WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Gagal mengupdate status' });
  } finally {
    conn.release();
  }
});

// ── DELETE /api/status/:id ──────────────────────────────────────────────────
router.delete('/:id', authMiddleware, requireMenu('status:delete'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query('SELECT * FROM status_dokumen WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Status tidak ditemukan' });

    // Cek apakah ada dokumen yang pakai status ini
    const [dokumen] = await conn.query('SELECT COUNT(*) AS cnt FROM dokumen WHERE status = ?', [existing[0].nama]);
    if (dokumen[0].cnt > 0) {
      return res.status(400).json({ error: 'Status tidak dapat dihapus karena masih digunakan oleh dokumen' });
    }

    await conn.query('DELETE FROM status_dokumen WHERE id = ?', [req.params.id]);
    await log(conn, {
      action: `Menghapus status`,
      targetId: req.params.id,
      targetTitle: existing[0].nama,
      performedBy: req.user.id,
    });
    await conn.commit();

    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus status' });
  } finally {
    conn.release();
  }
});

module.exports = router;
