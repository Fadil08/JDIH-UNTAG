import Storage "mo:caffeineai-object-storage/Storage";
import Common "common";

module {
  public type GaleriItemId = Nat;

  /// Public-facing gallery item (gambar as optional blob, same as Artikel pattern).
  public type GaleriItem = {
    id : GaleriItemId;
    judul : Text;
    deskripsi : Text;
    gambar : ?Storage.ExternalBlob;
    album : Text;
    createdAt : Common.Timestamp;
    createdBy : Text;
  };

  /// Input shape for adding or updating a gallery item.
  public type GaleriItemInput = {
    judul : Text;
    deskripsi : Text;
    gambar : ?Storage.ExternalBlob;
    album : Text;
  };
};
