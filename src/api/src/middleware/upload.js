const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadDir = path.join(__dirname, '..', '..', process.env.UPLOAD_DIR || 'uploads');

// ── Storage untuk PDF ─────────────────────────────────────────────────────────
const pdfStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadDir, 'pdf');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .slice(0, 80);
    const unique = `${Date.now()}_${base}${ext}`;
    cb(null, unique);
  },
});

const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Hanya file PDF yang diizinkan'), false);
  }
};

// ── Storage untuk Gambar ──────────────────────────────────────────────────────
const gambarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = path.join(uploadDir, 'gambar');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const base = path.basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_\-]/g, '_')
      .slice(0, 80);
    const unique = `${Date.now()}_${base}${ext}`;
    cb(null, unique);
  },
});

const gambarFilter = (req, file, cb) => {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Hanya file gambar (JPG, PNG, WebP, GIF) yang diizinkan'), false);
  }
};

const maxSize = parseInt(process.env.MAX_FILE_SIZE || '52428800'); // 50MB default

const uploadPdf = multer({
  storage: pdfStorage,
  fileFilter: pdfFilter,
  limits: { fileSize: maxSize },
});

const uploadGambar = multer({
  storage: gambarStorage,
  fileFilter: gambarFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB untuk gambar
});

/**
 * Hapus file lama dari disk jika ada.
 */
function deleteFile(filePath) {
  if (!filePath) return;
  const abs = path.join(uploadDir, filePath.replace('/uploads/', ''));
  if (fs.existsSync(abs)) {
    fs.unlink(abs, err => {
      if (err) console.warn('Gagal hapus file lama:', err.message);
    });
  }
}

module.exports = { uploadPdf, uploadGambar, deleteFile };
