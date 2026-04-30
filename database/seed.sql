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

-- ── Halaman Tentang default ───────────────────────────────────────────────────
INSERT IGNORE INTO tentang_pages (slug, judul, konten, updated_by) VALUES
(
  'sejarah',
  'Sejarah JDIH UNTAG Banyuwangi',
  '{"blocks":[{"__kind__":"paragraf","paragraf":"Jaringan Dokumentasi dan Informasi Hukum (JDIH) Universitas 17 Agustus 1945 Banyuwangi didirikan sebagai bagian dari upaya mewujudkan tata kelola hukum yang transparan dan akuntabel di lingkungan perguruan tinggi."},{"__kind__":"paragraf","paragraf":"Berdasarkan Peraturan Presiden Nomor 33 Tahun 2012 tentang Jaringan Dokumentasi dan Informasi Hukum Nasional, setiap instansi, termasuk perguruan tinggi, diwajibkan untuk membangun dan mengelola sistem dokumentasi hukum yang terintegrasi."},{"__kind__":"paragraf","paragraf":"JDIH UNTAG Banyuwangi hadir sebagai respons terhadap kebutuhan civitas akademika akan akses yang mudah terhadap seluruh produk hukum kampus, mulai dari Statuta, Peraturan Rektor, Keputusan, hingga Surat Edaran."},{"__kind__":"paragraf","paragraf":"Dengan hadirnya portal JDIH ini, UNTAG Banyuwangi berkomitmen untuk terus meningkatkan pelayanan informasi hukum kepada seluruh pemangku kepentingan, baik internal maupun eksternal universitas."}]}',
  1
),
(
  'visiMisi',
  'Visi & Misi JDIH UNTAG Banyuwangi',
  '{"blocks":[{"__kind__":"paragraf","paragraf":"Menjadi pusat dokumentasi dan informasi hukum perguruan tinggi yang terpercaya, transparan, dan mudah diakses oleh seluruh civitas akademika serta masyarakat umum."},{"__kind__":"daftarItem","daftarItem":["Menghimpun, mengolah, dan mendokumentasikan seluruh produk hukum yang berlaku di lingkungan UNTAG Banyuwangi secara sistematis dan terstruktur.","Menyediakan akses yang mudah, cepat, dan terbuka bagi seluruh civitas akademika dan masyarakat umum terhadap informasi hukum kampus.","Membangun sistem pengelolaan informasi hukum yang modern, handal, dan terintegrasi dengan Jaringan Dokumentasi dan Informasi Hukum Nasional (JDIHN).","Meningkatkan kesadaran hukum di lingkungan kampus melalui diseminasi informasi hukum yang efektif dan berkelanjutan.","Mendukung terciptanya tata kelola universitas yang baik (good university governance) melalui keterbukaan informasi hukum."]}]}',
  1
),
(
  'dasarHukum',
  'Dasar Hukum JDIH UNTAG Banyuwangi',
  '{"blocks":[{"__kind__":"daftarItem","daftarItem":["Undang-Undang Nomor 14 Tahun 2008 tentang Keterbukaan Informasi Publik.","Undang-Undang Nomor 12 Tahun 2011 tentang Pembentukan Peraturan Perundang-undangan.","Peraturan Presiden Nomor 33 Tahun 2012 tentang Jaringan Dokumentasi dan Informasi Hukum Nasional.","Peraturan Menteri Hukum dan Hak Asasi Manusia Nomor 8 Tahun 2019 tentang Standar Pengelolaan Dokumen dan Informasi Hukum.","Statuta Universitas 17 Agustus 1945 Banyuwangi."]}]}',
  1
),
(
  'fungsi',
  'Fungsi JDIH UNTAG Banyuwangi',
  '{"blocks":[{"__kind__":"daftarItem","daftarItem":["Menghimpun dan mendokumentasikan seluruh produk hukum yang ditetapkan oleh pimpinan universitas.","Mengolah dan menyimpan dokumen hukum secara sistematis agar mudah ditemukan dan diakses.","Menyebarluaskan informasi hukum kepada civitas akademika dan masyarakat umum.","Melakukan inventarisasi dan pemutakhiran produk hukum secara berkala.","Menjaga keutuhan dan keotentikan dokumen hukum yang telah ditetapkan.","Berkoordinasi dengan JDIHN untuk memastikan keterpaduan sistem informasi hukum nasional."]}]}',
  1
),
(
  'struktur',
  'Struktur Organisasi JDIH UNTAG Banyuwangi',
  '{"blocks":[{"__kind__":"daftarItem","daftarItem":["Pembina: Rektor Universitas 17 Agustus 1945 Banyuwangi","Pengarah: Wakil Rektor Bidang Umum dan Keuangan","Kepala JDIH: Kepala Bagian Hukum dan Tata Laksana","Pengelola Dokumen: Staf Bagian Hukum","Administrator Sistem: Unit Teknologi Informasi","Tim Verifikasi: Tim Ahli Hukum Internal"]}]}',
  1
);

SELECT 'Seed data berhasil dimasukkan!' AS status;
SELECT 'Username: admin | Password: admin123' AS info_login;
SELECT 'WAJIB GANTI PASSWORD setelah login pertama!' AS peringatan;
