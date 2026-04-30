const router = require('express').Router();
const db = require('../db');
const { authMiddleware, requireMenu } = require('../middleware/auth');
const { uploadGambar, deleteFile } = require('../middleware/upload');

function formatGaleri(row) {
  return {
    id: row.id,
    judul: row.judul,
    deskripsi: row.deskripsi,
    gambar: row.gambar ? `/uploads/gambar/${row.gambar}` : null,
    album: row.album,
    createdBy: row.created_by,
    createdByNama: row.created_by_nama || null,
    createdAt: row.created_at,
  };
}

// ── GET /api/galeri (publik) ──────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT g.*, u.nama AS created_by_nama
      FROM galeri g
      LEFT JOIN users u ON g.created_by = u.id
      ORDER BY g.created_at DESC
    `);
    res.json(rows.map(formatGaleri));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data galeri' });
  }
});

// ── GET /api/galeri/admin ─────────────────────────────────────────────────────
router.get('/admin', authMiddleware, requireMenu('galeri:view'), async (req, res) => {
  try {
    let sql = `
      SELECT g.*, u.nama AS created_by_nama
      FROM galeri g
      LEFT JOIN users u ON g.created_by = u.id
    `;
    const params = [];

    if (req.user.role === 'staff') {
      sql += ' WHERE g.created_by = ?';
      params.push(req.user.id);
    }
    
    sql += ' ORDER BY g.created_at DESC';
    const [rows] = await db.query(sql, params);
    res.json(rows.map(formatGaleri));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data galeri' });
  }
});

// ── GET /api/galeri/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT g.*, u.nama AS created_by_nama
      FROM galeri g
      LEFT JOIN users u ON g.created_by = u.id
      WHERE g.id = ?
    `, [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Item galeri tidak ditemukan' });
    res.json(formatGaleri(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil detail galeri' });
  }
});

// ── POST /api/galeri ──────────────────────────────────────────────────────────
router.post('/', authMiddleware, requireMenu('galeri:create'), uploadGambar.single('gambar'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { judul, deskripsi, album } = req.body;
    if (!judul) return res.status(400).json({ error: 'Judul wajib diisi' });

    const gambar = req.file ? req.file.filename : null;
    const [result] = await conn.query(
      'INSERT INTO galeri (judul, deskripsi, gambar, album, created_by) VALUES (?, ?, ?, ?, ?)',
      [judul, deskripsi || '', gambar, album || '', req.user.id]
    );
    await conn.query(
      'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
      ['Menambah item galeri', 'galeri', String(result.insertId), judul, req.user.id]
    );
    await conn.commit();

    const [rows] = await db.query('SELECT g.*, u.nama AS created_by_nama FROM galeri g LEFT JOIN users u ON g.created_by = u.id WHERE g.id = ?', [result.insertId]);
    res.status(201).json(formatGaleri(rows[0]));
  } catch (err) {
    await conn.rollback();
    if (req.file) deleteFile(`gambar/${req.file.filename}`);
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan item galeri' });
  } finally {
    conn.release();
  }
});

// ── PUT /api/galeri/:id ───────────────────────────────────────────────────────
router.put('/:id', authMiddleware, requireMenu('galeri:create'), uploadGambar.single('gambar'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.query('SELECT * FROM galeri WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Item galeri tidak ditemukan' });

    // Guard: Staff can only edit their own
    const isAdmin = ['superadmin', 'admin'].includes(req.user.role);
    const isOwner = existing[0].created_by === req.user.id;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Akses ditolak: Anda tidak dapat mengubah galeri orang lain' });
    }

    const { judul, deskripsi, album } = req.body;
    let gambar = existing[0].gambar;
    if (req.file) {
      if (gambar) deleteFile(`gambar/${gambar}`);
      gambar = req.file.filename;
    }

    await conn.query(
      'UPDATE galeri SET judul=?, deskripsi=?, gambar=?, album=? WHERE id=?',
      [judul, deskripsi || '', gambar, album || '', req.params.id]
    );
    await conn.query(
      'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
      ['Mengupdate item galeri', 'galeri', req.params.id, judul, req.user.id]
    );
    await conn.commit();

    const [rows] = await db.query('SELECT g.*, u.nama AS created_by_nama FROM galeri g LEFT JOIN users u ON g.created_by = u.id WHERE g.id = ?', [req.params.id]);
    res.json(formatGaleri(rows[0]));
  } catch (err) {
    await conn.rollback();
    if (req.file) deleteFile(`gambar/${req.file.filename}`);
    console.error(err);
    res.status(500).json({ error: 'Gagal mengupdate item galeri' });
  } finally {
    conn.release();
  }
});

// ── DELETE /api/galeri/:id ────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, requireMenu('galeri:delete'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT * FROM galeri WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Item galeri tidak ditemukan' });

    // Guard: Staff can only delete their own
    const isAdmin = ['superadmin', 'admin'].includes(req.user.role);
    const isOwner = rows[0].created_by === req.user.id;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Akses ditolak: Anda tidak dapat menghapus galeri orang lain' });
    }

    if (rows[0].gambar) deleteFile(`gambar/${rows[0].gambar}`);
    await conn.query('DELETE FROM galeri WHERE id = ?', [req.params.id]);
    await conn.query(
      'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
      ['Menghapus item galeri', 'galeri', req.params.id, rows[0].judul, req.user.id]
    );
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus item galeri' });
  } finally {
    conn.release();
  }
});

module.exports = router;
