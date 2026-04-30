import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export class ExternalBlob {
    getBytes(): Promise<Uint8Array<ArrayBuffer>>;
    getDirectURL(): string;
    static fromURL(url: string): ExternalBlob;
    static fromBytes(blob: Uint8Array<ArrayBuffer>): ExternalBlob;
    withUploadProgress(onProgress: (percentage: number) => void): ExternalBlob;
}
export interface Statistik {
    totalArtikel: bigint;
    totalDokumen: bigint;
    perKategori: Array<[KategoriId, string, bigint]>;
    totalUnduhan: bigint;
}
export type Timestamp = bigint;
export interface FilterDokumen {
    kategoriId?: KategoriId;
    status?: StatusDokumen;
    tahun?: bigint;
    katakunci?: string;
    workflowStatus?: WorkflowStatus;
}
export interface TentangPageInput {
    judul: string;
    konten: TentangContent;
}
export interface TentangPage {
    id: bigint;
    slug: TentangSlug;
    judul: string;
    updatedAt: Timestamp;
    updatedBy: string;
    konten: TentangContent;
}
export interface GaleriItem {
    id: GaleriItemId;
    album: string;
    createdAt: Timestamp;
    createdBy: string;
    gambar?: ExternalBlob;
    judul: string;
    deskripsi: string;
}
export interface Artikel {
    id: ArtikelId;
    status: string;
    tanggal: Timestamp;
    tags: Array<string>;
    ringkasan: string;
    gambar?: ExternalBlob;
    judul: string;
    author: string;
    tanggalPublikasi: bigint;
    konten: string;
}
export interface TentangContent {
    blocks: Array<TentangBlock>;
}
export interface Kategori {
    id: KategoriId;
    nama: string;
}
export type GaleriItemId = bigint;
export type WorkflowResult = {
    __kind__: "ok";
    ok: string;
} | {
    __kind__: "err";
    err: string;
};
export type DokumenId = bigint;
export interface AdminUser {
    principal: string;
    grantedMenus: Array<MenuPermission>;
    nama?: string;
    isActive: boolean;
    addedAt: Timestamp;
    addedBy: string;
}
export interface DokumenInput {
    tag: Array<string>;
    kategoriId: KategoriId;
    status: StatusDokumen;
    tahun: bigint;
    judul: string;
    relasiHukum?: string;
    abstrak: string;
    tanggalPenetapan: string;
    nomor: string;
    tanggalPengundangan?: bigint;
    workflowStatus?: WorkflowStatus;
    filePdf: ExternalBlob;
}
export interface MyPermissions {
    grantedMenus: Array<MenuPermission>;
    isAdmin: boolean;
}
export interface ActivityLog {
    id: bigint;
    action: string;
    performedAt: Timestamp;
    performedBy: string;
    targetTitle: string;
    targetType: string;
    targetId: string;
}
export type ArtikelId = bigint;
export interface GaleriItemInput {
    album: string;
    gambar?: ExternalBlob;
    judul: string;
    deskripsi: string;
}
export type TentangBlock = {
    __kind__: "daftarItem";
    daftarItem: Array<string>;
} | {
    __kind__: "paragraf";
    paragraf: string;
};
export type KategoriId = bigint;
export interface ArtikelInput {
    status: string;
    tags: Array<string>;
    ringkasan: string;
    gambar?: ExternalBlob;
    judul: string;
    author: string;
    tanggalPublikasi?: bigint;
    konten: string;
}
export interface Dokumen {
    id: DokumenId;
    tag: Array<string>;
    kategoriId: KategoriId;
    status: StatusDokumen;
    tahun: bigint;
    judul: string;
    relasiHukum?: string;
    reviewedAt?: Timestamp;
    reviewedBy?: Principal;
    catatanKoreksi: string;
    abstrak: string;
    tanggalPenetapan: string;
    nomor: string;
    downloadCount: bigint;
    tanggalPengundangan?: bigint;
    workflowStatus: WorkflowStatus;
    filePdf: ExternalBlob;
}
export enum MenuPermission {
    galeri = "galeri",
    userManagement = "userManagement",
    kategori = "kategori",
    dokumen = "dokumen",
    statistik = "statistik",
    berita = "berita",
    tentang = "tentang"
}
export enum StatusDokumen {
    Berlaku = "Berlaku",
    Dicabut = "Dicabut",
    TidakBerlaku = "TidakBerlaku"
}
export enum TentangSlug {
    visiMisi = "visiMisi",
    sejarah = "sejarah",
    fungsi = "fungsi",
    struktur = "struktur",
    dasarHukum = "dasarHukum"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export enum WorkflowStatus {
    PendingReview = "PendingReview",
    Draft = "Draft",
    Published = "Published"
}
export interface backendInterface {
    addAdminUser(principal: string, nama: string | null, grantedMenus: Array<MenuPermission>): Promise<{
        __kind__: "ok";
        ok: AdminUser;
    } | {
        __kind__: "err";
        err: string;
    }>;
    addBerita(input: ArtikelInput): Promise<Artikel>;
    addDokumen(input: DokumenInput): Promise<Dokumen>;
    addGaleriItem(input: GaleriItemInput): Promise<GaleriItem>;
    addKategori(nama: string): Promise<Kategori>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    deleteBerita(id: ArtikelId): Promise<boolean>;
    deleteDokumen(id: DokumenId): Promise<boolean>;
    deleteGaleriItem(id: GaleriItemId): Promise<boolean>;
    deleteKategori(id: KategoriId): Promise<boolean>;
    downloadDokumen(id: DokumenId): Promise<boolean>;
    getActivityLog(): Promise<Array<ActivityLog>>;
    getBeritaDetail(id: ArtikelId): Promise<Artikel | null>;
    getCallerUserRole(): Promise<UserRole>;
    getDokumenDetail(id: DokumenId): Promise<Dokumen | null>;
    getGaleriItem(id: GaleriItemId): Promise<GaleriItem | null>;
    getMyPermissions(): Promise<MyPermissions>;
    getPendingReviewCount(): Promise<bigint>;
    getStatistik(): Promise<Statistik>;
    getTentangPage(slug: TentangSlug): Promise<TentangPage | null>;
    isCallerAdmin(): Promise<boolean>;
    listAdminUsers(): Promise<Array<AdminUser>>;
    listBerita(): Promise<Array<Artikel>>;
    listDokumen(filter: FilterDokumen): Promise<Array<Dokumen>>;
    listDokumenAdmin(filter: FilterDokumen): Promise<Array<Dokumen>>;
    listGaleri(): Promise<Array<GaleriItem>>;
    listKategori(): Promise<Array<Kategori>>;
    listTentangPages(): Promise<Array<TentangPage>>;
    publishDokumen(id: DokumenId): Promise<WorkflowResult>;
    removeAdminUser(principal: string): Promise<{
        __kind__: "ok";
        ok: null;
    } | {
        __kind__: "err";
        err: string;
    }>;
    returnToDraft(id: DokumenId, catatan: string): Promise<WorkflowResult>;
    submitForReview(id: DokumenId): Promise<WorkflowResult>;
    updateAdminUser(principal: string, nama: string | null, grantedMenus: Array<MenuPermission>, isActive: boolean): Promise<{
        __kind__: "ok";
        ok: AdminUser;
    } | {
        __kind__: "err";
        err: string;
    }>;
    updateBerita(id: ArtikelId, input: ArtikelInput): Promise<Artikel | null>;
    updateDokumen(id: DokumenId, input: DokumenInput): Promise<Dokumen | null>;
    updateGaleriItem(id: GaleriItemId, input: GaleriItemInput): Promise<GaleriItem | null>;
    updateKategori(id: KategoriId, nama: string): Promise<Kategori | null>;
    updateTentangPage(slug: TentangSlug, input: TentangPageInput): Promise<TentangPage | null>;
}
