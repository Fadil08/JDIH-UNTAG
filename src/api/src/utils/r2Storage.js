const { S3Client, PutObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const path = require('path');

// ── R2 Client ────────────────────────────────────────────────────────────────
function getClient() {
  const accountId = process.env.R2_ACCOUNT_ID;
  const accessKeyId = process.env.R2_ACCESS_KEY_ID;
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY;

  if (!accountId || !accessKeyId || !secretAccessKey) {
    throw new Error('[R2] R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, atau R2_SECRET_ACCESS_KEY belum dikonfigurasi di .env');
  }

  return new S3Client({
    region: 'auto',
    endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
    credentials: { accessKeyId, secretAccessKey },
  });
}

/**
 * Upload file ke Cloudflare R2.
 * @param {Buffer} fileBuffer - Buffer file dari multer (memoryStorage)
 * @param {string} originalName - Nama file asli
 * @param {string} mimeType - MIME type file
 * @param {string} folder - Sub-folder tujuan ('pdf' | 'gambar')
 * @returns {Promise<{key: string, publicUrl: string}>}
 */
async function uploadToR2(fileBuffer, originalName, mimeType, folder) {
  const bucket = process.env.R2_BUCKET_NAME;
  const publicUrl = process.env.R2_PUBLIC_URL;

  if (!bucket) throw new Error('[R2] R2_BUCKET_NAME belum dikonfigurasi di .env');
  if (!publicUrl) throw new Error('[R2] R2_PUBLIC_URL belum dikonfigurasi di .env');

  // Buat key unik: folder/timestamp_namafile.ext
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext)
    .replace(/[^a-zA-Z0-9_\-]/g, '_')
    .slice(0, 80);
  const key = `${folder}/${Date.now()}_${base}${ext}`;

  const client = getClient();
  await client.send(new PutObjectCommand({
    Bucket: bucket,
    Key: key,
    Body: fileBuffer,
    ContentType: mimeType,
  }));

  return {
    key,
    publicUrl: `${publicUrl.replace(/\/$/, '')}/${key}`,
  };
}

/**
 * Hapus file dari Cloudflare R2 berdasarkan key.
 * @param {string} key - Object key di R2 (contoh: 'pdf/123_file.pdf')
 */
async function deleteFromR2(key) {
  if (!key) return;
  try {
    const bucket = process.env.R2_BUCKET_NAME;
    const client = getClient();
    await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    console.warn(`[R2] Gagal hapus file ${key}:`, err.message);
  }
}

/**
 * Deteksi apakah nilai yang disimpan di DB adalah key R2 atau format lama (nama file lokal).
 * Format R2: 'pdf/123_file.pdf' atau 'gambar/123_img.jpg'
 * Format lama: '123_file.pdf' (tanpa subfolder prefix)
 */
function isR2Key(value) {
  if (!value) return false;
  return value.startsWith('pdf/') || value.startsWith('gambar/');
}

/**
 * Bangun URL dari nilai di database.
 * Backward compatible: format lama dikembalikan sebagai path lokal.
 */
function buildUrl(dbValue, folder) {
  if (!dbValue) return null;
  if (dbValue.startsWith('http')) return dbValue; // sudah URL lengkap (Google Drive lama)
  if (isR2Key(dbValue)) {
    // Format R2 baru
    const publicUrl = process.env.R2_PUBLIC_URL || '';
    return `${publicUrl.replace(/\/$/, '')}/${dbValue}`;
  }
  // Format lama — file lokal
  return `/uploads/${folder}/${dbValue}`;
}

module.exports = { uploadToR2, deleteFromR2, isR2Key, buildUrl };
