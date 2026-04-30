const router = require('express').Router();
const db = require('../db');

// ── GET /api/statistik ────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    // Total dokumen published
    const [[{ totalDokumen }]] = await db.query(
      "SELECT COUNT(*) AS totalDokumen FROM dokumen WHERE workflow_status = 'Published'"
    );

    // Total unduhan
    const [[{ totalUnduhan }]] = await db.query(
      "SELECT COALESCE(SUM(download_count), 0) AS totalUnduhan FROM dokumen WHERE workflow_status = 'Published'"
    );

    // Total artikel terbit
    const [[{ totalArtikel }]] = await db.query(
      "SELECT COUNT(*) AS totalArtikel FROM artikel WHERE status = 'Terbit'"
    );

    // Per kategori
    const [perKategoriRows] = await db.query(`
      SELECT k.id, k.nama, COUNT(d.id) AS jumlah
      FROM kategori k
      LEFT JOIN dokumen d ON d.kategori_id = k.id AND d.workflow_status = 'Published'
      GROUP BY k.id, k.nama
      ORDER BY k.nama ASC
    `);

    const perKategori = perKategoriRows.map(r => ({
      id: r.id,
      nama: r.nama,
      jumlah: Number(r.jumlah),
    }));

    // Tren per Tahun
    const [trenTahunRows] = await db.query(`
      SELECT tahun, COUNT(id) AS jumlah
      FROM dokumen
      WHERE workflow_status = 'Published' AND tahun IS NOT NULL AND CAST(tahun AS SIGNED) > 0
      GROUP BY tahun
      ORDER BY CAST(tahun AS SIGNED) ASC
    `);

    const trenTahun = trenTahunRows.map(r => ({
      tahun: String(r.tahun),
      jumlah: Number(r.jumlah),
    }));

    res.json({
      totalDokumen: Number(totalDokumen),
      totalUnduhan: Number(totalUnduhan),
      totalArtikel: Number(totalArtikel),
      perKategori,
      trenTahun,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data statistik' });
  }
});

module.exports = router;
