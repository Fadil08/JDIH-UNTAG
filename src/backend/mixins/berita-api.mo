import List "mo:core/List";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import BeritaTypes "../types/berita";
import BeritaLib "../lib/berita";

mixin (
  accessControlState : AccessControl.AccessControlState,
  artikelList : List.List<BeritaTypes.Artikel>,
  nextArtikelId : Common.Counter,
) {
  // ── Public queries ────────────────────────────────────────────────────────

  public query func listBerita() : async [BeritaTypes.Artikel] {
    BeritaLib.listArtikel(artikelList);
  };

  public query func getBeritaDetail(id : Common.ArtikelId) : async ?BeritaTypes.Artikel {
    BeritaLib.getArtikel(artikelList, id);
  };

  // ── Admin ─────────────────────────────────────────────────────────────────

  public shared ({ caller }) func addBerita(input : BeritaTypes.ArtikelInput) : async BeritaTypes.Artikel {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Hanya admin yang dapat menambahkan berita");
    };
    let artikel = BeritaLib.addArtikel(artikelList, nextArtikelId.value, input);
    nextArtikelId.value += 1;
    artikel;
  };

  public shared ({ caller }) func updateBerita(id : Common.ArtikelId, input : BeritaTypes.ArtikelInput) : async ?BeritaTypes.Artikel {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Hanya admin yang dapat mengubah berita");
    };
    BeritaLib.updateArtikel(artikelList, id, input);
  };

  public shared ({ caller }) func deleteBerita(id : Common.ArtikelId) : async Bool {
    if (not AccessControl.hasPermission(accessControlState, caller, #admin)) {
      Runtime.trap("Unauthorized: Hanya admin yang dapat menghapus berita");
    };
    BeritaLib.deleteArtikel(artikelList, id);
  };
};
