import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import AccessControl "mo:caffeineai-authorization/access-control";
import UM "../types/user-management";
import UMLib "../lib/user-management";
import Common "../types/common";

mixin (
  accessControlState : AccessControl.AccessControlState,
  adminUsers : Map.Map<Text, UM.AdminUser>,
  activityLog : List.List<UM.ActivityLog>,
  nextLogId : Common.Counter,
) {

  // ── Admin user management (Super Admin OR #userManagement permission required) ──

  /// Returns the full list of registered admin users.
  public shared ({ caller }) func listAdminUsers() : async [UM.AdminUser] {
    if (not UMLib.hasMenuAccess(accessControlState, adminUsers, caller, #userManagement)) {
      return [];
    };
    UMLib.listAdminUsers(adminUsers);
  };

  /// Adds a new admin user with the specified menu permissions.
  public shared ({ caller }) func addAdminUser(
    principal : Text,
    nama : ?Text,
    grantedMenus : [UM.MenuPermission],
  ) : async { #ok : UM.AdminUser; #err : Text } {
    if (not UMLib.hasMenuAccess(accessControlState, adminUsers, caller, #userManagement)) {
      return #err("Tidak memiliki akses untuk mengelola user");
    };
    let input : UM.AdminUserInput = {
      principal;
      nama;
      grantedMenus;
      isActive = true;
    };
    let result = UMLib.addAdminUser(adminUsers, input, caller.toText(), Time.now());
    switch (result) {
      case (#ok(user)) {
        UMLib.recordActivity(
          activityLog,
          nextLogId,
          "AddUser",
          "user",
          principal,
          switch (nama) { case (?n) n; case null principal },
          caller.toText(),
          Time.now(),
        );
        #ok(user);
      };
      case (#err(msg)) { #err(msg) };
    };
  };

  /// Updates an existing admin user's name, permissions, and active state.
  public shared ({ caller }) func updateAdminUser(
    principal : Text,
    nama : ?Text,
    grantedMenus : [UM.MenuPermission],
    isActive : Bool,
  ) : async { #ok : UM.AdminUser; #err : Text } {
    if (not UMLib.hasMenuAccess(accessControlState, adminUsers, caller, #userManagement)) {
      return #err("Tidak memiliki akses untuk mengelola user");
    };
    let input : UM.AdminUserInput = { principal; nama; grantedMenus; isActive };
    let result = UMLib.updateAdminUser(adminUsers, input);
    switch (result) {
      case (#ok(user)) {
        UMLib.recordActivity(
          activityLog,
          nextLogId,
          "UpdateUser",
          "user",
          principal,
          switch (nama) { case (?n) n; case null principal },
          caller.toText(),
          Time.now(),
        );
        #ok(user);
      };
      case (#err(msg)) { #err(msg) };
    };
  };

  /// Removes an admin user by their principal text.
  public shared ({ caller }) func removeAdminUser(
    principal : Text,
  ) : async { #ok; #err : Text } {
    if (not UMLib.hasMenuAccess(accessControlState, adminUsers, caller, #userManagement)) {
      return #err("Tidak memiliki akses untuk mengelola user");
    };
    let result = UMLib.removeAdminUser(adminUsers, principal);
    switch (result) {
      case (#ok) {
        UMLib.recordActivity(
          activityLog,
          nextLogId,
          "RemoveUser",
          "user",
          principal,
          principal,
          caller.toText(),
          Time.now(),
        );
        #ok;
      };
      case (#err(msg)) { #err(msg) };
    };
  };

  // ── Permissions query (any authenticated caller) ──────────────────────────

  /// Returns whether the caller is an admin and which menus they can access.
  public shared query ({ caller }) func getMyPermissions() : async UM.MyPermissions {
    UMLib.getMyPermissions(accessControlState, adminUsers, caller);
  };

  // ── Activity log query (admin only) ──────────────────────────────────────

  /// Returns the last 50 activity log entries, newest first.
  public shared query ({ caller }) func getActivityLog() : async [UM.ActivityLog] {
    if (not UMLib.hasMenuAccess(accessControlState, adminUsers, caller, #statistik)) {
      return [];
    };
    UMLib.getActivityLog(activityLog);
  };
};
