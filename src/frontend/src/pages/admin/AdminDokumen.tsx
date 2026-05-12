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

import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CheckCircle,
  Clock,
  History,
  Loader2,
  MessageSquare,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Send,
  Trash2,
  Upload,
  UserCheck,
} from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import api, { getFileUrl } from "../../api";
import type { DokumenInput, backendInterface } from "../../backend.d";
import { StatusDokumen as StatusEnum } from "../../backend.d";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { KategoriTag } from "../../components/ui/KategoriTag";
import { SkeletonList } from "../../components/ui/LoadingSpinner";
import {
  StatusBadge,
  WorkflowStatusBadge,
} from "../../components/ui/StatusBadge";
import {
  useDeleteDokumen,
  useDokumenAdmin,
  useKategori,
  useStatus,
  usePublishDokumen,
  useReturnToDraft,
  useSubmitForReview,
} from "../../hooks/useBackend";
import { usePermissions } from "../../hooks/usePermissions";
import type { StatusDokumen, WorkflowStatus, WorkflowLog } from "../../types";
import { TAHUN_OPTIONS, WORKFLOW_STATUS_LABEL, STATUS_LABEL } from "../../types";
import { X, Badge, Download } from "lucide-react";
import * as XLSX from "xlsx";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function truncatePrincipal(principal: string | number | null | undefined): string {
  if (!principal) return "-";
  const str = String(principal);
  if (str.length <= 12) return str;
  return `${str.slice(0, 12)}...`;
}

// ─── Form State ───────────────────────────────────────────────────────────────

interface DokumenFormState {
  judul: string;
  nomor: string;
  kategoriId: string;
  tahun: string;
  tanggalPenetapan: string;
  tanggalPengundangan: string;
  relasiHukum: string;
  status: StatusDokumen;
  abstrak: string;
  tags: string;
  file: File | null;
  relatedDocs: Array<{ target_id: number; tipe_relasi: string; judul?: string }>;
  pesanPerubahan: string;
}

export const EMPTY_FORM: DokumenFormState = {
  judul: "",
  nomor: "",
  kategoriId: "",
  tahun: String(new Date().getFullYear()),
  tanggalPenetapan: "",
  tanggalPengundangan: "",
  relasiHukum: "",
  status: "Berlaku",
  abstrak: "",
  tags: "",
  file: null,
  relatedDocs: [],
  pesanPerubahan: "",
};

interface FormErrors {
  judul?: string;
  nomor?: string;
  kategoriId?: string;
  tanggalPenetapan?: string;
  abstrak?: string;
  file?: string;
}

function validate(form: DokumenFormState, isEdit: boolean): FormErrors {
  const errs: FormErrors = {};
  if (!form.judul.trim()) errs.judul = "Judul wajib diisi";
  if (!form.nomor.trim()) errs.nomor = "Nomor dokumen wajib diisi";
  if (!form.kategoriId) errs.kategoriId = "Pilih kategori";
  if (!form.tanggalPenetapan)
    errs.tanggalPenetapan = "Tanggal penetapan wajib diisi";
  if (!form.abstrak.trim()) errs.abstrak = "Abstrak wajib diisi";
  if (!isEdit && !form.file) errs.file = "File PDF wajib diunggah";
  return errs;
}

// ─── Workflow Filter Options ──────────────────────────────────────────────────

const WORKFLOW_FILTER_OPTIONS: Array<{
  value: WorkflowStatus | "all";
  label: string;
}> = [
    { value: "all", label: "Semua Status Alur" },
    { value: "Draft", label: WORKFLOW_STATUS_LABEL.Draft },
    { value: "PendingReview", label: WORKFLOW_STATUS_LABEL.PendingReview },
    { value: "Published", label: WORKFLOW_STATUS_LABEL.Published },
    { value: "Archived", label: WORKFLOW_STATUS_LABEL.Archived },
  ];

// ─── Return To Draft Sub-form ─────────────────────────────────────────────────

interface ReturnToDraftFormProps {
  docId: string;
  onClose: () => void;
}

function ReturnToDraftForm({ docId, onClose }: ReturnToDraftFormProps) {
  const [catatan, setCatatan] = useState("");
  const returnToDraft = useReturnToDraft();

  async function handleSubmit() {
    if (!catatan.trim()) {
      toast.error("Catatan koreksi wajib diisi");
      return;
    }
    try {
      await returnToDraft.mutateAsync({ id: docId, catatan: catatan.trim() });
      toast.success("Dokumen dikembalikan ke Draf");
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengembalikan ke draf",
      );
    }
  }

  return (
    <div
      className="mt-2 rounded-lg border border-yellow-300 bg-yellow-50 p-3 space-y-2"
      data-ocid="admin_dokumen.return_draft_form"
    >
      <p className="text-xs font-semibold text-yellow-800">
        Catatan Koreksi untuk Operator
      </p>
      <Textarea
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
        placeholder="Tuliskan alasan pengembalian atau koreksi yang perlu diperbaiki..."
        rows={3}
        className="text-xs resize-none border-yellow-300 focus:border-yellow-500"
        data-ocid="admin_dokumen.catatan_koreksi_textarea"
      />
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={returnToDraft.isPending}
          className="text-xs h-7"
          data-ocid="admin_dokumen.return_draft_cancel_button"
        >
          Batal
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={returnToDraft.isPending || !catatan.trim()}
          className="text-xs h-7 bg-yellow-600 hover:bg-yellow-700 text-white"
          data-ocid="admin_dokumen.return_draft_confirm_button"
        >
          {returnToDraft.isPending ? (
            <Loader2 className="w-3 h-3 animate-spin mr-1" />
          ) : null}
          Kembalikan ke Draf
        </Button>
      </div>
    </div>
  );
}

