
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Pencil, Plus, Trash2, Users, X } from "lucide-react"; 
import { useState } from "react";
import { toast } from "sonner";
import api, { AdminUser, MenuPermission as MenuPermissionKey } from "../../api";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Checkbox } from "../../components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../../components/ui/dialog";
import { Input } from "../../components/ui/input";
import { Label } from "../../components/ui/label";
import { Skeleton } from "../../components/ui/skeleton";
import { Switch } from "../../components/ui/switch";
import { usePermissions } from "../../hooks/usePermissions";

// Logika hak akses kini dipindahkan sepenuhnya ke halaman Manajemen Peran.
// Halaman ini hanya fokus pada pengelolaan akun pengguna (Generator User).

// ─── Backend Hook ─────────────────────────────────────────────────────────────

function useAdminUsers() {
  return useQuery({
    queryKey: ["adminUsers"],
    queryFn: async () => {
      return await api.users.list();
    },
    staleTime: 30_000,
  });
}

// ─── Copy Principal Cell ──────────────────────────────────────────────────────

// ─── Username Cell ─────────────────────────────────────────────────────────────
function UsernameCell({ username }: { username: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="font-semibold text-sm text-foreground">
        {username}
      </span>
    </div>
  );
}

// ─── User Form ────────────────────────────────────────────────────────────────

interface UserFormData {
  username: string;
  password?: string;
  nama: string;
  role: string;
  grantedMenus: MenuPermissionKey[];
  isActive: boolean;
}

interface UserFormProps {
  initial?: UserFormData;
  showStatus?: boolean;
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
  error?: string;
}

