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
import { Separator } from "@/components/ui/separator";
import { Link, useSearch } from "@tanstack/react-router";
import {
  ChevronDown,
  ChevronUp,
  FileText,
  RotateCcw,
  Search,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Layout } from "../components/layout/Layout";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { KategoriTag } from "../components/ui/KategoriTag";
import { SkeletonList } from "../components/ui/LoadingSpinner";
import { PageHeader } from "../components/ui/PageHeader";
import { StatusBadge } from "../components/ui/StatusBadge";
import { useDokumen, useKategori, useStatus } from "../hooks/useBackend";
import { useSEO } from "../hooks/useSEO";
import type { FilterDokumen, JenisDokumen, StatusDokumen } from "../api";
import { JENIS_LABEL, TAHUN_OPTIONS } from "../types";

// ─── Item keys (static, avoids index variable) ───────────────────────────────

const ITEM_KEYS = [
  "1",
  "2",
  "3",
  "4",
  "5",
  "6",
  "7",
  "8",
  "9",
  "10",
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "20",
  "21",
  "22",
  "23",
  "24",
  "25",
  "26",
  "27",
  "28",
  "29",
  "30",
];

// ─── Filter Panel ─────────────────────────────────────────────────────────────

interface FilterKategoriItem {
  id: string | number;
  nama: string;
}

interface FilterPanelProps {
  filter: FilterDokumen;
  onFilterChange: (f: Partial<FilterDokumen>) => void;
  onReset: () => void;
  kategoriList: FilterKategoriItem[];
  statusList: { id: number | string; nama: string }[];
}

