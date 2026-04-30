const slugify = require('slugify');
const router = require('express').Router();
const db = require('../db');
const { authMiddleware, requireMenu, requireSuperAdmin } = require('../middleware/auth');
const { uploadPdf, deleteFile } = require('../middleware/upload');

// ── Helper: generate unique slug ─────────────────────────────────────────────
async function generateUniqueSlug(conn, title, excludeId = null) {
  const base = slugify(title, { lower: true, strict: true });
  let slug = base;
  let counter = 1;
  while (true) {
    let sql = 'SELECT id FROM dokumen WHERE slug = ?';
    const params = [slug];
    if (excludeId) {
      sql += ' AND id != ?';
      params.push(excludeId);
    }
    const [rows] = await conn.query(sql, params);
    if (rows.length === 0) break;
    slug = `${base}-${counter++}`;
  }
  return slug;
}

// ── Helper: ambil tags untuk dokumen ─────────────────────────────────────────
async function getTags(dokumenId) {
  const [rows] = await db.query('SELECT tag FROM dokumen_tags WHERE dokumen_id = ? ORDER BY id ASC', [dokumenId]);
  return rows.map(r => r.tag);
}

// ── Helper: simpan tags ───────────────────────────────────────────────────────
async function saveTags(conn, dokumenId, tags) {
  await conn.query('DELETE FROM dokumen_tags WHERE dokumen_id = ?', [dokumenId]);
  if (tags && tags.length > 0) {
    const values = tags.map(t => [dokumenId, t]);
    await conn.query('INSERT INTO dokumen_tags (dokumen_id, tag) VALUES ?', [values]);
  }
}

// ── Helper: ambil relasi dokumen ─────────────────────────────────────────────
async function getRelations(dokumenId) {
  // Hubungan ke dokumen lain (source)
  const [outbound] = await db.query(`
    SELECT r.target_id as id, r.tipe_relasi, d.judul, d.nomor, d.slug
    FROM dokumen_relasi r
    JOIN dokumen d ON r.target_id = d.id
    WHERE r.dokumen_id = ?
  `, [dokumenId]);

  // Hubungan dari dokumen lain (inverse)
  const [inbound] = await db.query(`
    SELECT r.dokumen_id as id, r.tipe_relasi, d.judul, d.nomor, d.slug
    FROM dokumen_relasi r
    JOIN dokumen d ON r.dokumen_id = d.id
    WHERE r.target_id = ?
  `, [dokumenId]);

  // Map inverse relations to their respective BPHN meanings
  // If B mencabut A, then A is 'Dicabut' by B
  const inverseMap = {
    'Mencabut': 'Dicabut',
    'Mengubah': 'Diubah',
    'Menjabarkan': 'Dijabarkan' // Additional for completeness
  };

  const relations = [
    ...outbound.map(r => ({ ...r, arah: 'outbound' })),
    ...inbound.map(r => ({ 
        id: r.id, 
        judul: r.judul, 
        nomor: r.nomor, 
        slug: r.slug,
        tipe_relasi: inverseMap[r.tipe_relasi] || r.tipe_relasi,
        arah: 'inbound' 
    }))
  ];

  return relations;
}

// ── Helper: simpan relasi ─────────────────────────────────────────────────────
async function saveRelations(conn, dokumenId, relations) {
  await conn.query('DELETE FROM dokumen_relasi WHERE dokumen_id = ?', [dokumenId]);
  if (relations && relations.length > 0) {
    const values = relations.map(r => [dokumenId, r.target_id, r.tipe_relasi]);
    await conn.query('INSERT INTO dokumen_relasi (dokumen_id, target_id, tipe_relasi) VALUES ?', [values]);
  }
}

// ── Helper: simpan log workflow ──────────────────────────────────────────────
async function addWorkflowLog(conn, { dokumenId, userId, action, before, after, message }) {
  await conn.query(
    `INSERT INTO dokumen_logs 
      (dokumen_id, user_id, action, status_before, status_after, message) 
     VALUES (?, ?, ?, ?, ?, ?)`,
    [dokumenId, userId, action, before, after, message || null]
  );
}

