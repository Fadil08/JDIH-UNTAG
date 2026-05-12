-- ============================================================
-- JDIH UNTAG Banyuwangi — Seed Data
-- ============================================================
-- Jalankan setelah schema.sql
-- Password default superadmin: admin123
-- WAJIB GANTI PASSWORD setelah login pertama!
-- ============================================================

USE jdih_untag;

-- ── Permissions Granular ──────────────────────────────────────────────────────
DELETE FROM permissions;
INSERT INTO permissions (`key`, label) VALUES 
('dashboard:view', 'Lihat Dashboard'),
('dokumen:view', 'Lihat Daftar Dokumen'),
('dokumen:create', 'Tambah Dokumen'),
('dokumen:edit', 'Edit Dokumen'),
('dokumen:delete', 'Hapus Dokumen'),
('dokumen:review', 'Verifikasi/Review'),
('berita:view', 'Lihat Berita'),
('berita:create', 'Tambah Berita'),
('berita:edit', 'Edit Berita'),
('berita:delete', 'Hapus Berita'),
('userManagement:view', 'Kelola User');

-- ── Superadmin default ────────────────────────────────────────────────────────
-- Password: admin123 (bcrypt hash)
INSERT IGNORE INTO users (username, password_hash, nama, role, granted_menus, is_active)
VALUES (
  'admin',
  '$2b$10$TTrcmxTZEZfFG2/z8nOgdeUQRf/yChBTu7B.IERBct/gA0yitC1Kq',
  'Administrator',
  'superadmin',
  '["dokumen","kategori","berita","statistik","userManagement","tentang","galeri"]',
  1
);

-- ── Kategori dokumen default ─────────────────────────────────────────────────
INSERT IGNORE INTO kategori (id, nama) VALUES
  (1, 'Statuta'),
  (2, 'Peraturan Rektor'),
  (3, 'Keputusan Rektor'),
  (4, 'Surat Edaran'),
  (5, 'Peraturan Senat'),
  (6, 'Standar Operasional Prosedur (SOP)'),
  (7, 'Perjanjian / MoU');

-- ── Halaman Tentang ───────────────────────────────────────────────────────────
-- 1. Sejarah
INSERT IGNORE INTO tentang_pages (id, slug, judul, updated_by) VALUES (1, 'sejarah', 'Sejarah JDIH UNTAG Banyuwangi', 1);
INSERT IGNORE INTO tentang_konten (page_id, tipe, isi, urutan) VALUES 
(1, 'paragraf', 'Jaringan Dokumentasi dan Informasi Hukum (JDIH) Universitas 17 Agustus 1945 Banyuwangi didirikan sebagai bagian dari upaya mewujudkan tata kelola hukum yang transparan dan akuntabel di lingkungan perguruan tinggi.', 0),
(1, 'paragraf', 'Berdasarkan Peraturan Presiden Nomor 33 Tahun 2012 tentang Jaringan Dokumentasi dan Informasi Hukum Nasional, setiap instansi, termasuk perguruan tinggi, diwajibkan untuk membangun dan mengelola sistem dokumentasi hukum yang terintegrasi.', 1),
(1, 'paragraf', 'JDIH UNTAG Banyuwangi hadir sebagai respons terhadap kebutuhan civitas akademika akan akses yang mudah terhadap seluruh produk hukum kampus.', 2),
(1, 'paragraf', 'Dengan hadirnya portal JDIH ini, UNTAG Banyuwangi berkomitmen untuk terus meningkatkan pelayanan informasi hukum kepada seluruh pemangku kepentingan.', 3);

-- 2. Visi & Misi
INSERT IGNORE INTO tentang_pages (id, slug, judul, updated_by) VALUES (2, 'visiMisi', 'Visi & Misi JDIH UNTAG Banyuwangi', 1);
INSERT IGNORE INTO tentang_konten (page_id, tipe, isi, urutan) VALUES 
(2, 'paragraf', 'Menjadi pusat dokumentasi dan informasi hukum perguruan tinggi yang terpercaya, transparan, dan mudah diakses oleh seluruh civitas akademika serta masyarakat umum.', 0),
(2, 'list_item', 'Menghimpun, mengolah, dan mendokumentasikan seluruh produk hukum yang berlaku di lingkungan UNTAG Banyuwangi secara sistematis dan terstruktur.', 1),
(2, 'list_item', 'Menyediakan akses yang mudah, cepat, dan terbuka bagi seluruh civitas akademika dan masyarakat umum terhadap informasi hukum kampus.', 2),
(2, 'list_item', 'Membangun sistem pengelolaan informasi hukum yang modern, handal, and terintegrasi dengan Jaringan Dokumentasi dan Informasi Hukum Nasional (JDIHN).', 3),
(2, 'list_item', 'Meningkatkan kesadaran hukum di lingkungan kampus melalui diseminasi informasi hukum yang efektif dan berkelanjutan.', 4),
(2, 'list_item', 'Mendukung terciptanya tata kelola universitas yang baik (good university governance) melalui keterbukaan informasi hukum.', 5);

