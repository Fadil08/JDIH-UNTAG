import Storage "mo:caffeineai-object-storage/Storage";
import Common "common";
import WorkflowTypes "dokumen-workflow";

module {
  public type Kategori = {
    id : Common.KategoriId;
    nama : Text;
  };

  public type DokumenInternal = {
    id : Common.DokumenId;
    judul : Text;
    nomor : Text;
    kategoriId : Common.KategoriId;
    tahun : Nat;
    tanggalPenetapan : Text;
    status : Common.StatusDokumen;
    abstrak : Text;
    tag : [Text];
    filePdf : Storage.ExternalBlob;
    var downloadCount : Nat;
    /// Status alur kerja publikasi (Draft/PendingReview/Published)
    var workflowStatus : WorkflowTypes.WorkflowStatus;
    /// Catatan koreksi dari Super Admin saat mengembalikan ke Draft
    var catatanKoreksi : Text;
    /// Principal Super Admin yang mereview/menerbitkan dokumen
    var reviewedBy : ?Principal;
    /// Waktu saat dokumen direview/diterbitkan
    var reviewedAt : ?Common.Timestamp;
    /// Principal Operator yang mengajukan dokumen untuk review
    var submittedForReviewBy : ?Principal;
    /// Waktu saat dokumen diajukan untuk review
    var submittedForReviewAt : ?Common.Timestamp;
    /// Tanggal pengundangan produk hukum (opsional)
    var tanggalPengundangan : ?Int;
    /// Relasi hukum dengan produk hukum lain, misalnya "Mencabut Peraturan Rektor No. 5 Tahun 2018" (opsional)
    var relasiHukum : ?Text;
  };

  public type Dokumen = {
    id : Common.DokumenId;
    judul : Text;
    nomor : Text;
    kategoriId : Common.KategoriId;
    tahun : Nat;
    tanggalPenetapan : Text;
    status : Common.StatusDokumen;
    abstrak : Text;
    tag : [Text];
    filePdf : Storage.ExternalBlob;
    downloadCount : Nat;
    workflowStatus : WorkflowTypes.WorkflowStatus;
    catatanKoreksi : Text;
    reviewedBy : ?Principal;
    reviewedAt : ?Common.Timestamp;
    /// Tanggal pengundangan produk hukum (opsional)
    tanggalPengundangan : ?Int;
    /// Relasi hukum dengan produk hukum lain (opsional)
    relasiHukum : ?Text;
  };

  public type DokumenInput = {
    judul : Text;
    nomor : Text;
    kategoriId : Common.KategoriId;
    tahun : Nat;
    tanggalPenetapan : Text;
    status : Common.StatusDokumen;
    abstrak : Text;
    tag : [Text];
    filePdf : Storage.ExternalBlob;
    /// Opsional — jika tidak diisi, default ke #Draft saat addDokumen
    workflowStatus : ?WorkflowTypes.WorkflowStatus;
    /// Tanggal pengundangan produk hukum (opsional)
    tanggalPengundangan : ?Int;
    /// Relasi hukum dengan produk hukum lain (opsional)
    relasiHukum : ?Text;
  };

  public type FilterDokumen = {
    kategoriId : ?Common.KategoriId;
    tahun : ?Nat;
    status : ?Common.StatusDokumen;
    katakunci : ?Text;
    /// Filter berdasarkan workflowStatus (null = tidak difilter)
    workflowStatus : ?WorkflowTypes.WorkflowStatus;
  };

  public type Statistik = {
    totalDokumen : Nat;
    totalUnduhan : Nat;
    totalArtikel : Nat;
    perKategori : [(Common.KategoriId, Text, Nat)];
  };
};