// ── Helper: format row ke response ───────────────────────────────────────────
function formatDokumen(row, tags, relations = []) {
  return {
    id: row.id,
    slug: row.slug,
    judul: row.judul,
    nomor: row.nomor,
    kategoriId: row.kategori_id,
    tahun: row.tahun,
    tanggalPenetapan: row.tanggal_penetapan,
    tanggalPengundangan: row.tanggal_pengundangan || null,
    status: row.status,
    abstrak: row.abstrak,
    relasiHukum: row.relasi_hukum || null,
    filePdf: row.file_pdf ? `/uploads/pdf/${row.file_pdf}` : null,
    downloadCount: row.download_count,
    workflowStatus: row.workflow_status,
    catatanKoreksi: row.catatan_koreksi || '',
    reviewedBy: row.reviewed_by || null,
    reviewedAt: row.reviewed_at || null,
    reviewedByNama: row.reviewed_by_nama || null,
    submittedBy: row.submitted_by || null,
    submittedByNama: row.submitted_by_nama || null,
    tag: tags || [],
    relations: relations,
    kategoriNama: row.kategori_nama || null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ── GET /api/dokumen (publik - hanya Published) ───────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { kategoriId, tahun, status, katakunci } = req.query;
    let sql = `
      SELECT d.*, k.nama AS kategori_nama
      FROM dokumen d
      LEFT JOIN kategori k ON d.kategori_id = k.id
      WHERE d.workflow_status = 'Published'
    `;
    const params = [];

    if (kategoriId) { sql += ' AND d.kategori_id = ?'; params.push(kategoriId); }
    if (tahun) { sql += ' AND d.tahun = ?'; params.push(tahun); }
    if (status) { sql += ' AND d.status = ?'; params.push(status); }
    if (katakunci) {
      sql += ' AND (d.judul LIKE ? OR d.nomor LIKE ? OR d.abstrak LIKE ?)';
      const kw = `%${katakunci}%`;
      params.push(kw, kw, kw);
    }
    sql += ' ORDER BY d.created_at DESC';

    const [rows] = await db.query(sql, params);
    const result = await Promise.all(rows.map(async r => formatDokumen(r, await getTags(r.id))));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data dokumen' });
  }
});

// ── GET /api/dokumen/admin (admin - semua workflow status) ────────────────────
router.get('/admin', authMiddleware, requireMenu('dokumen:view'), async (req, res) => {
  try {
    const { kategoriId, tahun, status, katakunci, workflowStatus } = req.query;
    let sql = `
      SELECT d.*, k.nama AS kategori_nama, 
             u1.nama AS submitted_by_nama, 
             u2.nama AS reviewed_by_nama
      FROM dokumen d
      LEFT JOIN kategori k ON d.kategori_id = k.id
      LEFT JOIN users u1 ON d.submitted_by = u1.id
      LEFT JOIN users u2 ON d.reviewed_by = u2.id
      WHERE 1=1
    `;
    const params = [];

    // Isolasi data: jika bukan super admin dan bukan reviewer, hanya tampilkan dokumen yang ditambahkan oleh user tersebut
    const isSuperAdmin = req.user.role === 'superadmin';
    const canReview = (req.user.granted_menus || []).includes('dokumen:review');
    if (!isSuperAdmin && !canReview) {
      sql += ' AND d.submitted_by = ?';
      params.push(req.user.id);
    }

    if (kategoriId) { sql += ' AND d.kategori_id = ?'; params.push(kategoriId); }
    if (tahun) { sql += ' AND d.tahun = ?'; params.push(tahun); }
    if (status) { sql += ' AND d.status = ?'; params.push(status); }
    if (workflowStatus) { sql += ' AND d.workflow_status = ?'; params.push(workflowStatus); }
    if (katakunci) {
      sql += ' AND (d.judul LIKE ? OR d.nomor LIKE ? OR d.abstrak LIKE ?)';
      const kw = `%${katakunci}%`;
      params.push(kw, kw, kw);
    }
    sql += ' ORDER BY d.created_at DESC';

    const [rows] = await db.query(sql, params);
    const result = await Promise.all(rows.map(async r => formatDokumen(r, await getTags(r.id))));
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil data dokumen' });
  }
});