function FilterPanel({
  filter,
  onFilterChange,
  onReset,
  kategoriList,
  statusList,
}: FilterPanelProps) {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label htmlFor="filter-jenis" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Jenis Dokumen
        </Label>
        <Select
          value={filter.jenis || "semua"}
          onValueChange={(v) =>
            onFilterChange({ jenis: v === "semua" ? "" : v })
          }
        >
          <SelectTrigger
            id="filter-jenis"
            className="w-full bg-background"
            data-ocid="katalog.filter_jenis.select"
          >
            <SelectValue placeholder="Semua Jenis" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Jenis</SelectItem>
            {kategoriList.map((k) => (
              <SelectItem key={String(k.id)} value={String(k.id)}>
                {k.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-tahun" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Tahun
        </Label>
        <Select
          value={filter.tahun?.toString() || "semua"}
          onValueChange={(v) =>
            onFilterChange({ tahun: v === "semua" ? "" : Number(v) })
          }
        >
          <SelectTrigger
            id="filter-tahun"
            className="w-full bg-background"
            data-ocid="katalog.filter_tahun.select"
          >
            <SelectValue placeholder="Semua Tahun" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Tahun</SelectItem>
            {TAHUN_OPTIONS.map((y) => (
              <SelectItem key={y} value={y.toString()}>
                {y}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="filter-status" className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Status
        </Label>
        <Select
          value={filter.status || "semua"}
          onValueChange={(v) =>
            onFilterChange({
              status: v === "semua" ? "" : v,
            })
          }
        >
          <SelectTrigger
            id="filter-status"
            className="w-full bg-background"
            data-ocid="katalog.filter_status.select"
          >
            <SelectValue placeholder="Semua Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="semua">Semua Status</SelectItem>
            {statusList.map((st) => (
              <SelectItem key={st.id} value={st.nama}>
                {st.nama}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Separator />

      <Button
        variant="outline"
        size="sm"
        className="w-full gap-2 text-muted-foreground hover:text-foreground"
        onClick={onReset}
        data-ocid="katalog.reset_filter.button"
      >
        <RotateCcw className="w-3.5 h-3.5" />
        Reset Filter
      </Button>
    </div>
  );
}

// ─── Desktop Table Row ────────────────────────────────────────────────────────

interface DokumenRowProps {
  id: string | number;
  slug: string;
  judul: string;
  nomor: string;
  kategoriNama: string | null;
  tahun: number;
  status: StatusDokumen;
  keyIndex: string;
}

function DokumenRow({
  id,
  slug,
  judul,
  nomor,
  kategoriNama,
  tahun,
  status,
  keyIndex,
}: DokumenRowProps) {
  return (
    <tr
      className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors"
      data-ocid={`katalog.item.${keyIndex}`}
    >
      <td className="px-4 py-3.5">
        <div className="min-w-0">
          <Link
            to="/katalog/$slug"
            params={{ slug: slug }}
            className="font-semibold text-sm text-foreground hover:text-accent transition-colors line-clamp-2 leading-snug"
            data-ocid={`katalog.judul_link.${keyIndex}`}
          >
            {judul}
          </Link>
          <p className="font-doc-number text-muted-foreground text-xs mt-0.5 truncate">
            {nomor}
          </p>
        </div>
      </td>
      <td className="px-4 py-3.5 hidden md:table-cell">
        <KategoriTag nama={kategoriNama ?? "-"} />
      </td>
      <td className="px-4 py-3.5 hidden sm:table-cell text-sm text-center text-muted-foreground font-medium">
        {tahun}
      </td>
      <td className="px-4 py-3.5">
        <StatusBadge status={status} />
      </td>
      <td className="px-4 py-3.5 text-right">
        <Button
          asChild
          size="sm"
          className="bg-accent hover:bg-accent/90 text-accent-foreground text-xs h-8 px-3"
          data-ocid={`katalog.detail_button.${keyIndex}`}
        >
          <Link to="/katalog/$slug" params={{ slug: slug }}>
            Detail
          </Link>
        </Button>
      </td>
    </tr>
  );
}

// ─── Mobile Card ──────────────────────────────────────────────────────────────

interface DokumenCardProps {
  id: string | number;
  slug: string;
  judul: string;
  nomor: string;
  kategoriNama: string | null;
  tahun: number;
  status: StatusDokumen;
  keyIndex: string;
}

function DokumenCard({
  id,
  slug,
  judul,
  nomor,
  kategoriNama,
  tahun,
  status,
  keyIndex,
}: DokumenCardProps) {
  return (
    <div
      className="bg-card border border-border rounded-lg p-4 shadow-card"
      data-ocid={`katalog.item.${keyIndex}`}
    >
      <Link
        to="/katalog/$slug"
        params={{ slug: slug }}
        className="block font-semibold text-sm text-foreground hover:text-accent transition-colors leading-snug mb-1"
        data-ocid={`katalog.judul_link.${keyIndex}`}
      >
        {judul}
      </Link>
      <p className="font-doc-number text-muted-foreground text-xs mb-3 truncate">
        {nomor}
      </p>
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <KategoriTag nama={kategoriNama ?? "-"} />
        <span className="text-xs text-muted-foreground">{tahun}</span>
        <StatusBadge status={status} />
      </div>
      <Button
        asChild
        size="sm"
        className="w-full bg-accent hover:bg-accent/90 text-accent-foreground text-xs h-8"
        data-ocid={`katalog.detail_button.${keyIndex}`}
      >
        <Link to="/katalog/$slug" params={{ slug: slug }}>
          Lihat Detail
        </Link>
      </Button>
    </div>
  );
}

// ─── Jenis options fallback (from JENIS_LABEL) ────────────────────────────────

const JENIS_FILTER_ITEMS = Object.entries(JENIS_LABEL).map(([key, label]) => ({
  id: key,
  nama: label,
}));

// ─── Default filter ───────────────────────────────────────────────────────────

const DEFAULT_FILTER: FilterDokumen = {};

// ─── Main Page ────────────────────────────────────────────────────────────────

export function Katalog() {
  useSEO({
    title: "Katalog Hukum",
    description: "Cari dan temukan berbagai produk hukum seperti Peraturan, Keputusan, dan Surat Edaran di lingkungan UNTAG Banyuwangi."
  });

  const searchParams = useSearch({ strict: false }) as any;
  // ?q=<query text>  and  ?kategori=<category display name>
  const initialQuery = searchParams?.q || "";
  const urlKategoriNama: string = searchParams?.kategori || "";

  const [filter, setFilter] = useState<FilterDokumen>({ ...DEFAULT_FILTER, query: initialQuery });
  const [inputQuery, setInputQuery] = useState(initialQuery);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const { data: dokumenList, isLoading, isError, refetch } = useDokumen(filter);
  const { data: kategoriList } = useKategori();
  const { data: statusList } = useStatus();

  // Once kategoriList is loaded, resolve the URL category name to its DB ID and apply filter
  useEffect(() => {
    if (!urlKategoriNama || !kategoriList || kategoriList.length === 0) return;
    const match = kategoriList.find(
      (k) => k.nama.toLowerCase() === urlKategoriNama.toLowerCase(),
    );
    if (match) {
      setFilter((prev) => ({
        ...prev,
        jenis: String(match.id),
        kategoriId: Number(match.id),
      }));
    }
  }, [urlKategoriNama, kategoriList]);

  // Sync ?q= changes
  useEffect(() => {
    const q = searchParams?.q || "";
    setInputQuery(q);
    setFilter((prev) => ({ ...prev, query: q }));
  }, [searchParams?.q]);

  const filterKategoriItems =
    kategoriList && kategoriList.length > 0
      ? kategoriList.map((k) => ({ id: k.id, nama: k.nama }))
      : JENIS_FILTER_ITEMS;

  const handleSearch = () => {
    setFilter((prev) => ({ ...prev, query: inputQuery }));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleSearch();
  };

  const handleFilterChange = (partial: Partial<FilterDokumen>) => {
    setFilter((prev) => {
      const next = { ...prev, ...partial };
      // Map 'jenis' (which is category ID from UI) to 'kategoriId' for API
      if (partial.jenis !== undefined) {
        next.kategoriId = partial.jenis === "" ? undefined : Number(partial.jenis);
      }
      return next;
    });
  };

  const handleReset = () => {
    setFilter(DEFAULT_FILTER);
    setInputQuery("");
  };

  const results = dokumenList ?? [];
  const totalHasil = results.length;
  const hasActiveFilter = !!(
    filter.query ||
    filter.jenis ||
    filter.tahun ||
    filter.status
  );

  return (
    <Layout>
      <PageHeader
        title="Katalog Produk Hukum"
        description="Telusuri dan unduh dokumen peraturan, keputusan, surat edaran, dan produk hukum lainnya dari UNTAG Banyuwangi."
        breadcrumbs={[{ label: "Katalog Produk Hukum" }]}
      />

      <div className="container mx-auto px-4 py-6">
        {/* Search Bar */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6 shadow-subtle">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                value={inputQuery}
                onChange={(e) => setInputQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Cari berdasarkan judul, nomor, atau kata kunci..."
                className="pl-9 bg-background"
                data-ocid="katalog.search_input"
              />
            </div>
            <Button
              onClick={handleSearch}
              className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2 px-5 flex-shrink-0"
              data-ocid="katalog.search_button"
            >
              <Search className="w-4 h-4" />
              <span className="hidden sm:inline">Cari</span>
            </Button>
          </div>
        </div>

        <div className="flex gap-6">
          {/* ── Sidebar Filter (Desktop) ─── */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="bg-card border border-border rounded-lg p-5 shadow-subtle sticky top-4">
              <h2 className="font-display font-semibold text-sm text-foreground mb-4 uppercase tracking-wide">
                Filter Dokumen
              </h2>
              <FilterPanel
                filter={filter}
                onFilterChange={handleFilterChange}
                onReset={handleReset}
                kategoriList={filterKategoriItems}
                statusList={statusList ?? []}
              />
            </div>
          </aside>

          {/* ── Main Content ─── */}
          <div className="flex-1 min-w-0">
            {/* Mobile Filter Toggle */}
            <div className="lg:hidden mb-4">
              <Button
                variant="outline"
                size="sm"
                className="gap-2 w-full justify-between"
                onClick={() => setMobileFilterOpen((v) => !v)}
                data-ocid="katalog.mobile_filter.toggle"
              >
                <span className="font-medium">Filter Dokumen</span>
                {mobileFilterOpen ? (
                  <ChevronUp className="w-4 h-4" />
                ) : (
                  <ChevronDown className="w-4 h-4" />
                )}
              </Button>

              {mobileFilterOpen && (
                <div className="mt-2 bg-card border border-border rounded-lg p-4 shadow-subtle">
                  <FilterPanel
                    filter={filter}
                    onFilterChange={handleFilterChange}
                    onReset={handleReset}
                    kategoriList={filterKategoriItems}
                    statusList={statusList ?? []}
                  />
                </div>
              )}
            </div>

            {/* Result Count */}
            {!isLoading && !isError && (
              <div className="flex items-center justify-between mb-4">
                <p
                  className="text-sm text-muted-foreground"
                  data-ocid="katalog.result_count"
                >
                  Ditemukan{" "}
                  <span className="font-semibold text-foreground">
                    {totalHasil}
                  </span>{" "}
                  dokumen
                </p>
                {hasActiveFilter && (
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-accent hover:underline flex items-center gap-1"
                    data-ocid="katalog.reset_filter_inline.button"
                  >
                    <RotateCcw className="w-3 h-3" />
                    Reset Filter
                  </button>
                )}
              </div>
            )}

            {/* Loading */}
            {isLoading && <SkeletonList count={6} />}

            {/* Error */}
            {isError && !isLoading && <ErrorState onRetry={() => refetch()} />}

            {/* Empty */}
            {!isLoading && !isError && results.length === 0 && (
              <div
                className="bg-card border border-border rounded-lg"
                data-ocid="katalog.empty_state"
              >
                <EmptyState
                  icon={<FileText className="w-8 h-8 text-muted-foreground" />}
                  title="Dokumen tidak ditemukan"
                  description="Coba ubah kata kunci pencarian atau reset filter untuk melihat semua dokumen."
                  actionLabel="Reset Filter"
                  onAction={handleReset}
                />
              </div>
            )}

            {/* Desktop Table */}
            {!isLoading && !isError && results.length > 0 && (
              <>
                <div className="hidden sm:block bg-card border border-border rounded-lg overflow-hidden shadow-subtle">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-secondary border-b border-border">
                        <th className="px-4 py-3 text-left font-semibold text-secondary-foreground text-xs uppercase tracking-wide">
                          Judul / Nomor
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-secondary-foreground text-xs uppercase tracking-wide hidden md:table-cell">
                          Jenis
                        </th>
                        <th className="px-4 py-3 text-center font-semibold text-secondary-foreground text-xs uppercase tracking-wide hidden sm:table-cell w-20">
                          Tahun
                        </th>
                        <th className="px-4 py-3 text-left font-semibold text-secondary-foreground text-xs uppercase tracking-wide w-32">
                          Status
                        </th>
                        <th className="px-4 py-3 text-right font-semibold text-secondary-foreground text-xs uppercase tracking-wide w-24">
                          Aksi
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {results.map((doc, idx) => (
                        <DokumenRow
                          key={doc.id}
                          id={String(doc.id)}
                          slug={doc.slug}
                          judul={doc.judul}
                          nomor={doc.nomor}
                          kategoriNama={doc.kategoriNama ?? '-'}
                          tahun={doc.tahun}
                          status={doc.status}
                          keyIndex={ITEM_KEYS[idx] ?? String(idx + 1)}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile Cards */}
                <div className="sm:hidden space-y-3">
                  {results.map((doc, idx) => (
                    <DokumenCard
                      key={doc.id}
                      id={String(doc.id)}
                      slug={doc.slug}
                      judul={doc.judul}
                      nomor={doc.nomor}
                      kategoriNama={doc.kategoriNama ?? '-'}
                      tahun={doc.tahun}
                      status={doc.status}
                      keyIndex={ITEM_KEYS[idx] ?? String(idx + 1)}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}
