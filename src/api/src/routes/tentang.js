const router = require('express').Router();
const db = require('../db');
const { authMiddleware, requireMenu } = require('../middleware/auth');

/**
 * Format page data from rows
 * Group consecutive list_items/struktur_items into blocks for frontend compatibility
 */
async function getFullPage(conn, slug) {
  const [pages] = await conn.query(`
    SELECT t.*, u.nama AS updated_by_nama
    FROM tentang_pages t
    LEFT JOIN users u ON t.updated_by = u.id
    WHERE t.slug = ?
  `, [slug]);

  if (pages.length === 0) return null;
  const page = pages[0];

  const [blocks] = await conn.query(`
    SELECT * FROM tentang_konten
    WHERE page_id = ?
    ORDER BY urutan ASC
  `, [page.id]);

  const formattedBlocks = [];
  for (const b of blocks) {
    if (b.tipe === 'paragraf') {
      formattedBlocks.push({ __kind__: 'paragraf', paragraf: b.isi });
    } else if (b.tipe === 'list_item') {
      let lastBlock = formattedBlocks[formattedBlocks.length - 1];
      if (lastBlock && lastBlock.__kind__ === 'daftarItem' && !lastBlock.isStruktur) {
        lastBlock.daftarItem.push(b.isi);
      } else {
        formattedBlocks.push({ __kind__: 'daftarItem', daftarItem: [b.isi], isStruktur: false });
      }
    } else if (b.tipe === 'struktur_item') {
      let lastBlock = formattedBlocks[formattedBlocks.length - 1];
      const serialized = `Jabatan: ${b.jabatan || ''} | Nama: ${b.nama || ''} | Unit: ${b.unit || ''}`;
      if (lastBlock && lastBlock.__kind__ === 'daftarItem' && lastBlock.isStruktur) {
        lastBlock.daftarItem.push(serialized);
      } else {
        formattedBlocks.push({ __kind__: 'daftarItem', daftarItem: [serialized], isStruktur: true });
      }
    }
  }

  // Remove the temporary isStruktur flag before sending
  const finalBlocks = formattedBlocks.map(({ isStruktur, ...rest }) => rest);

  return {
    id: page.id,
    slug: page.slug,
    judul: page.judul,
    konten: { blocks: finalBlocks },
    updatedBy: page.updated_by,
    updatedByNama: page.updated_by_nama || null,
    updatedAt: page.updated_at,
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
    res.json(rows.map(row => ({
      id: row.id,
      slug: row.slug,
      judul: row.judul,
      updatedBy: row.updated_by,
      updatedByNama: row.updated_by_nama || null,
      updatedAt: row.updated_at,
    })));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data halaman tentang' });
  }
});

// ── GET /api/tentang/:slug ────────────────────────────────────────────────────
router.get('/:slug', async (req, res) => {
  try {
    const page = await getFullPage(db, req.params.slug);
    if (!page) return res.status(404).json({ error: 'Halaman tidak ditemukan' });
    res.json(page);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil halaman tentang' });
  }
});

// ── PUT /api/tentang/:slug ────────────────────────────────────────────────────
router.put('/:slug', authMiddleware, requireMenu('tentang:edit'), async (req, res) => {
  const { slug } = req.params;
  const { judul, konten } = req.body;
  if (!judul || !konten || !konten.blocks) {
    return res.status(400).json({ error: 'Judul dan konten (blocks) wajib diisi' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    // 1. Get or create page
    let [pages] = await conn.query('SELECT id FROM tentang_pages WHERE slug = ?', [slug]);
    let pageId;
    if (pages.length === 0) {
      const [result] = await conn.query(
        'INSERT INTO tentang_pages (slug, judul, updated_by) VALUES (?, ?, ?)',
        [slug, judul, req.user.id]
      );
      pageId = result.insertId;
    } else {
      pageId = pages[0].id;
      await conn.query(
        'UPDATE tentang_pages SET judul = ?, updated_by = ? WHERE id = ?',
        [judul, req.user.id, pageId]
      );
    }

    // 2. Refresh blocks
    await conn.query('DELETE FROM tentang_konten WHERE page_id = ?', [pageId]);

    let order = 0;
    for (const block of konten.blocks) {
      if (block.__kind__ === 'paragraf') {
        await conn.query(
          'INSERT INTO tentang_konten (page_id, tipe, isi, urutan) VALUES (?, ?, ?, ?)',
          [pageId, 'paragraf', block.paragraf, order++]
        );
      } else if (block.__kind__ === 'daftarItem') {
        for (const item of block.daftarItem) {
          // Check if it's a structure item (Jabatan: ... | Nama: ... | Unit: ...)
          if (item.includes('Jabatan:') && item.includes('Nama:')) {
            const parts = {};
            for (const seg of item.split(' | ')) {
              const [k, ...rest] = seg.split(':');
              if (k && rest.length) parts[k.trim()] = rest.join(':').trim();
            }
            await conn.query(
              'INSERT INTO tentang_konten (page_id, tipe, isi, nama, jabatan, unit, urutan) VALUES (?, ?, ?, ?, ?, ?, ?)',
              [pageId, 'struktur_item', item, parts.Nama || '', parts.Jabatan || '', parts.Unit || '', order++]
            );
          } else {
            await conn.query(
              'INSERT INTO tentang_konten (page_id, tipe, isi, urutan) VALUES (?, ?, ?, ?)',
              [pageId, 'list_item', item, order++]
            );
          }
        }
      }
    }

    await conn.query(
      'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
      ['Mengupdate halaman tentang', 'tentang', slug, judul, req.user.id]
    );

    await conn.commit();
    const updatedPage = await getFullPage(db, slug);
    res.json(updatedPage);
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Gagal mengupdate halaman tentang' });
  } finally {
    conn.release();
  }
});

module.exports = router;