// ── GET /api/dokumen/pending-count ────────────────────────────────────────────
router.get('/pending-count', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(
      "SELECT COUNT(*) AS cnt FROM dokumen WHERE workflow_status = 'PendingReview'"
    );
    res.json({ count: rows[0].cnt });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil data' });
  }
});

// ── GET /api/dokumen/:idOrSlug ────────────────────────────────────────────────
router.get('/:idOrSlug', async (req, res) => {
  try {
    const { idOrSlug } = req.params;
    const isId = /^\d+$/.test(idOrSlug);
    
    let sql = 'SELECT d.*, k.nama AS kategori_nama FROM dokumen d LEFT JOIN kategori k ON d.kategori_id = k.id WHERE ';
    sql += isId ? 'd.id = ?' : 'd.slug = ?';

    const [rows] = await db.query(sql, [idOrSlug]);
    if (rows.length === 0) return res.status(404).json({ error: 'Dokumen tidak ditemukan' });
    
    const docId = rows[0].id;
    const tags = await getTags(docId);
    const relations = await getRelations(docId);
    
    res.json(formatDokumen(rows[0], tags, relations));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil detail dokumen' });
  }
});

// ── POST /api/dokumen ─────────────────────────────────────────────────────────
router.post('/', authMiddleware, requireMenu('dokumen:create'), uploadPdf.single('filePdf'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const {
      judul, nomor, kategoriId, tahun, tanggalPenetapan, tanggalPengundangan,
      status, abstrak, relasiHukum, tag, relatedDocs
    } = req.body;

    if (!judul || !nomor || !kategoriId || !tahun) {
      return res.status(400).json({ error: 'Judul, nomor, kategori, dan tahun wajib diisi' });
    }

    const filePdf = req.file ? req.file.filename : null;
    
    // Parse tags (can be array or JSON string or comma-separated string)
    let tags = [];
    if (Array.isArray(tag)) {
        tags = tag;
    } else if (typeof tag === 'string') {
        if (tag.startsWith('[') && tag.endsWith(']')) {
            try { tags = JSON.parse(tag); } catch { tags = tag.split(',').map(t => t.trim()).filter(Boolean); }
        } else {
            tags = tag.split(',').map(t => t.trim()).filter(Boolean);
        }
    }

    // Parse relatedDocs
    let relations = [];
    if (relatedDocs) {
        try {
            relations = typeof relatedDocs === 'string' ? JSON.parse(relatedDocs) : relatedDocs;
        } catch (e) {
            console.error('Failed to parse relatedDocs:', e);
        }
    }

    const slug = await generateUniqueSlug(conn, judul);

    const [result] = await conn.query(
      `INSERT INTO dokumen 
        (judul, slug, nomor, kategori_id, tahun, tanggal_penetapan, tanggal_pengundangan, status, abstrak, relasi_hukum, file_pdf, workflow_status, submitted_by, submitted_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Draft', ?, NOW())`,
      [judul, slug, nomor, kategoriId, tahun, tanggalPenetapan || null, tanggalPengundangan || null,
       status || 'Berlaku', abstrak || '', relasiHukum || null, filePdf, req.user.id]
    );

    const docId = result.insertId;
    await saveTags(conn, docId, tags);
    await saveRelations(conn, docId, relations);

    // Activity log
    await conn.query(
      'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
      ['Menambah dokumen', 'dokumen', String(docId), judul, req.user.id]
    );

    await conn.commit();
    const [rows] = await db.query(
      'SELECT d.*, k.nama AS kategori_nama FROM dokumen d LEFT JOIN kategori k ON d.kategori_id = k.id WHERE d.id = ?',
      [docId]
    );
    res.status(201).json(formatDokumen(rows[0], tags, relations));
  } catch (err) {
    await conn.rollback();
    if (req.file) deleteFile(`pdf/${req.file.filename}`);
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan dokumen' });
  } finally {
    conn.release();
  }
});

