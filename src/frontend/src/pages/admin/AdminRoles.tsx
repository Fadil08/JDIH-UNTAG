import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "../../api";
import { 
  Shield, 
  Plus, 
  Pencil, 
  Trash2, 
  Check,
  Search,
  Loader2,
  Lock,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter
} from "@/components/ui/dialog";
import { SkeletonList } from "../../components/ui/LoadingSpinner";
import { ErrorState } from "../../components/ui/ErrorState";
import { EmptyState } from "../../components/ui/EmptyState";
import type { RoleWithPermissions, PermissionOption, RoleInput, MenuPermission } from "../../types";

// ── Definisi Modul untuk Grouping ─────────────────────────────────────────────

interface ModulGroup {
  key: string;
  label: string;
  icon: string;
  actions: { key: string; label: string }[];
}

const MODULE_GROUPS: ModulGroup[] = [
  {
    key: "dashboard",
    label: "Dashboard",
    icon: "📊",
    actions: [{ key: "dashboard:view", label: "Lihat" }],
  },
  {
    key: "dokumen",
    label: "Dokumen",
    icon: "📄",
    actions: [
      { key: "dokumen:view", label: "Lihat" },
      { key: "dokumen:create", label: "Tambah" },
      { key: "dokumen:edit", label: "Edit" },
      { key: "dokumen:delete", label: "Hapus" },
      { key: "dokumen:review", label: "Verifikasi" },
    ],
  },
  {
    key: "kategori",
    label: "Kategori",
    icon: "📁",
    actions: [
      { key: "kategori:view", label: "Lihat" },
      { key: "kategori:create", label: "Tambah" },
      { key: "kategori:edit", label: "Edit" },
      { key: "kategori:delete", label: "Hapus" },
    ],
  },
  {
    key: "status",
    label: "Status Dokumen",
    icon: "🏷️",
    actions: [
      { key: "status:view", label: "Lihat" },
      { key: "status:create", label: "Tambah" },
      { key: "status:edit", label: "Edit" },
      { key: "status:delete", label: "Hapus" },
    ],
  },
  {
    key: "berita",
    label: "Berita",
    icon: "📰",
    actions: [
      { key: "berita:view", label: "Lihat" },
      { key: "berita:create", label: "Tambah" },
      { key: "berita:edit", label: "Edit" },
      { key: "berita:delete", label: "Hapus" },
    ],
  },
  {
    key: "galeri",
    label: "Galeri",
    icon: "🖼️",
    actions: [
      { key: "galeri:view", label: "Lihat" },
      { key: "galeri:create", label: "Tambah" },
      { key: "galeri:delete", label: "Hapus" },
    ],
  },
  {
    key: "statistik",
    label: "Statistik",
    icon: "📈",
    actions: [{ key: "statistik:view", label: "Lihat" }],
  },
  {
    key: "userManagement",
    label: "Pengguna",
    icon: "👥",
    actions: [
      { key: "userManagement:view", label: "Lihat" },
      { key: "userManagement:create", label: "Tambah" },
      { key: "userManagement:edit", label: "Edit" },
      { key: "userManagement:delete", label: "Hapus" },
    ],
  },
  {
    key: "roleManagement",
    label: "Role & Akses",
    icon: "🛡️",
    actions: [
      { key: "roleManagement:view", label: "Lihat" },
      { key: "roleManagement:create", label: "Tambah" },
      { key: "roleManagement:edit", label: "Edit" },
      { key: "roleManagement:delete", label: "Hapus" },
    ],
  },
  {
    key: "tentang",
    label: "Tentang JDIH",
    icon: "📖",
    actions: [
      { key: "tentang:view", label: "Lihat" },
      { key: "tentang:edit", label: "Edit" },
    ],
  },
  {
    key: "kontak",
    label: "Informasi Kontak",
    icon: "📞",
    actions: [{ key: "kontak:edit", label: "Edit" }],
  },
  {
    key: "activityLog",
    label: "Log Aktivitas",
    icon: "📜",
    actions: [{ key: "activityLog:view", label: "Lihat" }],
  },
  {
    key: "settings",
    label: "Pengaturan Sistem",
    icon: "⚙️",
    actions: [
      { key: "settings:view", label: "Lihat" },
      { key: "settings:edit", label: "Edit" },
    ],
  },
];

// ── Helper: count per modul ───────────────────────────────────────────────────

function countModulPermissions(
  permissions: MenuPermission[],
  modulKey: string
): { active: number; total: number } {
  const group = MODULE_GROUPS.find((g) => g.key === modulKey);
  if (!group) return { active: 0, total: 0 };
  const total = group.actions.length;
  const active = group.actions.filter((a) =>
    permissions.includes(a.key)
  ).length;
  return { active, total };
}

