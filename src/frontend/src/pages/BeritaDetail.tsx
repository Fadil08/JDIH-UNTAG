import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, Calendar, Tag, User, Newspaper } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { ErrorState } from "../components/ui/ErrorState";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { PageHeader } from "../components/ui/PageHeader";
import { useBerita, useBeritaDetail } from "../hooks/useBackend";
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
      className="space-y-5 text-foreground/90 leading-relaxed text-[15px] md:text-base text-justify"
      data-ocid="berita_detail.konten"
    >
      {paragraphs.map((para, i) => (
        // biome-ignore lint/suspicious/noArrayIndexKey: static content
        <p key={i}>
          {para.trim()}
        </p>
      ))}
    </div>
  );
}

// ─── Sidebar Berita Terbaru ───────────────────────────────────────────────────

function BeritaTerbaruSidebar({ currentId }: { currentId: string | number }) {
  const { data: artikelList, isLoading } = useBerita();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex gap-3 animate-pulse">
            <div className="w-20 h-20 bg-muted rounded-md flex-shrink-0" />
            <div className="flex-1 space-y-2 py-1">
              <div className="h-4 bg-muted rounded w-full" />
              <div className="h-4 bg-muted rounded w-3/4" />
              <div className="h-3 bg-muted rounded w-1/2 mt-2" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!artikelList) return null;

  const filtered = artikelList.filter((a) => String(a.id) !== String(currentId)).slice(0, 4);

  if (filtered.length === 0) return <p className="text-sm text-muted-foreground">Belum ada berita lain.</p>;

  return (
    <div className="space-y-5">
      {filtered.map((a) => (
        <Link
          key={a.id}
          to="/berita/$id"
          params={{ id: String(a.id) }}
          className="flex gap-3 group"
        >
          <div className="w-20 h-20 rounded-md overflow-hidden bg-secondary/50 flex-shrink-0 border border-border/50">
            {a.gambar ? (
              <img src={a.gambar} alt={a.judul} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Newspaper className="w-6 h-6 text-muted-foreground/30" />
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <h4 className="text-sm font-bold leading-snug line-clamp-2 group-hover:text-primary transition-colors">
              {a.judul}
            </h4>
            <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatTanggalIndonesia(a.tanggalPublikasi ?? a.tanggal)}
            </p>
          </div>
        </Link>
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
        <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Content */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-xl shadow-sm border border-border/50 p-6 md:p-8">
              <div className="flex items-center gap-2 mb-4 text-primary">
                <Newspaper className="w-5 h-5" />
                <h2 className="text-xl font-display font-bold">Artikel</h2>
              </div>
              
              <Separator className="mb-6" />

              <h1 className="text-2xl md:text-3xl font-display font-bold text-foreground leading-tight mb-4">
                {artikel.judul}
              </h1>

              {/* Meta */}
              <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-6 bg-muted/30 p-3 rounded-lg border border-border/40">
                <span className="flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 flex-shrink-0 text-primary/70" />
                  {tanggal}
                </span>
                <span className="flex items-center gap-1.5">
                  <User className="w-4 h-4 flex-shrink-0 text-primary/70" />
                  {penulisNama}
                </span>
              </div>

              {/* Hero image */}
              {coverUrl && (
                <div className="mb-8 rounded-xl overflow-hidden border border-border/50 shadow-sm">
                  <img
                    src={coverUrl}
                    alt={artikel.judul}
                    className="w-full max-h-[400px] object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).parentElement?.remove();
                    }}
                  />
                </div>
              )}

              {/* Article body */}
              <ArticleContent isi={isiKonten} />

              {/* Tags */}
              {(artikel.tags?.length ?? 0) > 0 && (
                <div className="mt-10 pt-6 border-t border-border">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Tag Terkait</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {artikel.tags.map((tag) => (
                      <Badge
                        key={tag}
                        variant="secondary"
                        className="text-xs bg-muted hover:bg-muted/80 text-muted-foreground"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Back button */}
              <div className="mt-10">
                <Button
                  asChild
                  variant="outline"
                  className="gap-2"
                >
                  <Link to="/berita">
                    <ArrowLeft className="w-4 h-4" />
                    Kembali ke Daftar Berita
                  </Link>
                </Button>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-xl shadow-sm border border-border/50 p-6 sticky top-24">
              <div className="flex items-center gap-2 mb-4 text-destructive">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>
                <h3 className="text-lg font-display font-bold text-foreground">Berita Terbaru</h3>
              </div>
              <Separator className="mb-6" />
              <BeritaTerbaruSidebar currentId={id} />
            </div>
          </div>

        </div>
      </div>
    </Layout>
  );
}
