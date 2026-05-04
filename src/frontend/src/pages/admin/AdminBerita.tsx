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
import { Badge } from "@/components/ui/badge";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft } from "lucide-react";

import { useQueryClient } from "@tanstack/react-query";
import {
  Calendar,
  ImageIcon,
  Loader2,
  Pencil,
  Plus,
  Tag,
  Trash2,
  Upload,
  User,
  UserCheck,
  X,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import api from "../../api";
import { usePermissions } from "../../hooks/usePermissions";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { SkeletonList } from "../../components/ui/LoadingSpinner";
import { useBerita, useDeleteBerita } from "../../hooks/useBackend";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncatePrincipal(principal: string | number | null | undefined): string {
  if (!principal) return "-";
  const str = String(principal);
  if (str.length <= 12) return str;
  return `${str.slice(0, 12)}...`;
}

// ─── Form State ────────────────────────────────────────────────────────────────

interface BeritaFormState {
  judul: string;
  author: string;
  konten: string;
  ringkasan: string;
  tagsInput: string;
  status: string;
  tanggalPublikasi: string;
}

interface FormErrors {
  judul?: string;
  author?: string;
  konten?: string;
  gambar?: string;
}

const EMPTY_FORM: BeritaFormState = {
  judul: "",
  author: "",
  konten: "",
  ringkasan: "",
  tagsInput: "",
  status: "Terbit",
  tanggalPublikasi: "",
};

function validate(form: BeritaFormState): FormErrors {
  const errs: FormErrors = {};
  if (!form.judul.trim()) errs.judul = "Judul wajib diisi";
  if (!form.author.trim()) errs.author = "Nama penulis wajib diisi";
  if (!form.konten.trim()) errs.konten = "Konten artikel wajib diisi";
  return errs;
}

function formatTanggal(ts: bigint | string | number | undefined | null): string {
  if (!ts) return "-";
  try {
    let date: Date;
    if (typeof ts === 'string') {
      date = new Date(ts);
    } else {
      const ms = Number(typeof ts === 'bigint' ? ts / 1_000_000n : ts);
      if (ms === 0) return "-";
      date = new Date(ms);
    }
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return "-";
  }
}

function dateStringToOptBigint(dateStr: string): bigint | undefined {
  return dateStr ? BigInt(new Date(dateStr).getTime()) * 1_000_000n : undefined;
}

function bigintToDateString(ts: bigint): string {
  return ts ? new Date(Number(ts / 1_000_000n)).toISOString().split("T")[0] : "";
}

function parseTags(input: string): string[] {
  return input
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

// ─── Image Upload Widget ───────────────────────────────────────────────────────

interface ImageUploadWidgetProps {
  imageFile: File | null;
  existingImageUrl: string;
  uploadProgress: number;
  isUploading: boolean;
  error?: string;
  onFileSelect: (file: File | null) => void;
  onClearExisting: () => void;
}

function ImageUploadWidget({
  imageFile,
  existingImageUrl,
  uploadProgress,
  isUploading,
  error,
  onFileSelect,
  onClearExisting,
}: ImageUploadWidgetProps) {
  const fileRef = useRef<HTMLInputElement>(null);
  const previewUrl = imageFile ? URL.createObjectURL(imageFile) : null;
  const displayUrl = previewUrl ?? (existingImageUrl || null);

  return (
    <div>
      <Label className="text-sm font-medium">Gambar Sampul</Label>
      <div className="mt-1">
        {displayUrl ? (
          <div className="relative rounded-lg overflow-hidden border border-border">
            <img
              src={displayUrl}
              alt="Pratinjau gambar"
              className="w-full h-40 object-cover"
            />
            <button
              type="button"
              onClick={() => {
                onFileSelect(null);
                onClearExisting();
                if (fileRef.current) fileRef.current.value = "";
              }}
              className="absolute top-2 right-2 bg-background/80 hover:bg-background rounded-full p-1 border border-border transition-colors"
              aria-label="Hapus gambar"
              data-ocid="admin_berita.gambar_remove_button"
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
            className="w-full border-2 border-dashed border-border rounded-lg p-5 text-center cursor-pointer hover:border-primary/40 transition-colors"
            onClick={() => fileRef.current?.click()}
            data-ocid="admin_berita.gambar_upload_button"
          >
            {isUploading ? (
              <Loader2 className="w-6 h-6 text-muted-foreground mx-auto mb-1 animate-spin" />
            ) : (
              <ImageIcon className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
            )}
            <p className="text-xs text-muted-foreground">
              Klik untuk pilih gambar (JPG, PNG, WebP)
            </p>
          </button>
        )}

        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0] ?? null;
            onFileSelect(f);
          }}
          data-ocid="admin_berita.gambar_file_input"
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
              Mengunggah gambar... {uploadProgress}%
            </p>
          </div>
        )}

        {displayUrl && (
          <button
            type="button"
            className="mt-2 flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            onClick={() => fileRef.current?.click()}
            data-ocid="admin_berita.gambar_change_button"
          >
            <Upload className="w-3.5 h-3.5" />
            Ganti gambar
          </button>
        )}
      </div>
      {error && (
        <p
          className="text-xs text-accent mt-1"
          data-ocid="admin_berita.gambar.field_error"
        >
          {error}
        </p>
      )}
    </div>
  );
}

