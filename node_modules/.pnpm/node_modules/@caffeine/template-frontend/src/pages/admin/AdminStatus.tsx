import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import api from "../../api";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { SkeletonList } from "../../components/ui/LoadingSpinner";
import { PageHeader } from "../../components/ui/PageHeader";
import { useDeleteStatus, useStatus } from "../../hooks/useBackend";

interface KatFormState {
  nama: string;
  warna: string;
}

interface FormErrors {
  nama?: string;
  warna?: string;
}

function validate(form: KatFormState): FormErrors {
  const errs: FormErrors = {};
  if (!form.nama.trim()) errs.nama = "Nama Status wajib diisi";
  return errs;
}

export function AdminStatus() {

  const qc = useQueryClient();

  const { data: StatusList, isLoading, isError, refetch } = useStatus();
  const deleteStatus = useDeleteStatus();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | number | null>(null);
  const [form, setForm] = useState<KatFormState>({ nama: "", warna: "#64748b" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string | number;
    nama: string;
  } | null>(null);

  function openCreate() {
    setForm({ nama: "", warna: "#64748b" });
    setErrors({});
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(id: string | number, nama: string, warna?: string) {
    setForm({ nama, warna: warna || "#64748b" });
    setErrors({});
    setEditId(id);
    setShowForm(true);
  }

  function setField(key: keyof KatFormState, val: string) {
    setForm((p) => ({ ...p, [key]: val }));
    if (errors[key]) setErrors((p) => ({ ...p, [key]: undefined }));
  }

  async function handleSave() {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    try {
      if (editId) {
        await api.status.update(Number(editId), form.nama.trim(), form.warna);
        toast.success("Status berhasil diperbarui");
      } else {
        await api.status.add(form.nama.trim(), form.warna);
        toast.success("Status berhasil ditambahkan");
      }
      qc.invalidateQueries({ queryKey: ["Status"] });
      qc.invalidateQueries({ queryKey: ["statistik"] });
      setShowForm(false);
    } catch {
      toast.error("Gagal menyimpan Status. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string | number) {
    try {
      await deleteStatus.mutateAsync(Number(id));
      toast.success("Status berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus Status");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Kelola Status"
        description="Kelola jenis produk hukum yang tersedia di portal"
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Status" }]}
        actions={
          <Button
            onClick={openCreate}
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 text-sm"
            data-ocid="admin_Status.tambah_button"
          >
            <Plus className="w-4 h-4" />
            Tambah Status
          </Button>
        }
      />

      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <SkeletonList count={4} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !StatusList || StatusList.length === 0 ? (
          <EmptyState
            title="Belum ada Status"
            description="Tambahkan Status produk hukum pertama."
            actionLabel="Tambah Status"
            onAction={openCreate}
            data-ocid="admin_Status.empty_state"
          />
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            data-ocid="admin_Status.Status_list"
          >
            {StatusList.map((kat, idx) => (
              <div
                key={kat.id}
                className="bg-card border border-border rounded-xl p-5 transition-all hover:border-primary/30 hover:shadow-sm"
                data-ocid={`admin_Status.Status_card.${idx + 1}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: kat.warna || '#64748b' }} />
                    <h3 className="font-semibold text-foreground text-sm leading-snug">
                      {kat.nama}
                    </h3>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-secondary"
                      onClick={() => openEdit(kat.id, kat.nama, kat.warna)}
                      data-ocid={`admin_Status.edit_button.${idx + 1}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-accent hover:text-accent hover:bg-accent/5"
                      onClick={() =>
                        setDeleteTarget({ id: kat.id, nama: kat.nama })
                      }
                      data-ocid={`admin_Status.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(v) => !saving && setShowForm(v)}>
        <DialogContent className="max-w-sm" data-ocid="admin_Status.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editId ? "Edit Status" : "Tambah Status"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Kelola nama Status untuk pengelompokan dokumen hukum.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Label htmlFor="kat-nama" className="text-sm font-medium">
              Nama Status <span className="text-accent">*</span>
            </Label>
            <Input
              id="kat-nama"
              value={form.nama}
              onChange={(e) => setField("nama", e.target.value)}
              placeholder="cth. Peraturan Rektor"
              className="mt-1 text-sm"
              data-ocid="admin_Status.nama_input"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            {errors.nama && (
              <p
                className="text-xs text-accent mt-1"
                data-ocid="admin_Status.nama.field_error"
              >
                {errors.nama}
              </p>
            )}
          </div>
          <div className="py-2">
            <Label htmlFor="kat-warna" className="text-sm font-medium">
              Warna Status
            </Label>
            <div className="flex items-center gap-3 mt-1">
              <Input
                id="kat-warna"
                type="color"
                value={form.warna}
                onChange={(e) => setField("warna", e.target.value)}
                className="w-12 h-10 p-1 cursor-pointer"
                data-ocid="admin_Status.warna_input"
              />
              <span className="text-sm text-muted-foreground">{form.warna}</span>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={saving}
              data-ocid="admin_Status.cancel_button"
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
              data-ocid="admin_Status.submit_button"
            >
              {saving && <Loader2 className="w-4 h-4 animate-spin" />}
              {saving ? "Menyimpan..." : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="admin_Status.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Status?</AlertDialogTitle>
            <AlertDialogDescription>
              Status <strong>{deleteTarget?.nama}</strong> akan dihapus.
              Dokumen yang terkait Status ini mungkin terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="admin_Status.delete_cancel_button">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              data-ocid="admin_Status.delete_confirm_button"
            >
              {deleteStatus.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Hapus"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

