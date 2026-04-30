const router = require('express').Router();
const db = require('../db');
const { authMiddleware, requireMenu } = require('../middleware/auth');

const VALID_SLUGS = ['sejarah', 'visiMisi', 'dasarHukum', 'fungsi', 'struktur'];

function formatPage(row) {
  return {
    id: row.id,
    slug: row.slug,
    judul: row.judul,
    konten: (() => {
      try { return JSON.parse(row.konten); } catch { return { blocks: [] }; }
    })(),
    updatedBy: row.updated_by,
    updatedByNama: row.updated_by_nama || null,
    updatedAt: row.updated_at,
  };
}

// ── GET /api/tentang ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT t.*, u.nama AS updated_by_nama
      FROM tentang_pages t
      LEFT JOIN users u ON t.updated_by = u.id
      ORDER BY t.id ASC
    `);
    res.json(rows.map(formatPage));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data halaman tentang' });
  }
});

// ── GET /api/tentang/:slug ────────────────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  const { slug } = req.params;
  if (!VALID_SLUGS.includes(slug)) {
    return res.status(400).json({ error: 'Slug tidak valid' });
  }
  try {
    const [rows] = await db.query(`
      SELECT t.*, u.nama AS updated_by_nama
      FROM tentang_pages t
      LEFT JOIN users u ON t.updated_by = u.id
      WHERE t.slug = ?
    `, [slug]);
    if (rows.length === 0) return res.status(404).json({ error: 'Halaman tidak ditemukan' });
    res.json(formatPage(rows[0]));
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil halaman tentang' });
  }
});

// ── PUT /api/tentang/:slug ────────────────────────────────────────────────────
router.put('/:slug', authMiddleware, requireMenu('tentang:edit'), async (req, res) => {
  const { slug } = req.params;
  if (!VALID_SLUGS.includes(slug)) {
    return res.status(400).json({ error: 'Slug tidak valid' });
  }

  const { judul, konten } = req.body;
  if (!judul || !konten) return res.status(400).json({ error: 'Judul dan konten wajib diisi' });

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [existing] = await conn.query('SELECT id FROM tentang_pages WHERE slug = ?', [slug]);
    const kontenJson = JSON.stringify(konten);

    if (existing.length === 0) {
      // Buat baru jika belum ada
      await conn.query(
        'INSERT INTO tentang_pages (slug, judul, konten, updated_by) VALUES (?, ?, ?, ?)',
        [slug, judul, kontenJson, req.user.id]
      );
    } else {
      await conn.query(
        'UPDATE tentang_pages SET judul=?, konten=?, updated_by=? WHERE slug=?',
        [judul, kontenJson, req.user.id, slug]
      );
    }

    await conn.query(
      'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
      ['Mengupdate halaman tentang', 'tentang', slug, judul, req.user.id]
    );
    await conn.commit();

    const [rows] = await db.query(`
      SELECT t.*, u.nama AS updated_by_nama
      FROM tentang_pages t LEFT JOIN users u ON t.updated_by = u.id
      WHERE t.slug = ?
    `, [slug]);
    res.json(formatPage(rows[0]));
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Gagal mengupdate halaman tentang' });
  } finally {
    conn.release();
  }
});

module.exports = router;
