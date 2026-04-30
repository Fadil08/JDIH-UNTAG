const router = require('express').Router();
const db = require('../db');
const { authMiddleware, requireMenu } = require('../middleware/auth');
const { uploadGambar, deleteFile } = require('../middleware/upload');

// ── GET /api/settings (publik) ────────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const [rows] = await db.query('SELECT setting_key, setting_value FROM settings');
    const settings = rows.reduce((acc, row) => {
      acc[row.setting_key] = row.setting_value;
      return acc;
    }, {});
    
    // Add full URL to logo_url if present
    if (settings.logo_url) {
      settings.logo_url = `/uploads/gambar/${settings.logo_url}`;
    }
    
    res.json(settings);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Gagal mengambil pengaturan' });
  }
});

// ── PUT /api/settings (Admin) ─────────────────────────────────────────────────
router.put('/', authMiddleware, requireMenu('settings:edit'), uploadGambar.single('logo'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const settingsInput = req.body;
    
    // Validasi field yang diizinkan untuk diupdate (selain logo_url yang dihandle multer)
    const allowedKeys = ['app_name', 'unit_name', 'app_description', 'contact_email', 'contact_phone'];
    
    for (const key of allowedKeys) {
      if (settingsInput[key] !== undefined) {
        await conn.query(
          'INSERT INTO settings (setting_key, setting_value) VALUES (?, ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)',
          [key, settingsInput[key]]
        );
      }
    }

    if (req.file) {
      // Ambil logo lama untuk dihapus
      const [oldLogo] = await conn.query("SELECT setting_value FROM settings WHERE setting_key = 'logo_url'");
      if (oldLogo.length > 0 && oldLogo[0].setting_value) {
        deleteFile(`gambar/${oldLogo[0].setting_value}`);
      }
      
      // Update dengan nama file baru
      await conn.query(
        "INSERT INTO settings (setting_key, setting_value) VALUES ('logo_url', ?) ON DUPLICATE KEY UPDATE setting_value = VALUES(setting_value)",
        [req.file.filename]
      );
    }
    
    // Log activity
    await conn.query(
      'INSERT INTO activity_log (action, target_type, target_id, target_title, performed_by) VALUES (?, ?, ?, ?, ?)',
      ['Mengupdate Pengaturan', 'settings', '0', 'Pengaturan Website', req.user.id]
    );

    await conn.commit();
    res.json({ success: true, message: 'Pengaturan berhasil disimpan' });
  } catch (err) {
    await conn.rollback();
    if (req.file) deleteFile(`gambar/${req.file.filename}`);
    console.error(err);
    res.status(500).json({ error: 'Gagal menyimpan pengaturan' });
  } finally {
    conn.release();
  }
});

module.exports = router;