// ── PUT /api/dokumen/:id ──────────────────────────────────────────────────────
router.put('/:id', authMiddleware, requireMenu('dokumen:edit'), uploadPdf.single('filePdf'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [existing] = await conn.query('SELECT * FROM dokumen WHERE id = ?', [req.params.id]);
    if (existing.length === 0) return res.status(404).json({ error: 'Dokumen tidak ditemukan' });

    // Workflow Check: Dokumen yang sedang direview tidak boleh diedit.
    if (existing[0].workflow_status === 'PendingReview') {
      return res.status(400).json({ error: 'Dokumen tidak dapat diedit karena sedang dalam proses review' });
    }

    // Isolasi data: jika bukan super admin dan bukan reviewer, hanya bisa edit dokumennya sendiri
    const isSuperAdmin = req.user.role === 'superadmin';
    const canReview = (req.user.granted_menus || []).includes('dokumen:review');
    if (!isSuperAdmin && !canReview && existing[0].submitted_by !== req.user.id) {
      return res.status(403).json({ error: 'Anda hanya dapat mengedit dokumen yang Anda tambahkan sendiri' });
    }

    const {
      judul, nomor, kategoriId, tahun, tanggalPenetapan, tanggalPengundangan,
      status, abstrak, relasiHukum, tag, relatedDocs, pesanPerubahan
    } = req.body;

    let filePdf = existing[0].file_pdf;
    if (req.file) {
      if (filePdf) deleteFile(`pdf/${filePdf}`);
      filePdf = req.file.filename;
    }

    // Parse tags
    let tags = [];
    if (Array.isArray(tag)) {
        tags = tag;
    } else if (typeof tag === 'string') {
        if (tag.startsWith('[') && tag.endsWith(']')) {
            try { tags = JSON.parse(tag); } catch { tags = tag.split(',').map(t => t.trim()).filter(Boolean); }
        } else {
            tags = tag.split(',').map(t => t.trim()).filter(Boolean);
        }
    }
    
    // Parse relations
    let relations = [];
    if (relatedDocs) {
        try {
            relations = typeof relatedDocs === 'string' ? JSON.parse(relatedDocs) : relatedDocs;
        } catch (e) {
            console.error('Failed to parse relatedDocs:', e);
        }
    }

    // Update slug if title changed
    let slug = existing[0].slug;
    if (judul !== existing[0].judul || !slug) {
        slug = await generateUniqueSlug(conn, judul, req.params.id);
    }

    const prevWorkflowStatus = existing[0].workflow_status;

    // Saat dokumen diedit, status workflow direset ke Draft dan perlu diverifikasi ulang.
    // catatan_koreksi juga dikosongkan karena ini adalah revision baru dari staff.
    await conn.query(
      `UPDATE dokumen SET 
        judul=?, slug=?, nomor=?, kategori_id=?, tahun=?, tanggal_penetapan=?, tanggal_pengundangan=?,
        status=?, abstrak=?, relasi_hukum=?, file_pdf=?,
        workflow_status='Draft', catatan_koreksi='',
        submitted_by=?, submitted_at=NOW()
       WHERE id = ?`,
      [judul, slug, nomor, kategoriId, tahun, tanggalPenetapan || null, tanggalPengundangan || null,
       status || 'Berlaku', abstrak || '', relasiHukum || null, filePdf,
       req.user.id, req.params.id]
    );
    
    await saveTags(conn, req.params.id, tags);
    await saveRelations(conn, req.params.id, relations);

    // Catat log workflow: dokumen diedit dan dikembalikan ke Draft
    const logMessage = pesanPerubahan
      ? `Dokumen diperbarui oleh ${req.user.nama || req.user.username}. Pesan: ${pesanPerubahan}`
      : `Dokumen diperbarui oleh ${req.user.nama || req.user.username} dan perlu verifikasi ulang.`;

    await addWorkflowLog(conn, {
      dokumenId: req.params.id,
      userId: req.user.id,
      action: 'Edit Dokumen',
      before: prevWorkflowStatus,
      after: 'Draft',
      message: logMessage
    });

    await conn.query(
      'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
      ['Mengupdate dokumen', 'dokumen', req.params.id, judul, req.user.id]
    );

    await conn.commit();
    const [rows] = await db.query(
      'SELECT d.*, k.nama AS kategori_nama FROM dokumen d LEFT JOIN kategori k ON d.kategori_id = k.id WHERE d.id = ?',
      [req.params.id]
    );
    res.json(formatDokumen(rows[0], tags, relations));
  } catch (err) {
    await conn.rollback();
    if (req.file) deleteFile(`pdf/${req.file.filename}`);
    console.error(err);
    res.status(500).json({ error: 'Gagal mengupdate dokumen' });
  } finally {
    conn.release();
  }
});

