import Storage "mo:caffeineai-object-storage/Storage";
import Common "common";

module {
  public type Artikel = {
    id : Common.ArtikelId;
    judul : Text;
    konten : Text;
    tanggal : Common.Timestamp;
    author : Text;
    ringkasan : Text;
    gambar : ?Storage.ExternalBlob;
    tags : [Text];
    status : Text;
    tanggalPublikasi : Int;
  };

  public type ArtikelInput = {
    judul : Text;
    konten : Text;
    author : Text;
    ringkasan : Text;
    gambar : ?Storage.ExternalBlob;
    tags : [Text];
    status : Text;
    tanggalPublikasi : ?Int;
  };
};
