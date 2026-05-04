const multer = require('multer');

// ── Gunakan Memory Storage ────────────────────────────────────────────────────
// File disimpan sementara di RAM lalu dikirim ke Google Drive.
// Ini diperlukan karena Vercel tidak mendukung penyimpanan file ke disk.
const memoryStorage = multer.memoryStorage();

// ── Filter untuk PDF ──────────────────────────────────────────────────────────
const pdfFilter = (req, file, cb) => {
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Hanya file PDF yang diizinkan'), false);
  }
};

// ── Filter untuk Gambar ───────────────────────────────────────────────────────
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
  storage: memoryStorage,
  fileFilter: pdfFilter,
  limits: { fileSize: maxSize },
});

const uploadGambar = multer({
  storage: memoryStorage,
  fileFilter: gambarFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB untuk gambar
});

// Stub deleteFile untuk backward compat — penghapusan sekarang lewat googleDrive.js
function deleteFile(filePath) {
  // Tidak ada operasi disk; penghapusan dari Drive dilakukan
  // secara langsung di masing-masing route menggunakan deleteFromDrive(fileId)
}

module.exports = { uploadPdf, uploadGambar, deleteFile };