-- 3. Dasar Hukum
INSERT IGNORE INTO tentang_pages (id, slug, judul, updated_by) VALUES (3, 'dasarHukum', 'Dasar Hukum JDIH UNTAG Banyuwangi', 1);
INSERT IGNORE INTO tentang_konten (page_id, tipe, isi, urutan) VALUES 
(3, 'list_item', 'Undang-Undang Nomor 14 Tahun 2008 tentang Keterbukaan Informasi Publik.', 0),
(3, 'list_item', 'Undang-Undang Nomor 12 Tahun 2011 tentang Pembentukan Peraturan Perundang-undangan.', 1),
(3, 'list_item', 'Peraturan Presiden Nomor 33 Tahun 2012 tentang Jaringan Dokumentasi dan Informasi Hukum Nasional.', 2),
(3, 'list_item', 'Peraturan Menteri Hukum dan Hak Asasi Manusia Nomor 8 Tahun 2019 tentang Standar Pengelolaan Dokumen dan Informasi Hukum.', 3),
(3, 'list_item', 'Statuta Universitas 17 Agustus 1945 Banyuwangi.', 4);

-- 4. Fungsi
INSERT IGNORE INTO tentang_pages (id, slug, judul, updated_by) VALUES (4, 'fungsi', 'Fungsi JDIH UNTAG Banyuwangi', 1);
INSERT IGNORE INTO tentang_konten (page_id, tipe, isi, urutan) VALUES 
(4, 'list_item', 'Menghimpun dan mendokumentasikan seluruh produk hukum yang ditetapkan oleh pimpinan universitas.', 0),
(4, 'list_item', 'Mengolah dan menyimpan dokumen hukum secara sistematis agar mudah ditemukan dan diakses.', 1),
(4, 'list_item', 'Menyebarluaskan informasi hukum kepada civitas akademika dan masyarakat umum.', 2),
(4, 'list_item', 'Melakukan inventarisasi dan pemutakhiran produk hukum secara berkala.', 3),
(4, 'list_item', 'Menjaga keutuhan dan keotentikan dokumen hukum yang telah ditetapkan.', 4),
(4, 'list_item', 'Berkoordinasi dengan JDIHN untuk memastikan keterpaduan sistem informasi hukum nasional.', 5);

-- 5. Struktur
INSERT IGNORE INTO tentang_pages (id, slug, judul, updated_by) VALUES (5, 'struktur', 'Struktur Organisasi JDIH UNTAG Banyuwangi', 1);
INSERT IGNORE INTO tentang_konten (page_id, tipe, isi, nama, jabatan, unit, urutan) VALUES 
(5, 'struktur_item', 'Struktur 1', 'Prof. Dr. H. Teguh Sulistyo, S.H., M.H.', 'Penanggung Jawab', 'Rektor UNTAG Banyuwangi', 0),
(5, 'struktur_item', 'Struktur 2', 'Dr. Hj. Sri Wahyuni, S.H., M.H.', 'Ketua JDIH', 'Wakil Rektor Bidang Akademik', 1),
(5, 'struktur_item', 'Struktur 3', 'Agus Prasetyo, S.H., M.H.', 'Koordinator Teknis', 'Kepala Bagian Hukum', 2),
(5, 'struktur_item', 'Struktur 4', 'Staf Bagian Hukum', 'Pengelola Dokumen', 'Biro Umum', 3),
(5, 'struktur_item', 'Struktur 5', 'Unit Teknologi Informasi', 'Administrator Sistem', 'UPT TI', 4),
(5, 'struktur_item', 'Struktur 6', 'Tim Ahli Hukum Internal', 'Tim Verifikasi', 'Fakultas Hukum', 5);

SELECT 'Seed data berhasil dimasukkan!' AS status;
SELECT 'Username: admin | Password: admin123' AS info_login;
SELECT 'WAJIB GANTI PASSWORD setelah login pertama!' AS peringatan;
