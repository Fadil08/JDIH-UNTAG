import Map "mo:core/Map";
import List "mo:core/List";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import UM "../types/user-management";
import UMLib "../lib/user-management";
import GaleriTypes "../types/galeri";
import GaleriLib "../lib/galeri";
import Common "../types/common";

mixin (
  accessControlState : AccessControl.AccessControlState,
  adminUsers : Map.Map<Text, UM.AdminUser>,
  galeriItems : List.List<GaleriTypes.GaleriItem>,
  nextGaleriItemId : Common.Counter,
) {
  // ── Public queries ────────────────────────────────────────────────────────

  public query func listGaleri() : async [GaleriTypes.GaleriItem] {
    GaleriLib.listGaleri(galeriItems);
  };

  public query func getGaleriItem(id : GaleriTypes.GaleriItemId) : async ?GaleriTypes.GaleriItem {
    GaleriLib.getGaleriItem(galeriItems, id);
  };

  // ── Admin updates ─────────────────────────────────────────────────────────

  public shared ({ caller }) func addGaleriItem(input : GaleriTypes.GaleriItemInput) : async GaleriTypes.GaleriItem {
    if (not UMLib.hasMenuAccess(accessControlState, adminUsers, caller, #galeri)) {
      Runtime.trap("Unauthorized: Hanya admin yang dapat menambahkan item galeri");
    };
    let item = GaleriLib.addGaleriItem(galeriItems, nextGaleriItemId.value, input, caller.toText());
    nextGaleriItemId.value += 1;
    item;
  };

  public shared ({ caller }) func updateGaleriItem(id : GaleriTypes.GaleriItemId, input : GaleriTypes.GaleriItemInput) : async ?GaleriTypes.GaleriItem {
    if (not UMLib.hasMenuAccess(accessControlState, adminUsers, caller, #galeri)) {
      Runtime.trap("Unauthorized: Hanya admin yang dapat mengubah item galeri");
    };
    GaleriLib.updateGaleriItem(galeriItems, id, input);
  };

  public shared ({ caller }) func deleteGaleriItem(id : GaleriTypes.GaleriItemId) : async Bool {
    if (not UMLib.hasMenuAccess(accessControlState, adminUsers, caller, #galeri)) {
      Runtime.trap("Unauthorized: Hanya admin yang dapat menghapus item galeri");
    };
    GaleriLib.deleteGaleriItem(galeriItems, id);
  };
};