// ─── Main Component ────────────────────────────────────────────────────────────

export function AdminBerita() {
  const { isAdmin, grantedMenus } = usePermissions();
  const qc = useQueryClient();

  const { data: artikelList, isLoading, isError, refetch } = useBerita();
  const deleteBerita = useDeleteBerita();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [editAudit, setEditAudit] = useState<{
    createdBy: string;
    lastModifiedBy: string;
  }>({
    createdBy: "",
    lastModifiedBy: "",
  });
  const [form, setForm] = useState<BeritaFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [existingImageUrl, setExistingImageUrl] = useState<string>("");

  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<{
    id: string;
    judul: string;
  } | null>(null);

  function openCreate() {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditId(null);
    setEditAudit({ createdBy: "", lastModifiedBy: "" });
    setImageFile(null);
    setExistingImageUrl("");
    setUploadProgress(0);
    setShowForm(true);
  }

  function openEdit(
    id: string,
    artikel: {
      judul: string;
      author: string;
      konten: string;
      ringkasan?: string;
      gambar?: string;
      tags?: string[];
      status?: string;
      tanggalPublikasi?: bigint;
      createdBy?: string;
      lastModifiedBy?: string;
    },
  ) {
    setForm({
      judul: artikel.judul,
      author: artikel.author,
      konten: artikel.konten,
      ringkasan: artikel.ringkasan ?? "",
      tagsInput: (artikel.tags ?? []).join(", "),
      status: artikel.status ?? "Terbit",
      tanggalPublikasi: artikel.tanggalPublikasi
        ? bigintToDateString(artikel.tanggalPublikasi)
        : "",
    });
    setErrors({});
    setEditId(id);
    setEditAudit({
      createdBy: artikel.createdBy ?? "",
      lastModifiedBy: artikel.lastModifiedBy ?? "",
    });
    setImageFile(null);
    setExistingImageUrl(artikel.gambar ?? "");
    setUploadProgress(0);
    setShowForm(true);
  }

  function setField<K extends keyof BeritaFormState>(key: K, val: string) {
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
        author: form.author.trim(),
        konten: form.konten.trim(),
        ringkasan: form.ringkasan.trim(),
        gambar,
        tags: parseTags(form.tagsInput),
        status: form.status || "Terbit",
        tanggalPublikasi: form.tanggalPublikasi || undefined,
      };

      if (editId) {
        await api.berita.update(editId, input);
        toast.success("Artikel berhasil diperbarui");
      } else {
        await api.berita.add(input);
        toast.success("Artikel berhasil ditambahkan");
      }

      qc.invalidateQueries({ queryKey: ["berita"] });
      qc.invalidateQueries({ queryKey: ["statistik"] });
      setShowForm(false);
    } catch {
      toast.error("Gagal menyimpan artikel. Silakan coba lagi.");
    } finally {
      setSaving(false);
      setIsUploading(false);
      setUploadProgress(0);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteBerita.mutateAsync(id);
      toast.success("Artikel berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus artikel");
    } finally {
      setDeleteTarget(null);
    }
  }

  const isSavingOrUploading = saving || isUploading;

  return (
    <>
      <div className="container mx-auto px-4 py-6">
        {/* Page title + action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h1 className="font-display font-bold text-xl text-foreground">
            Kelola Berita
          </h1>
          <Button
            onClick={openCreate}
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 text-sm"
            data-ocid="admin_berita.tambah_button"
          >
            <Plus className="w-4 h-4" />
            Tambah Artikel
          </Button>
        </div>

        {isLoading ? (
          <SkeletonList count={4} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !artikelList || artikelList.length === 0 ? (
          <EmptyState
            title="Belum ada artikel berita"
            description="Publikasikan artikel berita atau pengumuman pertama Anda."
            actionLabel="Tambah Artikel"
            onAction={openCreate}
            data-ocid="admin_berita.empty_state"
          />
        ) : (
          <div className="space-y-3" data-ocid="admin_berita.artikel_list">
            {artikelList.map((artikel, idx) => {
              const artikelAny = artikel as typeof artikel & {
                status?: string;
                gambar?: string;
                createdBy?: string;
                lastModifiedBy?: string;
              };
              const artikelStatus = artikelAny.status;
              const artikelGambarUrl = artikelAny.gambar;
              const createdBy = artikelAny.createdBy ?? "";
              const lastModifiedBy = artikelAny.lastModifiedBy ?? "";
              return (
                <div
                  key={artikel.id}
                  className="bg-card border border-border rounded-lg p-4 flex items-center gap-4"
                  data-ocid={`admin_berita.artikel_item.${idx + 1}`}
                >
                  {/* Thumbnail */}
                  {artikelGambarUrl ? (
                    <img
                      src={artikelGambarUrl}
                      alt={artikel.judul}
                      className="w-14 h-14 rounded object-cover border border-border shrink-0 hidden sm:block"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded border border-border bg-muted flex items-center justify-center shrink-0 hidden sm:block">
                      <ImageIcon className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-medium text-foreground text-sm leading-snug line-clamp-1">
                        {artikel.judul}
                      </h3>
                      {artikelStatus && (
                        <Badge
                          variant={
                            artikelStatus === "Terbit" ? "default" : "secondary"
                          }
                          className={
                            artikelStatus === "Terbit"
                              ? "text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/10"
                              : "text-xs bg-muted text-muted-foreground"
                          }
                        >
                          {artikelStatus}
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 mt-1.5 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {formatTanggal(artikel.createdAt)}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="w-3 h-3" />
                        {artikel.author ?? "-"}
                      </span>
                      {artikel.tags && artikel.tags.length > 0 && (
                        <span className="flex items-center gap-1">
                          <Tag className="w-3 h-3" />
                          {artikel.tags.slice(0, 2).join(", ")}
                          {artikel.tags.length > 2 &&
                            ` +${artikel.tags.length - 2}`}
                        </span>
                      )}
                    </div>
                    {/* Audit trail row */}
                    <div className="flex flex-wrap gap-3 mt-1 text-xs text-muted-foreground">
                      <span
                        className="flex items-center gap-1"
                        title={createdBy || "—"}
                      >
                        <UserCheck className="w-3 h-3" />
                        Dibuat:{" "}
                        <span className="font-mono">
                          {createdBy ? truncatePrincipal(createdBy) : "—"}
                        </span>
                      </span>
                      {lastModifiedBy && (
                        <span
                          className="flex items-center gap-1"
                          title={lastModifiedBy}
                        >
                          Diubah:{" "}
                          <span className="font-mono">
                            {truncatePrincipal(lastModifiedBy)}
                          </span>
                        </span>
                      )}
                    </div>
                    {artikel.ringkasan && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {artikel.ringkasan}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 border border-border"
                      onClick={() =>
                        openEdit(String(artikel.id), {
                          judul: artikel.judul,
                          author: artikel.author,
                          konten: artikel.konten,
                          ringkasan: artikel.ringkasan,
                          gambar: artikelGambarUrl,
                          tags: artikel.tags,
                          status: artikelStatus,
                          tanggalPublikasi: undefined,
                          createdBy,
                          lastModifiedBy,
                        })
                      }
                      data-ocid={`admin_berita.edit_button.${idx + 1}`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 border border-border text-accent hover:text-accent hover:bg-accent/5"
                      onClick={() =>
                        setDeleteTarget({
                          id: String(artikel.id),
                          judul: artikel.judul,
                        })
                      }
                      data-ocid={`admin_berita.delete_button.${idx + 1}`}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Full Page Overlay */}
      {showForm && (
        <div className="fixed inset-0 lg:left-64 z-[40] bg-zinc-50 overflow-y-auto animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="max-w-4xl mx-auto px-4 py-8">
            <div className="flex items-center gap-4 mb-8">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => !isSavingOrUploading && setShowForm(false)}
                className="rounded-full hover:bg-zinc-200"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h2 className="font-display font-bold text-2xl text-foreground">
                  {editId ? "Edit Artikel" : "Tambah Artikel Baru"}
                </h2>
                <p className="text-sm text-muted-foreground mt-1">
                  {editId 
                    ? "Perbarui konten berita atau pengumuman Anda." 
                    : "Buat konten berita atau pengumuman untuk portal JDIH."}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Form (2/3) */}
              <div className="lg:col-span-2 space-y-6">
                <div className="bg-card border border-border rounded-xl p-6 shadow-subtle space-y-5">
                  {/* Judul */}
                  <div>
                    <Label htmlFor="berita-judul" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Judul Artikel <span className="text-accent">*</span>
                    </Label>
                    <Input
                      id="berita-judul"
                      value={form.judul}
                      onChange={(e) => setField("judul", e.target.value)}
                      placeholder="Masukkan judul artikel yang menarik..."
                      className="mt-2 text-lg font-semibold h-12"
                      data-ocid="admin_berita.judul_input"
                    />
                    {errors.judul && (
                      <p className="text-xs text-accent mt-1">{errors.judul}</p>
                    )}
                  </div>

                  {/* Ringkasan */}
                  <div>
                    <Label htmlFor="berita-ringkasan" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Ringkasan Singkat
                    </Label>
                    <Textarea
                      id="berita-ringkasan"
                      value={form.ringkasan}
                      onChange={(e) => setField("ringkasan", e.target.value)}
                      placeholder="Ringkasan muncul di daftar berita (opsional)..."
                      rows={3}
                      className="mt-2 text-sm resize-none"
                      data-ocid="admin_berita.ringkasan_textarea"
                    />
                  </div>

                  {/* Konten */}
                  <div>
                    <Label htmlFor="berita-konten" className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
                      Isi Konten <span className="text-accent">*</span>
                    </Label>
                    <div className="mt-2 bg-background border rounded-md overflow-hidden">
                      <ReactQuill
                        theme="snow"
                        value={form.konten}
                        onChange={(val) => setField("konten", val)}
                        className="h-80 mb-12"
                        placeholder="Tulis narasi lengkap berita di sini..."
                      />
                    </div>
                    {errors.konten && (
                      <p className="text-xs text-accent mt-1">{errors.konten}</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Sidebar Settings (1/3) */}
              <div className="space-y-6">
                {/* Meta Data */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-subtle space-y-5">
                  <h3 className="font-bold text-sm uppercase tracking-wider border-b pb-2 mb-4">Pengaturan Publikasi</h3>
                  
                  <div>
                    <Label htmlFor="berita-status" className="text-xs font-semibold text-muted-foreground">
                      Status
                    </Label>
                    <Select
                      value={form.status}
                      onValueChange={(val) => setField("status", val)}
                    >
                      <SelectTrigger id="berita-status" className="mt-1.5" data-ocid="admin_berita.status_select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Terbit">Terbit (Publik)</SelectItem>
                        <SelectItem value="Draf">Simpan Sebagai Draf</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="berita-author" className="text-xs font-semibold text-muted-foreground">
                      Penulis <span className="text-accent">*</span>
                    </Label>
                    <Input
                      id="berita-author"
                      value={form.author}
                      onChange={(e) => setField("author", e.target.value)}
                      placeholder="Nama admin / unit"
                      className="mt-1.5"
                    />
                    {errors.author && <p className="text-xs text-accent mt-1">{errors.author}</p>}
                  </div>

                  <div>
                    <Label htmlFor="berita-tanggal" className="text-xs font-semibold text-muted-foreground">
                      Tanggal Tayang
                    </Label>
                    <Input
                      id="berita-tanggal"
                      type="date"
                      value={form.tanggalPublikasi}
                      onChange={(e) => setField("tanggalPublikasi", e.target.value)}
                      className="mt-1.5"
                    />
                  </div>
                </div>

                {/* Media & Tags */}
                <div className="bg-card border border-border rounded-xl p-6 shadow-subtle space-y-5">
                  <h3 className="font-bold text-sm uppercase tracking-wider border-b pb-2 mb-4">Media & Label</h3>
                  
                  <ImageUploadWidget
                    imageFile={imageFile}
                    existingImageUrl={existingImageUrl}
                    uploadProgress={uploadProgress}
                    isUploading={isUploading}
                    error={errors.gambar}
                    onFileSelect={(f) => {
                      setImageFile(f);
                      setErrors((prev) => ({ ...prev, gambar: undefined }));
                    }}
                    onClearExisting={() => setExistingImageUrl("")}
                  />

                  <div>
                    <Label htmlFor="berita-tags" className="text-xs font-semibold text-muted-foreground">
                      Label / Tags
                    </Label>
                    <Input
                      id="berita-tags"
                      value={form.tagsInput}
                      onChange={(e) => setField("tagsInput", e.target.value)}
                      placeholder="kegiatan, pengumuman"
                      className="mt-1.5"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1 italic">* Pisahkan dengan koma</p>
                  </div>
                </div>

                {/* Info Audit */}
                {editId && (
                  <div className="bg-muted/30 border border-border rounded-xl p-4 space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase">Log Perubahan</p>
                    <div className="text-[11px] text-muted-foreground space-y-1">
                      <p>Dibuat: <span className="text-foreground font-mono">{truncatePrincipal(editAudit.createdBy)}</span></p>
                      {editAudit.lastModifiedBy && (
                        <p>Diubah: <span className="text-foreground font-mono">{truncatePrincipal(editAudit.lastModifiedBy)}</span></p>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-4">
                  <Button
                    onClick={handleSave}
                    disabled={isSavingOrUploading}
                    className="w-full bg-accent hover:bg-accent/90 text-accent-foreground h-11 font-bold"
                  >
                    {isSavingOrUploading && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                    {isUploading ? "Mengunggah..." : editId ? "Simpan Perubahan" : "Terbitkan Artikel"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => !isSavingOrUploading && setShowForm(false)}
                    disabled={isSavingOrUploading}
                    className="w-full"
                  >
                    Batal
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent data-ocid="admin_berita.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Artikel?</AlertDialogTitle>
            <AlertDialogDescription>
              Artikel <strong>{deleteTarget?.judul}</strong> akan dihapus secara
              permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="admin_berita.delete_cancel_button">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              data-ocid="admin_berita.delete_confirm_button"
            >
              {deleteBerita.isPending ? (
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
