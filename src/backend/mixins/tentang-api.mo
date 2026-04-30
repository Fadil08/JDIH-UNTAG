import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Runtime "mo:core/Runtime";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import TentangTypes "../types/tentang";
import TentangLib "../lib/tentang";
import UM "../types/user-management";
import UMLib "../lib/user-management";

mixin (
  accessControlState : AccessControl.AccessControlState,
  adminUsers : Map.Map<Text, UM.AdminUser>,
  tentangPages : Map.Map<Text, TentangTypes.TentangPage>,
  activityLog : List.List<UM.ActivityLog>,
  nextLogId : Common.Counter,
) {
  // ── Public queries ────────────────────────────────────────────────────────

  public query func getTentangPage(slug : TentangTypes.TentangSlug) : async ?TentangTypes.TentangPage {
    TentangLib.getTentangPage(tentangPages, slug);
  };

  public query func listTentangPages() : async [TentangTypes.TentangPage] {
    TentangLib.listTentangPages(tentangPages);
  };

  // ── Admin mutations ───────────────────────────────────────────────────────

  public shared ({ caller }) func updateTentangPage(
    slug : TentangTypes.TentangSlug,
    input : TentangTypes.TentangPageInput,
  ) : async ?TentangTypes.TentangPage {
    if (not UMLib.hasMenuAccess(accessControlState, adminUsers, caller, #tentang)) {
      Runtime.trap("Unauthorized: Tidak memiliki akses untuk mengubah halaman Tentang JDIH");
    };
    let now = Time.now();
    let result = TentangLib.updateTentangPage(tentangPages, slug, input, caller.toText(), now);
    switch (result) {
      case null {};
      case (?page) {
        UMLib.recordActivity(
          activityLog,
          nextLogId,
          "UpdateTentang",
          "tentang",
          page.judul,
          page.judul,
          caller.toText(),
          now,
        );
      };
    };
    result;
  };
};
