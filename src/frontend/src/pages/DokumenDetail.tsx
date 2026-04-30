import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link, useParams } from "@tanstack/react-router";
import {
  AlertCircle,
  ArrowLeft,
  Calendar,
  Download,
  FileText,
  Folder,
  Hash,
  Tag,
} from "lucide-react";
import { useCallback, useState } from "react";
import { api, API_BASE } from "../api";
import { Layout } from "../components/layout/Layout";
import { BreadcrumbNav } from "../components/ui/BreadcrumbNav";
import { ErrorState } from "../components/ui/ErrorState";
import { KategoriTag } from "../components/ui/KategoriTag";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useDokumenDetail } from "../hooks/useBackend";
import { useSEO } from "../hooks/useSEO";
import { STATUS_LABEL } from "../types";

// ─── Download Handler ─────────────────────────────────────────────────────────

function useDownloadDokumen() {
  const [isDownloading, setIsDownloading] = useState(false);

  const download = useCallback(
    async (id: string, filePdf: string | null, judul: string) => {
      setIsDownloading(true);
      try {
        // Increment download counter
        await api.dokumen.download(id).catch(() => null);
        // Open the file
        if (filePdf) {
          window.open(API_BASE + filePdf, "_blank", "noopener,noreferrer");
        } else {
          alert(`Dokumen "${judul}" belum tersedia untuk diunduh.`);
        }
      } finally {
        setIsDownloading(false);
      }
    },
    [],
  );

  return { download, isDownloading };
}

// ─── Metadata Row ─────────────────────────────────────────────────────────────

