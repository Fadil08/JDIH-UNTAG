import { useQueryClient, useQuery } from "@tanstack/react-query";
import {
  CheckCircle,
  FileText,
  Loader2,
  RotateCcw,
  Search,
  UserCheck,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

import { api, API_BASE, getFileUrl } from "../../api";
import { useDokumenAdmin, usePublishDokumen, useReturnToDraft } from "../../hooks/useBackend";
import { usePermissions } from "../../hooks/usePermissions";
import { EmptyState } from "../../components/ui/EmptyState";
import { ErrorState } from "../../components/ui/ErrorState";
import { KategoriTag } from "../../components/ui/KategoriTag";
import { SkeletonList } from "../../components/ui/LoadingSpinner";
import { StatusBadge } from "../../components/ui/StatusBadge";
import type { WorkflowStatus } from "../../types";

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
      {logs.map((log) => (
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

// ─── Return To Draft Sub-form ─────────────────────────────────────────────────

interface ReturnToDraftFormProps {
  docId: string;
  onClose: () => void;
}

function ReturnToDraftForm({ docId, onClose }: ReturnToDraftFormProps) {
  const qc = useQueryClient();
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
      qc.invalidateQueries({ queryKey: ["pendingCount"] });
      qc.invalidateQueries({ queryKey: ["dokumenAdmin"] });
      onClose();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Gagal mengembalikan ke draf",
      );
    }
  }

  return (
    <div
      className="mt-3 rounded-lg border border-yellow-300 bg-yellow-50 p-4 space-y-3"
      data-ocid="admin_verifikasi.return_draft_form"
    >
      <p className="text-sm font-bold text-yellow-800">
        Catatan Koreksi (Alasan Penolakan)
      </p>
      <Textarea
        value={catatan}
        onChange={(e) => setCatatan(e.target.value)}
        placeholder="Tuliskan instruksi perbaikan untuk operator..."
        rows={3}
        className="text-sm resize-none border-yellow-300 focus:border-yellow-500"
      />
      <div className="flex gap-2 justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={onClose}
          disabled={returnToDraft.isPending}
          className="h-8 text-xs"
        >
          Batal
        </Button>
        <Button
          size="sm"
          onClick={handleSubmit}
          disabled={returnToDraft.isPending || !catatan.trim()}
          className="h-8 text-xs bg-yellow-600 hover:bg-yellow-700 text-white"
        >
          {returnToDraft.isPending && (
            <Loader2 className="w-3 h-3 animate-spin mr-1" />
          )}
          Tolak dan Kembalikan ke Draf
        </Button>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AdminVerifikasi() {
  const qc = useQueryClient();
  const { can } = usePermissions();
  const [search, setSearch] = useState("");
  const [showReturnFormId, setShowReturnFormId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"pending" | "history">("pending");

  const {
    data: dokumen,
    isLoading,
    isError,
    refetch,
  } = useDokumenAdmin({
    query: search,
    workflowStatus: activeTab === "pending" ? "PendingReview" : undefined,
  });

  const publishDokumen = usePublishDokumen();

  if (!can("dokumen:review")) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <p className="text-lg font-bold text-destructive">Akses Ditolak</p>
        <p className="text-muted-foreground text-sm">
          Hanya verifikator atau Super Admin yang dapat membuka halaman ini.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-foreground">
            Pusat Verifikasi Dokumen
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Tinjau, setujui, dan pantau seluruh alur publikasi produk hukum universitas.
          </p>
        </div>
      </div>

      {/* TABS NAVIGATION */}
      <div className="flex items-center gap-2 mb-6 border-b border-border pb-px">
        <button
          onClick={() => setActiveTab("pending")}
          className={`px-4 py-2 text-sm font-bold transition-all border-b-2 ${
            activeTab === "pending"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Antrean Verifikasi
          {activeTab !== "pending" && (
            <span className="ml-2 px-1.5 py-0.5 bg-primary/10 text-primary text-[10px] rounded-full">
              Review
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab("history")}
          className={`px-4 py-2 text-sm font-bold transition-all border-b-2 ${
            activeTab === "history"
              ? "border-primary text-primary"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          Riwayat & Monitoring
        </button>
      </div>

      {/* Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Cari berdasarkan nomor atau judul..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-sm h-10 shadow-sm"
          />
        </div>
      </div>

      {/* Konten Kotak Masuk */}
      {isLoading ? (
        <SkeletonList count={4} />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : !dokumen || dokumen.length === 0 ? (
        <EmptyState
          title={
            activeTab === "pending"
              ? "Tidak ada Antrean Verifikasi"
              : "Tidak ada data riwayat"
          }
          description={
            activeTab === "pending"
              ? "Semua dokumen selesai diperiksa atau tidak ada ajuan draf baru."
              : "Belum ada dokumen yang diproses di sistem ini."
          }
        />
      ) : (
        <div className="space-y-5">
          {dokumen.map((doc, idx) => {
            const submittedBy = doc.submittedByNama || "Sistem";
            const verifikator = doc.reviewedByNama;

            return (
              <div
                key={doc.id}
                className="bg-card border border-border hover:shadow-md transition-all rounded-xl overflow-hidden shadow-sm"
              >
                <div className="flex flex-col lg:flex-row">
                  {/* Left Section: Info */}
                  <div className="flex-1 p-5 lg:p-6">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <span className="inline-flex items-center justify-center p-1.5 w-8 h-8 bg-primary/5 text-primary rounded-lg ring-1 ring-primary/10">
                        <FileText size={16} />
                      </span>
                      <KategoriTag nama={doc.kategoriNama ?? "-"} />
                      <StatusBadge status={doc.status} />
                      {activeTab === "history" && (
                        <div className="ml-auto">
                          <span className="text-[10px] uppercase font-black tracking-widest text-muted-foreground bg-muted px-2 py-1 rounded">
                            {doc.workflowStatus}
                          </span>
                        </div>
                      )}
                    </div>

                    <h3 className="font-bold text-foreground text-lg leading-tight mb-1">
                      {doc.judul}
                    </h3>
                    <p className="text-primary/80 font-mono text-sm">
                      {doc.nomor} · {doc.tahun}
                    </p>

                    <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center gap-2.5 p-2 bg-muted/30 rounded-lg border border-border/50">
                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600 font-bold text-xs ring-1 ring-blue-500/20">
                          {submittedBy.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-tighter">
                            Diajukan Oleh
                          </p>
                          <p className="text-xs font-bold text-foreground truncate">
                            {submittedBy}
                          </p>
                        </div>
                      </div>

                      {verifikator && (
                        <div className="flex items-center gap-2.5 p-2 bg-green-500/5 rounded-lg border border-green-500/10">
                          <div className="w-8 h-8 rounded-full bg-green-500/10 flex items-center justify-center text-green-600 font-bold text-xs ring-1 ring-green-500/20">
                            <UserCheck size={14} />
                          </div>
                          <div className="min-w-0">
                            <p className="text-[10px] text-green-700/60 font-bold uppercase tracking-tighter">
                              Verifikator
                            </p>
                            <p className="text-xs font-bold text-green-700 truncate">
                              {verifikator}
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 p-4 rounded-xl bg-orange-50/30 border border-orange-200/20 text-sm text-foreground/80 italic leading-relaxed">
                      {(() => {
                        const content = doc.abstrak || "";
                        const hasHtmlTags = /<[a-z][\s\S]*>/i.test(content);
                        if (hasHtmlTags) {
                          return <div dangerouslySetInnerHTML={{ __html: content }} />;
                        }
                        return <span>"{content}"</span>;
                      })()}
                    </div>

                    <details className="mt-4 group bg-muted/30 border border-border/50 rounded-xl overflow-hidden">
                      <summary className="cursor-pointer text-xs font-bold p-3 bg-muted/50 hover:bg-muted text-muted-foreground uppercase tracking-wider flex items-center justify-between outline-none">
                        <span>Lihat Detail Metadata Dokumen</span>
                        <span className="text-[10px] transition-transform group-open:rotate-180">▼</span>
                      </summary>
                      <div className="p-4 border-t border-border/50 space-y-4 bg-card text-sm">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Tanggal Penetapan</p>
                            <p className="font-medium text-foreground">
                              {doc.tanggalPenetapan ? new Date(doc.tanggalPenetapan).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                            </p>
                          </div>
                          <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Tanggal Pengundangan</p>
                            <p className="font-medium text-foreground">
                              {doc.tanggalPengundangan ? new Date(doc.tanggalPengundangan).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                            </p>
                          </div>
                        </div>
                        {doc.relasiHukum && (
                          <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-1">Relasi Hukum</p>
                            <p className="font-medium text-foreground">{doc.relasiHukum}</p>
                          </div>
                        )}
                        {doc.tag && doc.tag.length > 0 && (
                          <div>
                            <p className="text-[10px] uppercase font-bold text-muted-foreground mb-2">Tag / Subjek</p>
                            <div className="flex flex-wrap gap-1.5">
                              {doc.tag.map((t, i) => (
                                <span key={i} className="px-2 py-1 bg-accent/10 text-accent rounded text-[10px] font-bold uppercase tracking-wider border border-accent/20">
                                  {t}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </details>

                    <details className="mt-2 group bg-muted/30 border border-border/50 rounded-xl overflow-hidden">
                      <summary className="cursor-pointer text-xs font-bold p-3 bg-muted/50 hover:bg-muted text-muted-foreground uppercase tracking-wider flex items-center justify-between outline-none">
                        <span>Lihat Riwayat & Catatan Revisi</span>
                        <span className="text-[10px] transition-transform group-open:rotate-180">▼</span>
                      </summary>
                      <div className="p-4 border-t border-border/50 bg-card text-sm">
                        <WorkflowHistory dokumenId={doc.id} />
                      </div>
                    </details>

                    {showReturnFormId === String(doc.id) && (
                      <ReturnToDraftForm
                        docId={String(doc.id)}
                        onClose={() => setShowReturnFormId(null)}
                      />
                    )}
                  </div>

                  {/* Right Section: Actions */}
                  <div className="lg:w-[260px] bg-muted/20 p-5 lg:p-6 flex flex-col gap-3 justify-center border-t lg:border-t-0 lg:border-l border-border">
                    {doc.workflowStatus === "PendingReview" ? (
                      <>
                        <Button
                          className="w-full bg-green-600 hover:bg-green-700 text-white gap-2 font-bold h-11"
                          disabled={publishDokumen.isPending}
                          onClick={async () => {
                            try {
                              await publishDokumen.mutateAsync(String(doc.id));
                              toast.success("Dokumen berhasil diterbitkan.");
                              qc.invalidateQueries({
                                queryKey: ["pendingCount"],
                              });
                              qc.invalidateQueries({
                                queryKey: ["dokumenAdmin"],
                              });
                            } catch (err) {
                              toast.error(
                                err instanceof Error
                                  ? err.message
                                  : "Gagal menerbitkan"
                              );
                            }
                          }}
                        >
                          {publishDokumen.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <CheckCircle className="w-4 h-4" />
                          )}
                          Terbitkan
                        </Button>

                        <Button
                          variant="outline"
                          className="w-full border-yellow-500/50 text-yellow-700 hover:bg-yellow-500 hover:text-white gap-2 font-bold h-11"
                          onClick={() =>
                            setShowReturnFormId(
                              showReturnFormId === String(doc.id)
                                ? null
                                : String(doc.id)
                            )
                          }
                        >
                          <RotateCcw className="w-4 h-4" />
                          Kembalikan
                        </Button>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background border border-border shadow-sm mb-3">
                          <CheckCircle size={14} className="text-green-500" />
                          <span className="text-xs font-bold text-foreground">
                            Selesai Diproses
                          </span>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2 mt-auto">
                      {doc.filePdf && (
                        <Button
                          variant="secondary"
                          className="w-full text-xs font-bold h-9"
                          onClick={() =>
                            window.open(
                              getFileUrl(doc.filePdf),
                              "_blank"
                            )
                          }
                        >
                          Pratinjau File PDF
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