function UserForm({
  initial,
  showStatus = false,
  onSubmit,
  onCancel,
  isLoading,
  error,
}: UserFormProps) {
  const [username, setUsername] = useState(initial?.username ?? "");
  const [password, setPassword] = useState("");
  const [nama, setNama] = useState(initial?.nama ?? "");
  const [role, setRole] = useState<string>(initial?.role ?? "staff");
  const [grantedMenus, setGrantedMenus] = useState<MenuPermissionKey[]>(
    initial?.grantedMenus ?? [],
  );
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [showPermissions, setShowPermissions] = useState(false);
  const [validationError, setValidationError] = useState("");

  const { data: availableRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.roles.list(),
  });

  const { data: rolesWithPerms, isLoading: loadingPerms } = useQuery({
    queryKey: ["roles-perms"],
    queryFn: () => api.roles.listWithPermissions(),
  });

  const ALL_MENUS: MenuPermissionKey[] = [
    'dashboard:view',
    'dokumen:view', 'dokumen:create', 'dokumen:edit', 'dokumen:delete', 'dokumen:review',
    'kategori:view', 'kategori:create', 'kategori:edit', 'kategori:delete',
    'berita:view', 'berita:create', 'berita:edit', 'berita:delete',
    'galeri:view', 'galeri:create', 'galeri:delete',
    'statistik:view',
    'userManagement:view', 'userManagement:create', 'userManagement:edit', 'userManagement:delete',
    'roleManagement:view', 'roleManagement:create', 'roleManagement:edit', 'roleManagement:delete',
    'tentang:view', 'tentang:edit'
  ];

  function handleRoleChange(newRole: string) {
    setRole(newRole);
    if (newRole === 'superadmin') {
      setGrantedMenus(ALL_MENUS);
      return;
    }
    // Sinkronkan hak akses secara otomatis dari konfigurasi peran
    if (rolesWithPerms) {
      const r = rolesWithPerms.find((rp) => rp.name === newRole);
      if (r) {
        setGrantedMenus(r.permissions);
      }
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!username.trim()) {
      setValidationError("Username wajib diisi.");
      return;
    }
    if (!initial && !password.trim()) {
        setValidationError("Password wajib diisi untuk user baru.");
        return;
    }
    if (password.trim() && password.trim().length < 6) {
        setValidationError("Password minimal 6 karakter.");
        return;
    }
    if (role !== 'superadmin' && grantedMenus.length === 0) {
      setValidationError("Peran yang dipilih tidak memiliki hak akses (Atur di Manajemen Peran).");
      return;
    }
    setValidationError("");
    onSubmit({ 
        username: username.trim(), 
        password: password.trim() || undefined, 
        nama, 
        role,
        grantedMenus, 
        isActive 
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Username */}
      <div className="space-y-1.5">
        <Label htmlFor="username" className="text-foreground font-medium">
          Username
        </Label>
        <Input
          id="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="cth: admin123"
          disabled={!!initial}
          className="text-sm"
          data-ocid="users.username_input"
        />
        {!!initial && (
          <p className="text-xs text-muted-foreground">
            Username tidak dapat diubah.
          </p>
        )}
      </div>

      {/* Role */}
      <div className="space-y-1.5">
        <Label className="text-foreground font-medium">Peran / Role</Label>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {(availableRoles || [
            { name: "staff", label: "Staff" },
            { name: "admin", label: "Operator" },
            { name: "superadmin", label: "Super Admin" },
          ]).map((r) => {
            const label = r.name === 'admin' ? 'Operator' : r.name === 'superadmin' ? 'Super Admin' : r.label;
            return (
              <label
                key={r.name}
                className={`flex items-center justify-center py-2 px-3 rounded-lg border-2 cursor-pointer transition-all ${
                  role === r.name
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border hover:border-foreground/20 text-muted-foreground"
                }`}
              >
                <input
                  type="radio"
                  name="role"
                  className="hidden"
                  checked={role === r.name}
                  onChange={() => handleRoleChange(r.name)}
                />
                <span className="text-xs font-bold leading-none text-center">
                  {label}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Password */}
      <div className="space-y-1.5">
        <Label htmlFor="password" className="text-foreground font-medium">
          {initial ? "Ubah Password" : "Password"}
          {initial && <span className="text-muted-foreground font-normal ml-1">(opsional)</span>}
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder={initial ? "Kosongkan jika tidak ingin diubah" : "Masukkan password"}
          className="text-sm"
          data-ocid="users.password_input"
        />
      </div>

      {/* Nama */}
      <div className="space-y-1.5">
        <Label htmlFor="nama" className="text-foreground font-medium">
          Nama{" "}
          <span className="text-muted-foreground font-normal">(opsional)</span>
        </Label>
        <Input
          id="nama"
          value={nama}
          onChange={(e) => setNama(e.target.value)}
          placeholder="Nama pengguna"
          data-ocid="users.nama_input"
        />
      </div>

      {/* Hak Akses Monitoring (Informational only) */}
      <div className="p-3.5 rounded-lg border border-primary/10 bg-primary/5">
        <div className="flex items-center justify-between mb-2">
           <Label className="text-primary font-bold text-xs uppercase tracking-wider">Hak Akses Terdeteksi</Label>
           <Badge variant="secondary" className="text-[10px] py-0">{role === 'superadmin' ? 'FULL ACCESS' : `${grantedMenus.length} Izin`}</Badge>
        </div>
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          {role === 'superadmin' 
            ? 'Administrator Utama memiliki hak akses penuh ke seluruh fitur sistem.' 
            : `Hak akses user ini ditentukan secara otomatis berdasarkan peran "${role}". Ubah pengaturan izin di menu Manajemen Peran jika diperlukan.`}
        </p>
      </div>

      {/* Status (Edit only) */}
      {showStatus && (
        <div className="flex items-center justify-between py-3 border-t border-border">
          <div>
            <p className="text-sm font-medium text-foreground">Status User</p>
            <p className="text-xs text-muted-foreground">
              {isActive
                ? "Aktif — dapat mengakses panel admin"
                : "Nonaktif — akses diblokir"}
            </p>
          </div>
          <Switch
            checked={isActive}
            onCheckedChange={setIsActive}
            data-ocid="users.status_switch"
          />
        </div>
      )}

      {/* Errors */}
      {(validationError || error) && (
        <p
          className="text-sm text-primary font-medium"
          data-ocid="users.form_error_state"
        >
          {validationError || error}
        </p>
      )}

      <DialogFooter className="gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isLoading}
          data-ocid="users.cancel_button"
        >
          Batal
        </Button>
        <Button
          type="submit"
          disabled={isLoading}
          className="bg-primary text-primary-foreground hover:bg-primary/90"
          data-ocid="users.submit_button"
        >
          {isLoading ? "Menyimpan..." : "Simpan"}
        </Button>
      </DialogFooter>
    </form>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export function AdminUsers() {
  const { isAdmin, grantedMenus } = usePermissions();
  const qc = useQueryClient();

  const { data: users = [], isLoading } = useAdminUsers();
  const { data: availableRoles } = useQuery({
    queryKey: ["roles"],
    queryFn: () => api.roles.list(),
  });

  const [modalState, setModalState] = useState<
    | { type: "add" }
    | { type: "edit"; user: AdminUser }
    | { type: "delete"; user: AdminUser }
    | null
  >(null);

  const [mutationError, setMutationError] = useState("");

  // ─── Mutations ─────────────────────────────────────────────────────────────

  const addMutation = useMutation({
    mutationFn: async (data: UserFormData) => {
      return await api.users.add({
        username: data.username,
        password: data.password || "password123",
        nama: data.nama,
        role: data.role,
        grantedMenus: data.grantedMenus,
        isActive: data.isActive
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminUsers"] });
      setModalState(null);
      setMutationError("");
      toast.success("User berhasil ditambahkan");
    },
    onError: (err: Error) => setMutationError(err.message),
  });

  const updateMutation = useMutation({
    mutationFn: async ({
      data,
      id,
    }: {
      data: UserFormData;
      id: number;
    }) => {
      await api.users.update(id, {
          nama: data.nama,
          role: data.role,
          grantedMenus: data.grantedMenus,
          isActive: data.isActive
      });
      if (data.password && data.password.trim().length >= 6) {
          await api.users.changePassword(id, data.password.trim());
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminUsers"] });
      setModalState(null);
      setMutationError("");
      toast.success("User berhasil diperbarui");
    },
    onError: (err: Error) => setMutationError(err.message),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.users.delete(id);
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["adminUsers"] });
      setModalState(null);
      setMutationError("");
      toast.success("User berhasil dihapus");
    },
    onError: (err: Error) => setMutationError(err.message),
  });

  function handleCloseModal() {
    setModalState(null);
    setMutationError("");
  }

  // ─── Access Guard ───────────────────────────────────────────────────────────

  const { can } = usePermissions();
  if (!can('userManagement:view')) {
    return (
      <div
        className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4"
        data-ocid="users.access_denied_state"
      >
        <Users className="w-12 h-12 text-muted-foreground mb-4" />
        <h2 className="font-display font-bold text-lg text-foreground mb-2">
          Akses Ditolak
        </h2>
        <p className="text-muted-foreground text-sm max-w-sm">
          Halaman ini hanya dapat diakses oleh administrator utama.
        </p>
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────────────────

  const editingUser = modalState?.type === "edit" ? modalState.user : null;
  const deletingUser = modalState?.type === "delete" ? modalState.user : null;

  return (
    <>
      {/* Page Header */}
      <div
        className="bg-primary py-8 border-b border-border"
        data-ocid="users.header_section"
      >
        <div className="container mx-auto px-4 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-primary-foreground" />
            <div>
              <h1 className="font-display font-bold text-2xl text-primary-foreground">
                Kelola User
              </h1>
              <p className="text-primary-foreground/70 text-sm">
                Atur akses pengguna ke panel administrasi
              </p>
            </div>
          </div>
          <Button
            onClick={() => setModalState({ type: "add" })}
            className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold"
            data-ocid="users.add_user_button"
          >
            <Plus className="w-4 h-4 mr-2" />
            Tambah User
          </Button>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Table Card */}
        <div
          className="bg-card border border-border rounded-xl overflow-hidden"
          data-ocid="users.table"
        >
          {isLoading ? (
            <div className="p-6 space-y-3" data-ocid="users.loading_state">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-6" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              ))}
            </div>
          ) : users.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center px-4"
              data-ocid="users.empty_state"
            >
              <Users className="w-10 h-10 text-muted-foreground mb-3" />
              <p className="font-medium text-foreground">
                Belum ada user yang ditambahkan
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Klik "Tambah User" untuk menambahkan pengguna baru.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-muted/50 border-b border-border">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide w-10">
                      No
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Username
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Nama
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Peran
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Akses Menu
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                      Aksi
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr
                      key={user.id}
                      className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors"
                      data-ocid={`users.item.${idx + 1}`}
                    >
                      <td className="px-4 py-4 text-muted-foreground font-mono text-xs">
                        {idx + 1}
                      </td>
                      <td className="px-4 py-4">
                        <UsernameCell username={user.username} />
                      </td>
                      <td className="px-4 py-4 text-foreground">
                        {user.nama || (
                          <span className="text-muted-foreground italic text-xs">
                            —
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        {(() => {
                           const r = (availableRoles || []).find(x => x.name === user.role);
                           const label = r ? r.label : user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Operator' : user.role;
                           const colorClass = (user.role as string) === 'superadmin' 
                             ? "bg-primary/20 text-primary border-primary/30" 
                             : user.role === 'admin' || (user.role as string) === 'verifikator'
                               ? "bg-accent/20 text-accent border-accent/30"
                               : "text-muted-foreground";
                           
                           return (
                             <Badge variant={r || user.role === 'superadmin' ? 'default' : 'outline'} className={`${colorClass} text-[10px] uppercase font-bold px-1.5 py-0`}>
                               {label}
                             </Badge>
                           );
                        })()}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex flex-wrap gap-1">
                          {user.grantedMenus.map((menu) => (
                            <Badge
                              key={menu}
                              variant="outline"
                              className="text-[9px] border-border text-muted-foreground bg-muted/40 px-1.5 py-0 uppercase leading-relaxed"
                            >
                              {menu.replace(':', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {user.isActive ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-foreground/10 text-foreground border border-border">
                            Aktif
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-primary/10 text-primary border border-primary/20">
                            Nonaktif
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setModalState({ type: "edit", user })
                            }
                            className="p-1.5 rounded border border-border text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                            aria-label="Edit user"
                            data-ocid={`users.edit_button.${idx + 1}`}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              setModalState({ type: "delete", user })
                            }
                            className="p-1.5 rounded border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                            aria-label="Hapus user"
                            data-ocid={`users.delete_button.${idx + 1}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Info card */}
        <div className="mt-6 bg-muted/30 border border-border rounded-xl p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <strong className="text-foreground">Catatan:</strong> User yang
            ditambahkan di sini dapat mengakses panel admin sesuai hak akses
            menu yang diberikan. Gunakan username dan password yang aman.
            Administrator utama memiliki akses penuh ke semua fitur.
          </p>
        </div>
      </div>

      {/* ── Add User Modal ──────────────────────────────────────────────── */}
      <Dialog
        open={modalState?.type === "add"}
        onOpenChange={(open) => !open && handleCloseModal()}
      >
        <DialogContent
          className="sm:max-w-md"
          data-ocid="users.add_user_dialog"
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-display text-lg">
                Tambah User Baru
              </DialogTitle>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="users.close_button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              Lengkapi detail pengguna di bawah ini untuk memberikan akses masuk.
            </DialogDescription>
          </DialogHeader>
          <UserForm
            onSubmit={(data) => addMutation.mutate(data)}
            onCancel={handleCloseModal}
            isLoading={addMutation.isPending}
            error={mutationError}
          />
        </DialogContent>
      </Dialog>

      {/* ── Edit User Modal ─────────────────────────────────────────────── */}
      <Dialog
        open={modalState?.type === "edit"}
        onOpenChange={(open) => !open && handleCloseModal()}
      >
        <DialogContent
          className="sm:max-w-md"
          data-ocid="users.edit_user_dialog"
        >
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="font-display text-lg">
                Edit User
              </DialogTitle>
              <button
                type="button"
                onClick={handleCloseModal}
                className="p-1 text-muted-foreground hover:text-foreground transition-colors"
                data-ocid="users.close_button"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <DialogDescription className="text-sm text-muted-foreground">
              Ubah informasi pengguna atauatur ulang hak akses menu.
            </DialogDescription>
          </DialogHeader>
          {editingUser && (
            <UserForm
              key={editingUser.id}
              initial={{
                username: editingUser.username,
                nama: editingUser.nama || "",
                role: editingUser.role,
                grantedMenus: editingUser.grantedMenus,
                isActive: editingUser.isActive,
              }}
              showStatus
              onSubmit={(data) =>
                updateMutation.mutate({
                  data,
                  id: editingUser.id,
                })
              }
              onCancel={handleCloseModal}
              isLoading={updateMutation.isPending}
              error={mutationError}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* ── Delete Confirmation ─────────────────────────────────────────── */}
      <Dialog
        open={modalState?.type === "delete"}
        onOpenChange={(open) => !open && handleCloseModal()}
      >
        <DialogContent
          className="sm:max-w-sm"
          data-ocid="users.delete_user_dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-lg">
              Hapus User
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">
              Konfirmasi penghapusan akun pengguna dari sistem.
            </DialogDescription>
          </DialogHeader>
          {deletingUser && (
            <>
              <div className="py-2">
                <p className="text-sm text-foreground">
                  Hapus user{" "}
                  <span className="font-bold">
                    {deletingUser.username}
                  </span>
                  ? Tindakan ini tidak dapat dibatalkan.
                </p>
                {mutationError && (
                  <p
                    className="text-sm text-primary font-medium mt-2"
                    data-ocid="users.delete_error_state"
                  >
                    {mutationError}
                  </p>
                )}
              </div>
              <DialogFooter className="gap-2">
                <Button
                  variant="outline"
                  onClick={handleCloseModal}
                  disabled={deleteMutation.isPending}
                  data-ocid="users.delete_cancel_button"
                >
                  Batal
                </Button>
                <Button
                  onClick={() => deleteMutation.mutate(deletingUser.id)}
                  disabled={deleteMutation.isPending}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                  data-ocid="users.delete_confirm_button"
                >
                  {deleteMutation.isPending ? "Menghapus..." : "Hapus"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
