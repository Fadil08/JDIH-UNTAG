import List "mo:core/List";
import Map "mo:core/Map";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import DokumenTypes "../types/dokumen";
import BeritaTypes "../types/berita";
import DokumenLib "../lib/dokumen";

mixin (
  accessControlState : AccessControl.AccessControlState,
  dokumenList : List.List<DokumenTypes.DokumenInternal>,
  kategoriMap : Map.Map<Common.KategoriId, DokumenTypes.Kategori>,
  artikelList : List.List<BeritaTypes.Artikel>,
  nextDokumenId : Common.Counter,
  nextKategoriId : Common.Counter,
) {
  // ── Public queries ────────────────────────────────────────────────────────

  public query func listDokumen(filter : DokumenTypes.FilterDokumen) : async [DokumenTypes.Dokumen] {
    // Publik hanya melihat dokumen Published
    DokumenLib.listDokumenPublic(dokumenList, filter);
  };

  public query func getDokumenDetail(id : Common.DokumenId) : async ?DokumenTypes.Dokumen {
    DokumenLib.getDokumen(dokumenList, id);
  };

  public query func listKategori() : async [DokumenTypes.Kategori] {
    DokumenLib.listKategori(kategoriMap);
  };

  public query func getStatistik() : async DokumenTypes.Statistik {
    DokumenLib.getStatistik(dokumenList, kategoriMap, artikelList.size());
  };

  // ── Public update ─────────────────────────────────────────────────────────

  public shared func downloadDokumen(id : Common.DokumenId) : async Bool {
    DokumenLib.incrementDownload(dokumenList, id);
  };

  // ── Admin: dokumen ────────────────────────────────────────────────────────

  public shared ({ caller }) func addDokumen(input : DokumenTypes.DokumenInput) : async DokumenTypes.Dokumen {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Hanya admin yang dapat menambahkan dokumen");
    };
    let dok = DokumenLib.addDokumen(dokumenList, nextDokumenId.value, input);
    nextDokumenId.value += 1;
    dok;
  };

  public shared ({ caller }) func updateDokumen(id : Common.DokumenId, input : DokumenTypes.DokumenInput) : async ?DokumenTypes.Dokumen {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Hanya admin yang dapat mengubah dokumen");
    };
    DokumenLib.updateDokumen(dokumenList, id, input);
  };

  public shared ({ caller }) func deleteDokumen(id : Common.DokumenId) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Hanya admin yang dapat menghapus dokumen");
    };
    DokumenLib.deleteDokumen(dokumenList, id);
  };

  // ── Admin: kategori ───────────────────────────────────────────────────────

  public shared ({ caller }) func addKategori(nama : Text) : async DokumenTypes.Kategori {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Hanya admin yang dapat menambahkan kategori");
    };
    let kat = DokumenLib.addKategori(kategoriMap, nextKategoriId.value, nama);
    nextKategoriId.value += 1;
    kat;
  };

  public shared ({ caller }) func updateKategori(id : Common.KategoriId, nama : Text) : async ?DokumenTypes.Kategori {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Hanya admin yang dapat mengubah kategori");
    };
    DokumenLib.updateKategori(kategoriMap, id, nama);
  };

  public shared ({ caller }) func deleteKategori(id : Common.KategoriId) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Hanya admin yang dapat menghapus kategori");
    };
    DokumenLib.deleteKategori(kategoriMap, id);
  };
};
