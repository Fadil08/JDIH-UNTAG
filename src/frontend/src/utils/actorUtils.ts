// actorUtils.ts — legacy file, sekarang semua fetch dilakukan via api.ts
// File ini hanya berisi sample data fallback jika diperlukan oleh komponen lama.

export type StatusDokumen = 'Berlaku' | 'TidakBerlaku' | 'Dicabut';
export type JenisDokumen =
  | 'Statuta' | 'PeraturanRektor' | 'KeputusanRektor'
  | 'SuratEdaran' | 'SOP' | 'Perjanjian';

export interface Kategori {
  id: string | number;
  nama: string;
  deskripsi?: string;
  jumlahDokumen?: number;
  createdAt?: bigint | string;
}

export interface Dokumen {
  id: string | number;
  judul: string;
  nomor: string;
  jenis?: JenisDokumen;
  kategoriId: string | number;
  kategoriNama?: string;
  tahun: number;
  tanggalPenetapan: string;
  status: StatusDokumen;
  workflowStatus: string;
  catatanKoreksi: string;
  abstrak: string;
  fileUrl?: string;
  filePdf?: string | null;
  ukuranFile?: string;
  tags?: string[];
  tag?: string[];
  createdAt?: bigint | string;
  updatedAt?: bigint | string;
  downloadCount?: number;
}

export interface Artikel {
  id: string | number;
  judul: string;
  slug?: string;
  ringkasan: string;
  isi?: string;
  konten?: string;
  tanggalPublikasi: string | null;
  penulis?: string;
  author?: string;
  gambarUrl?: string;
  gambar?: string | null;
  tags?: string[];
  createdAt?: bigint | string;
  updatedAt?: bigint | string;
}

export interface Statistik {
  totalDokumen: number;
  totalUnduhan: number;
  totalKategori?: number;
  totalArtikel: number;
  dokumenPerKategori?: { kategoriId: string | number; kategoriNama: string; jumlah: number }[];
  perKategori?: { id: number; nama: string; jumlah: number }[];
  dokumenTerbaru?: Dokumen[];
}

// ── Re-export dari api.ts untuk kompatibilitas mundur ─────────────────────────

export { default as api } from '../api';

// ── Stub functions (tidak dipakai lagi, untuk backward compat) ────────────────

export async function fetchListDokumen(): Promise<Dokumen[]> { return []; }
export async function fetchDokumenDetail(): Promise<Dokumen | null> { return null; }
export async function fetchListKategori(): Promise<Kategori[]> { return []; }
export async function fetchStatistik(): Promise<Statistik> {
  return { totalDokumen: 0, totalUnduhan: 0, totalArtikel: 0 };
}
export async function fetchListBerita(): Promise<Artikel[]> { return []; }
export async function fetchBeritaDetail(): Promise<Artikel | null> { return null; }
