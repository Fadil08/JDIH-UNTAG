const router = require('express').Router();
const db = require('../db');
const { authMiddleware } = require('../middleware/auth');

// ── GET /api/logs ─────────────────────────────────────────────────────────────
// Menggabungkan activity_log + dokumen_logs menjadi satu tampilan terpadu
// Query params: page, limit, search, lokasi
router.get('/', authMiddleware, async (req, res) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page  || '1'));
    const limit = Math.min(100, Math.max(5, parseInt(req.query.limit || '20')));
    const offset = (page - 1) * limit;
    const search = (req.query.search || '').trim();
    const lokasiFilter = (req.query.lokasi || '').trim();

    // ── Query gabungan (UNION) ──────────────────────────────────────────────
    // Sumber 1: activity_log — aktivitas CRUD umum
    // Sumber 2: dokumen_logs — riwayat workflow dokumen
    const unionSQL = `
      (
        SELECT
          CONCAT('act-', al.id) AS id,
          al.performed_at       AS waktu,
          COALESCE(CONVERT(al.target_type USING utf8mb4) COLLATE utf8mb4_unicode_ci, 'system') AS lokasi,
          CONCAT(
            COALESCE(CONVERT(u.nama USING utf8mb4), CONVERT(u.username USING utf8mb4), 'Sistem') COLLATE utf8mb4_unicode_ci, ': ',
            CONVERT(al.action USING utf8mb4) COLLATE utf8mb4_unicode_ci,
            IF(al.target_title IS NOT NULL AND al.target_title != '',
               CONCAT(' - "', CONVERT(al.target_title USING utf8mb4) COLLATE utf8mb4_unicode_ci, '"'), '')
          ) COLLATE utf8mb4_unicode_ci AS deskripsi,
          COALESCE(CONVERT(u.nama USING utf8mb4), CONVERT(u.username USING utf8mb4)) COLLATE utf8mb4_unicode_ci AS pelaku,
          CONVERT(u.role USING utf8mb4) COLLATE utf8mb4_unicode_ci AS peran,
          CONVERT(al.action USING utf8mb4) COLLATE utf8mb4_unicode_ci AS aksi,
          CONVERT(al.target_title USING utf8mb4) COLLATE utf8mb4_unicode_ci AS target,
          'activity' COLLATE utf8mb4_unicode_ci AS sumber
        FROM activity_log al
        LEFT JOIN users u ON al.performed_by = u.id
      )
      UNION ALL
      (
        SELECT
          CONCAT('wf-', dl.id)  AS id,
          dl.created_at         AS waktu,
          'dokumen' COLLATE utf8mb4_unicode_ci AS lokasi,
          CONCAT(
            COALESCE(CONVERT(u.nama USING utf8mb4), CONVERT(u.username USING utf8mb4), 'Sistem') COLLATE utf8mb4_unicode_ci,
            ' [', CONVERT(dl.action USING utf8mb4) COLLATE utf8mb4_unicode_ci, ']: ',
            IF(dl.message IS NOT NULL AND dl.message != '',
               CONVERT(dl.message USING utf8mb4) COLLATE utf8mb4_unicode_ci,
               CONCAT(
                 IF(dl.status_before IS NOT NULL,
                    CONCAT(CONVERT(dl.status_before USING utf8mb4) COLLATE utf8mb4_unicode_ci, ' -> '), ''),
                 COALESCE(CONVERT(dl.status_after USING utf8mb4) COLLATE utf8mb4_unicode_ci, '')
               )
            ),
            ' - "', COALESCE(CONVERT(d.judul USING utf8mb4), 'Dokumen') COLLATE utf8mb4_unicode_ci, '"'
          ) COLLATE utf8mb4_unicode_ci AS deskripsi,
          COALESCE(CONVERT(u.nama USING utf8mb4), CONVERT(u.username USING utf8mb4)) COLLATE utf8mb4_unicode_ci AS pelaku,
          CONVERT(u.role USING utf8mb4) COLLATE utf8mb4_unicode_ci AS peran,
          CONVERT(dl.action USING utf8mb4) COLLATE utf8mb4_unicode_ci AS aksi,
          CONVERT(d.judul USING utf8mb4) COLLATE utf8mb4_unicode_ci AS target,
          'workflow' COLLATE utf8mb4_unicode_ci AS sumber
        FROM dokumen_logs dl
        LEFT JOIN users u ON dl.user_id = u.id
        LEFT JOIN dokumen d ON dl.dokumen_id = d.id
      )
    `;

    // ── Bangun klausa WHERE ─────────────────────────────────────────────────
    const conditions = [];
    const params = [];

    if (search) {
      conditions.push(`deskripsi LIKE ?`);
      params.push(`%${search}%`);
    }
    if (lokasiFilter && lokasiFilter !== 'all') {
      conditions.push(`lokasi = ?`);
      params.push(lokasiFilter);
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // ── Count total (untuk pagination) ─────────────────────────────────────
    // Double-wrap diperlukan agar WHERE pada alias kolom bekerja di MySQL
    const countSQL = `SELECT COUNT(*) AS total FROM (SELECT * FROM (${unionSQL}) AS t1) AS combined ${where}`;
    const [[{ total }]] = await db.query(countSQL, [...params]);

    // ── Fetch data dengan sorting + pagination ──────────────────────────────
    const dataSQL = `
      SELECT * FROM (SELECT * FROM (${unionSQL}) AS t1) AS combined
      ${where}
      ORDER BY waktu DESC
      LIMIT ? OFFSET ?
    `;
    const [rows] = await db.query(dataSQL, [...params, limit, offset]);

    res.json({
      data: rows,
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[Logs] Error:', err);
    res.status(500).json({ error: 'Gagal mengambil data log', detail: err.message });
  }
});

// ── GET /api/logs/lokasi-list ─────────────────────────────────────────────────
// Mengembalikan daftar lokasi unik untuk dropdown filter
router.get('/lokasi-list', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT DISTINCT target_type AS lokasi FROM activity_log WHERE target_type IS NOT NULL AND target_type != ''
      UNION
      SELECT 'dokumen' AS lokasi
      ORDER BY lokasi ASC
    `);
    res.json(rows.map(r => r.lokasi));
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil daftar lokasi' });
  }
});

module.exports = router;
