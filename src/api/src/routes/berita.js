const router = require('express').Router();
const db = require('../db');
const { authMiddleware, requireMenu } = require('../middleware/auth');
const { uploadGambar } = require('../middleware/upload');
const { uploadToR2, deleteFromR2, buildUrl } = require('../utils/r2Storage');


function formatArtikel(row) {
  return {
    id: row.id,
    judul: row.judul,
    konten: row.konten,
    ringkasan: row.ringkasan,
    author: row.author,
    gambar: buildUrl(row.gambar, 'gambar'),
    status: row.status,
    tanggal: row.tanggal,
    tanggalPublikasi: row.tanggal_publikasi,
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    createdBy: row.created_by,
    lastModifiedBy: row.last_modified_by || null,
  };
}

async function getTags(artikelId) {
  const [rows] = await db.query('SELECT tag FROM artikel_tags WHERE artikel_id = ? ORDER BY id ASC', [artikelId]);
  return rows.map(r => r.tag);
}

async function saveTags(conn, artikelId, tags) {
  await conn.query('DELETE FROM artikel_tags WHERE artikel_id = ?', [artikelId]);
  if (tags && tags.length > 0) {
    const values = tags.map(t => [artikelId, t]);
    await conn.query('INSERT INTO artikel_tags (artikel_id, tag) VALUES ?', [values]);
  }
}

// ── GET /api/berita (publik) ──────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT * FROM artikel WHERE status = 'Terbit' ORDER BY tanggal_publikasi DESC"
    );
    const result = await Promise.all(rows.map(async r => formatArtikel({ ...r, tags: await getTags(r.id) })));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data berita' });
  }
});

// ── GET /api/berita/admin ─────────────────────────────────────────────────────
router.get('/admin', authMiddleware, requireMenu('berita:view'), async (req, res) => {
  try {
    let sql = 'SELECT a.*, u.nama AS author_nama FROM artikel a LEFT JOIN users u ON a.created_by = u.id';
    const params = [];

    if (req.user.role === 'staff') {
      sql += ' WHERE a.created_by = ?';
      params.push(req.user.id);
    }
    
    sql += ' ORDER BY a.created_at DESC';
    const [rows] = await db.query(sql, params);
    const result = await Promise.all(rows.map(async r => formatArtikel({ ...r, tags: await getTags(r.id) })));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data berita' });
  }
});

// ── GET /api/berita/:id ───────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT * FROM artikel WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Berita tidak ditemukan' });
    const tags = await getTags(req.params.id);
    res.json(formatArtikel({ ...rows[0], tags }));
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil detail berita' });
  }
});

// ── POST /api/berita ──────────────────────────────────────────────────────────
router.post('/', authMiddleware, requireMenu('berita:create'), uploadGambar.single('gambar'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { judul, konten, ringkasan, author, status, tanggalPublikasi, tags: rawTags } = req.body;
    if (!judul || !konten) return res.status(400).json({ error: 'Judul dan konten wajib diisi' });

    // Upload gambar ke R2 jika ada
    let gambar = null;
    if (req.file) {
      const r2File = await uploadToR2(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'gambar'
      );
      gambar = r2File.key; // Simpan R2 key ke DB
    }
    const tags = Array.isArray(rawTags) ? rawTags : (rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : []);

    // Pastikan tanggal_publikasi valid — null jika kosong/tidak valid
    let pubDate = null;
    if (tanggalPublikasi && tanggalPublikasi.trim()) {
      const parsed = new Date(tanggalPublikasi);
      pubDate = isNaN(parsed.getTime()) ? null : parsed.toISOString().slice(0, 19).replace('T', ' ');
    }

    const [result] = await conn.query(
      'INSERT INTO artikel (judul, konten, ringkasan, author, gambar, status, tanggal_publikasi, created_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [judul, konten, ringkasan || '', author || '', gambar, status || 'Terbit', pubDate, req.user.id]
    );
    await saveTags(conn, result.insertId, tags);
    await conn.query(
      'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
      ['Menambah berita', 'berita', String(result.insertId), judul, req.user.id]
    );
    await conn.commit();

    const [rows] = await db.query('SELECT * FROM artikel WHERE id = ?', [result.insertId]);
    res.status(201).json(formatArtikel({ ...rows[0], tags }));
  } catch (err) {
    await conn.rollback();
    console.error('[POST /api/berita] Error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Gagal menyimpan berita', detail: err instanceof Error ? err.message : 'Unknown error' });
  } finally {
    conn.release();
  }
});

