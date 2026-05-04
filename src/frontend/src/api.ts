// REST API client untuk JDIH UNTAG
// Menggantikan seluruh IC SDK / Motoko actor layer

export const API_BASE = import.meta.env.VITE_API_URL ?? 'jdih-untag-api.vercel.app';

// ── Token helpers ─────────────────────────────────────────────────────────────

export function getToken(): string | null {
  return localStorage.getItem('jdih_token');
}

export function setToken(token: string) {
  localStorage.setItem('jdih_token', token);
}

export function clearToken() {
  localStorage.removeItem('jdih_token');
  localStorage.removeItem('jdih_user');
}

export function getStoredUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem('jdih_user');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredUser(user: AuthUser) {
  localStorage.setItem('jdih_user', JSON.stringify(user));
}

// ── Auth types ────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: number;
  username: string;
  nama: string | null;
  role: 'superadmin' | 'admin' | 'staff';
  granted_menus: string[];
}

export interface LoginResult {
  token: string;
  user: AuthUser;
}

// ── Domain types (matching backend response shape) ────────────────────────────

export type StatusDokumen = string;

export interface StatusItem {
  id: number;
  nama: string;
  warna?: string;
  created_at?: string;
}

export type WorkflowStatus = 'Draft' | 'PendingReview' | 'Published' | 'Archived';
export type TentangSlug = 'sejarah' | 'visiMisi' | 'dasarHukum' | 'fungsi' | 'struktur';
export type MenuPermission = string;

// JenisDokumen tetap untuk backward compat
export type JenisDokumen =
  | 'Statuta' | 'PeraturanRektor' | 'KeputusanRektor'
  | 'SuratEdaran' | 'PeraturanSenat' | 'SOP' | 'MoU';

export interface Kategori {
  id: number;
  nama: string;
  deskripsi?: string;        // optional backward compat
  jumlahDokumen?: number;    // optional backward compat
  created_at?: string;
}

export interface Dokumen {
  id: number;
  slug: string;
  judul: string;
  nomor: string;
  kategoriId: number;
  kategoriNama: string | null;
  tahun: number;
  tanggalPenetapan: string | null;
  tanggalPengundangan: string | null;
  status: StatusDokumen;
  abstrak: string;
  relasiHukum: string | null;
  filePdf: string | null;       // URL path, e.g. /uploads/pdf/xxx.pdf
  downloadCount: number;
  workflowStatus: WorkflowStatus;
  catatanKoreksi: string;
  reviewedBy: number | null;
  reviewedAt: string | null;
  reviewedByNama: string | null;
  submittedBy: number | null;
  submittedByNama: string | null;
  tag: string[];
  relations?: DokumenRelation[];
  createdAt: string;
  updatedAt: string;
}

export interface DokumenRelation {
  id: number;
  slug: string;
  judul: string;
  nomor: string;
  tipe_relasi: string;
  arah: 'outbound' | 'inbound';
}

export interface FilterDokumen {
  kategoriId?: number;
  tahun?: number | '';
  status?: StatusDokumen | '';
  katakunci?: string;
  query?: string;          // alias untuk katakunci di frontend
  jenis?: string | '';     // alias untuk kategori filter di frontend
  workflowStatus?: WorkflowStatus;
}

export interface DokumenInput {
  judul: string;
  nomor: string;
  kategoriId: number;
  tahun: number;
  tanggalPenetapan?: string;
  tanggalPengundangan?: string;
  status?: StatusDokumen;
  abstrak?: string;
  relasiHukum?: string;
  tag?: string[];
  filePdf?: File;
  pesanPerubahan?: string;
}

