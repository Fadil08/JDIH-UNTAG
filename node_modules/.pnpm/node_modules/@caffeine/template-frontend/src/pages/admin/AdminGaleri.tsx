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
import { Textarea } from "@/components/ui/textarea";

import { useQueryClient } from "@tanstack/react-query";
import {
  Image as ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import api from "../../api";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { SkeletonList } from "../../components/ui/LoadingSpinner";
import { useDeleteGaleriItem, useGaleri } from "../../hooks/useBackend";
import { usePermissions } from "../../hooks/usePermissions";
import type { GaleriItem } from "../../types";

// ─── Form State ───────────────────────────────────────────────────────────────

interface FormState {
  judul: string;
  deskripsi: string;
  album: string;
}

interface FormErrors {
  judul?: string;
  album?: string;
}

const EMPTY_FORM: FormState = { judul: "", deskripsi: "", album: "" };

const ALBUM_SUGGESTIONS = [
  "Kegiatan Akademik",
  "Wisuda",
  "Seminar",
  "Fasilitas Kampus",
  "Kegiatan Mahasiswa",
  "Dokumentasi Hukum",
];

function validate(form: FormState): FormErrors {
  const errs: FormErrors = {};
  if (!form.judul.trim()) errs.judul = "Judul wajib diisi";
  if (!form.album.trim()) errs.album = "Album wajib diisi";
  return errs;
}

// ─── Image Upload Widget ──────────────────────────────────────────────────────

interface ImageWidgetProps {
  imageFile: File | null;
  existingUrl: string;
  isUploading: boolean;
  uploadProgress: number;
  onFileSelect: (f: File | null) => void;
  onClearExisting: () => void;
}

function GaleriImageWidget({
  imageFile,
  existingUrl,
  isUploading,
  uploadProgress,
  onFileSelect,
  onClearExisting,
}: ImageWidgetProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : null;
  const displayUrl = previewUrl ?? existingUrl ?? null;

  return (
    <div>
      <Label className="text-sm font-medium">Foto</Label>
      <div className="mt-1">
        {displayUrl ? (
          <div className="relative rounded-lg overflow-hidden border border-border">
            <img
              src={displayUrl}
              alt="Pratinjau foto"
              className="w-full h-44 object-cover"
            />
            <button
              type="button"
              onClick={() => {
                onFileSelect(null);
                onClearExisting();
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="absolute top-2 right-2 bg-background/80 hover:bg-background rounded-full p-1 border border-border transition-colors"
              aria-label="Hapus foto"
              data-ocid="admin_galeri.gambar_remove_button"
            >
              <X className="w-4 h-4 text-foreground" />
            </button>
            {imageFile && (
              <div className="absolute bottom-0 left-0 right-0 bg-background/80 px-3 py-1.5 text-xs text-foreground truncate">
                {imageFile.name}
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => fileRef.current?.click()}
            data-ocid="admin_galeri.gambar_upload_button"
          >
            {isUploading ? (
              <Loader2 className="w-7 h-7 text-muted-foreground mx-auto mb-2 animate-spin" />
            ) : (
              <ImageIcon className="w-7 h-7 text-muted-foreground mx-auto mb-2" />
            )}
            <p className="text-xs text-muted-foreground">
              Klik untuk pilih foto (JPG, PNG, WebP)
            </p>
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onFileSelect(e.target.files?.[0] ?? null)}
          data-ocid="admin_galeri.gambar_file_input"
        />

        {isUploading && uploadProgress > 0 && uploadProgress < 100 && (
          <div className="mt-2">
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Mengunggah foto... {uploadProgress}%
            </p>
          </div>
        )}

        {displayUrl && (
          <button
            type="button"
            className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => fileRef.current?.click()}
            data-ocid="admin_galeri.gambar_change_button"
          >
            <Upload className="w-3.5 h-3.5" />
            Ganti foto
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminGaleri() {
  const qc = useQueryClient();
  const { can } = usePermissions();

  const { data: galeriList, isLoading, isError, refetch } = useGaleri();
  const deleteGaleriItem = useDeleteGaleriItem();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string>("");

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    judul: string;
  } | null>(null);

  // Access control
  const canAccess = can("galeri:view");
  if (!canAccess) {
    return (
      <div className="container mx-auto px-4 py-12 text-center">
        <p className="text-muted-foreground">
          Anda tidak memiliki akses ke halaman ini.
        </p>
      </div>
    );
  }

  function openCreate() {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditId(null);
    setImageFile(null);
    setExistingImageUrl("");
    setUploadProgress(0);
    setShowForm(true);
  }

  function openEdit(item: GaleriItem) {
    setForm({
      judul: item.judul,
      deskripsi: item.deskripsi,
      album: item.album,
    });
    setErrors({});
    setEditId(item.id);
    setImageFile(null);
    setExistingImageUrl(item.gambar ?? "");
    setUploadProgress(0);
    setShowForm(true);
  }

  function setField<K extends keyof FormState>(key: K, val: string) {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (key in errors) setErrors((prev) => ({ ...prev, [key]: undefined }));
  }

  function getSelectedImageFile(): File | undefined {
    return imageFile || undefined;
  }

  async function handleSave() {
    const errs = validate(form);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      const gambar = getSelectedImageFile();
      const input = {
        judul: form.judul.trim(),
        deskripsi: form.deskripsi.trim(),
        album: form.album.trim(),
        gambar,
      };

      if (editId !== null) {
        await api.galeri.update(Number(editId), input);
        toast.success("Foto berhasil diperbarui");
      } else {
        await api.galeri.add(input);
        toast.success("Foto berhasil ditambahkan");
      }

      qc.invalidateQueries({ queryKey: ["galeri"] });
      setShowForm(false);
    } catch {
      toast.error("Gagal menyimpan foto. Silakan coba lagi.");
    } finally {
      setSaving(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleDelete(id: number) {
    try {
      await deleteGaleriItem.mutateAsync(id);
      toast.success("Foto berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus foto");
    } finally {
      setDeleteTarget(null);
    }
  }

  const isBusy = saving || isUploading;

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h1 className="font-display font-bold text-xl text-foreground">
            Kelola Galeri
          </h1>
          <Button
            onClick={openCreate}
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 text-sm"
            data-ocid="admin_galeri.tambah_button"
          >
            <Plus className="w-4 h-4" />
            Tambah Foto
          </Button>
        </div>

        {/* Content */}
        {isLoading ? (
          <SkeletonList count={4} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !galeriList || galeriList.length === 0 ? (
          <EmptyState
            title="Belum ada foto di galeri"
            description="Unggah foto kegiatan atau dokumentasi kampus pertama Anda."
            actionLabel="Tambah Foto"
            onAction={openCreate}
            data-ocid="admin_galeri.empty_state"
          />
        ) : (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
            data-ocid="admin_galeri.foto_list"
          >
            {galeriList.map((item, idx) => {
              const imgUrl = item.gambar ?? null;
              return (
                <div
                  key={item.id}
                  className="group relative bg-card border border-border rounded-lg overflow-hidden"
                  data-ocid={`admin_galeri.foto_item.${idx + 1}`}
                >
                  {/* Thumbnail */}
                  {imgUrl ? (
                    <img
                      src={imgUrl}
                      alt={item.judul}
                      className="w-full aspect-square object-cover"
                    />
                  ) : (
                    <div className="w-full aspect-square bg-muted flex items-center justify-center">
                      <ImageIcon className="w-10 h-10 text-muted-foreground/30" />
                    </div>
                  )}

                  {/* Info overlay on hover */}
                  <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/50 transition-all duration-200" />
                  <div className="absolute inset-0 flex flex-col justify-between p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    <div className="flex justify-end gap-1.5">
                      <button
                        type="button"
                        onClick={() => openEdit(item)}
                        className="w-7 h-7 bg-background/90 hover:bg-background rounded flex items-center justify-center border border-border transition-colors"
                        aria-label="Edit"
                        data-ocid={`admin_galeri.edit_button.${idx + 1}`}
                      >
                        <Pencil className="w-3.5 h-3.5 text-foreground" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setDeleteTarget({ id: item.id, judul: item.judul })
                        }
                        className="w-7 h-7 bg-background/90 hover:bg-accent/10 rounded flex items-center justify-center border border-border transition-colors"
                        aria-label="Hapus"
                        data-ocid={`admin_galeri.delete_button.${idx + 1}`}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-accent" />
                      </button>
                    </div>
                    <div>
                      <span className="inline-block bg-primary text-primary-foreground text-xs px-2 py-0.5 rounded mb-1">
                        {item.album}
                      </span>
                      <p className="text-white text-xs font-semibold line-clamp-2">
                        {item.judul}
                      </p>
                    </div>
                  </div>

                  {/* Non-hover title at bottom */}
                  <div className="p-2 bg-card border-t border-border group-hover:opacity-0 transition-opacity">
                    <p className="text-foreground text-xs font-medium truncate">
                      {item.judul}
                    </p>
                    <p className="text-muted-foreground text-xs truncate">
                      {item.album}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(v) => !isBusy && setShowForm(v)}>
        <DialogContent
          className="max-w-lg max-h-[90vh] overflow-y-auto"
          data-ocid="admin_galeri.dialog"
        >
          <DialogHeader>
            <DialogTitle className="font-display text-base">
              {editId !== null ? "Edit Foto" : "Tambah Foto"}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Unggah dan kelola foto untuk galeri atau slider beranda.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            {/* Image Upload */}
            <GaleriImageWidget
              imageFile={imageFile}
              existingUrl={existingImageUrl}
              isUploading={isUploading}
              uploadProgress={uploadProgress}
              onFileSelect={(f) => setImageFile(f)}
              onClearExisting={() => {
                setExistingImageUrl("");
              }}
            />

            {/* Judul */}
            <div>
              <Label htmlFor="galeri-judul" className="text-sm font-medium">
                Judul <span className="text-accent">*</span>
              </Label>
              <Input
                id="galeri-judul"
                value={form.judul}
                onChange={(e) => setField("judul", e.target.value)}
                placeholder="Judul foto atau keterangan singkat"
                className="mt-1 text-sm"
                data-ocid="admin_galeri.judul_input"
              />
              {errors.judul && (
                <p
                  className="text-xs text-accent mt-1"
                  data-ocid="admin_galeri.judul.field_error"
                >
                  {errors.judul}
                </p>
              )}
            </div>

            {/* Deskripsi */}
            <div>
              <Label htmlFor="galeri-deskripsi" className="text-sm font-medium">
                Deskripsi
              </Label>
              <Textarea
                id="galeri-deskripsi"
                value={form.deskripsi}
                onChange={(e) => setField("deskripsi", e.target.value)}
                placeholder="Keterangan foto lebih lengkap (opsional)..."
                rows={3}
                className="mt-1 text-sm resize-none"
                data-ocid="admin_galeri.deskripsi_textarea"
              />
            </div>

            {/* Album */}
            <div>
              <Label htmlFor="galeri-album" className="text-sm font-medium">
                Album <span className="text-accent">*</span>
              </Label>
              <Input
                id="galeri-album"
                value={form.album}
                onChange={(e) => setField("album", e.target.value)}
                placeholder="Nama album atau kategori foto"
                className="mt-1 text-sm"
                list="album-suggestions"
                data-ocid="admin_galeri.album_input"
              />
              <datalist id="album-suggestions">
                {ALBUM_SUGGESTIONS.map((s) => (
                  <option key={s} value={s} />
                ))}
              </datalist>
              {errors.album && (
                <p
                  className="text-xs text-accent mt-1"
                  data-ocid="admin_galeri.album.field_error"
                >
                  {errors.album}
                </p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Contoh: Kegiatan Akademik, Wisuda, Fasilitas Kampus
              </p>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button
              variant="outline"
              onClick={() => setShowForm(false)}
              disabled={isBusy}
              data-ocid="admin_galeri.cancel_button"
            >
              Batal
            </Button>
            <Button
              onClick={handleSave}
              disabled={isBusy}
              className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
              data-ocid="admin_galeri.submit_button"
            >
              {isBusy && <Loader2 className="w-4 h-4 animate-spin" />}
              {isUploading
                ? "Mengunggah foto..."
                : saving
                  ? "Menyimpan..."
                  : "Simpan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="admin_galeri.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Foto?</AlertDialogTitle>
            <AlertDialogDescription>
              Foto <strong>{deleteTarget?.judul}</strong> akan dihapus secara
              permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="admin_galeri.delete_cancel_button">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              data-ocid="admin_galeri.delete_confirm_button"
            >
              {deleteGaleriItem.isPending ? (
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