// ─── Workflow Action Buttons ──────────────────────────────────────────────────

interface WorkflowActionsProps {
  docId: string | number;
  workflowStatus: WorkflowStatus;
  canReview: boolean;
  idx: number;
}

function WorkflowActions({
  docId,
  workflowStatus,
  canReview,
  idx,
}: WorkflowActionsProps) {
  const [showReturnForm, setShowReturnForm] = useState(false);
  const submitForReview = useSubmitForReview();
  const publishDokumen = usePublishDokumen();

  if (workflowStatus === "Published") return null;

  if (workflowStatus === "Draft") {
    return (
      <div className="mt-2">
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7 border-foreground/30 gap-1.5"
          disabled={submitForReview.isPending}
          onClick={async () => {
            try {
              await submitForReview.mutateAsync(String(docId));
              toast.success("Dokumen diajukan untuk review");
            } catch (err) {
              toast.error(
                err instanceof Error
                  ? err.message
                  : "Gagal mengajukan untuk review",
              );
            }
          }}
          data-ocid={`admin_dokumen.ajukan_review_button.${idx}`}
        >
          {submitForReview.isPending ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Send className="w-3 h-3" />
          )}
          Ajukan Review
        </Button>
      </div>
    );
  }

  if (workflowStatus === "PendingReview") {
    if (!canReview) {
      return (
        <div className="mt-2">
          <span
            className="inline-flex items-center gap-1.5 text-xs text-yellow-700 bg-yellow-50 border border-yellow-200 rounded px-2 py-1"
            data-ocid={`admin_dokumen.menunggu_persetujuan.${idx}`}
          >
            <Clock className="w-3 h-3" />
            Menunggu Persetujuan Super Admin
          </span>
        </div>
      );
    }

    return (
      <div className="mt-2 space-y-2">
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            className="text-xs h-7 bg-green-600 hover:bg-green-700 text-white gap-1.5"
            disabled={publishDokumen.isPending}
            onClick={async () => {
              try {
                await publishDokumen.mutateAsync(String(docId));
                toast.success("Dokumen berhasil diterbitkan");
              } catch (err) {
                toast.error(
                  err instanceof Error
                    ? err.message
                    : "Gagal menerbitkan dokumen",
                );
              }
            }}
            data-ocid={`admin_dokumen.terbitkan_button.${idx}`}
          >
            {publishDokumen.isPending ? (
              <Loader2 className="w-3 h-3 animate-spin" />
            ) : (
              <CheckCircle className="w-3 h-3" />
            )}
            Terbitkan
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-xs h-7 border-yellow-400 text-yellow-700 hover:bg-yellow-50 gap-1.5"
            onClick={() => setShowReturnForm((v) => !v)}
            data-ocid={`admin_dokumen.kembalikan_draft_button.${idx}`}
          >
            <RotateCcw className="w-3 h-3" />
            Kembalikan ke Draf
          </Button>
        </div>
        {showReturnForm && (
          <ReturnToDraftForm
            docId={String(docId)}
            onClose={() => setShowReturnForm(false)}
          />
        )}
      </div>
    );
  }

  return null;
}

// ─── Workflow History Component ──────────────────────────────────────────────

