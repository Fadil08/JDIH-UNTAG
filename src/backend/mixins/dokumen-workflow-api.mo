import List "mo:core/List";
import AccessControl "mo:caffeineai-authorization/access-control";
import Common "../types/common";
import DokumenTypes "../types/dokumen";
import WorkflowTypes "../types/dokumen-workflow";
import UserMgmtTypes "../types/user-management";
import DokumenLib "../lib/dokumen";
import WorkflowLib "../lib/dokumen-workflow";

mixin (
  accessControlState : AccessControl.AccessControlState,
  dokumenList : List.List<DokumenTypes.DokumenInternal>,
  activityLog : List.List<UserMgmtTypes.ActivityLog>,
  nextLogId : Common.Counter,
) {
  /// Operator: mengajukan dokumen untuk ditinjau Super Admin (Draft -> PendingReview).
  /// Membutuhkan pengguna yang sudah login (non-anonymous).
  public shared ({ caller }) func submitForReview(id : Common.DokumenId) : async WorkflowTypes.WorkflowResult {
    if (caller.isAnonymous()) {
      return #err("Akses ditolak: login diperlukan");
    };
    WorkflowLib.submitForReview(dokumenList, activityLog, nextLogId, id, caller);
  };

  /// Super Admin: menerbitkan dokumen ke publik (PendingReview -> Published).
  /// Membutuhkan role Super Admin (admin di AccessControl).
  public shared ({ caller }) func publishDokumen(id : Common.DokumenId) : async WorkflowTypes.WorkflowResult {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Akses ditolak: hanya Super Admin yang dapat menerbitkan dokumen");
    };
    WorkflowLib.publishDokumen(dokumenList, activityLog, nextLogId, id, caller);
  };

  /// Super Admin: mengembalikan dokumen ke Draft dengan catatan koreksi (PendingReview -> Draft).
  /// Membutuhkan role Super Admin (admin di AccessControl).
  public shared ({ caller }) func returnToDraft(id : Common.DokumenId, catatan : Text) : async WorkflowTypes.WorkflowResult {
    if (not AccessControl.isAdmin(accessControlState, caller)) {
      return #err("Akses ditolak: hanya Super Admin yang dapat mengembalikan dokumen ke Draft");
    };
    WorkflowLib.returnToDraft(dokumenList, activityLog, nextLogId, id, catatan, caller);
  };

  /// Dashboard: menghitung jumlah dokumen yang menunggu review.
  public query func getPendingReviewCount() : async Nat {
    WorkflowLib.getPendingReviewCount(dokumenList);
  };

  /// Admin: daftar semua dokumen terlepas dari workflowStatus, dengan filter opsional.
  public shared ({ caller }) func listDokumenAdmin(filter : DokumenTypes.FilterDokumen) : async [DokumenTypes.Dokumen] {
    if (caller.isAnonymous()) {
      return [];
    };
    DokumenLib.listDokumen(dokumenList, filter);
  };
};
