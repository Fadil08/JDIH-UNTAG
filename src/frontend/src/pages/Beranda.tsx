import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "@tanstack/react-router";
import { useNavigate } from "@tanstack/react-router";
import {
  ArrowRight,
  BookOpen,
  Calendar,
  ChevronRight,
  Download,
  FileText,
  Gavel,
  ImageIcon,
  Newspaper,
  Scale,
  Search,
  TrendingUp,
  X,
} from "lucide-react";
import { useState } from "react";
import { Layout } from "../components/layout/Layout";
import { formatTanggalIndonesia } from "../lib/utils";
import { KategoriTag } from "../components/ui/KategoriTag";
import { SkeletonCard } from "../components/ui/LoadingSpinner";
import { StatusBadge } from "../components/ui/StatusBadge";
import {
  useBerita,
  useDokumen,
  useGaleri,
  useStatistik,
} from "../hooks/useBackend";
import { getFileUrl } from "../api";
import { useSEO } from "../hooks/useSEO";
import type { GaleriItem } from "../types";
import { JENIS_LABEL } from "../types";

// ─── Static Data ──────────────────────────────────────────────────────────────

const KATEGORI_ICONS = [Gavel, FileText, Scale, BookOpen, Scale, TrendingUp];

const SKELETON_KEYS = ["sa", "sb", "sc", "sd", "se", "sf"] as const;
const BERITA_SKELETON_KEYS = ["ba", "bb", "bc"] as const;
const GALERI_SKELETON_KEYS = ["ga", "gb", "gc", "gd", "ge", "gf"] as const;

// ─── Galeri Preview Sub-components ────────────────────────────────────────────

function GaleriPreviewCard({
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
      data-ocid={`beranda.galeri_card.${index}`}
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
        <div className="w-full h-full flex items-center justify-center bg-secondary/40">
          <ImageIcon className="w-10 h-10 text-muted-foreground/40" />
        </div>
      )}
      {/* Hover overlay */}
      <div className="absolute inset-0 bg-foreground/0 group-hover:bg-foreground/50 transition-all duration-300 flex flex-col justify-end p-3 opacity-0 group-hover:opacity-100">
        <Badge className="self-start bg-primary text-primary-foreground text-xs mb-1.5 pointer-events-none">
          {item.album}
        </Badge>
        <p className="text-white text-xs font-semibold leading-snug line-clamp-2 text-left">
          {item.judul}
        </p>
      </div>
    </button>
  );
}

