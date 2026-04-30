import Common "common";

module {
  /// Identifies each sub-page under the "Tentang JDIH" menu.
  public type TentangSlug = {
    #sejarah;
    #visiMisi;
    #dasarHukum;
    #fungsi;
    #struktur;
  };

  /// A flexible content block — either a paragraph of text or a list of items.
  public type TentangBlock = {
    #paragraf : Text;
    #daftarItem : [Text];
  };

  /// The full editable content of a Tentang page.
  public type TentangContent = {
    blocks : [TentangBlock];
  };

  /// A single "Tentang JDIH" page stored in the backend.
  public type TentangPage = {
    id : Nat;
    slug : TentangSlug;
    judul : Text;
    konten : TentangContent;
    updatedBy : Text;
    updatedAt : Common.Timestamp;
  };

  /// Input shape for updating a Tentang page.
  public type TentangPageInput = {
    judul : Text;
    konten : TentangContent;
  };
};
