# JDIH UNTAG API — Backend Node.js + Express + MySQL

## Cara Menjalankan

### 1. Install dependencies
```bash
cd src/api
npm install
```

### 2. Konfigurasi database
Edit file `.env` sesuai konfigurasi MySQL Anda:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=jdih_untag
DB_USER=root
DB_PASS=password_anda
JWT_SECRET=ganti-dengan-secret-yang-aman
PORT=3001
```

### 3. Buat database & jalankan schema
```sql
-- Di MySQL:
CREATE DATABASE jdih_untag CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE jdih_untag;
SOURCE /path/to/database/schema.sql;
SOURCE /path/to/database/seed.sql;
```

### 4. Jalankan server
```bash
# Development (auto-restart)
npm run dev

# Production
npm start
```

Server akan berjalan di: **http://localhost:3001**

---

## Login Default
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: superadmin

> ⚠️ Wajib ganti password setelah login pertama!

---

## Struktur Folder
```
src/api/
├── .env                    ← Konfigurasi (jangan di-commit ke git!)
├── .env.example            ← Template konfigurasi
├── package.json
├── uploads/                ← File upload (dibuat otomatis)
│   ├── pdf/                ← File PDF dokumen
│   └── gambar/             ← Gambar berita & galeri
└── src/
    ├── server.js           ← Entry point Express
    ├── db.js               ← MySQL connection pool
    ├── middleware/
    │   ├── auth.js         ← JWT authentication
    │   └── upload.js       ← Multer file upload
    └── routes/
        ├── auth.js         ← POST /api/auth/login, GET /api/auth/me
        ├── dokumen.js      ← CRUD dokumen + workflow
        ├── kategori.js     ← CRUD kategori
        ├── berita.js       ← CRUD berita/artikel
        ├── galeri.js       ← CRUD galeri
        ├── tentang.js      ← GET/PUT halaman tentang
        ├── users.js        ← CRUD users + activity log
        └── statistik.js    ← GET statistik
```

---

## API Endpoints

### Auth
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| POST | `/api/auth/login` | - | Login, dapat JWT token |
| GET | `/api/auth/me` | ✅ | Info user yang login |

### Dokumen
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/dokumen` | - | List dokumen published (publik) |
| GET | `/api/dokumen/admin` | ✅ admin | List semua dokumen |
| GET | `/api/dokumen/pending-count` | ✅ | Jumlah pending review |
| GET | `/api/dokumen/:id` | - | Detail dokumen |
| POST | `/api/dokumen` | ✅ admin | Tambah dokumen (multipart/form-data) |
| PUT | `/api/dokumen/:id` | ✅ admin | Update dokumen |
| DELETE | `/api/dokumen/:id` | ✅ admin | Hapus dokumen |
| POST | `/api/dokumen/:id/download` | - | Increment download count |
| POST | `/api/dokumen/:id/submit` | ✅ | Submit for review |
| POST | `/api/dokumen/:id/publish` | ✅ superadmin | Publish dokumen |
| POST | `/api/dokumen/:id/return` | ✅ superadmin | Kembalikan ke draft |

### Kategori
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/kategori` | - | List semua kategori |
| POST | `/api/kategori` | ✅ | Tambah kategori |
| PUT | `/api/kategori/:id` | ✅ | Update kategori |
| DELETE | `/api/kategori/:id` | ✅ | Hapus kategori |

### Berita
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/berita` | - | List berita terbit (publik) |
| GET | `/api/berita/admin` | ✅ | List semua berita |
| GET | `/api/berita/:id` | - | Detail berita |
| POST | `/api/berita` | ✅ | Tambah berita (multipart/form-data) |
| PUT | `/api/berita/:id` | ✅ | Update berita |
| DELETE | `/api/berita/:id` | ✅ | Hapus berita |

### Galeri
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/galeri` | - | List galeri (publik) |
| GET | `/api/galeri/:id` | - | Detail item galeri |
| POST | `/api/galeri` | ✅ | Tambah item galeri |
| PUT | `/api/galeri/:id` | ✅ | Update item galeri |
| DELETE | `/api/galeri/:id` | ✅ | Hapus item galeri |

### Tentang
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/tentang` | - | List semua halaman tentang |
| GET | `/api/tentang/:slug` | - | Halaman tentang by slug |
| PUT | `/api/tentang/:slug` | ✅ | Update halaman tentang |

### Users
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/users` | ✅ | List semua user |
| GET | `/api/users/permissions` | ✅ | Permissions user yang login |
| GET | `/api/users/activity-log/all` | ✅ | Activity log |
| GET | `/api/users/:id` | ✅ | Detail user |
| POST | `/api/users` | ✅ superadmin | Tambah user |
| PUT | `/api/users/:id` | ✅ superadmin | Update user |
| PUT | `/api/users/:id/password` | ✅ superadmin | Ganti password |
| DELETE | `/api/users/:id` | ✅ superadmin | Hapus user |

### Statistik
| Method | Endpoint | Auth | Deskripsi |
|--------|----------|------|-----------|
| GET | `/api/statistik` | - | Statistik dokumen & berita |

---

## File Upload

### PDF Dokumen
- Field: `filePdf`
- Tipe: `multipart/form-data`
- Format: `.pdf` only
- Max size: 50MB
- Disimpan di: `uploads/pdf/`
- URL akses: `/uploads/pdf/[filename]`

### Gambar Berita & Galeri
- Field: `gambar`
- Tipe: `multipart/form-data`
- Format: `.jpg`, `.png`, `.webp`, `.gif`
- Max size: 10MB
- Disimpan di: `uploads/gambar/`
- URL akses: `/uploads/gambar/[filename]`
