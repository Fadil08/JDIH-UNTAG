import { Link } from "@tanstack/react-router";
import { ArrowRight, Calendar, Newspaper, User } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { PageHeader } from "../components/ui/PageHeader";
import { useBerita } from "../hooks/useBackend";
import type { Artikel } from "../types";

// ─── Date Formatter ───────────────────────────────────────────────────────────

function formatTanggalIndonesia(dateStr: string | null | undefined): string {
  if (!dateStr) return "-";
  const BULAN = [
    "Januari",
    "Februari",
    "Maret",
    "April",
    "Mei",
    "Juni",
    "Juli",
    "Agustus",
    "September",
    "Oktober",
    "November",
    "Desember",
  ];
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return `${date.getDate()} ${BULAN[date.getMonth()]} ${date.getFullYear()}`;
}

// ─── Skeleton Grid ────────────────────────────────────────────────────────────

const SKELETON_KEYS = ["a", "b", "c", "d"];

function SkeletonBeritaGrid() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 gap-5"
      data-ocid="berita.loading_state"
    >
      {SKELETON_KEYS.map((key) => (
        <div
          key={key}
          className="bg-card border border-border rounded-lg overflow-hidden animate-pulse"
        >
          <div className="skeleton h-44 w-full" />
          <div className="p-5 space-y-3">
            <div className="flex gap-3">
              <div className="skeleton h-3 w-28 rounded" />
              <div className="skeleton h-3 w-20 rounded" />
            </div>
            <div className="skeleton h-5 w-4/5 rounded" />
            <div className="skeleton h-4 w-full rounded" />
            <div className="skeleton h-4 w-3/4 rounded" />
            <div className="skeleton h-4 w-5/6 rounded" />
            <div className="skeleton h-4 w-24 rounded mt-2" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Artikel Card ─────────────────────────────────────────────────────────────

function ArtikelCard({ artikel, index }: { artikel: Artikel; index: number }) {
  const ringkasan =
    artikel.ringkasan.length > 200
      ? `${artikel.ringkasan.substring(0, 200)}…`
      : artikel.ringkasan;

  const tanggal = formatTanggalIndonesia(artikel.tanggalPublikasi ?? artikel.tanggal);

  const coverUrl = artikel.gambar ?? null;

  return (
    <Link
      to="/berita/$id"
      params={{ id: String(artikel.id) }}
      className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-card transition-smooth group flex flex-col"
      data-ocid={`berita.artikel_card.${index}`}
    >
      {/* Cover image / placeholder */}
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={artikel.judul}
          className="h-44 w-full object-cover border-b border-border"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="h-44 bg-secondary flex items-center justify-center border-b border-border">
          <Newspaper className="w-12 h-12 text-primary/20" />
        </div>
      )}

      <div className="p-5 flex flex-col flex-1">
        {/* Meta */}
        <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground mb-3">
          <span className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 flex-shrink-0" />
            {tanggal}
          </span>
          <span className="flex items-center gap-1.5 min-w-0">
            <User className="w-3.5 h-3.5 flex-shrink-0" />
            <span className="truncate">{artikel.author ?? ''}</span>
          </span>
        </div>

        {/* Judul */}
        <h2 className="font-display font-semibold text-foreground text-base leading-snug mb-2 group-hover:text-accent transition-smooth line-clamp-2">
          {artikel.judul}
        </h2>

        {/* Ringkasan */}
        <p className="text-muted-foreground text-sm leading-relaxed flex-1">
          {ringkasan}
        </p>

        {/* CTA */}
        <div className="flex items-center gap-1 text-accent text-sm font-semibold mt-4 group-hover:gap-2 transition-smooth">
          Baca Selengkapnya <ArrowRight className="w-4 h-4" />
        </div>
      </div>
    </Link>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Berita() {
  const { data: artikelList, isLoading, isError, refetch } = useBerita();

  return (
    <Layout>
      <PageHeader
        title="Berita & Pengumuman"
        description="Informasi terkini seputar kegiatan dan regulasi JDIH UNTAG Banyuwangi"
        breadcrumbs={[{ label: "Berita & Pengumuman" }]}
      />

      <div className="container mx-auto px-4 py-8" data-ocid="berita.list">
        {isLoading ? (
          <SkeletonBeritaGrid />
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : !artikelList || artikelList.length === 0 ? (
          <EmptyState
            title="Belum ada berita"
            description="Belum ada artikel berita yang dipublikasikan. Silakan kembali lagi nanti."
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {artikelList.map((artikel, idx) => (
              <ArtikelCard key={artikel.id} artikel={artikel} index={idx + 1} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
