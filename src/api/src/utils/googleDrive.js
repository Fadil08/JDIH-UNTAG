const { google } = require('googleapis');
const { Readable } = require('stream');
const path = require('path');

// ── Auth Google Drive (Service Account) ──────────────────────────────────────
const auth = new google.auth.JWT(
  process.env.GOOGLE_DRIVE_CLIENT_EMAIL,
  null,
  (process.env.GOOGLE_DRIVE_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
  ['https://www.googleapis.com/auth/drive']
);

const drive = google.drive({ version: 'v3', auth });

/**
 * Upload file ke Google Shared Drive.
 * @param {Buffer} fileBuffer - Buffer file dari multer (memoryStorage)
 * @param {string} originalName - Nama file asli
 * @param {string} mimeType - MIME type file
 * @param {string} folderId - ID folder di Shared Drive
 * @returns {Promise<{fileId: string, directUrl: string, viewUrl: string}>}
 */
async function uploadToDrive(fileBuffer, originalName, mimeType, folderId) {
  // Validasi konfigurasi sebelum upload
  if (!process.env.GOOGLE_DRIVE_CLIENT_EMAIL || !process.env.GOOGLE_DRIVE_PRIVATE_KEY) {
    throw new Error('[Drive] GOOGLE_DRIVE_CLIENT_EMAIL atau GOOGLE_DRIVE_PRIVATE_KEY belum dikonfigurasi di .env');
  }
  if (!folderId || folderId.startsWith('your_')) {
    throw new Error('[Drive] Folder ID Google Drive belum dikonfigurasi di .env');
  }

  // Buat nama file unik agar tidak bentrok
  const ext = path.extname(originalName);
  const base = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 80);
  const uniqueName = `${Date.now()}_${base}${ext}`;

  // supportsAllDrives: true agar bisa upload ke Shared Drive
  const response = await drive.files.create({
    supportsAllDrives: true,
    requestBody: {
      name: uniqueName,
      parents: [folderId],
    },
    media: {
      mimeType: mimeType,
      body: Readable.from(fileBuffer),
    },
    fields: 'id, name, webContentLink, webViewLink',
  });

  // Set file bisa diakses publik (untuk embed gambar/PDF di frontend)
  await drive.permissions.create({
    fileId: response.data.id,
    supportsAllDrives: true,
    requestBody: {
      role: 'reader',
      type: 'anyone',
    },
  });

  return {
    fileId: response.data.id,
    fileName: response.data.name,
    directUrl: `https://drive.google.com/uc?export=view&id=${response.data.id}`,
    viewUrl: response.data.webViewLink,
  };
}

/**
 * Hapus file dari Google Drive berdasarkan file ID.
 * @param {string} fileId - ID file di Google Drive
 */
async function deleteFromDrive(fileId) {
  if (!fileId) return;
  try {
    await drive.files.delete({
      fileId,
      supportsAllDrives: true,
    });
  } catch (err) {
    console.warn(`[Drive] Gagal hapus file ${fileId}:`, err.message);
  }
}

module.exports = { uploadToDrive, deleteFromDrive };