export default function AdminRoles() {
  const qc = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  
  // Form states
  const [label, setLabel] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [selectedPermissions, setSelectedPermissions] = useState<MenuPermission[]>([]);

  // Queries
  const { data: roles, isLoading: rolesLoading, isError: rolesError } = useQuery({
    queryKey: ["roles-perms"],
    queryFn: () => api.roles.listWithPermissions(),
  });

  const { data: permissions } = useQuery({
    queryKey: ["all-permissions"],
    queryFn: () => api.roles.permissions(),
  });

  // Mutations
  const addMutation = useMutation({
    mutationFn: (input: RoleInput) => api.roles.add(input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles-perms"] });
      qc.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Peran berhasil ditambahkan");
      closeModal();
    },
    onError: () => toast.error("Gagal menambahkan peran")
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, input }: { id: number; input: RoleInput }) => api.roles.update(id, input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles-perms"] });
      qc.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Peran berhasil diperbarui");
      closeModal();
    },
    onError: () => toast.error("Gagal memperbarui peran")
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.roles.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["roles-perms"] });
      qc.invalidateQueries({ queryKey: ["roles"] });
      toast.success("Peran berhasil dihapus");
    },
    onError: (err: any) => toast.error(err.message || "Gagal menghapus peran")
  });

  function openModal(role?: RoleWithPermissions) {
    if (role) {
      setEditingRole(role);
      setLabel(role.label);
      setName(role.name);
      setDescription(role.description || "");
      setSelectedPermissions(role.permissions);
    } else {
      setEditingRole(null);
      setLabel("");
      setName("");
      setDescription("");
      setSelectedPermissions([]);
    }
    setIsModalOpen(true);
  }

  function closeModal() {
    setIsModalOpen(false);
  }

  function handleSave() {
    if (!label.trim()) return toast.error("Label wajib diisi");
    
    const input: RoleInput = {
      name: editingRole ? editingRole.name : label.toLowerCase().replace(/\s+/g, '_'),
      label,
      description,
      permissions: selectedPermissions
    };

    if (editingRole) {
      updateMutation.mutate({ id: editingRole.id, input });
    } else {
      addMutation.mutate(input);
    }
  }

  function togglePermission(key: MenuPermission) {
    setSelectedPermissions(prev => 
      prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
    );
  }

  function toggleModul(modulKey: string) {
    const group = MODULE_GROUPS.find(g => g.key === modulKey);
    if (!group) return;
    const allKeys = group.actions.map(a => a.key);
    const allSelected = allKeys.every(k => selectedPermissions.includes(k));
    if (allSelected) {
      setSelectedPermissions(prev => prev.filter(p => !allKeys.includes(p)));
    } else {
      setSelectedPermissions(prev => {
        const newPerms = [...prev];
        allKeys.forEach(k => {
          if (!newPerms.includes(k)) newPerms.push(k);
        });
        return newPerms;
      });
    }
  }

  function selectAll() {
    const allKeys = MODULE_GROUPS.flatMap(g => g.actions.map(a => a.key));
    setSelectedPermissions(allKeys);
  }

  function deselectAll() {
    setSelectedPermissions([]);
  }

  const isSuperadminEdit = editingRole?.is_system && editingRole?.name === 'superadmin';

  if (rolesLoading) return <SkeletonList />;
  if (rolesError) return <ErrorState message="Gagal memuat data peran" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Shield className="w-7 h-7 text-primary" />
            Manajemen Peran & Akses
          </h1>
          <p className="text-muted-foreground mt-1">
            Definisikan peran pengguna dan atur izin aksi per modul secara granular.
          </p>
        </div>
        <Button onClick={() => openModal()} className="shadow-sm">
          <Plus className="w-4 h-4 mr-2" />
          Tambah Peran
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {roles?.map((role) => (
          <div key={role.id} className="bg-card border border-border rounded-xl shadow-sm hover:shadow-md transition-all overflow-hidden">
            <div className="p-5 border-b border-border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Shield className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground flex items-center gap-2">
                    {role.label}
                    {role.is_system ? (
                      <Badge variant="secondary" className="text-[10px] uppercase font-bold py-0 h-5">Sistem</Badge>
                    ) : null}
                  </h3>
                  <p className="text-xs text-muted-foreground font-mono">{role.name}</p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" onClick={() => openModal(role)} className="h-8 w-8">
                  <Pencil className="w-4 h-4" />
                </Button>
                {!role.is_system && (
                  <Button variant="ghost" size="icon" onClick={() => {
                    if (confirm("Hapus peran ini?")) deleteMutation.mutate(role.id);
                  }} className="h-8 w-8 text-primary hover:text-primary">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="text-sm text-muted-foreground">
                {role.description || "Tidak ada deskripsi."}
              </div>
              <div className="space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Hak Akses ({role.permissions.length} izin)
                </p>
                <div className="space-y-1.5">
                  {role.permissions.length === 0 ? (
                    <span className="text-xs italic text-muted-foreground">Tidak ada hak akses</span>
                  ) : (
                    MODULE_GROUPS.map(modul => {
                      const { active, total } = countModulPermissions(role.permissions, modul.key);
                      if (active === 0) return null;
                      return (
                        <div key={modul.key} className="flex items-center gap-2 flex-wrap">
                          <span className="text-xs min-w-[100px]">{modul.icon} {modul.label}</span>
                          {modul.actions
                            .filter(a => role.permissions.includes(a.key))
                            .map(a => (
                              <Badge key={a.key} variant="outline" className="text-[10px] font-medium bg-muted/50 px-1.5 py-0">
                                {a.label}
                              </Badge>
                            ))}
                          {active === total && (
                            <Badge className="text-[9px] font-bold py-0 px-1.5 bg-primary/10 text-primary border-primary/20">
                              FULL
                            </Badge>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}

        {roles?.length === 0 && (
          <div className="col-span-full">
            <EmptyState title="Belum ada peran" description="Tambahkan peran baru untuk mulai mengatur hak akses pengguna." />
          </div>
        )}
      </div>

      {/* Modal Add/Edit */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? "Edit Peran" : "Tambah Peran Baru"}</DialogTitle>
            <DialogDescription>
              Tentukan nama peran dan pilih aksi per modul yang dapat diakses.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Label Peran</label>
              <Input 
                value={label} 
                onChange={e => setLabel(e.target.value)} 
                placeholder="cth: Editor Berita" 
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Deskripsi</label>
              <Input 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="Tulis kegunaan peran ini" 
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium block">Hak Akses per Modul</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={selectAll}
                    disabled={isSuperadminEdit}
                    className="text-[11px] text-primary hover:underline font-medium disabled:opacity-50"
                  >
                    Pilih Semua
                  </button>
                  <span className="text-muted-foreground text-[11px]">|</span>
                  <button
                    type="button"
                    onClick={deselectAll}
                    disabled={isSuperadminEdit}
                    className="text-[11px] text-muted-foreground hover:underline font-medium disabled:opacity-50"
                  >
                    Hapus Semua
                  </button>
                </div>
              </div>

              <div className="border border-border rounded-lg divide-y divide-border bg-card">
                {MODULE_GROUPS.map(modul => {
                  const allKeys = modul.actions.map(a => a.key);
                  const allSelected = allKeys.every(k => selectedPermissions.includes(k));
                  const someSelected = allKeys.some(k => selectedPermissions.includes(k));
                  const selectedCount = allKeys.filter(k => selectedPermissions.includes(k)).length;

                  return (
                    <div key={modul.key} className="px-3 py-2.5">
                      {/* Module header */}
                      <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer group flex-1">
                          <Checkbox
                            checked={allSelected}
                            // @ts-ignore - indeterminate handling
                            ref={(el: any) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                            onCheckedChange={() => toggleModul(modul.key)}
                            disabled={isSuperadminEdit}
                          />
                          <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                            {modul.icon} {modul.label}
                          </span>
                        </label>
                        <Badge variant="outline" className="text-[10px] font-mono py-0 h-5">
                          {selectedCount}/{modul.actions.length}
                        </Badge>
                      </div>

                      {/* Actions within module */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-2 ml-7">
                        {modul.actions.map(action => (
                          <label key={action.key} className="flex items-center gap-1.5 cursor-pointer group">
                            <Checkbox
                              checked={selectedPermissions.includes(action.key)}
                              onCheckedChange={() => togglePermission(action.key)}
                              disabled={isSuperadminEdit}
                              className="h-3.5 w-3.5"
                            />
                            <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                              {action.label}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[11px] text-muted-foreground">
                Total izin dipilih: <strong>{selectedPermissions.length}</strong> dari{" "}
                {MODULE_GROUPS.reduce((sum, g) => sum + g.actions.length, 0)}
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={closeModal}>Batal</Button>
            <Button onClick={handleSave} disabled={addMutation.isPending || updateMutation.isPending}>
              {(addMutation.isPending || updateMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