// ── DELETE /api/dokumen/:id ───────────────────────────────────────────────────
router.delete('/:id', authMiddleware, requireMenu('dokumen:delete'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT * FROM dokumen WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Dokumen tidak ditemukan' });

    // Workflow Check: Dokumen yang sedang direview tidak boleh dihapus.
    // Pengecekan role hardcode dihapus karena sudah di-handle oleh requireMenu('dokumen:delete')
    if (rows[0].workflow_status === 'PendingReview') {
      return res.status(400).json({ error: 'Dokumen tidak dapat dihapus saat sedang dalam proses review' });
    }

    // Isolasi data: jika bukan super admin dan bukan reviewer, hanya bisa hapus dokumennya sendiri
    const isSuperAdmin = req.user.role === 'superadmin';
    const canReview = (req.user.granted_menus || []).includes('dokumen:review');
    if (!isSuperAdmin && !canReview && rows[0].submitted_by !== req.user.id) {
      return res.status(403).json({ error: 'Anda hanya dapat menghapus dokumen yang Anda tambahkan sendiri' });
    }

    if (rows[0].file_pdf) deleteFile(`pdf/${rows[0].file_pdf}`);

    await conn.query('DELETE FROM dokumen WHERE id = ?', [req.params.id]);
    await conn.query(
      'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
      ['Menghapus dokumen', 'dokumen', req.params.id, rows[0].judul, req.user.id]
    );
    await conn.commit();
    res.json({ success: true });
  } catch (err) {
    await conn.rollback();
    console.error(err);
    res.status(500).json({ error: 'Gagal menghapus dokumen' });
  } finally {
    conn.release();
  }
});

