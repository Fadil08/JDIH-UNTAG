import Common "common";

module {
  /// Keys representing each menu/feature section in the admin panel.
  public type MenuPermission = {
    #dokumen;
    #kategori;
    #berita;
    #statistik;
    #userManagement;
    #tentang;
    #galeri;
  };

  /// An admin user record stored in the backend.
  public type AdminUser = {
    principal : Text;
    nama : ?Text;
    grantedMenus : [MenuPermission];
    isActive : Bool;
    addedAt : Common.Timestamp;
    addedBy : Text;
  };

  /// Input shape for adding or updating an admin user.
  public type AdminUserInput = {
    principal : Text;
    nama : ?Text;
    grantedMenus : [MenuPermission];
    isActive : Bool;
  };

  /// Permissions summary returned to the caller.
  public type MyPermissions = {
    isAdmin : Bool;
    grantedMenus : [MenuPermission];
  };

  /// An activity log entry capturing who did what and when.
  public type ActivityLog = {
    id : Nat;
    action : Text;
    targetType : Text;
    targetId : Text;
    targetTitle : Text;
    performedBy : Text;
    performedAt : Common.Timestamp;
  };
};