export interface Artikel {
  id: number;
  judul: string;
  konten: string;
  ringkasan: string;
  author: string;
  gambar: string | null;  // URL path
  status: string;
  tanggal: string;
  tanggalPublikasi: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ArtikelInput {
  judul: string;
  konten: string;
  ringkasan?: string;
  author?: string;
  status?: string;
  tanggalPublikasi?: string;
  tags?: string[];
  gambar?: File;
}

export interface GaleriItem {
  id: number;
  judul: string;
  deskripsi: string;
  gambar: string | null; // URL path
  album: string;
  createdBy: number | null;
  createdAt: string;
}

export interface GaleriItemInput {
  judul: string;
  deskripsi?: string;
  album?: string;
  gambar?: File;
}

export interface TentangBlock {
  __kind__: 'paragraf' | 'daftarItem';
  paragraf?: string;
  daftarItem?: string[];
}

export interface TentangContent {
  blocks: TentangBlock[];
}

export interface TentangPage {
  id: number;
  slug: TentangSlug;
  judul: string;
  konten: TentangContent;
  updatedBy: number | null;
  updatedAt: string;
}

export interface TentangPageInput {
  judul: string;
  konten: TentangContent;
}

export interface AdminUser {
  id: number;
  username: string;
  nama: string | null;
  role: string;
  grantedMenus: MenuPermission[];
  isActive: boolean;
  addedBy: number | null;
  createdAt: string;
}

export interface AdminUserInput {
  username: string;
  password?: string;
  nama?: string;
  role: string;
  grantedMenus: MenuPermission[];
  isActive: boolean;
}

export interface MyPermissions {
  isAdmin: boolean;
  grantedMenus: MenuPermission[];
}

export interface ActivityLog {
  id: number;
  action: string;
  targetType: string;
  targetId: string;
  targetTitle: string;
  performedBy: string;
  performedByNama?: string;
  performedAt: string;
}

export interface PermissionOption {
  id: number;
  key: MenuPermission;
  label: string;
}

export interface WorkflowLog {
  id: number;
  dokumen_id: number;
  user_id: number;
  user_nama: string | null;
  user_role: string | null;
  action: string;
  status_before: string | null;
  status_after: string | null;
  message: string | null;
  created_at: string;
}

export interface Role {
  id: number;
  name: string;
  label: string;
  description: string | null;
  is_system: boolean;
}

export interface RoleWithPermissions extends Role {
  permissions: MenuPermission[];
}

export interface RoleInput {
  name: string;
  label: string;
  description?: string;
  permissions: MenuPermission[];
}

export interface Statistik {
  totalDokumen: number;
  totalUnduhan: number;
  totalArtikel: number;
  totalKategori?: number;
  perKategori: Array<{ id: number; nama: string; jumlah: number }>;
  dokumenPerKategori?: Array<{
    kategoriId: string | number;
    kategoriNama: string;
    jumlah: number;
  }>;
  trenTahun?: Array<{
    tahun: string;
    jumlah: number;
  }>;
}

export interface Settings {
  app_name: string;
  unit_name: string;
  app_description: string;
  contact_email: string;
  contact_phone: string;
  logo_url: string;
}

export interface SettingsInput {
  app_name?: string;
  unit_name?: string;
  app_description?: string;
  contact_email?: string;
  contact_phone?: string;
  logo?: File | null;
}

export interface WorkflowResult {
  ok?: string;
  err?: string;
}

// ── Core fetch wrapper ────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  // Don't set Content-Type for FormData (let browser set multipart boundary)
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && path !== '/auth/login') {
    clearToken();
    window.location.href = '/';
    throw new Error('Sesi login telah berakhir');
  }

  const json = await res.json();

  if (!res.ok) {
    throw new Error(json?.error ?? `HTTP ${res.status}`);
  }

  return json as T;
}

