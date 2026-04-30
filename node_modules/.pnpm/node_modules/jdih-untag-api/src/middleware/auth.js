const jwt = require('jsonwebtoken');

/**
 * Middleware: Verifikasi JWT token dari header Authorization.
 * Menyimpan data user di req.user.
 */
function authMiddleware(req, res, next) {
  const header = req.headers['authorization'];
  if (!header || !header.startsWith('Bearer ')) {
    console.error(`[Auth] No Bearer token on path: ${req.path}`);
    return res.status(401).json({ error: 'Token tidak ditemukan, silakan login terlebih dahulu' });
  }

  const token = header.slice(7);
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded; // { id, username, role, granted_menus }
    next();
  } catch (err) {
    console.error(`[Auth] JWT Error on path ${req.path}:`, err.message);
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ error: 'Sesi login telah berakhir, silakan login kembali' });
    }
    return res.status(401).json({ error: 'Token tidak valid' });
  }
}

/**
 * Middleware: Cek role superadmin.
 */
function requireSuperAdmin(req, res, next) {
  if (req.user?.role !== 'superadmin') {
    return res.status(403).json({ error: 'Hanya Super Admin yang dapat melakukan aksi ini' });
  }
  next();
}

/**
 * Middleware: Cek role superadmin atau admin (bukan guest/operator).
 */
function requireAdmin(req, res, next) {
  const allowed = ['superadmin', 'admin'];
  if (!allowed.includes(req.user?.role)) {
    return res.status(403).json({ error: 'Akses ditolak' });
  }
  next();
}

/**
 * Factory: Cek apakah user memiliki akses ke izin tertentu.
 * Format izin: 'modul:aksi' (contoh: 'dokumen:create')
 * Super admin selalu punya akses ke semua menu/izin.
 */
function requireMenu(permission) {
  return (req, res, next) => {
    // Super admin bypass
    if (req.user?.role === 'superadmin') return next();
    
    const userPermissions = req.user?.granted_menus || [];
    
    // Cek izin granular (format: 'modul:aksi')
    if (userPermissions.includes(permission)) {
      return next();
    }
    
    return res.status(403).json({ error: `Akses ditolak: Anda tidak memiliki izin "${permission}"` });
  };
}

module.exports = { authMiddleware, requireSuperAdmin, requireAdmin, requireMenu };
