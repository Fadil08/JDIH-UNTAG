import { Link } from "@tanstack/react-router";
import { ArrowRight, Newspaper } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { PageHeader } from "../components/ui/PageHeader";
import { useBerita } from "../hooks/useBackend";
import type { Artikel } from "../types";


// ─── Skeleton Grid ────────────────────────────────────────────────────────────

const SKELETON_KEYS = ["a", "b", "c", "d"];

function SkeletonBeritaGrid() {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      data-ocid="berita.loading_state"
    >
      {SKELETON_KEYS.map((key) => (
        <div
          key={key}
          className="bg-white rounded-xl overflow-hidden animate-pulse shadow-sm"
        >
          <div className="skeleton h-56 w-full" />
          <div className="p-6 space-y-4">
            <div className="skeleton h-7 w-full rounded" />
            <div className="skeleton h-7 w-3/4 rounded" />
            <div className="skeleton h-4 w-full rounded mt-4" />
            <div className="skeleton h-4 w-5/6 rounded" />
            <div className="skeleton h-4 w-4/6 rounded" />
            <div className="skeleton h-4 w-24 rounded mt-4" />
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Artikel Card ─────────────────────────────────────────────────────────────

function ArtikelCard({ artikel, index }: { artikel: Artikel; index: number }) {
  const ringkasan = artikel.ringkasan;
  const coverUrl = artikel.gambar ?? null;

  return (
    <Link
      to="/berita/$id"
      params={{ id: String(artikel.id) }}
      className="bg-white rounded-xl overflow-hidden hover:shadow-lg transition-all duration-300 group flex flex-col shadow-sm border border-transparent hover:border-primary/10"
      data-ocid={`berita.artikel_card.${index}`}
    >
      {/* Cover image / placeholder */}
      {coverUrl ? (
        <img
          src={coverUrl}
          alt={artikel.judul}
          className="h-56 w-full object-cover"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="h-56 bg-secondary flex items-center justify-center">
          <Newspaper className="w-16 h-16 text-primary/20" />
        </div>
      )}

      <div className="p-6 flex flex-col flex-1">
        {/* Judul */}
        <h2 className="font-display font-bold text-primary text-lg md:text-xl leading-snug mb-3 group-hover:text-accent transition-smooth line-clamp-3">
          {artikel.judul}
        </h2>

        {/* Ringkasan */}
        <p className="text-muted-foreground text-sm leading-relaxed flex-1 line-clamp-3">
          {ringkasan}
        </p>

        {/* CTA */}
        <div className="flex items-center gap-1 text-primary text-sm font-semibold mt-6 group-hover:gap-2 transition-smooth">
          Selengkapnya <ArrowRight className="w-4 h-4" />
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {artikelList.map((artikel, idx) => (
              <ArtikelCard key={artikel.id} artikel={artikel} index={idx + 1} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