// Build FormData helper for multipart uploads
function buildFormData(data: Record<string, unknown>, fileField?: string, file?: File): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;

    if (v instanceof File || v instanceof Blob) {
      fd.append(k, v);
    } else if (Array.isArray(v) || (typeof v === 'object' && v !== null)) {
      fd.append(k, JSON.stringify(v));
    } else {
      fd.append(k, String(v));
    }
  }
  if (fileField && file) {
    fd.append(fileField, file);
  }
  return fd;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export const api = {
  auth: {
    login: (username: string, password: string) =>
      apiFetch<LoginResult>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ username, password }),
      }),
    me: () => apiFetch<AuthUser & MyPermissions>('/api/auth/me'),
  },

  // ── Dokumen ──────────────────────────────────────────────────────────────────

  dokumen: {
    list: (filter?: FilterDokumen) => {
      const params = new URLSearchParams();
      if (filter?.kategoriId) params.set('kategoriId', String(filter.kategoriId));
      if (filter?.tahun) params.set('tahun', String(filter.tahun));
      if (filter?.status) params.set('status', filter.status);
      if (filter?.katakunci) params.set('katakunci', filter.katakunci);
      if (filter?.query) params.set('katakunci', filter.query); // alias for search input
      const qs = params.toString() ? `?${params}` : '';
      return apiFetch<Dokumen[]>(`/api/dokumen${qs}`);
    },
    listAdmin: (filter?: FilterDokumen) => {
      const params = new URLSearchParams();
      if (filter?.kategoriId) params.set('kategoriId', String(filter.kategoriId));
      if (filter?.tahun) params.set('tahun', String(filter.tahun));
      if (filter?.status) params.set('status', filter.status);
      if (filter?.katakunci) params.set('katakunci', filter.katakunci);
      if (filter?.query) params.set('katakunci', filter.query);  // alias for search input
      if (filter?.workflowStatus) params.set('workflowStatus', filter.workflowStatus);
      const qs = params.toString() ? `?${params}` : '';
      return apiFetch<Dokumen[]>(`/api/dokumen/admin${qs}`);
    },
    detail: (id: string | number) => apiFetch<Dokumen>(`/api/dokumen/${id}`),
    pendingCount: () => apiFetch<{ count: number }>('/api/dokumen/pending-count'),
    add: (input: DokumenInput) => {
      const { filePdf, tag, ...rest } = input;
      const fd = buildFormData(rest, 'filePdf', filePdf);
      (tag ?? []).forEach((t) => fd.append('tag', t));
      return apiFetch<Dokumen>('/api/dokumen', { method: 'POST', body: fd });
    },
    update: (id: string | number, input: DokumenInput) => {
      const { filePdf, tag, ...rest } = input;
      const fd = buildFormData(rest, 'filePdf', filePdf);
      (tag ?? []).forEach((t) => fd.append('tag', t));
      return apiFetch<Dokumen>(`/api/dokumen/${id}`, { method: 'PUT', body: fd });
    },
    delete: (id: string | number) =>
      apiFetch<{ success: boolean }>(`/api/dokumen/${id}`, { method: 'DELETE' }),
    download: (id: string | number) =>
      apiFetch<{ success: boolean }>(`/api/dokumen/${id}/download`, { method: 'POST' }),
    submitForReview: (id: string | number) =>
      apiFetch<WorkflowResult>(`/api/dokumen/${id}/submit`, { method: 'POST' }),
    publish: (id: string | number) =>
      apiFetch<WorkflowResult>(`/api/dokumen/${id}/publish`, { method: 'POST' }),
    returnToDraft: (id: string | number, catatan: string) =>
      apiFetch<WorkflowResult>(`/api/dokumen/${id}/return`, {
        method: 'POST',
        body: JSON.stringify({ catatan }),
      }),
    logs: (id: string | number) => apiFetch<WorkflowLog[]>(`/api/dokumen/${id}/logs`),
  },

  // ── Kategori ─────────────────────────────────────────────────────────────────

  kategori: {
    list: () => apiFetch<Kategori[]>('/api/kategori'),
    add: (nama: string) =>
      apiFetch<Kategori>('/api/kategori', { method: 'POST', body: JSON.stringify({ nama }) }),
    update: (id: number, nama: string) =>
      apiFetch<Kategori>(`/api/kategori/${id}`, { method: 'PUT', body: JSON.stringify({ nama }) }),
    delete: (id: number) =>
      apiFetch<{ success: boolean }>(`/api/kategori/${id}`, { method: 'DELETE' }),
  },

  // ── Status Dokumen ───────────────────────────────────────────────────────────

  status: {
    list: () => apiFetch<StatusItem[]>('/api/status'),
    add: (nama: string, warna: string) =>
      apiFetch<StatusItem>('/api/status', { method: 'POST', body: JSON.stringify({ nama, warna }) }),
    update: (id: number, nama: string, warna: string) =>
      apiFetch<StatusItem>(`/api/status/${id}`, { method: 'PUT', body: JSON.stringify({ nama, warna }) }),
    delete: (id: number) =>
      apiFetch<{ success: boolean }>(`/api/status/${id}`, { method: 'DELETE' }),
  },

  // ── Berita ────────────────────────────────────────────────────────────────────

  berita: {
    list: () => apiFetch<Artikel[]>('/api/berita'),
    listAdmin: () => apiFetch<Artikel[]>('/api/berita/admin'),
    detail: (id: string | number) => apiFetch<Artikel>(`/api/berita/${id}`),
    add: (input: ArtikelInput) => {
      const { gambar, tags, ...rest } = input;
      const fd = buildFormData(rest, 'gambar', gambar);
      (tags ?? []).forEach((t) => fd.append('tags', t));
      return apiFetch<Artikel>('/api/berita', { method: 'POST', body: fd });
    },
    update: (id: string | number, input: ArtikelInput) => {
      const { gambar, tags, ...rest } = input;
      const fd = buildFormData(rest, 'gambar', gambar);
      (tags ?? []).forEach((t) => fd.append('tags', t));
      return apiFetch<Artikel>(`/api/berita/${id}`, { method: 'PUT', body: fd });
    },
    delete: (id: string | number) =>
      apiFetch<{ success: boolean }>(`/api/berita/${id}`, { method: 'DELETE' }),
  },

  // ── Galeri ────────────────────────────────────────────────────────────────────

  galeri: {
    list: () => apiFetch<GaleriItem[]>('/api/galeri'),
    listAdmin: () => apiFetch<GaleriItem[]>('/api/galeri/admin'),
    detail: (id: string | number) => apiFetch<GaleriItem>(`/api/galeri/${id}`),
    add: (input: GaleriItemInput) => {
      const { gambar, ...rest } = input;
      const fd = buildFormData(rest, 'gambar', gambar);
      return apiFetch<GaleriItem>('/api/galeri', { method: 'POST', body: fd });
    },
    update: (id: string | number, input: GaleriItemInput) => {
      const { gambar, ...rest } = input;
      const fd = buildFormData(rest, 'gambar', gambar);
      return apiFetch<GaleriItem>(`/api/galeri/${id}`, { method: 'PUT', body: fd });
    },
    delete: (id: string | number) =>
      apiFetch<{ success: boolean }>(`/api/galeri/${id}`, { method: 'DELETE' }),
  },

  // ── Tentang ───────────────────────────────────────────────────────────────────

  tentang: {
    list: () => apiFetch<TentangPage[]>('/api/tentang'),
    get: (slug: TentangSlug) => apiFetch<TentangPage>(`/api/tentang/${slug}`),
    update: (slug: TentangSlug, input: TentangPageInput) =>
      apiFetch<TentangPage>(`/api/tentang/${slug}`, {
        method: 'PUT',
        body: JSON.stringify(input),
      }),
  },

  // ── Users ─────────────────────────────────────────────────────────────────────

  users: {
    list: () => apiFetch<AdminUser[]>('/api/users'),
    permissions: () => apiFetch<MyPermissions>('/api/users/permissions'),
    activityLog: () => apiFetch<ActivityLog[]>('/api/users/activity-log/all'),
    add: (input: AdminUserInput) =>
      apiFetch<AdminUser>('/api/users', { method: 'POST', body: JSON.stringify(input) }),
    update: (id: number, input: Omit<AdminUserInput, 'username' | 'password'>) =>
      apiFetch<AdminUser>(`/api/users/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
    changePassword: (id: number, password: string) =>
      apiFetch<{ success: boolean }>(`/api/users/${id}/password`, {
        method: 'PUT',
        body: JSON.stringify({ password }),
      }),
    delete: (id: number) =>
      apiFetch<{ success: boolean }>(`/api/users/${id}`, { method: 'DELETE' }),
  },

  // ── Roles ─────────────────────────────────────────────────────────────────────

  roles: {
    list: () => apiFetch<Role[]>('/api/roles'),
    listWithPermissions: () => apiFetch<RoleWithPermissions[]>('/api/roles/with-permissions'),
    permissions: () => apiFetch<PermissionOption[]>('/api/roles/permissions'),
    add: (input: RoleInput) =>
      apiFetch<Role>('/api/roles', { method: 'POST', body: JSON.stringify(input) }),
    update: (id: number, input: RoleInput) =>
      apiFetch<Role>(`/api/roles/${id}`, { method: 'PUT', body: JSON.stringify(input) }),
    delete: (id: number) =>
      apiFetch<{ success: boolean }>(`/api/roles/${id}`, { method: 'DELETE' }),
  },

  // ── Statistik ─────────────────────────────────────────────────────────────────

  statistik: {
    get: () => apiFetch<Statistik>('/api/statistik'),
  },

  // ── Settings ──────────────────────────────────────────────────────────────────

  settings: {
    get: () => apiFetch<Settings>('/api/settings'),
    update: (input: SettingsInput) => {
      const { logo, ...rest } = input;
      const fd = buildFormData(rest, 'logo', logo || undefined);
      return apiFetch<{ success: boolean }>('/api/settings', { method: 'PUT', body: fd });
    },
  },
};

export default api;
