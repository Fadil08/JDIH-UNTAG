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
import { useDeleteKategori, useKategori } from "../../hooks/useBackend";

interface KatFormState {
  nama: string;
}

interface FormErrors {
  nama?: string;
}

function validate(form: KatFormState): FormErrors {
  const errs: FormErrors = {};
  if (!form.nama.trim()) errs.nama = "Nama kategori wajib diisi";
  return errs;
}

export function AdminKategori() {

  const qc = useQueryClient();

  const { data: kategoriList, isLoading, isError, refetch } = useKategori();
  const deleteKategori = useDeleteKategori();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | number | null>(null);
  const [form, setForm] = useState<KatFormState>({ nama: "" });
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string | number;
    nama: string;
  } | null>(null);

  function openCreate() {
    setForm({ nama: "" });
    setErrors({});
    setEditId(null);
    setShowForm(true);
  }

  function openEdit(id: string | number, nama: string) {
    setForm({ nama });
    setErrors({});
    setEditId(id);
    setShowForm(true);
  }

  function setField(val: string) {
    setForm({ nama: val });
    if (errors.nama) setErrors({});
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
        await api.kategori.update(Number(editId), form.nama.trim());
        toast.success("Kategori berhasil diperbarui");
      } else {
        await api.kategori.add(form.nama.trim());
        toast.success("Kategori berhasil ditambahkan");
      }
      qc.invalidateQueries({ queryKey: ["kategori"] });
      qc.invalidateQueries({ queryKey: ["statistik"] });
      setShowForm(false);
    } catch {
      toast.error("Gagal menyimpan kategori. Silakan coba lagi.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string | number) {
    try {
      await deleteKategori.mutateAsync(Number(id));
      toast.success("Kategori berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus kategori");
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <>
      <PageHeader
        title="Kelola Kategori"
        description="Kelola jenis produk hukum yang tersedia di portal"
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Kategori" }]}
        actions={
          <Button
            onClick={openCreate}
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 text-sm"
            data-ocid="admin_kategori.tambah_button"
          >
            <Plus className="w-4 h-4" />
            Tambah Kategori
          </Button>
        }
      />

      <div className="container mx-auto px-4 py-6">
        {isLoading ? (
          <SkeletonList count={4} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !kategoriList || kategoriList.length === 0 ? (
          <EmptyState
            title="Belum ada kategori"
            description="Tambahkan kategori produk hukum pertama."
            actionLabel="Tambah Kategori"
            onAction={openCreate}
            data-ocid="admin_kategori.empty_state"
          />
        ) : (
          <div
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            data-ocid="admin_kategori.kategori_list"
          >
            {kategoriList.map((kat, idx) => (
              <div
                key={kat.id}
                className="bg-card border border-border rounded-xl p-5 transition-all hover:border-primary/30 hover:shadow-sm"
                data-ocid={`admin_kategori.kategori_card.${idx + 1}`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-semibold text-foreground text-sm leading-snug flex-1">
                    {kat.nama}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 hover:bg-secondary"
                      onClick={() => openEdit(kat.id, kat.nama)}
                      data-ocid={`admin_kategori.edit_button.${idx + 1}`}
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
                      data-ocid={`admin_kategori.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
                {kat.deskripsi && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                    {kat.deskripsi}
                  </p>
                )}
                <div className="text-xs font-medium text-primary bg-primary/5 rounded px-2 py-1 inline-block">
                  {kat.jumlahDokumen} dokumen
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Form Dialog */}
      <Dialog open={showForm} onOpenChange={(v) => !saving && setShowForm(v)}>
        <DialogContent className="max-w-sm" data-ocid="admin_kategori.dialog">
          <DialogHeader>
            <DialogTitle className="font-display">
              {editId ? "Edit Kategori" : "Tambah Kategori"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Kelola nama kategori untuk pengelompokan dokumen hukum.
            </DialogDescription>
          </DialogHeader>

          <div className="py-2">
            <Label htmlFor="kat-nama" className="text-sm font-medium">
              Nama Kategori <span className="text-accent">*</span>
            </Label>
            <Input
              id="kat-nama"
              value={form.nama}
              onChange={(e) => setField(e.target.value)}
              placeholder="cth. Peraturan Rektor"
              className="mt-1 text-sm"
              data-ocid="admin_kategori.nama_input"
              onKeyDown={(e) => e.key === "Enter" && handleSave()}
            />
            {errors.nama && (
              <p
                className="text-xs text-accent mt-1"
                data-ocid="admin_kategori.nama.field_error"
              >
                {errors.nama}
              </p>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={saving}
              data-ocid="admin_kategori.cancel_button"
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
              data-ocid="admin_kategori.submit_button"
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
        <AlertDialogContent data-ocid="admin_kategori.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Kategori?</AlertDialogTitle>
            <AlertDialogDescription>
              Kategori <strong>{deleteTarget?.nama}</strong> akan dihapus.
              Dokumen yang terkait kategori ini mungkin terpengaruh.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="admin_kategori.delete_cancel_button">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              data-ocid="admin_kategori.delete_confirm_button"
            >
              {deleteKategori.isPending ? (
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