function MetaRow({
  label,
  value,
  mono = false,
  icon,
}: {
  label: string;
  value: string;
  mono?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-0.5">
      <dt className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
        {label}
      </dt>
      <dd
        className={`text-sm text-foreground font-semibold flex items-center gap-1.5 ${
          mono ? "font-mono text-xs tracking-wide" : ""
        }`}
      >
        {icon && <span className="text-muted-foreground">{icon}</span>}
        {value}
      </dd>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function DokumenDetail() {
  const { slug } = useParams({ from: "/katalog/$slug" });
  const { data: dokumen, isLoading, isError, refetch } = useDokumenDetail(slug);
  const { download, isDownloading } = useDownloadDokumen();

  useSEO({
    title: dokumen ? dokumen.judul : "Memuat Dokumen...",
    description: dokumen ? (dokumen.abstrak || dokumen.judul) : "Detail dokumen produk hukum JDIH UNTAG Banyuwangi."
  });

  const handleDownload = () => {
    if (dokumen) {
      download(String(dokumen.id), dokumen.filePdf, dokumen.judul);
    }
  };

  if (isLoading) {
    return (
      <Layout>
        <div
          className="min-h-[60vh] flex items-center justify-center"
          data-ocid="dokumen_detail.loading_state"
        >
          <LoadingSpinner size="lg" text="Memuat detail dokumen..." />
        </div>
      </Layout>
    );
  }

  if (isError || !dokumen) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <ErrorState
            title="Dokumen Tidak Ditemukan"
            message="Maaf, dokumen yang Anda cari tidak tersedia atau telah dihapus."
            onRetry={refetch}
          />
        </div>
      </Layout>
    );
  }

  const tags = dokumen.tag || [];
  const relations = dokumen.relations || [];

  return (
    <Layout>
      {/* ── Header ──────────────────────────────────────────────── */}
      <div
        className="bg-card border-b border-border"
        data-ocid="dokumen_detail.page"
      >
        <div className="container mx-auto px-4 py-5">
          <BreadcrumbNav
            items={[
              { label: "Katalog Hukum", to: "/katalog" },
              { label: dokumen.judul },
            ]}
          />

          <div className="mt-4 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="min-w-0 flex-1">
              {/* Nomor dokumen */}
              <div className="flex items-center gap-2 mb-2">
                <Hash className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                <span className="font-mono text-xs tracking-wide text-muted-foreground">
                  {dokumen.nomor}
                </span>
                <StatusBadge status={dokumen.status} />
              </div>
              {/* Judul */}
              <h1
                className="font-display font-bold text-xl sm:text-2xl text-foreground leading-tight break-words"
                data-ocid="dokumen_detail.judul"
              >
                {dokumen.judul}
              </h1>
            </div>
            {/* Tombol unduh di header (desktop) */}
            <div className="hidden sm:block flex-shrink-0">
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 font-semibold"
                data-ocid="dokumen_detail.unduh_button"
              >
                <Download className="w-4 h-4" />
                {isDownloading ? "Mengunduh..." : "Unduh Dokumen PDF"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Main Column ───────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* Grid Metadata */}
            <div
              className="bg-card border border-border rounded-lg p-6"
              data-ocid="dokumen_detail.metadata_card"
            >
              <h2 className="font-display font-semibold text-foreground text-sm uppercase tracking-wider mb-5 flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                Informasi Dokumen
              </h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                <MetaRow
                  label="Nomor Dokumen"
                  value={dokumen.nomor}
                  mono
                  icon={<Hash className="w-3.5 h-3.5" />}
                />
                <MetaRow
                  label="Kategori Dokumen"
                  value={dokumen.kategoriNama ?? '-'}
                  icon={<Folder className="w-3.5 h-3.5" />}
                />
                <MetaRow
                  label="Tahun Terbit"
                  value={String(dokumen.tahun)}
                  icon={<Calendar className="w-3.5 h-3.5" />}
                />
                <MetaRow
                  label="Tanggal Penetapan"
                  value={dokumen.tanggalPenetapan ? new Date(dokumen.tanggalPenetapan).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                  icon={<Calendar className="w-3.5 h-3.5" />}
                />
                {dokumen.tanggalPengundangan && (
                  <MetaRow
                    label="Tanggal Pengundangan"
                    value={new Date(dokumen.tanggalPengundangan).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric' })}
                    icon={<Calendar className="w-3.5 h-3.5" />}
                  />
                )}
                <MetaRow label="Status" value={STATUS_LABEL[dokumen.status] ?? dokumen.status} />
                {dokumen.relasiHukum && (
                  <div className="sm:col-span-2">
                    <MetaRow
                      label="Relasi Dengan Produk Hukum Lain"
                      value={dokumen.relasiHukum}
                    />
                  </div>
                )}
              </dl>
            </div>

            {/* Dokumen Terkait (Simlink BPHN) */}
            {relations.length > 0 && (
              <div
                className="bg-card border border-border rounded-lg p-6"
                data-ocid="dokumen_detail.relations_card"
              >
                <h2 className="font-display font-semibold text-foreground text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4 text-accent rotate-180" />
                  Dokumen Terkait
                </h2>
                <div className="space-y-3">
                  {relations.map((rel, idx) => (
                    <Link
                      key={`${rel.id}-${idx}`}
                      to="/katalog/$slug"
                      params={{ slug: rel.slug }}
                      className="flex items-start gap-3 p-3 rounded-lg border border-transparent hover:border-border hover:bg-muted/30 transition-all group"
                    >
                      <div className={`mt-1 flex-shrink-0 w-2 h-2 rounded-full ${rel.arah === 'inbound' ? 'bg-accent' : 'bg-blue-500'}`} />
                      <div>
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[10px] font-bold uppercase py-0.5 px-1.5 rounded bg-muted text-muted-foreground group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                            {rel.tipe_relasi}
                          </span>
                          <span className="text-xs text-muted-foreground font-mono">{rel.nomor}</span>
                        </div>
                        <p className="text-sm font-medium text-foreground group-hover:text-accent font-display line-clamp-2">
                          {rel.judul}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
            <div
              className="bg-card border border-border rounded-lg p-6"
              data-ocid="dokumen_detail.abstrak_card"
            >
              <h2 className="font-display font-semibold text-foreground text-sm uppercase tracking-wider mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-accent" />
                Abstrak / Ringkasan
              </h2>
              <Separator className="mb-4" />
              <p className="text-foreground/80 text-sm leading-relaxed">
                {dokumen.abstrak}
              </p>
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div
                className="bg-card border border-border rounded-lg p-6"
                data-ocid="dokumen_detail.tags_card"
              >
                <h2 className="font-display font-semibold text-foreground text-sm uppercase tracking-wider mb-4 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-accent" />
                  Tag / Subjek
                </h2>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <KategoriTag key={tag} nama={tag} />
                  ))}
                </div>
              </div>
            )}

            {/* Built-in PDF Viewer */}
            {dokumen.filePdf ? (
              <div
                className="bg-card border border-border rounded-lg overflow-hidden flex flex-col mt-6 shadow-sm"
                style={{ height: "800px" }}
                data-ocid="dokumen_detail.pdf_viewer"
              >
                <div className="bg-muted/50 p-4 border-b border-border flex items-center justify-between">
                  <h2 className="font-display font-semibold text-foreground text-sm uppercase tracking-wider flex items-center gap-2">
                    <FileText className="w-4 h-4 text-accent" />
                    Pratinjau Dokumen
                  </h2>
                  <Button
                    size="sm"
                    onClick={handleDownload}
                    disabled={isDownloading}
                    className="h-8 gap-2 bg-accent hover:bg-accent/90 text-accent-foreground"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Unduh PDF
                  </Button>
                </div>
                <iframe
                  src={API_BASE + dokumen.filePdf}
                  className="w-full flex-1 border-0"
                  title={`Preview ${dokumen.judul}`}
                />
              </div>
            ) : (
              <div className="bg-card border border-border rounded-lg p-8 mt-6 flex flex-col items-center justify-center text-center text-muted-foreground">
                <FileText className="w-10 h-10 mb-3 opacity-20" />
                <p className="text-sm font-medium">File dokumen tidak tersedia</p>
                <p className="text-xs mt-1">Sistem belum memiliki salinan digital untuk peraturan ini.</p>
              </div>
            )}

            {/* Tombol unduh fullwidth (mobile) */}
            <div className="sm:hidden">
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2 font-semibold py-3 text-base"
                data-ocid="dokumen_detail.unduh_mobile_button"
              >
                <Download className="w-5 h-5" />
                {isDownloading ? "Mengunduh..." : "Unduh Dokumen PDF"}
              </Button>
            </div>

            {/* Tombol kembali */}
            <div className="flex items-center">
              <Button
                asChild
                variant="outline"
                className="gap-2 border-border"
                data-ocid="dokumen_detail.kembali_button"
              >
                <Link to="/katalog">
                  <ArrowLeft className="w-4 h-4" />
                  Kembali ke Katalog
                </Link>
              </Button>
            </div>
          </div>

          {/* ── Sidebar ───────────────────────── */}
          <div className="space-y-4">
            {/* Download card */}
            <div
              className="bg-primary rounded-lg p-6 text-primary-foreground"
              data-ocid="dokumen_detail.download_card"
            >
              <div className="w-12 h-12 bg-primary-foreground/10 rounded-lg flex items-center justify-center mb-4">
                <FileText className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-base mb-1">Unduh Dokumen</h3>
              <p className="text-primary-foreground/70 text-xs mb-1">Format PDF</p>
              <p className="text-primary-foreground/50 text-xs mb-5">
                {dokumen.downloadCount > 0 ? `${dokumen.downloadCount}× diunduh` : 'Belum ada unduhan'}
              </p>
              <Button
                onClick={handleDownload}
                disabled={isDownloading}
                className="w-full bg-accent hover:bg-accent/90 text-accent-foreground gap-2 font-semibold"
                data-ocid="dokumen_detail.unduh_pdf_button"
              >
                <Download className="w-4 h-4" />
                {isDownloading ? "Mengunduh..." : "Unduh PDF"}
              </Button>
            </div>

            {/* Keterangan */}
            <div className="bg-muted/60 border border-border rounded-lg p-4">
              <div className="flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Pastikan Anda mengunduh dokumen dari sumber resmi JDIH UNTAG
                  Banyuwangi untuk menjamin keasliannya.
                </p>
              </div>
            </div>

            {/* Status & Kategori detail */}
            <div className="bg-card border border-border rounded-lg p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Status</span>
                <StatusBadge status={dokumen.status} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Kategori</span>
                <KategoriTag nama={dokumen.kategoriNama ?? '-'} />
              </div>
            </div>

            {/* Kembali (sidebar) */}
            <Button
              asChild
              variant="outline"
              className="w-full gap-2 border-border"
              data-ocid="dokumen_detail.kembali_sidebar_button"
            >
              <Link to="/katalog">
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Katalog
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
