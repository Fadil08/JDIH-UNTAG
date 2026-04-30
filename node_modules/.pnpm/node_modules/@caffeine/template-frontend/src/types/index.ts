// types/index.ts — Re-exports dari api.ts untuk kompatibilitas komponen

export type {
  StatusDokumen,
  WorkflowStatus,
  TentangSlug,
  TentangBlock,
  TentangContent,
  TentangPage,
  TentangPageInput,
  MenuPermission,
  Kategori,
  Dokumen,
  FilterDokumen,
  DokumenInput,
  Artikel,
  ArtikelInput,
  GaleriItem,
  GaleriItemInput,
  Statistik,
  AdminUser,
  MyPermissions,
  ActivityLog,
  WorkflowResult,
  WorkflowLog,
  AuthUser,
  Role,
  RoleWithPermissions,
  RoleInput,
  PermissionOption,
} from '../api';

// ─── Tipe tambahan (tidak ada di api.ts) ────────────────────────────────────

export type JenisDokumen =
  | 'Statuta' | 'PeraturanRektor' | 'KeputusanRektor'
  | 'SuratEdaran' | 'PeraturanSenat' | 'SOP' | 'MoU';

export interface DokumenPerKategori {
  kategoriId: string | number;
  kategoriNama: string;
  jumlah: number;
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface GaleriItemForm {
  judul: string;
  deskripsi: string;
  album: string;
}

/** For filter dropdowns where id may be string or number */
export interface FilterKategoriItem {
  id: string | number;
  nama: string;
}

// ─── Label constants ─────────────────────────────────────────────────────────

export const JENIS_LABEL: Record<JenisDokumen, string> = {
  Statuta: 'Statuta',
  PeraturanRektor: 'Peraturan Rektor',
  KeputusanRektor: 'Keputusan Rektor',
  SuratEdaran: 'Surat Edaran',
  PeraturanSenat: 'Peraturan Senat',
  SOP: 'SOP',
  MoU: 'Perjanjian / MoU',
};

export const STATUS_LABEL = {
  'Berlaku': 'Berlaku',
  'Tidak Berlaku': 'Tidak Berlaku',
  'Dicabut': 'Dicabut',
  'Diubah': 'Diubah',
  'Mencabut': 'Mencabut',
  'Mengubah': 'Mengubah',
  'Menjabarkan': 'Menjabarkan',
} as const;

export const WORKFLOW_STATUS_LABEL = {
  Draft: 'Draf',
  PendingReview: 'Menunggu Review',
  Published: 'Terbit',
  Archived: 'Diarsipkan',
} as const;

export const TAHUN_OPTIONS = Array.from({ length: 20 }, (_, i) => new Date().getFullYear() - i);
