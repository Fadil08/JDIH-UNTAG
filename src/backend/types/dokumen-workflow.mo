module {
  /// Status alur kerja publikasi dokumen (terpisah dari StatusDokumen konten).
  public type WorkflowStatus = {
    #Draft;
    #PendingReview;
    #Published;
  };

  /// Hasil operasi workflow — berhasil atau gagal dengan pesan.
  public type WorkflowResult = {
    #ok : Text;
    #err : Text;
  };
};