// ── PUT /api/berita/:id ───────────────────────────────────────────────────────
router.put('/:id', authMiddleware, requireMenu('berita:edit'), uploadGambar.single('gambar'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.query('SELECT * FROM artikel WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Berita tidak ditemukan' });

    // Guard: Staff can only edit their own
    const isAdmin = req.user.role !== 'staff';
    const isOwner = existing[0].created_by === req.user.id;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Akses ditolak: Anda tidak dapat mengubah berita orang lain' });
    }

    const { judul, konten, ringkasan, author, status, tanggalPublikasi, tags: rawTags } = req.body;

    let gambar = existing[0].gambar;
    if (req.file) {
      // Hapus gambar lama dari R2 jika format baru
      if (gambar && (gambar.startsWith('pdf/') || gambar.startsWith('gambar/'))) {
        await deleteFromR2(gambar);
      }
      const r2File = await uploadToR2(
        req.file.buffer,
        req.file.originalname,
        req.file.mimetype,
        'gambar'
      );
      gambar = r2File.key;
    }
    const tags = Array.isArray(rawTags) ? rawTags : (rawTags ? rawTags.split(',').map(t => t.trim()).filter(Boolean) : []);

    // Pastikan tanggal_publikasi valid — pertahankan nilai lama jika input kosong/tidak valid
    let pubDate = existing[0].tanggal_publikasi ?? null;
    if (tanggalPublikasi && String(tanggalPublikasi).trim()) {
      const parsed = new Date(tanggalPublikasi);
      if (!isNaN(parsed.getTime())) {
        pubDate = parsed.toISOString().slice(0, 19).replace('T', ' ');
      }
    }

    await conn.query(
      'UPDATE artikel SET judul=?, konten=?, ringkasan=?, author=?, gambar=?, status=?, tanggal_publikasi=?, last_modified_by=? WHERE id=?',
      [judul, konten, ringkasan || '', author || '', gambar, status || 'Terbit', pubDate, req.user.id, req.params.id]
    );
    await saveTags(conn, req.params.id, tags);
    await conn.query(
      'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
      ['Mengupdate berita', 'berita', req.params.id, judul, req.user.id]
    );
    await conn.commit();

    const [rows] = await db.query('SELECT * FROM artikel WHERE id = ?', [req.params.id]);
    res.json(formatArtikel({ ...rows[0], tags }));
  } catch (err) {
    await conn.rollback();
    console.error('[PUT /api/berita] Error:', err instanceof Error ? err.message : err);
    res.status(500).json({ error: 'Gagal mengupdate berita', detail: err instanceof Error ? err.message : 'Unknown error' });
  } finally {
    conn.release();
  }
});


// ── DELETE /api/berita/:id ────────────────────────────────────────────────────
router.delete('/:id', authMiddleware, requireMenu('berita:delete'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT * FROM artikel WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Berita tidak ditemukan' });

    // Guard: Staff can only delete their own
    const isAdmin = req.user.role !== 'staff';
    const isOwner = rows[0].created_by === req.user.id;
    if (!isAdmin && !isOwner) {
      return res.status(403).json({ error: 'Akses ditolak: Anda tidak dapat menghapus berita orang lain' });
    }

    // Hapus gambar lama dari R2 jika format baru
    if (rows[0].gambar && (rows[0].gambar.startsWith('pdf/') || rows[0].gambar.startsWith('gambar/'))) {
      await deleteFromR2(rows[0].gambar);
    }    await conn.query('DELETE FROM artikel WHERE id = ?', [req.params.id]);
    await conn.query(
      'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
      ['Menghapus berita', 'berita', req.params.id, rows[0].judul, req.user.id]
    );
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus berita' });
  } finally {
    conn.release();
  }
});

module.exports = router;