function WorkflowHistory({ dokumenId }: { dokumenId: string | number }) {
  const { data: logs, isLoading } = useQuery({
    queryKey: ['dokumenLogs', dokumenId],
    queryFn: () => api.dokumen.logs(dokumenId),
    enabled: !!dokumenId
  });

  if (isLoading) return <div className="animate-pulse h-20 bg-muted rounded-lg" />;
  if (!logs || logs.length === 0) return (
    <div className="text-center py-6 border border-dashed rounded-lg">
      <p className="text-xs text-muted-foreground">Belum ada riwayat aktivitas untuk dokumen ini.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {logs.map((log, i) => (
        <div key={log.id} className="relative pl-6 pb-4 last:pb-0 border-l border-border last:border-0 ml-2">
          {/* Timeline dot */}
          <div className="absolute left-[-5px] top-1 w-2.5 h-2.5 rounded-full bg-accent ring-4 ring-background" />

          <div className="bg-muted/30 rounded-lg p-3 border border-border/50">
            <div className="flex items-center justify-between mb-1">
              <span className="text-[10px] font-bold uppercase tracking-wider text-accent">
                {log.action}
              </span>
              <span className="text-[10px] text-muted-foreground">
                {new Date(log.created_at).toLocaleString('id-ID')}
              </span>
            </div>

            {log.message && (
              <p className="text-xs text-foreground mb-2 italic">
                "{log.message}"
              </p>
            )}

            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-border/30">
              <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center text-[10px] font-bold text-accent">
                {log.user_nama?.[0] || 'U'}
              </div>
              <span className="text-[10px] font-medium text-muted-foreground">
                {log.user_nama} • <span className="uppercase">{log.user_role}</span>
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
// ─── Relation Selector Component ──────────────────────────────────────────────

function RelationSelector({
  onAdd
}: {
  onAdd: (doc: { id: number; judul: string; nomor: string }) => void
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  async function handleSearch() {
    if (!query.trim()) return;
    setLoading(true);
    try {
      const data = await api.dokumen.listAdmin({ query: query.trim() });
      setResults(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2 border border-border rounded-lg p-3 bg-muted/20">
      <div className="flex gap-2">
        <Input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Cari judul/nomor dokumen..."
          className="h-8 text-xs"
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
        />
        <Button size="sm" className="h-8 px-3 text-xs" onClick={handleSearch} disabled={loading}>
          {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : 'Cari'}
        </Button>
      </div>
      {results.length > 0 && (
        <div className="max-h-40 overflow-y-auto border border-border rounded bg-background">
          {results.map(r => (
            <button
              key={r.id}
              type="button"
              className="w-full text-left p-2 hover:bg-muted text-xs border-b last:border-0 border-border"
              onClick={() => {
                onAdd({ id: r.id, judul: r.judul, nomor: r.nomor });
                setResults([]);
                setQuery("");
              }}
            >
              <div className="font-bold">{r.nomor}</div>
              <div className="truncate">{r.judul}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminDokumen() {
  const qc = useQueryClient();
  const { isAdmin, grantedMenus, can } = usePermissions();

  const [search, setSearch] = useState("");
  const [workflowFilter, setWorkflowFilter] = useState<WorkflowStatus | "all">("all");
  const [kategoriFilter, setKategoriFilter] = useState<string>("all");

  const hasActiveFilter = workflowFilter !== "all" || kategoriFilter !== "all" || search.trim() !== "";

  function resetFilters() {
    setSearch("");
    setWorkflowFilter("all");
    setKategoriFilter("all");
  }

  const {
    data: dokumen,
    isLoading,
    isError,
    refetch,
  } = useDokumenAdmin({
    query: search,
    workflowStatus: workflowFilter === "all" ? undefined : workflowFilter,
    kategoriId: kategoriFilter === "all" ? undefined : Number(kategoriFilter),
  });
  const { data: kategoriList } = useKategori();
  const { data: statusList } = useStatus();
  const deleteDokumen = useDeleteDokumen();

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | number | null>(null);
  const [editAudit, setEditAudit] = useState({
    createdBy: "",
    lastModifiedBy: "",
  });
  const [editCatatanKoreksi, setEditCatatanKoreksi] = useState("");
  const [form, setForm] = useState<DokumenFormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FormErrors>({});
  const [saving, setSaving] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: string | number;
    judul: string;
  } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  function openCreate() {
    setForm(EMPTY_FORM);
    setErrors({});
    setEditId(null);
    setEditAudit({ createdBy: "", lastModifiedBy: "" });
    setEditCatatanKoreksi("");
    setShowForm(true);
  }

  function openEdit(doc: {
    id: string | number;
    judul: string;
    nomor: string;
    kategoriId: string | number;
    tahun: number;
    tanggalPenetapan: string;
    tanggalPengundangan?: string | number | null;
    relasiHukum?: string | null;
    status: StatusDokumen;
    abstrak: string;
    tag?: string[];
    catatanKoreksi?: string;
    createdBy?: string;
    lastModifiedBy?: string;
  }) {
    // Parse tanggalPengundangan safely directly to string (handling both DB ISO string and old timestamp format)
    let tglPengundangan = "";
    if (doc.tanggalPengundangan != null) {
      const d = new Date(doc.tanggalPengundangan);
      if (!isNaN(d.getTime())) {
        tglPengundangan = d.toISOString().slice(0, 10);
      }
    }
    setForm({
      judul: doc.judul,
      nomor: doc.nomor,
      kategoriId: String(doc.kategoriId),
      tahun: String(doc.tahun),
      tanggalPenetapan: doc.tanggalPenetapan,
      tanggalPengundangan: tglPengundangan,
      relasiHukum: doc.relasiHukum ?? "",
      status: doc.status,
      abstrak: doc.abstrak,
      tags: (doc.tag ?? []).join(", "),
      file: null,
      relatedDocs: (doc as any).relations ? (doc as any).relations.filter((r: any) => r.arah === 'outbound').map((r: any) => ({
        target_id: r.id,
        tipe_relasi: r.tipe_relasi,
        judul: r.judul
      })) : [],
      pesanPerubahan: "",
    });
    setErrors({});
    setEditId(doc.id);
    setEditAudit({
      createdBy: doc.createdBy ?? "",
      lastModifiedBy: doc.lastModifiedBy ?? "",
    });
    setEditCatatanKoreksi(doc.catatanKoreksi ?? "");
    setShowForm(true);
  }

  function setField<K extends keyof DokumenFormState>(
    key: K,
    val: DokumenFormState[K],
  ) {
    setForm((prev) => ({ ...prev, [key]: val }));
    if (errors[key as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [key]: undefined }));
    }
  }

  async function handleSave() {
    const errs = validate(form, !!editId);
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    setSaving(true);
    setUploadProgress(0); // Fake progress if needed or just 0
    try {
      const tagsArr = form.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

      const input = {
        judul: form.judul.trim(),
        nomor: form.nomor.trim(),
        kategoriId: Number(form.kategoriId),
        tahun: Number(form.tahun),
        tanggalPenetapan: form.tanggalPenetapan,
        tanggalPengundangan: form.tanggalPengundangan || undefined,
        relasiHukum: form.relasiHukum.trim() || undefined,
        status: form.status,
        abstrak: form.abstrak.trim(),
        tag: tagsArr,
        filePdf: form.file || undefined,
        relatedDocs: form.relatedDocs,
        pesanPerubahan: form.pesanPerubahan.trim() || undefined,
      };

      if (editId) {
        await api.dokumen.update(String(editId), input as any);
        toast.success("Dokumen berhasil diperbarui. Status dikembalikan ke Draf untuk verifikasi ulang.");
      } else {
        if (!form.file) return;
        await api.dokumen.add(input as any);
        toast.success("Dokumen berhasil ditambahkan");
      }

      qc.invalidateQueries({ queryKey: ["dokumen"] });
      qc.invalidateQueries({ queryKey: ["dokumenAdmin"] });
      qc.invalidateQueries({ queryKey: ["statistik"] });
      setShowForm(false);
    } catch (err) {
      console.error(err);
      toast.error("Gagal menyimpan dokumen. Silakan coba lagi.");
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  }

  async function handleDelete(id: string | number) {
    try {
      await deleteDokumen.mutateAsync(String(id));
      toast.success("Dokumen berhasil dihapus");
    } catch {
      toast.error("Gagal menghapus dokumen");
    } finally {
      setDeleteTarget(null);
    }
  }

  function handleExportExcel() {
    if (!dokumen || dokumen.length === 0) {
      toast.error("Tidak ada data untuk diekspor");
      return;
    }

    // Siapkan data untuk diekspor
    const exportData = dokumen.map((doc: any, index: number) => ({
      "No": index + 1,
      "Judul Dokumen": doc.judul,
      "Nomor": doc.nomor,
      "Tahun": doc.tahun,
      "Kategori": doc.kategoriNama || "-",
      "Status Berlakunya": doc.status,
      "Status Verifikasi (Alur)": doc.workflowStatus || "Draft",
      "Tanggal Penetapan": doc.tanggalPenetapan ? new Date(doc.tanggalPenetapan).toLocaleDateString("id-ID") : "-",
      "Tanggal Pengundangan": doc.tanggalPengundangan ? new Date(doc.tanggalPengundangan).toLocaleDateString("id-ID") : "-",
      "Abstrak": doc.abstrak || "-",
      "Tags": (doc.tag || []).join(", "),
      "Diunggah Oleh": doc.submittedByNama || "-",
      "Diverifikasi Oleh": doc.reviewedByNama || "-",
      "Diunduh (kali)": doc.downloadCount || 0
    }));

    // Buat worksheet dan workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Dokumen");

    // Sesuaikan lebar kolom
    const wscols = [
      { wch: 5 }, { wch: 40 }, { wch: 25 }, { wch: 8 }, { wch: 20 },
      { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 30 },
      { wch: 20 }, { wch: 20 }, { wch: 20 }, { wch: 10 }
    ];
    worksheet['!cols'] = wscols;

    // Generate file
    XLSX.writeFile(workbook, `Laporan_Dokumen_JDIH_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Berhasil mengekspor data ke Excel!");
  }

  return (
    <>
      <div className={`container mx-auto px-4 py-6 transition-all ${showForm ? "hidden" : "block"}`}>
        {/* Page title + action */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <h1 className="font-display font-bold text-xl text-foreground">
            Kelola Dokumen
          </h1>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleExportExcel}
              className="gap-2 text-sm border-green-500 text-green-700 hover:bg-green-50 hover:text-green-800 hover:border-green-600 shadow-sm"
              data-ocid="admin_dokumen.export_excel_button"
            >
              <Download className="w-4 h-4" />
              Ekspor Excel
            </Button>
            {can('dokumen:create') && (
              <Button
                onClick={openCreate}
                className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 text-sm shadow-sm"
                data-ocid="admin_dokumen.tambah_button"
              >
                <Plus className="w-4 h-4" />
                Tambah Dokumen
              </Button>
            )}
          </div>
        </div>

        {/* Search + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-5 flex-wrap">
          {/* Search */}
          <div className="relative flex-1 min-w-[180px] max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Cari dokumen..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 text-sm"
              data-ocid="admin_dokumen.search_input"
            />
          </div>

          {/* Filter Kategori */}
          <Select
            value={kategoriFilter}
            onValueChange={(v) => setKategoriFilter(v)}
          >
            <SelectTrigger
              className="w-[190px] text-sm"
              data-ocid="admin_dokumen.kategori_filter_select"
            >
              <SelectValue placeholder="Semua Kategori" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Semua Kategori</SelectItem>
              {(kategoriList ?? []).map((k) => (
                <SelectItem key={k.id} value={String(k.id)}>
                  {k.nama}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Filter Workflow Status */}
          <Select
            value={workflowFilter}
            onValueChange={(v) => setWorkflowFilter(v as WorkflowStatus | "all")}
          >
            <SelectTrigger
              className="w-[200px] text-sm"
              data-ocid="admin_dokumen.workflow_filter_select"
            >
              <SelectValue placeholder="Semua Status Alur" />
            </SelectTrigger>
            <SelectContent>
              {WORKFLOW_FILTER_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Reset button — only shown when filter active */}
          {hasActiveFilter && (
            <Button
              variant="outline"
              size="sm"
              onClick={resetFilters}
              className="h-9 px-3 text-xs gap-1.5 text-muted-foreground hover:text-foreground border-dashed"
              data-ocid="admin_dokumen.reset_filter_button"
            >
              <X className="w-3.5 h-3.5" />
              Reset Filter
            </Button>
          )}
        </div>

        {isLoading ? (
          <SkeletonList count={5} />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !dokumen || dokumen.length === 0 ? (
          <EmptyState
            title="Belum ada dokumen"
            description="Tambahkan dokumen hukum pertama Anda."
            actionLabel={can('dokumen:create') ? "Tambah Dokumen" : undefined}
            onAction={can('dokumen:create') ? openCreate : undefined}
            data-ocid="admin_dokumen.empty_state"
          />
        ) : (
          <div className="space-y-3" data-ocid="admin_dokumen.dokumen_list">
            {dokumen.map((doc, idx) => {
              const docAny = doc as typeof doc & {
                createdBy?: string;
                lastModifiedBy?: string;
                catatanKoreksi?: string;
                workflowStatus?: WorkflowStatus;
              };
              const createdBy = docAny.createdBy ?? "";
              const lastModifiedBy = docAny.lastModifiedBy ?? "";
              const catatanKoreksi = docAny.catatanKoreksi ?? "";
              const workflowStatus: WorkflowStatus =
                docAny.workflowStatus ?? "Draft";

              return (
                <div
                  key={doc.id}
                  className="bg-card border border-border rounded-lg p-4"
                  data-ocid={`admin_dokumen.dokumen_item.${idx + 1}`}
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Badges row */}
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        <KategoriTag nama={doc.kategoriNama ?? "-"} />
                        <StatusBadge status={doc.status} />
                        <WorkflowStatusBadge status={workflowStatus} />
                      </div>
                      <h3 className="font-medium text-foreground text-sm leading-snug truncate">
                        {doc.judul}
                      </h3>
                      <p className="text-muted-foreground text-xs mt-0.5">
                        {doc.nomor} · {doc.tahun}
                      </p>
                      {/* Audit trail row */}
                      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-[10px] text-muted-foreground uppercase font-bold tracking-tight">
                        <span className="flex items-center gap-1">
                          <span className="text-muted-foreground/60">Oleh:</span>
                          <span className="text-foreground">{doc.submittedByNama || 'Sistem'}</span>
                        </span>
                        {doc.reviewedByNama && (
                          <span className="flex items-center gap-1">
                            <span className="text-muted-foreground/60">Diverifikasi:</span>
                            <span className="text-green-600 font-black">{doc.reviewedByNama}</span>
                          </span>
                        )}
                      </div>

                      {/* Workflow action area */}
                      <WorkflowActions
                        docId={doc.id}
                        workflowStatus={workflowStatus}
                        canReview={can('dokumen:review')}
                        idx={idx + 1}
                      />
                    </div>

                    {/* CRUD action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {can('dokumen:edit') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 border border-border"
                          onClick={() =>
                            openEdit({
                              ...doc,
                              tanggalPenetapan: doc.tanggalPenetapan ?? "",
                              tanggalPengundangan: doc.tanggalPengundangan,
                              tag: (doc as any).tag,
                              catatanKoreksi,
                              createdBy,
                              lastModifiedBy,
                            })
                          }
                          data-ocid={`admin_dokumen.edit_button.${idx + 1}`}
                        >
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {/* Tombol Download PDF */}
                      {doc.filePdf ? (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 border border-border text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          title="Download PDF"
                          onClick={async () => {
                            try {
                              await api.dokumen.download(doc.id);
                            } catch { /* ignore counter error */ }
                            window.open(getFileUrl(doc.filePdf), '_blank');
                          }}
                          data-ocid={`admin_dokumen.download_button.${idx + 1}`}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 border border-border opacity-30 cursor-not-allowed"
                          title="Tidak ada file PDF"
                          disabled
                          data-ocid={`admin_dokumen.download_button_disabled.${idx + 1}`}
                        >
                          <Download className="w-3.5 h-3.5" />
                        </Button>
                      )}
                      {can('dokumen:delete') && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 border border-border text-accent hover:text-accent hover:bg-accent/5"
                          onClick={() =>
                            setDeleteTarget({ id: doc.id, judul: doc.judul })
                          }
                          data-ocid={`admin_dokumen.delete_button.${idx + 1}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>

                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Form Inline Full Screen Overlay */}
      {showForm && (
        <div className="fixed inset-0 lg:left-64 z-[40] bg-zinc-50 overflow-y-auto px-4 py-8 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center gap-4 mb-6">
              <Button
                variant="outline"
                onClick={() => !saving && setShowForm(false)}
                disabled={saving}
              >
                Kembali
              </Button>
              <h1 className="font-display font-bold text-2xl text-foreground">
                {editId ? "Edit Dokumen" : "Tambah Dokumen"}
              </h1>
            </div>

            <div className="bg-card border border-border rounded-xl p-6 shadow-sm">
              <div className="space-y-6">
                {/* Catatan Koreksi (read-only, shown if not empty) */}
                {editId && editCatatanKoreksi && (
                  <div
                    className="rounded-lg border border-yellow-300 bg-yellow-50 p-3"
                    data-ocid="admin_dokumen.catatan_koreksi_panel"
                  >
                    <p className="text-xs font-semibold text-yellow-800 mb-1">
                      Catatan Koreksi dari Super Admin
                    </p>
                    <p className="text-xs text-yellow-700 whitespace-pre-wrap">
                      {editCatatanKoreksi}
                    </p>
                  </div>
                )}

                {/* Judul */}
                <div>
                  <Label htmlFor="dok-judul" className="text-sm font-medium">
                    Judul <span className="text-accent">*</span>
                  </Label>
                  <Input
                    id="dok-judul"
                    value={form.judul}
                    onChange={(e) => setField("judul", e.target.value)}
                    placeholder="Masukkan judul dokumen"
                    className="mt-1 text-sm"
                    data-ocid="admin_dokumen.judul_input"
                  />
                  {errors.judul && (
                    <p
                      className="text-xs text-accent mt-1"
                      data-ocid="admin_dokumen.judul.field_error"
                    >
                      {errors.judul}
                    </p>
                  )}
                </div>

                {/* Nomor */}
                <div>
                  <Label htmlFor="dok-nomor" className="text-sm font-medium">
                    Nomor Dokumen <span className="text-accent">*</span>
                  </Label>
                  <Input
                    id="dok-nomor"
                    value={form.nomor}
                    onChange={(e) => setField("nomor", e.target.value)}
                    placeholder="cth. SK/001/UNTAG-BWI/2024"
                    className="mt-1 text-sm"
                    data-ocid="admin_dokumen.nomor_input"
                  />
                  {errors.nomor && (
                    <p
                      className="text-xs text-accent mt-1"
                      data-ocid="admin_dokumen.nomor.field_error"
                    >
                      {errors.nomor}
                    </p>
                  )}
                </div>

                {/* Kategori & Tahun */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-sm font-medium">
                      Kategori <span className="text-accent">*</span>
                    </Label>
                    <Select
                      value={form.kategoriId}
                      onValueChange={(v) => setField("kategoriId", v)}
                    >
                      <SelectTrigger
                        className="mt-1 text-sm"
                        data-ocid="admin_dokumen.kategori_select"
                      >
                        <SelectValue placeholder="Pilih kategori" />
                      </SelectTrigger>
                      <SelectContent>
                        {(kategoriList ?? []).map((k) => (
                          <SelectItem key={k.id} value={String(k.id)}>
                            {k.nama}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.kategoriId && (
                      <p
                        className="text-xs text-accent mt-1"
                        data-ocid="admin_dokumen.kategori.field_error"
                      >
                        {errors.kategoriId}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Tahun</Label>
                    <Select
                      value={form.tahun}
                      onValueChange={(v) => setField("tahun", v)}
                    >
                      <SelectTrigger
                        className="mt-1 text-sm"
                        data-ocid="admin_dokumen.tahun_select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {TAHUN_OPTIONS.map((y) => (
                          <SelectItem key={String(y)} value={String(y)}>
                            {y}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Tanggal & Status */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="dok-tgl" className="text-sm font-medium">
                      Tanggal Penetapan <span className="text-accent">*</span>
                    </Label>
                    <Input
                      id="dok-tgl"
                      type="date"
                      value={form.tanggalPenetapan}
                      onChange={(e) => setField("tanggalPenetapan", e.target.value)}
                      className="mt-1 text-sm"
                      data-ocid="admin_dokumen.tanggal_input"
                    />
                    {errors.tanggalPenetapan && (
                      <p
                        className="text-xs text-accent mt-1"
                        data-ocid="admin_dokumen.tanggal.field_error"
                      >
                        {errors.tanggalPenetapan}
                      </p>
                    )}
                  </div>

                  <div>
                    <Label className="text-sm font-medium">Status Keberlakuan Utama</Label>
                    <Select
                      value={form.status}
                      onValueChange={(v) => setField("status", v as StatusDokumen)}
                    >
                      <SelectTrigger
                        className="mt-1 text-sm font-semibold text-accent"
                        data-ocid="admin_dokumen.status_select"
                      >
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {(statusList ?? []).map((st) => (
                          <SelectItem key={st.id} value={st.nama}>{st.nama}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Simlink / Dokumen Terkait Section */}
                <div className="rounded-xl border border-border bg-muted/10 p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-bold flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-accent" />
                      Simlink: Hubungkan dengan Dokumen Lain <span className="text-muted-foreground font-normal text-xs">(opsional)</span>
                    </Label>
                  </div>

                  {form.relatedDocs.length > 0 && (
                    <div className="space-y-2">
                      {form.relatedDocs.map((rel, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-card border border-border rounded-lg shadow-sm animate-in fade-in zoom-in-95 duration-200">
                          <Select
                            value={rel.tipe_relasi}
                            onValueChange={v => {
                              const newRels = [...form.relatedDocs];
                              newRels[idx].tipe_relasi = v;
                              setField('relatedDocs', newRels);
                            }}
                          >
                            <SelectTrigger className="w-32 h-8 text-xs font-bold uppercase">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Mencabut">Mencabut</SelectItem>
                              <SelectItem value="Mengubah">Mengubah</SelectItem>
                              <SelectItem value="Menjabarkan">Menjabarkan</SelectItem>
                            </SelectContent>
                          </Select>

                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-foreground truncate">{rel.judul}</p>
                          </div>

                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-accent hover:bg-accent/5"
                            onClick={() => {
                              const newRels = form.relatedDocs.filter((_, i) => i !== idx);
                              setField('relatedDocs', newRels);
                            }}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  <RelationSelector
                    onAdd={(doc) => {
                      if (form.relatedDocs.some(r => r.target_id === doc.id)) {
                        toast.error("Dokumen sudah ada dalam daftar relasi");
                        return;
                      }
                      const newRel = { target_id: doc.id, tipe_relasi: 'Mencabut', judul: doc.judul };
                      setField('relatedDocs', [...form.relatedDocs, newRel]);
                    }}
                  />
                  <p className="text-[10px] text-muted-foreground italic">
                    * Simlink memungkinkan JDIH menghubungkan riwayat hukum secara otomatis antar peraturan.
                  </p>
                </div>

                {/* Tanggal Pengundangan */}
                <div>
                  <Label
                    htmlFor="dok-tgl-pengundangan"
                    className="text-sm font-medium"
                  >
                    Tanggal Pengundangan{" "}
                    <span className="text-muted-foreground font-normal">
                      (opsional)
                    </span>
                  </Label>
                  <Input
                    id="dok-tgl-pengundangan"
                    type="date"
                    value={form.tanggalPengundangan}
                    onChange={(e) =>
                      setField("tanggalPengundangan", e.target.value)
                    }
                    className="mt-1 text-sm"
                    data-ocid="admin_dokumen.tanggal_pengundangan_input"
                  />
                </div>

                {/* Relasi Hukum */}
                <div>
                  <Label htmlFor="dok-relasi-hukum" className="text-sm font-medium">
                    Relasi Dengan Produk Hukum Lain{" "}
                    <span className="text-muted-foreground font-normal">
                      (opsional)
                    </span>
                  </Label>
                  <Textarea
                    id="dok-relasi-hukum"
                    value={form.relasiHukum}
                    onChange={(e) => setField("relasiHukum", e.target.value)}
                    placeholder="Contoh: Mencabut Peraturan Rektor No. 5 Tahun 2018"
                    rows={2}
                    className="mt-1 text-sm resize-none"
                    data-ocid="admin_dokumen.relasi_hukum_textarea"
                  />
                </div>

                {/* Abstrak */}
                <div>
                  <Label htmlFor="dok-abstrak" className="text-sm font-medium">
                    Abstrak <span className="text-accent">*</span>
                  </Label>
                  <div className="mt-2 bg-background">
                    <ReactQuill
                      theme="snow"
                      value={form.abstrak}
                      onChange={(val) => setField("abstrak", val)}
                      className="h-64 mb-12"
                      placeholder="Tuliskan abstrak atau ringkasan dokumen..."
                    />
                  </div>
                  {errors.abstrak && (
                    <p
                      className="text-xs text-accent mt-1"
                      data-ocid="admin_dokumen.abstrak.field_error"
                    >
                      {errors.abstrak}
                    </p>
                  )}
                </div>

                {/* Tags */}
                <div>
                  <Label htmlFor="dok-tags" className="text-sm font-medium">
                    Tag (pisahkan dengan koma)
                  </Label>
                  <Input
                    id="dok-tags"
                    value={form.tags}
                    onChange={(e) => setField("tags", e.target.value)}
                    placeholder="cth. statuta, akademik, 2024"
                    className="mt-1 text-sm"
                    data-ocid="admin_dokumen.tags_input"
                  />
                </div>

                {/* File Upload */}
                <div>
                  <Label className="text-sm font-medium">
                    File PDF {!editId && <span className="text-accent">*</span>}
                    {editId && (
                      <span className="text-muted-foreground font-normal">
                        {" "}
                        (kosongkan jika tidak mengubah)
                      </span>
                    )}
                  </Label>
                  <button
                    type="button"
                    className="mt-1 w-full border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/40 transition-colors"
                    onClick={() => fileRef.current?.click()}
                    data-ocid="admin_dokumen.upload_button"
                  >
                    <Upload className="w-5 h-5 text-muted-foreground mx-auto mb-2" />
                    {form.file ? (
                      <p className="text-sm text-foreground font-medium">
                        {form.file.name}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground">
                        Klik untuk pilih file PDF
                      </p>
                    )}
                  </button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      setField("file", f);
                    }}
                    data-ocid="admin_dokumen.file_input"
                  />
                  {errors.file && (
                    <p
                      className="text-xs text-accent mt-1"
                      data-ocid="admin_dokumen.file.field_error"
                    >
                      {errors.file}
                    </p>
                  )}
                  {saving && uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary rounded-full transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Mengunggah... {uploadProgress}%
                      </p>
                    </div>
                  )}
                </div>

                {/* Edit Mode: Pesan Perubahan & Peringatan Draft */}
                {editId && (
                  <div className="space-y-4">
                    {/* Warning Banner */}
                    <div className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50 p-4">
                      <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-amber-800">Perhatian: Perubahan Memerlukan Verifikasi Ulang</p>
                        <p className="text-xs text-amber-700 mt-1 leading-relaxed">
                          Menyimpan perubahan pada dokumen ini akan mengubah statusnya kembali menjadi <strong>Draf</strong>.
                          Dokumen perlu diajukan untuk review dan diverifikasi ulang oleh Verifikator / Super Admin sebelum dapat diterbitkan kembali.
                        </p>
                      </div>
                    </div>

                    {/* Pesan Perubahan */}
                    <div>
                      <Label htmlFor="dok-pesan-perubahan" className="text-sm font-medium flex items-center gap-2">
                        <MessageSquare className="w-4 h-4 text-accent" />
                        Pesan Perubahan
                        <span className="text-muted-foreground font-normal text-xs">(opsional, namun sangat disarankan)</span>
                      </Label>
                      <Textarea
                        id="dok-pesan-perubahan"
                        value={form.pesanPerubahan}
                        onChange={(e) => setField("pesanPerubahan", e.target.value)}
                        placeholder="Jelaskan perubahan apa yang Anda lakukan pada dokumen ini, misal: 'Memperbaiki nomor dokumen yang salah di halaman 2' atau 'Memperbarui lampiran PDF ke versi terbaru'..."
                        rows={3}
                        className="mt-1 text-sm resize-none border-amber-300 focus:border-amber-500 focus:ring-amber-200"
                        data-ocid="admin_dokumen.pesan_perubahan_textarea"
                      />
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Pesan ini akan dicatat dalam riwayat dokumen dan dapat dilihat oleh Verifikator.
                      </p>
                    </div>
                  </div>
                )}

                {/* Audit Trail (read-only, only in edit mode) */}
                {editId && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b pb-2">
                      <History className="w-4 h-4 text-accent" />
                      <h3 className="text-sm font-bold uppercase tracking-wider">Riwayat Review & Aktivitas</h3>
                    </div>
                    <WorkflowHistory dokumenId={editId} />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 pt-6 mt-6 border-t border-border">
                <Button
                  variant="outline"
                  onClick={() => setShowForm(false)}
                  disabled={saving}
                  data-ocid="admin_dokumen.cancel_button"
                >
                  Batal
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
                  data-ocid="admin_dokumen.submit_button"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? "Menyimpan..." : "Simpan"}
                </Button>
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
        <AlertDialogContent data-ocid="admin_dokumen.delete_dialog">
          <AlertDialogHeader>
            <AlertDialogTitle>Hapus Dokumen?</AlertDialogTitle>
            <AlertDialogDescription>
              Tindakan ini tidak dapat dibatalkan. Dokumen{" "}
              <strong>{deleteTarget?.judul}</strong> akan dihapus secara
              permanen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-ocid="admin_dokumen.delete_cancel_button">
              Batal
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteTarget && handleDelete(deleteTarget.id)}
              className="bg-accent hover:bg-accent/90 text-accent-foreground"
              data-ocid="admin_dokumen.delete_confirm_button"
            >
              {deleteDokumen.isPending ? (
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
