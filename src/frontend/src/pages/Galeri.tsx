import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { ImageIcon, X } from "lucide-react";
import { useState } from "react";
import { Layout } from "../components/layout/Layout";
import { PageHeader } from "../components/ui/PageHeader";
import { useGaleri } from "../hooks/useBackend";
import type { GaleriItem } from "../api";
import { getFileUrl } from "../api";

// ─── Skeleton ─────────────────────────────────────────────────────────────────

const SKELETON_KEYS = ["a", "b", "c", "d", "e", "f", "g", "h"];

function GaleriSkeleton() {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
      data-ocid="galeri.loading_state"
    >
      {SKELETON_KEYS.map((k) => (
        <Skeleton key={k} className="aspect-square rounded-lg" />
      ))}
    </div>
  );
}

// ─── Photo Card ───────────────────────────────────────────────────────────────

function GaleriCard({
  item,
  index,
  onOpen,
}: {
  item: GaleriItem;
  index: number;
  onOpen: (item: GaleriItem) => void;
}) {
  const imgUrl = item.gambar ?? null;

  return (
    <button
      type="button"
      onClick={() => onOpen(item)}
      className="group relative aspect-square overflow-hidden rounded-lg border border-border bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
      data-ocid={`galeri.foto_card.${index}`}
    >
      {imgUrl ? (
        <img
          src={getFileUrl(imgUrl)}
          alt={item.judul}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-muted">
          <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
        </div>
      )}

      {/* Overlay */}
      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/40 transition-all duration-300 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100">
        <Badge className="self-start bg-primary text-primary-foreground text-xs mb-1.5 pointer-events-none">
          {item.album}
        </Badge>
        <p className="text-white text-sm font-semibold leading-snug line-clamp-2 text-left">
          {item.judul}
        </p>
      </div>
    </button>
  );
}

// ─── Lightbox ─────────────────────────────────────────────────────────────────

function Lightbox({
  item,
  onClose,
}: {
  item: GaleriItem | null;
  onClose: () => void;
}) {
  if (!item) return null;
  const imgUrl = item.gambar ?? null;

  return (
    <Dialog open={!!item} onOpenChange={(v) => !v && onClose()}>
      <DialogContent
        className="max-w-3xl p-0 overflow-hidden bg-card border-border"
        data-ocid="galeri.lightbox_dialog"
      >
        <div className="relative">
          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 bg-foreground/60 hover:bg-foreground/80 text-white rounded-full p-1.5 transition-colors"
            aria-label="Tutup"
            data-ocid="galeri.lightbox.close_button"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Image */}
          {imgUrl ? (
            <img
              src={getFileUrl(imgUrl)}
              alt={item.judul}
              className="w-full max-h-[70vh] object-contain bg-muted"
            />
          ) : (
            <div className="w-full h-64 flex items-center justify-center bg-muted">
              <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}

          {/* Caption */}
          <div className="p-5">
            <div className="flex items-start gap-3 mb-2">
              <Badge className="bg-primary text-primary-foreground shrink-0">
                {item.album}
              </Badge>
            </div>
            <h2 className="font-display font-bold text-lg text-foreground leading-snug mb-1.5">
              {item.judul}
            </h2>
            {item.deskripsi && (
              <p className="text-muted-foreground text-sm leading-relaxed">
                {item.deskripsi}
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function Galeri() {
  const { data: galeriItems, isLoading, isError, refetch } = useGaleri();
  const [activeAlbum, setActiveAlbum] = useState<string>("Semua");
  const [lightboxItem, setLightboxItem] = useState<GaleriItem | null>(null);

  // Derive unique album list
  const albums = galeriItems
    ? [
        "Semua",
        ...Array.from(new Set(galeriItems.map((i) => i.album).filter(Boolean))),
      ]
    : ["Semua"];

  const filtered =
    activeAlbum === "Semua"
      ? (galeriItems ?? [])
      : (galeriItems ?? []).filter((i) => i.album === activeAlbum);

  return (
    <Layout>
      <PageHeader
        title="Galeri"
        description="Dokumentasi foto kegiatan dan lingkungan kampus UNTAG Banyuwangi"
        breadcrumbs={[{ label: "Galeri" }]}
      />

      <div className="container mx-auto px-4 py-8" data-ocid="galeri.page">
        {/* Album Filter Tabs */}
        {!isLoading && !isError && albums.length > 1 && (
          <div
            className="flex flex-wrap gap-2 mb-6"
            data-ocid="galeri.album_filter"
          >
            {albums.map((album) => (
              <Button
                key={album}
                variant={activeAlbum === album ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveAlbum(album)}
                className={
                  activeAlbum === album
                    ? "bg-primary text-primary-foreground hover:bg-primary/90"
                    : "border-border text-foreground hover:bg-muted"
                }
                data-ocid={`galeri.album_tab.${album.toLowerCase().replace(/\s+/g, "_")}`}
              >
                {album}
              </Button>
            ))}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <GaleriSkeleton />
        ) : isError ? (
          <div
            className="flex flex-col items-center justify-center py-20 text-center"
            data-ocid="galeri.error_state"
          >
            <ImageIcon className="w-14 h-14 text-muted-foreground/30 mb-4" />
            <p className="text-foreground font-semibold mb-2">
              Gagal memuat galeri
            </p>
            <p className="text-muted-foreground text-sm mb-5">
              Terjadi kesalahan saat mengambil data. Silakan coba lagi.
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              data-ocid="galeri.retry_button"
            >
              Coba Lagi
            </Button>
          </div>
        ) : filtered.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-20 text-center"
            data-ocid="galeri.empty_state"
          >
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-5">
              <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
            </div>
            <h3 className="text-foreground font-semibold text-lg mb-2">
              Belum ada foto tersedia
            </h3>
            <p className="text-muted-foreground text-sm max-w-xs">
              {activeAlbum === "Semua"
                ? "Foto kegiatan akan ditampilkan di sini setelah diunggah oleh admin."
                : `Belum ada foto di album "${activeAlbum}".`}
            </p>
          </div>
        ) : (
          <div
            className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
            data-ocid="galeri.foto_list"
          >
            {filtered.map((item, idx) => (
              <GaleriCard
                key={item.id}
                item={item}
                index={idx + 1}
                onOpen={setLightboxItem}
              />
            ))}
          </div>
        )}
      </div>

      {/* Lightbox */}
      <Lightbox item={lightboxItem} onClose={() => setLightboxItem(null)} />
    </Layout>
  );
}
