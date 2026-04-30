-- ============================================================
-- Migration: Definisi Ulang Permission Granular
-- Tanggal: 2026-04-24
-- Deskripsi: Mengganti permission level-menu dengan permission
--            granular (modul:aksi) agar sinkron dengan middleware backend.
-- ============================================================

SET FOREIGN_KEY_CHECKS = 0;

-- ── 1. Hapus mapping lama ──────────────────────────────────────────────────
DELETE FROM role_permissions;

-- ── 2. Hapus permission lama ───────────────────────────────────────────────
DELETE FROM permissions;

-- ── 3. Reset auto_increment ────────────────────────────────────────────────
ALTER TABLE permissions AUTO_INCREMENT = 1;

-- ── 4. Insert Permission Granular Baru ─────────────────────────────────────

-- Dashboard
INSERT INTO permissions (`key`, label) VALUES
('dashboard:view', 'Dashboard — Lihat');

-- Dokumen
INSERT INTO permissions (`key`, label) VALUES
('dokumen:view',   'Dokumen — Lihat'),
('dokumen:create', 'Dokumen — Tambah'),
('dokumen:edit',   'Dokumen — Edit'),
('dokumen:delete', 'Dokumen — Hapus'),
('dokumen:review', 'Dokumen — Verifikasi/Review');

-- Kategori
INSERT INTO permissions (`key`, label) VALUES
('kategori:view',   'Kategori — Lihat'),
('kategori:create', 'Kategori — Tambah'),
('kategori:edit',   'Kategori — Edit'),
('kategori:delete', 'Kategori — Hapus');

-- Berita
INSERT INTO permissions (`key`, label) VALUES
('berita:view',   'Berita — Lihat'),
('berita:create', 'Berita — Tambah'),
('berita:edit',   'Berita — Edit'),
('berita:delete', 'Berita — Hapus');

-- Galeri
INSERT INTO permissions (`key`, label) VALUES
('galeri:view',   'Galeri — Lihat'),
('galeri:create', 'Galeri — Tambah'),
('galeri:delete', 'Galeri — Hapus');

-- Statistik
INSERT INTO permissions (`key`, label) VALUES
('statistik:view', 'Statistik — Lihat');

-- User Management
INSERT INTO permissions (`key`, label) VALUES
('userManagement:view',   'Pengguna — Lihat'),
('userManagement:create', 'Pengguna — Tambah'),
('userManagement:edit',   'Pengguna — Edit'),
('userManagement:delete', 'Pengguna — Hapus');

-- Role Management
INSERT INTO permissions (`key`, label) VALUES
('roleManagement:view',   'Role & Akses — Lihat'),
('roleManagement:create', 'Role & Akses — Tambah'),
('roleManagement:edit',   'Role & Akses — Edit'),
('roleManagement:delete', 'Role & Akses — Hapus');

-- Tentang / Konten Statis
INSERT INTO permissions (`key`, label) VALUES
('tentang:view', 'Tentang JDIH — Lihat'),
('tentang:edit', 'Tentang JDIH — Edit');

-- ── 5. Mapping Ulang: Superadmin → Semua Permission ────────────────────────
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'superadmin';

-- ── 6. Mapping Ulang: Admin/Operator → Semua kecuali user/role management ─
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'admin'
  AND p.`key` NOT IN (
    'userManagement:view', 'userManagement:create', 'userManagement:edit', 'userManagement:delete',
    'roleManagement:view', 'roleManagement:create', 'roleManagement:edit', 'roleManagement:delete'
  );

-- ── 7. Mapping Ulang: Staff → Hanya view + create dokumen, berita, galeri ──
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.name = 'staff'
  AND p.`key` IN (
    'dashboard:view',
    'dokumen:view', 'dokumen:create', 'dokumen:edit',
    'berita:view', 'berita:create', 'berita:edit',
    'galeri:view', 'galeri:create'
  );

SET FOREIGN_KEY_CHECKS = 1;

-- ── 8. Update granted_menus di users agar sinkron dengan role baru ─────────
-- Superadmin: set semua permission
UPDATE users SET granted_menus = (
  SELECT JSON_ARRAYAGG(p.`key`) FROM permissions p
) WHERE role = 'superadmin';

-- Admin: set sesuai role admin
UPDATE users u SET granted_menus = (
  SELECT JSON_ARRAYAGG(p.`key`)
  FROM role_permissions rp
  JOIN permissions p ON rp.permission_id = p.id
  JOIN roles r ON rp.role_id = r.id
  WHERE r.name = 'admin'
) WHERE u.role = 'admin';

-- Staff: set sesuai role staff
UPDATE users u SET granted_menus = (
  SELECT JSON_ARRAYAGG(p.`key`)
  FROM role_permissions rp
  JOIN permissions p ON rp.permission_id = p.id
  JOIN roles r ON rp.role_id = r.id
  WHERE r.name = 'staff'
) WHERE u.role = 'staff';

SELECT 'Migration 002: Granular permissions berhasil!' AS status;
