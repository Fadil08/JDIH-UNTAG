import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Tag, User } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { PageHeader } from "../components/ui/PageHeader";
import { useBeritaDetail } from "../hooks/useBackend";
import { useSEO } from "../hooks/useSEO";

// ─── Date Formatter ───────────────────────────────────────────────────────────

function formatTanggalIndonesia(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const BULAN = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember",
  ];
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return `${date.getDate()} ${BULAN[date.getMonth()]} ${date.getFullYear()}`;
}

// ─── Content Renderer ─────────────────────────────────────────────────────────

function ArticleContent({ isi }: { isi: string }) {
  const paragraphs = isi.split(/\n\n+/).filter((p) => p.trim().length > 0);

  if (paragraphs.length <= 1) {
    const lines = isi.split("\n");
    return (
      <div
        className="space-y-3 text-foreground leading-relaxed"
        data-ocid="berita_detail.konten"
      >
        {lines.map((line, i) =>
          line.trim() ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: static content
            <p key={i} className="text-base leading-7">
              {line}
            </p>
          ) : (
            // biome-ignore lint/suspicious/noArrayIndexKey: static content
            <br key={i} />
          ),
        )}
      </div>
    );
  }

  return (
    <div
      className="space-y-4 text-foreground leading-relaxed"
      data-ocid="berita_detail.konten"
    >
      {paragraphs.map((para, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static content
        <p key={i} className="text-base leading-7">
          {para.trim()}
        </p>
      ))}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function BeritaDetail() {
  const { id } = useParams({ from: "/berita/$id" });
  const { data: artikel, isLoading, isError, refetch } = useBeritaDetail(id);

  useSEO({
    title: artikel ? artikel.judul : "Memuat Berita...",
    description: artikel ? artikel.konten : "Berita dan pengumuman terbaru seputar JDIH UNTAG Banyuwangi."
  });

  if (isLoading) {
    return (
      <Layout>
        <div
          className="min-h-[60vh] flex items-center justify-center"
          data-ocid="berita_detail.loading_state"
        >
          <LoadingSpinner size="lg" text="Memuat artikel..." />
        </div>
      </Layout>
    );
  }

  if (isError || !artikel) {
    return (
      <Layout>
        <div data-ocid="berita_detail.error_state">
          <ErrorState
            title="Artikel tidak ditemukan"
            message="Artikel yang Anda cari tidak tersedia atau telah dihapus."
            onRetry={() => refetch()}
            className="min-h-[60vh]"
          />
        </div>
      </Layout>
    );
  }

  const tanggal = formatTanggalIndonesia(artikel.tanggalPublikasi ?? artikel.tanggal);
  const coverUrl = artikel.gambar ?? null;
  const penulisNama = artikel.author ?? '-';
  const isiKonten = artikel.konten ?? '';

  return (
    <Layout>
      <PageHeader
        title={artikel.judul}
        breadcrumbs={[
          { label: "Berita & Pengumuman", to: "/berita" },
          { label: artikel.judul },
        ]}
      />

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-3xl mx-auto">
          {/* Hero image */}
          {coverUrl && (
            <div className="mb-6 rounded-lg overflow-hidden border border-border">
              <img
                src={coverUrl}
                alt={artikel.judul}
                className="w-full max-h-72 object-cover"
                onError={(e) => {
                  (e.currentTarget as HTMLImageElement).parentElement?.remove();
                }}
              />
            </div>
          )}

          {/* Meta */}
          <div
            className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4"
            data-ocid="berita_detail.meta"
          >
            <span className="flex items-center gap-1.5">
              <Calendar className="w-4 h-4 flex-shrink-0" />
              {tanggal}
            </span>
            <span className="flex items-center gap-1.5">
              <User className="w-4 h-4 flex-shrink-0" />
              {penulisNama}
            </span>
          </div>

          <Separator className="mb-6" />

          {/* Article body */}
          <ArticleContent isi={isiKonten} />

          {/* Tags */}
          {(artikel.tags?.length ?? 0) > 0 && (
            <div className="mt-8 pt-6 border-t border-border">
              <div className="flex items-center gap-2 mb-3">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-foreground">Tag</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {artikel.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="text-xs"
                    data-ocid="berita_detail.tag"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Back button */}
          <div className="mt-8">
            <Button
              asChild
              variant="outline"
              className="gap-2 border-border"
              data-ocid="berita_detail.kembali_button"
            >
              <Link to="/berita">
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Berita
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
}