function GaleriLightbox({
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
        data-ocid="beranda.galeri_lightbox_dialog"
      >
        <div className="relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-3 right-3 z-10 bg-foreground/60 hover:bg-foreground/80 text-white rounded-full p-1.5 transition-colors"
            aria-label="Tutup"
            data-ocid="beranda.galeri_lightbox.close_button"
          >
            <X className="w-4 h-4" />
          </button>
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

// ─── Component ────────────────────────────────────────────────────────────────

export function Beranda() {
  useSEO({
    title: "Beranda",
    description: "Selamat datang di Jaringan Dokumentasi dan Informasi Hukum (JDIH) UNTAG Banyuwangi. Portal resmi produk hukum, peraturan, dan informasi legal universitas."
  });
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { data: statistik, isLoading: loadingStats } = useStatistik();
  const { data: dokumen, isLoading: loadingDokumen } = useDokumen({});
  const { data: berita, isLoading: loadingBerita } = useBerita();
  const { data: galeriItems, isLoading: loadingGaleri } = useGaleri();
  const [galeriLightbox, setGaleriLightbox] = useState<GaleriItem | null>(null);

  const galeriPreview = (galeriItems ?? []).slice(0, 6);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    navigate({ to: "/katalog", search: { q: searchQuery } });
  };

  const STATS = [
    {
      key: "total-dokumen",
      label: "Total Dokumen",
      value: statistik?.totalDokumen ?? 35,
      icon: FileText,
      color: "text-primary",
    },
    {
      key: "total-unduhan",
      label: "Total Unduhan",
      value: statistik?.totalUnduhan ?? 1248,
      icon: Download,
      color: "text-accent",
    },
    {
      key: "kategori",
      label: "Kategori Produk Hukum",
      value: statistik?.totalKategori ?? 6,
      icon: BookOpen,
      color: "text-primary",
    },
    {
      key: "artikel-berita",
      label: "Artikel Berita",
      value: statistik?.totalArtikel ?? 12,
      icon: Newspaper,
      color: "text-accent",
    },
  ];

  return (
    <Layout>
      {/* ── Hero Section ─────────────────────────────────────────────────── */}
      <section
        className="relative overflow-hidden"
        style={{
          backgroundImage:
            "url('https://images.unsplash.com/photo-1568667256531-ffffff2a9eab?w=1920&q=80')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        data-ocid="beranda.hero_section"
      >
        {/* Modern blur gradient overlay instead of solid dark red */}
        <div
          className="absolute inset-0 bg-gradient-to-br from-primary/95 via-primary/80 to-accent/90 backdrop-blur-[2px]"
        />
        {/* Decorative pattern overlay */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-[20%] -right-[10%] w-[50%] h-[70%] bg-white/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-[20%] -left-[10%] w-[50%] h-[70%] bg-white/10 rounded-full blur-[100px]" />
        </div>

        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-3xl mx-auto text-center">
            {/* Eyebrow tag */}
            <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-md border border-white/30 text-white text-xs font-semibold px-4 py-2 rounded-full mb-8 shadow-[0_4px_24px_rgba(0,0,0,0.1)] animate-in fade-in slide-in-from-bottom-4 duration-500">
              <Scale className="w-3.5 h-3.5" />
              Portal Resmi JDIH UNTAG Banyuwangi
            </div>

            {/* Headline */}
            <h1 className="font-display font-bold text-3xl md:text-5xl text-primary-foreground leading-tight mb-4">
              Portal Dokumentasi <br className="hidden sm:block" />
              <span className="text-accent-foreground/90">Hukum</span> Kampus
            </h1>

            <p className="text-primary-foreground/75 text-base md:text-lg max-w-2xl mx-auto mb-10 leading-relaxed">
              Akses mudah produk hukum Universitas 17 Agustus 1945 Banyuwangi —
              statuta, peraturan rektor, keputusan, surat edaran, dan dokumen
              hukum lainnya secara transparan dan terpadu.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
              <Button
                asChild
                size="lg"
                className="bg-white text-primary hover:bg-white/90 font-bold px-8 h-14 rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300 gap-2 w-full sm:w-auto"
                data-ocid="beranda.cari_dokumen_button"
              >
                <Link to="/katalog">
                  <Search className="w-4 h-4" />
                  Cari Dokumen
                </Link>
              </Button>
              <Button
                asChild
                size="lg"
                variant="outline"
                className="border-white/40 text-white bg-white/10 backdrop-blur-md hover:bg-white/20 font-bold px-8 h-14 rounded-full gap-2 w-full sm:w-auto transition-all duration-300 hover:-translate-y-1"
                data-ocid="beranda.tentang_jdih_button"
              >
                <Link to="/tentang">
                  <BookOpen className="w-4 h-4" />
                  Tentang JDIH
                </Link>
              </Button>
            </div>

            {/* Inline Search */}
            <form
              onSubmit={handleSearch}
              className="flex gap-2 max-w-2xl mx-auto bg-white/20 backdrop-blur-xl p-2 rounded-full border border-white/30 shadow-[0_8px_30px_rgb(0,0,0,0.1)] animate-in fade-in slide-in-from-bottom-8 duration-1000"
              data-ocid="beranda.search_form"
            >
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/70 pointer-events-none" />
                <Input
                  type="text"
                  placeholder="Cari dokumen hukum... (misal: Statuta UNTAG)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-12 h-14 text-white placeholder:text-white/60 bg-transparent border-0 shadow-none text-base focus-visible:ring-0"
                  data-ocid="beranda.search_input"
                />
              </div>
              <Button
                type="submit"
                className="h-14 px-8 rounded-full bg-white text-primary hover:bg-white/90 font-bold gap-2 shrink-0 shadow-sm transition-transform active:scale-95"
                data-ocid="beranda.search_submit_button"
              >
                <Search className="w-4 h-4" />
                <span className="hidden sm:inline">Cari</span>
              </Button>
            </form>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ────────────────────────────────────────────────────── */}
      <section
        className="bg-card border-b border-border shadow-subtle"
        data-ocid="beranda.stats_section"
      >
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            {STATS.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.key}
                  className="py-6 px-4 flex items-center gap-3"
                  data-ocid={`beranda.stat_card.${stat.key}`}
                >
                  <div className="w-10 h-10 bg-primary/8 rounded-lg flex items-center justify-center flex-shrink-0 hidden sm:flex">
                    <Icon className={`w-5 h-5 ${stat.color}`} />
                  </div>
                  <div>
                    {loadingStats ? (
                      <div className="skeleton h-6 w-12 mb-1" />
                    ) : (
                      <div className="text-2xl font-display font-bold text-foreground leading-none mb-1">
                        {stat.value.toLocaleString("id-ID")}
                      </div>
                    )}
                    <div className="text-xs text-muted-foreground font-medium leading-tight">
                      {stat.label}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Kategori Section ─────────────────────────────────────────────── */}
      <section
        className="py-12 bg-secondary/30"
        data-ocid="beranda.kategori_section"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">
                Kategori Produk Hukum
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Telusuri berdasarkan jenis dokumen
              </p>
            </div>
            <Link
              to="/katalog"
              className="text-accent text-sm font-semibold hover:underline flex items-center gap-1 transition-smooth"
              data-ocid="beranda.kategori_semua_link"
            >
              Lihat Semua <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {Object.entries(JENIS_LABEL).map(([key, label], idx) => {
              const Icon = KATEGORI_ICONS[idx] ?? FileText;
              return (
                <Link
                  key={key}
                  to="/katalog"
                  className="bg-card border border-border rounded-lg p-4 text-center hover:border-primary/40 hover:shadow-card transition-smooth group flex flex-col items-center gap-2"
                  data-ocid={`beranda.kategori_card.${idx + 1}`}
                >
                  <div className="w-10 h-10 bg-primary/8 rounded-lg flex items-center justify-center group-hover:bg-primary/15 transition-smooth">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="text-xs font-semibold text-foreground leading-snug group-hover:text-primary transition-smooth text-center">
                    {label}
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── Dokumen Terbaru ──────────────────────────────────────────────── */}
      <section
        className="py-12 bg-background"
        data-ocid="beranda.dokumen_terbaru_section"
      >
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">
                Dokumen Terbaru
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Produk hukum yang baru diterbitkan
              </p>
            </div>
            <Link
              to="/katalog"
              className="text-accent text-sm font-semibold hover:underline flex items-center gap-1 transition-smooth"
              data-ocid="beranda.dokumen_semua_link"
            >
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {loadingDokumen
              ? SKELETON_KEYS.map((k) => <SkeletonCard key={k} />)
              : (dokumen ?? []).slice(0, 6).map((doc, idx) => (
                  <div
                    key={doc.id}
                    className="bg-card border border-border rounded-lg p-5 hover:shadow-card hover:border-border/60 transition-smooth flex flex-col"
                    data-ocid={`beranda.dokumen_card.${idx + 1}`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <KategoriTag nama={doc.kategoriNama ?? '-'} />
                      <StatusBadge status={doc.status} />
                    </div>

                    {/* Judul */}
                    <h3 className="font-semibold text-foreground text-sm leading-snug mb-2 flex-1 line-clamp-3">
                      {doc.judul}
                    </h3>

                    {/* Nomor dokumen */}
                    <p className="font-doc-number text-muted-foreground mb-3 truncate">
                      {doc.nomor}
                    </p>

                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-4 gap-2">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Tahun {doc.tahun}
                      </span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-auto">
                      <Button
                        asChild
                        size="sm"
                        className="flex-1 bg-accent hover:bg-accent/90 text-accent-foreground gap-1.5 text-xs"
                        data-ocid={`beranda.unduh_button.${idx + 1}`}
                      >
                        <Link to="/katalog/$slug" params={{ slug: doc.slug }}>
                          <Download className="w-3.5 h-3.5" />
                          Unduh PDF
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        size="sm"
                        className="border-border text-xs hover:border-primary/40 hover:text-primary transition-smooth"
                        data-ocid={`beranda.detail_button.${idx + 1}`}
                      >
                        <Link to="/katalog/$slug" params={{ slug: doc.slug }}>
                          Detail
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
          </div>

          {/* Bottom CTA */}
          <div className="text-center mt-8">
            <Button
              asChild
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-smooth font-semibold gap-2"
              data-ocid="beranda.lihat_semua_dokumen_button"
            >
              <Link to="/katalog">
                Lihat Semua Dokumen
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Berita & Pengumuman ──────────────────────────────────────────── */}
      <section className="py-12 bg-muted/40" data-ocid="beranda.berita_section">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">
                Berita & Pengumuman
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Informasi terkini seputar JDIH UNTAG Banyuwangi
              </p>
            </div>
            <Link
              to="/berita"
              className="text-accent text-sm font-semibold hover:underline flex items-center gap-1 transition-smooth"
              data-ocid="beranda.berita_semua_link"
            >
              Lihat Semua <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingBerita ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {BERITA_SKELETON_KEYS.map((k) => (
                <div
                  key={k}
                  className="bg-card border border-border rounded-lg p-5 animate-pulse space-y-3"
                >
                  <div className="skeleton h-3 w-24" />
                  <div className="skeleton h-4 w-full" />
                  <div className="skeleton h-4 w-4/5" />
                  <div className="skeleton h-3 w-full" />
                  <div className="skeleton h-3 w-3/4" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {(berita ?? []).slice(0, 3).map((artikel, idx) => (
                <Link
                  key={artikel.id}
                  to="/berita/$id"
                  params={{ id: String(artikel.id) }}
                  className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-card hover:border-border/60 transition-smooth flex flex-col group"
                  data-ocid={`beranda.berita_card.${idx + 1}`}
                >
                  {/* Image placeholder */}
                  <div className="w-full h-40 bg-secondary/50 flex items-center justify-center flex-shrink-0 border-b border-border relative overflow-hidden">
                    <Newspaper className="w-12 h-12 text-muted-foreground/25" />
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
                  </div>

                  {/* Content */}
                  <div className="p-5 flex-1 flex flex-col">
                    <div className="flex items-center gap-2 mb-3">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                      <p className="text-xs text-muted-foreground font-medium">
                        {formatTanggalIndonesia(artikel.tanggalPublikasi ?? artikel.tanggal)}
                      </p>
                    </div>

                    <h3 className="font-display font-semibold text-foreground text-sm leading-snug mb-2 group-hover:text-primary transition-smooth line-clamp-2 flex-1">
                      {artikel.judul}
                    </h3>

                    <p className="text-muted-foreground text-xs leading-relaxed line-clamp-3 mb-4">
                      {(artikel.ringkasan ?? "").length > 150
                        ? `${(artikel.ringkasan ?? "").substring(0, 150)}...`
                        : (artikel.ringkasan ?? "")}
                    </p>

                    <div className="flex items-center gap-1 text-xs text-accent font-semibold group-hover:gap-2 transition-smooth mt-auto">
                      Baca Selengkapnya
                      <ArrowRight className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Bottom CTA */}
          <div className="text-center mt-8">
            <Button
              asChild
              variant="outline"
              className="border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50 transition-smooth font-semibold gap-2"
              data-ocid="beranda.lihat_semua_berita_button"
            >
              <Link to="/berita">
                Lihat Semua Berita
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Banner Kontak ─────────────────────────────────────────────────── */}
      <section
        className="py-12 bg-primary mb-10"
        data-ocid="beranda.banner_section"
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="font-display font-bold text-xl md:text-2xl text-primary-foreground mb-3">
            Butuh Bantuan?
          </h2>
          <p className="text-primary-foreground/70 text-sm max-w-md mx-auto mb-7 leading-relaxed">
            Tim JDIH UNTAG Banyuwangi siap membantu Anda menemukan dokumen hukum
            yang dibutuhkan.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              size="lg"
              className="bg-accent hover:bg-accent/90 text-accent-foreground font-semibold gap-2 w-full sm:w-auto"
              data-ocid="beranda.hubungi_kami_button"
            >
              <Link to="/kontak">
                Hubungi Kami
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="border-primary-foreground/40 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 font-semibold gap-2 w-full sm:w-auto"
              data-ocid="beranda.katalog_button"
            >
              <Link to="/katalog">Lihat Katalog Dokumen</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* ── Galeri Preview ───────────────────────────────────────────────── */}
      <section
        className="py-14 bg-background border-t border-border"
        data-ocid="beranda.galeri_section"
      >
        <div className="container mx-auto px-4">
          {/* Section header */}
          <div className="flex items-center justify-between mb-7">
            <div>
              <h2 className="font-display font-bold text-xl text-foreground">
                Galeri
              </h2>
              <p className="text-muted-foreground text-sm mt-1">
                Dokumentasi kegiatan dan fasilitas kampus UNTAG Banyuwangi
              </p>
            </div>
            <Link
              to="/galeri"
              className="text-primary text-sm font-semibold hover:underline flex items-center gap-1 transition-smooth"
              data-ocid="beranda.galeri_semua_link"
            >
              Lihat Semua <ChevronRight className="w-4 h-4" />
            </Link>
          </div>

          {/* Grid */}
          {loadingGaleri ? (
            <div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
              data-ocid="beranda.galeri_loading_state"
            >
              {GALERI_SKELETON_KEYS.map((k) => (
                <Skeleton key={k} className="aspect-square rounded-lg" />
              ))}
            </div>
          ) : galeriPreview.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-16 text-center"
              data-ocid="beranda.galeri_empty_state"
            >
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <ImageIcon className="w-8 h-8 text-muted-foreground/40" />
              </div>
              <p className="text-foreground font-semibold mb-1">
                Belum ada foto tersedia
              </p>
              <p className="text-muted-foreground text-sm">
                Foto kegiatan akan ditampilkan di sini setelah diunggah oleh
                admin.
              </p>
            </div>
          ) : (
            <div
              className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3"
              data-ocid="beranda.galeri_foto_list"
            >
              {galeriPreview.map((item, idx) => (
                <GaleriPreviewCard
                  key={item.id}
                  item={item}
                  index={idx + 1}
                  onOpen={setGaleriLightbox}
                />
              ))}
            </div>
          )}

          {/* Bottom CTA */}
          <div className="text-center mt-8">
            <Button
              asChild
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold gap-2 px-8"
              data-ocid="beranda.lihat_semua_galeri_button"
            >
              <Link to="/galeri">
                Lihat Semua Foto
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Lightbox for galeri preview */}
      <GaleriLightbox
        item={galeriLightbox}
        onClose={() => setGaleriLightbox(null)}
      />
    </Layout>
  );
}