// ── POST /api/dokumen/:id/download (increment counter) ───────────────────────
router.post('/:id/download', async (req, res) => {
  try {
    await db.query('UPDATE dokumen SET download_count = download_count + 1 WHERE id = ?', [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Gagal mencatat unduhan' });
  }
});

// ── POST /api/dokumen/:id/submit (Submit for Review) ─────────────────────────
router.post('/:id/submit', authMiddleware, requireMenu('dokumen:edit'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT * FROM dokumen WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Dokumen tidak ditemukan' });

    // Pengecekan role hardcode dihapus karena sudah di-handle oleh requireMenu('dokumen:edit')
    if (rows[0].workflow_status !== 'Draft') {
      return res.status(400).json({ error: 'Hanya dokumen berstatus Draft yang dapat diajukan untuk review' });
    }

    await conn.query(
      'UPDATE dokumen SET workflow_status = ?, submitted_by = ?, submitted_at = NOW() WHERE id = ?',
      ['PendingReview', req.user.id, req.params.id]
    );

    await addWorkflowLog(conn, {
      dokumenId: req.params.id,
      userId: req.user.id,
      action: 'Pengajuan Review',
      before: rows[0].workflow_status,
      after: 'PendingReview',
      message: 'Dokumen diajukan untuk ditinjau oleh Verifikator'
    });

    await conn.query(
      'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
      ['Mengajukan dokumen untuk review', 'dokumen', req.params.id, rows[0].judul, req.user.id]
    );
    await conn.commit();
    res.json({ ok: 'Dokumen berhasil diajukan untuk review' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Gagal mengajukan dokumen' });
  } finally {
    conn.release();
  }
});

// ── POST /api/dokumen/:id/publish ─────────────────────────────────────────────
router.post('/:id/publish', authMiddleware, requireMenu('dokumen:review'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT * FROM dokumen WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Dokumen tidak ditemukan' });
    if (rows[0].workflow_status !== 'PendingReview') {
      return res.status(400).json({ error: 'Hanya dokumen PendingReview yang dapat dipublikasikan' });
    }

    await conn.query(
      'UPDATE dokumen SET workflow_status = ?, reviewed_by = ?, reviewed_at = NOW(), catatan_koreksi = ? WHERE id = ?',
      ['Published', req.user.id, '', req.params.id]
    );

    await addWorkflowLog(conn, {
      dokumenId: req.params.id,
      userId: req.user.id,
      action: 'Verifikasi: Terbitkan',
      before: rows[0].workflow_status,
      after: 'Published',
      message: 'Dokumen diperiksa dan dinyatakan LAYAK untuk diterbitkan.'
    });

    await conn.query(
      'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
      ['Mempublikasikan dokumen', 'dokumen', req.params.id, rows[0].judul, req.user.id]
    );
    await conn.commit();
    res.json({ ok: 'Dokumen berhasil dipublikasikan' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Gagal mempublikasikan dokumen' });
  } finally {
    conn.release();
  }
});

// ── POST /api/dokumen/:id/return (Return to Draft) ────────────────────────────
router.post('/:id/return', authMiddleware, requireMenu('dokumen:review'), async (req, res) => {
  const { catatan } = req.body;
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [rows] = await conn.query('SELECT * FROM dokumen WHERE id = ?', [req.params.id]);
    if (rows.length === 0) return res.status(404).json({ error: 'Dokumen tidak ditemukan' });

    await conn.query(
      'UPDATE dokumen SET workflow_status = ?, catatan_koreksi = ?, reviewed_by = ?, reviewed_at = NOW() WHERE id = ?',
      ['Draft', catatan || '', req.user.id, req.params.id]
    );

    await addWorkflowLog(conn, {
      dokumenId: req.params.id,
      userId: req.user.id,
      action: 'Verifikasi: Koreksi',
      before: rows[0].workflow_status,
      after: 'Draft',
      message: catatan || 'Perlu perbaikan sesuai instruksi.'
    });

    await conn.query(
      'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
      ['Mengembalikan dokumen ke Draft', 'dokumen', req.params.id, rows[0].judul, req.user.id]
    );
    await conn.commit();
    res.json({ ok: 'Dokumen dikembalikan ke status Draft' });
  } catch (err) {
    await conn.rollback();
    res.status(500).json({ error: 'Gagal mengembalikan dokumen' });
  } finally {
    conn.release();
  }
});

// ── GET /api/dokumen/:id/logs (History review) ────────────────────────────────
router.get('/:id/logs', authMiddleware, async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT l.*, u.nama as user_nama, u.role as user_role
      FROM dokumen_logs l
      LEFT JOIN users u ON l.user_id = u.id
      WHERE l.dokumen_id = ?
      ORDER BY l.created_at DESC
    `, [req.params.id]);
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: 'Gagal mengambil history' });
  }
});

module.exports = router;
