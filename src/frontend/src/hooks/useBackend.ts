import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import api, {
  type ArtikelInput,
  type DokumenInput,
  type FilterDokumen,
  type GaleriItemInput,
  type TentangPageInput,
  type TentangSlug,
} from '../api';

// ── Invalidation ──────────────────────────────────────────────────────────────

export function useInvalidateAll() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['dokumen'] });
    qc.invalidateQueries({ queryKey: ['dokumenAdmin'] });
    qc.invalidateQueries({ queryKey: ['kategori'] });
    qc.invalidateQueries({ queryKey: ['berita'] });
    qc.invalidateQueries({ queryKey: ['statistik'] });
    qc.invalidateQueries({ queryKey: ['activityLog'] });
    qc.invalidateQueries({ queryKey: ['pendingReviewCount'] });
    qc.invalidateQueries({ queryKey: ['galeri'] });
    qc.invalidateQueries({ queryKey: ['users'] });
  };
}

// ── Dokumen ───────────────────────────────────────────────────────────────────

export function useDokumen(filter?: FilterDokumen) {
  return useQuery({
    queryKey: ['dokumen', filter],
    queryFn: () => api.dokumen.list(filter),
    staleTime: 30_000,
    select: (d) => d ?? [],
  });
}

export function useDokumenAdmin(filter?: FilterDokumen) {
  return useQuery({
    queryKey: ['dokumenAdmin', filter],
    queryFn: () => api.dokumen.listAdmin(filter),
    staleTime: 30_000,
    select: (d) => d ?? [],
  });
}

export function useDokumenDetail(id: string) {
  return useQuery({
    queryKey: ['dokumen', id],
    queryFn: () => api.dokumen.detail(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function usePendingReviewCount() {
  return useQuery({
    queryKey: ['pendingReviewCount'],
    queryFn: async () => {
      const r = await api.dokumen.pendingCount();
      return r.count;
    },
    staleTime: 30_000,
  });
}

export function useAddDokumen() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: (input: DokumenInput) => api.dokumen.add(input),
    onSuccess: inv,
  });
}

export function useUpdateDokumen() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, input }: { id: string | number; input: DokumenInput }) =>
      api.dokumen.update(id, input),
    onSuccess: inv,
  });
}

export function useDeleteDokumen() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: (id: string | number) => api.dokumen.delete(id),
    onSuccess: inv,
  });
}

export function useSubmitForReview() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: async (id: string | number) => {
      const r = await api.dokumen.submitForReview(id);
      if (r.err) throw new Error(r.err);
      return r;
    },
    onSuccess: inv,
  });
}

export function usePublishDokumen() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: async (id: string | number) => {
      const r = await api.dokumen.publish(id);
      if (r.err) throw new Error(r.err);
      return r;
    },
    onSuccess: inv,
  });
}

export function useReturnToDraft() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: async ({ id, catatan }: { id: string | number; catatan: string }) => {
      const r = await api.dokumen.returnToDraft(id, catatan);
      if (r.err) throw new Error(r.err);
      return r;
    },
    onSuccess: inv,
  });
}

// ── Kategori ──────────────────────────────────────────────────────────────────

export function useKategori() {
  return useQuery({
    queryKey: ['kategori'],
    queryFn: () => api.kategori.list(),
    staleTime: 60_000,
    select: (d) => d ?? [],
  });
}

export function useStatus() {
  return useQuery({
    queryKey: ['status'],
    queryFn: () => api.status.list(),
    staleTime: 60_000,
    select: (d) => d ?? [],
  });
}

export function useAddKategori() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: (nama: string) => api.kategori.add(nama),
    onSuccess: inv,
  });
}

export function useUpdateKategori() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, nama }: { id: number; nama: string }) => api.kategori.update(id, nama),
    onSuccess: inv,
  });
}

export function useDeleteKategori() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: (id: number) => api.kategori.delete(id),
    onSuccess: inv,
  });
}

// ── Status ────────────────────────────────────────────────────────────────────

export function useAddStatus() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: ({ nama, warna }: { nama: string; warna: string }) => api.status.add(nama, warna),
    onSuccess: inv,
  });
}

export function useUpdateStatus() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, nama, warna }: { id: number; nama: string; warna: string }) =>
      api.status.update(id, nama, warna),
    onSuccess: inv,
  });
}

export function useDeleteStatus() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: (id: number) => api.status.delete(id),
    onSuccess: inv,
  });
}

// ── Berita ────────────────────────────────────────────────────────────────────

export function useBerita() {
  return useQuery({
    queryKey: ['berita'],
    queryFn: () => api.berita.list(),
    staleTime: 30_000,
    select: (d) => d ?? [],
  });
}

export function useBeritaAdmin() {
  return useQuery({
    queryKey: ['beritaAdmin'],
    queryFn: () => api.berita.listAdmin(),
    staleTime: 30_000,
    select: (d) => d ?? [],
  });
}

export function useBeritaDetail(id: string) {
  return useQuery({
    queryKey: ['berita', id],
    queryFn: () => api.berita.detail(id),
    enabled: !!id,
    staleTime: 30_000,
  });
}

export function useAddBerita() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: (input: ArtikelInput) => api.berita.add(input),
    onSuccess: inv,
  });
}

export function useUpdateBerita() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: ({ id, input }: { id: string | number; input: ArtikelInput }) =>
      api.berita.update(id, input),
    onSuccess: inv,
  });
}

export function useDeleteBerita() {
  const inv = useInvalidateAll();
  return useMutation({
    mutationFn: (id: string | number) => api.berita.delete(id),
    onSuccess: inv,
  });
}

// ── Statistik ─────────────────────────────────────────────────────────────────

export function useStatistik() {
  return useQuery({
    queryKey: ['statistik'],
    queryFn: () => api.statistik.get(),
    staleTime: 60_000,
  });
}

// ── Galeri ────────────────────────────────────────────────────────────────────

export function useGaleri() {
  return useQuery({
    queryKey: ['galeri'],
    queryFn: () => api.galeri.list(),
    staleTime: 30_000,
    select: (d) => d ?? [],
  });
}

export function useAddGaleriItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: GaleriItemInput) => api.galeri.add(input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['galeri'] }),
  });
}

export function useUpdateGaleriItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, input }: { id: number; input: GaleriItemInput }) =>
      api.galeri.update(id, input),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['galeri'] }),
  });
}

export function useDeleteGaleriItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => api.galeri.delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['galeri'] }),
  });
}

// ── Tentang ───────────────────────────────────────────────────────────────────

export function useTentangPages() {
  return useQuery({
    queryKey: ['tentangPages'],
    queryFn: () => api.tentang.list(),
    staleTime: 60_000,
    select: (d) => d ?? [],
  });
}

export function useTentangPage(slug: string) {
  return useQuery({
    queryKey: ['tentangPage', slug],
    queryFn: () => api.tentang.get(slug as TentangSlug),
    enabled: !!slug,
    staleTime: 60_000,
  });
}

export function useUpdateTentangPage() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ slug, input }: { slug: string; input: TentangPageInput }) =>
      api.tentang.update(slug as TentangSlug, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['tentangPages'] });
      qc.invalidateQueries({ queryKey: ['tentangPage'] });
    },
  });
}

// ── Admin Users ───────────────────────────────────────────────────────────────

export function useAdminUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => api.users.list(),
    staleTime: 30_000,
    select: (d) => d ?? [],
  });
}

export function useActivityLog() {
  return useQuery({
    queryKey: ['activityLog'],
    queryFn: () => api.users.activityLog(),
    staleTime: 60_000,
    select: (d) => d ?? [],
  });
}
