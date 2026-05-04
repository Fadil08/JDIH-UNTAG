require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Pastikan folder uploads ada (Hanya dijalankan di Lokal, bukan di Vercel/Production) ──
const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_DIR || 'uploads');
if (process.env.NODE_ENV !== 'production') {
  ['pdf', 'gambar'].forEach(sub => {
    const dir = path.join(uploadDir, sub);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  });
}

// ── Middleware global ────────────────────────────────────────────────────────
app.use(cors({
  origin: function (origin, callback) {
    // Izinkan requests tanpa origin (misal mobile apps atau curl), localhost, dan semua subdomain vercel.app
    if (!origin || origin.includes('localhost') || origin.endsWith('.vercel.app') || origin === process.env.FRONTEND_URL) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ── Static files (PDF & gambar yang diupload) ────────────────────────────────
app.use('/uploads', express.static(uploadDir));

// ── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/auth', require('./routes/auth'));
app.use('/api/kategori', require('./routes/kategori'));
app.use('/api/status', require('./routes/status'));
app.use('/api/dokumen', require('./routes/dokumen'));
app.use('/api/berita', require('./routes/berita'));
app.use('/api/galeri', require('./routes/galeri'));
app.use('/api/tentang', require('./routes/tentang'));
app.use('/api/users', require('./routes/users'));
app.use('/api/roles', require('./routes/roles'));
app.use('/api/statistik', require('./routes/statistik'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/logs', require('./routes/logs'));

// ── Health check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), service: 'JDIH UNTAG API' });
});

// ── 404 handler ──────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint tidak ditemukan' });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Terjadi kesalahan pada server',
  });
});

// ── Start server ──────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 JDIH UNTAG API berjalan di http://localhost:${PORT}`);
  console.log(`📁 File upload disimpan di: ${uploadDir}`);
});

module.exports = app;
