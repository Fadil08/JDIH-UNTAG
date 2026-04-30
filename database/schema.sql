-- ============================================================
-- JDIH UNTAG Banyuwangi — MySQL Schema
-- ============================================================
-- Jalankan file ini di MySQL setelah membuat database:
--   CREATE DATABASE jdih_untag CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   USE jdih_untag;
--   SOURCE schema.sql;
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── Tabel: users ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id              INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username        VARCHAR(100)  NOT NULL UNIQUE,
  password_hash   VARCHAR(255)  NOT NULL,
  nama            VARCHAR(255)  NULL,
  role            ENUM('superadmin', 'admin', 'staff') NOT NULL DEFAULT 'staff',
  granted_menus   JSON          NULL COMMENT 'Array menu permissions: ["dokumen","berita",...]',
  is_active       TINYINT(1)    NOT NULL DEFAULT 1,
  added_by        INT UNSIGNED  NULL,
  created_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabel: kategori ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS kategori (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  nama        VARCHAR(255) NOT NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabel: dokumen ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dokumen (
  id                    INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  judul                 VARCHAR(500)  NOT NULL,
  nomor                 VARCHAR(255)  NOT NULL,
  kategori_id           INT UNSIGNED  NOT NULL,
  tahun                 SMALLINT UNSIGNED NOT NULL,
  tanggal_penetapan     DATE          NULL,
  tanggal_pengundangan  DATE          NULL,
  status                ENUM('Berlaku', 'Tidak Berlaku', 'Dicabut', 'Diubah', 'Mencabut', 'Mengubah', 'Menjabarkan') NOT NULL DEFAULT 'Berlaku',
  abstrak               TEXT          NULL,
  relasi_hukum          TEXT          NULL COMMENT 'Catatan tambahan relasi hukum',
  file_pdf              VARCHAR(500)  NULL COMMENT 'Filename di folder uploads/pdf/',
  download_count        INT UNSIGNED  NOT NULL DEFAULT 0,
  workflow_status       ENUM('Draft', 'PendingReview', 'Published', 'Archived') NOT NULL DEFAULT 'Draft',
  catatan_koreksi       TEXT          NULL,
  slug                  VARCHAR(600)  NULL UNIQUE,
  reviewed_by           INT UNSIGNED  NULL,
  reviewed_at           TIMESTAMP     NULL,
  submitted_by          INT UNSIGNED  NULL,
  submitted_at          TIMESTAMP     NULL,
  created_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (kategori_id) REFERENCES kategori(id),
  FOREIGN KEY (reviewed_by)  REFERENCES users(id) ON DELETE SET NULL,
  FOREIGN KEY (submitted_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_workflow (workflow_status),
  INDEX idx_kategori (kategori_id),
  INDEX idx_tahun (tahun),
  INDEX idx_slug (slug),
  FULLTEXT INDEX ft_search (judul, nomor, abstrak)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabel: dokumen_relasi (Simlink) ──────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dokumen_relasi (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dokumen_id    INT UNSIGNED NOT NULL COMMENT 'Dokumen sumber',
  target_id     INT UNSIGNED NOT NULL COMMENT 'Dokumen yang direferensikan',
  tipe_relasi   ENUM('Mencabut', 'Mengubah', 'Menjabarkan') NOT NULL,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dokumen_id) REFERENCES dokumen(id) ON DELETE CASCADE,
  FOREIGN KEY (target_id)  REFERENCES dokumen(id) ON DELETE CASCADE,
  UNIQUE KEY unique_rel (dokumen_id, target_id, tipe_relasi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabel: dokumen_tags ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS dokumen_tags (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dokumen_id  INT UNSIGNED NOT NULL,
  tag         VARCHAR(100) NOT NULL,
  FOREIGN KEY (dokumen_id) REFERENCES dokumen(id) ON DELETE CASCADE,
  INDEX idx_dokumen (dokumen_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabel: dokumen_logs (Riwayat Review) ────────────────────────────────────
CREATE TABLE IF NOT EXISTS dokumen_logs (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  dokumen_id    INT UNSIGNED NOT NULL,
  user_id       INT UNSIGNED NOT NULL,
  action        VARCHAR(100) NOT NULL,
  status_before VARCHAR(50),
  status_after  VARCHAR(50),
  message       TEXT,
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (dokumen_id) REFERENCES dokumen(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabel: artikel (Berita) ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artikel (
  id                INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  judul             VARCHAR(500)  NOT NULL,
  konten            LONGTEXT      NOT NULL,
  ringkasan         TEXT          NULL,
  author            VARCHAR(255)  NULL,
  gambar            VARCHAR(500)  NULL COMMENT 'Filename di folder uploads/gambar/',
  status            ENUM('Draft', 'Terbit') NOT NULL DEFAULT 'Terbit',
  tanggal           TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  tanggal_publikasi TIMESTAMP     NULL,
  created_by        INT UNSIGNED  NULL,
  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_status (status),
  INDEX idx_tanggal_pub (tanggal_publikasi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabel: artikel_tags ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS artikel_tags (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  artikel_id  INT UNSIGNED NOT NULL,
  tag         VARCHAR(100) NOT NULL,
  FOREIGN KEY (artikel_id) REFERENCES artikel(id) ON DELETE CASCADE,
  INDEX idx_artikel (artikel_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabel: galeri ─────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS galeri (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  judul       VARCHAR(500) NOT NULL,
  deskripsi   TEXT         NULL,
  gambar      VARCHAR(500) NULL COMMENT 'Filename di folder uploads/gambar/',
  album       VARCHAR(255) NULL,
  created_by  INT UNSIGNED NULL,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabel: tentang_pages ──────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS tentang_pages (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  slug        ENUM('sejarah', 'visiMisi', 'dasarHukum', 'fungsi', 'struktur') NOT NULL UNIQUE,
  judul       VARCHAR(500) NOT NULL,
  konten      JSON         NOT NULL COMMENT 'Object { blocks: TentangBlock[] }',
  updated_by  INT UNSIGNED NULL,
  updated_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabel: activity_log ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS activity_log (
  id            INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  action        VARCHAR(255) NOT NULL,
  target_type   VARCHAR(100) NULL,
  target_id     VARCHAR(100) NULL,
  target_title  VARCHAR(500) NULL,
  performed_by  INT UNSIGNED NULL,
  performed_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (performed_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_performed_at (performed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabel: permissions ────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS permissions (
  id      INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  `key`   VARCHAR(100) NOT NULL UNIQUE,
  label   VARCHAR(255) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabel: roles ──────────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS roles (
  id          INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL UNIQUE COMMENT 'Slug nama peran',
  label       VARCHAR(255) NOT NULL,
  description TEXT NULL,
  is_system   TINYINT(1) NOT NULL DEFAULT 0 COMMENT '1 jika peran bawaan sistem'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Tabel: role_permissions ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id       INT UNSIGNED NOT NULL,
  permission_id INT UNSIGNED NOT NULL,
  PRIMARY KEY (role_id, permission_id),
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ── Data Awal: Permissions (Granular: modul:aksi) ────────────────────────────
INSERT IGNORE INTO permissions (`key`, label) VALUES
-- Dashboard
('dashboard:view', 'Dashboard — Lihat'),
-- Dokumen
('dokumen:view',   'Dokumen — Lihat'),
('dokumen:create', 'Dokumen — Tambah'),
('dokumen:edit',   'Dokumen — Edit'),
('dokumen:delete', 'Dokumen — Hapus'),
('dokumen:review', 'Dokumen — Verifikasi/Review'),
-- Kategori
('kategori:view',   'Kategori — Lihat'),
('kategori:create', 'Kategori — Tambah'),
('kategori:edit',   'Kategori — Edit'),
('kategori:delete', 'Kategori — Hapus'),
-- Berita
('berita:view',   'Berita — Lihat'),
('berita:create', 'Berita — Tambah'),
('berita:edit',   'Berita — Edit'),
('berita:delete', 'Berita — Hapus'),
-- Galeri
('galeri:view',   'Galeri — Lihat'),
('galeri:create', 'Galeri — Tambah'),
('galeri:delete', 'Galeri — Hapus'),
-- Statistik
('statistik:view', 'Statistik — Lihat'),
-- User Management
('userManagement:view',   'Pengguna — Lihat'),
('userManagement:create', 'Pengguna — Tambah'),
('userManagement:edit',   'Pengguna — Edit'),
('userManagement:delete', 'Pengguna — Hapus'),
-- Role Management
('roleManagement:view',   'Role & Akses — Lihat'),
('roleManagement:create', 'Role & Akses — Tambah'),
('roleManagement:edit',   'Role & Akses — Edit'),
('roleManagement:delete', 'Role & Akses — Hapus'),
-- Tentang / Konten Statis
('tentang:view', 'Tentang JDIH — Lihat'),
('tentang:edit', 'Tentang JDIH — Edit'),
-- Settings
('settings:view', 'Pengaturan — Lihat'),
('settings:edit', 'Pengaturan — Edit'),
-- Activity Log
('activityLog:view', 'Log Aktivitas — Lihat');

-- ── Data Awal: Roles ──────────────────────────────────────────────────────────
INSERT IGNORE INTO roles (name, label, is_system) VALUES 
('superadmin', 'Super Admin', 1),
('admin', 'Operator Admin', 1),
('staff', 'Staff', 1);

-- ── Mapping Awal: Role Permissions ───────────────────────────────────────────
-- Superadmin (semua akses)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name='superadmin'), id FROM permissions;

-- Admin (semua kecuali user & role management)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name='admin'), id FROM permissions
WHERE `key` NOT IN (
  'userManagement:view', 'userManagement:create', 'userManagement:edit', 'userManagement:delete',
  'roleManagement:view', 'roleManagement:create', 'roleManagement:edit', 'roleManagement:delete'
);

-- Pastikan superadmin punya semua permission baru
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name='superadmin'), id FROM permissions
WHERE `key` IN ('settings:view', 'settings:edit', 'activityLog:view');

-- Admin juga punya settings & activityLog
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name='admin'), id FROM permissions
WHERE `key` IN ('settings:view', 'settings:edit', 'activityLog:view');

-- Staff (dashboard, dokumen view+create+edit, berita view+create+edit, galeri view+create)
INSERT IGNORE INTO role_permissions (role_id, permission_id)
SELECT (SELECT id FROM roles WHERE name='staff'), id FROM permissions
WHERE `key` IN (
  'dashboard:view',
  'dokumen:view', 'dokumen:create', 'dokumen:edit',
  'berita:view', 'berita:create', 'berita:edit',
  'galeri:view', 'galeri:create'
);

SET FOREIGN_KEY_CHECKS = 1;

SELECT 'Schema berhasil dibuat!' AS status;
