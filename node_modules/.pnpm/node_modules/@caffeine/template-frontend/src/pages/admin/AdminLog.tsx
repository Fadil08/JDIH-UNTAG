import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as XLSX from "xlsx";
import { Link } from "@tanstack/react-router";
import {
  Activity,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Clock,
  Download,
  Filter,
  MapPin,
  RefreshCw,
  Search,
  User,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// ── Types ─────────────────────────────────────────────────────────────────────

interface LogEntry {
  id: string;
  waktu: string;
  lokasi: string;
  deskripsi: string;
  pelaku: string | null;
  peran: string | null;
  aksi: string;
  target: string | null;
  sumber: "activity" | "workflow";
}

interface LogMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface LogResponse {
  data: LogEntry[];
  meta: LogMeta;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const API_BASE = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

function getToken() {
  return localStorage.getItem("jdih_token");
}

async function fetchLogs(params: URLSearchParams): Promise<LogResponse> {
  const res = await fetch(`${API_BASE}/api/logs?${params}`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) throw new Error("Gagal mengambil log");
  return res.json();
}

async function fetchLokasiList(): Promise<string[]> {
  const res = await fetch(`${API_BASE}/api/logs/lokasi-list`, {
    headers: { Authorization: `Bearer ${getToken()}` },
  });
  if (!res.ok) return [];
  return res.json();
}

// Warna badge per lokasi/modul
const LOKASI_STYLE: Record<string, { bg: string; text: string; dot: string }> = {
  dokumen:  { bg: "bg-blue-50",   text: "text-blue-700",  dot: "bg-blue-500"  },
  berita:   { bg: "bg-amber-50",  text: "text-amber-700", dot: "bg-amber-500" },
  galeri:   { bg: "bg-violet-50", text: "text-violet-700",dot: "bg-violet-500"},
  kategori: { bg: "bg-teal-50",   text: "text-teal-700",  dot: "bg-teal-500"  },
  user:     { bg: "bg-orange-50", text: "text-orange-700",dot: "bg-orange-500"},
  role:     { bg: "bg-pink-50",   text: "text-pink-700",  dot: "bg-pink-500"  },
  auth:     { bg: "bg-green-50",  text: "text-green-700", dot: "bg-green-500" },
  settings: { bg: "bg-slate-50",  text: "text-slate-600", dot: "bg-slate-400" },
  tentang:  { bg: "bg-indigo-50", text: "text-indigo-700",dot: "bg-indigo-500"},
};

function lokasiBadge(lokasi: string) {
  const s = LOKASI_STYLE[lokasi.toLowerCase()] ?? {
    bg: "bg-gray-50", text: "text-gray-600", dot: "bg-gray-400",
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold capitalize ${s.bg} ${s.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${s.dot}`} />
      {lokasi}
    </span>
  );
}

function formatWaktu(iso: string) {
  const d = new Date(iso);
  return {
    tanggal: d.toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
    jam:     d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }),
    relative: timeAgo(d),
  };
}

function timeAgo(d: Date): string {
  const diffMs = Date.now() - d.getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  if (diffMin < 1)   return "baru saja";
  if (diffMin < 60)  return `${diffMin} menit lalu`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24)    return `${diffH} jam lalu`;
  const diffD = Math.floor(diffH / 24);
  if (diffD < 7)     return `${diffD} hari lalu`;
  return d.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
}

function peranBadge(peran: string | null) {
  if (!peran) return null;
  const map: Record<string, string> = {
    superadmin: "bg-red-100 text-red-700",
    admin:      "bg-orange-100 text-orange-700",
    staff:      "bg-zinc-100 text-zinc-600",
  };
  const cls = map[peran.toLowerCase()] ?? "bg-zinc-100 text-zinc-600";
  return (
    <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${cls}`}>
      {peran}
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function AdminLog() {
  const [page, setPage]               = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch]           = useState("");
  const [lokasi, setLokasi]           = useState("all");
  const [limit, setLimit]             = useState(20);

  const hasFilter = search !== "" || lokasi !== "all";

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const { data, isLoading, isError, refetch, isFetching } = useQuery<LogResponse>({
    queryKey: ["logs", page, limit, search, lokasi],
    queryFn: () => {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search)           params.set("search", search);
      if (lokasi !== "all") params.set("lokasi", lokasi);
      return fetchLogs(params);
    },
    staleTime: 15_000,
    placeholderData: (prev) => prev,
  });

  const { data: lokasiList = [] } = useQuery<string[]>({
    queryKey: ["logsLokasiList"],
    queryFn: fetchLokasiList,
    staleTime: 60_000,
  });

  const meta = data?.meta;
  const logs = data?.data ?? [];

  // ── Handlers ──────────────────────────────────────────────────────────────
  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput.trim());
    setPage(1);
  }

  function handleReset() {
    setSearch("");
    setSearchInput("");
    setLokasi("all");
    setPage(1);
  }

  function exportExcel() {
    if (!logs.length) return;
    
    const exportData = logs.map((l, index) => ({
      "No": index + 1,
      "Waktu": new Date(l.waktu).toLocaleString("id-ID"),
      "Lokasi": l.lokasi,
      "Pelaku": l.pelaku ?? "-",
      "Peran": l.peran ?? "-",
      "Aksi": l.aksi,
      "Deskripsi": l.deskripsi ?? "-"
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Data Log");
    
    const wscols = [
      {wch: 5}, {wch: 25}, {wch: 15}, {wch: 20}, {wch: 15}, {wch: 15}, {wch: 50}
    ];
    worksheet['!cols'] = wscols;

    XLSX.writeFile(workbook, `Laporan_Log_JDIH_${new Date().toISOString().split('T')[0]}.xlsx`);
  }

  // ── Page numbers ──────────────────────────────────────────────────────────
  function pageNumbers(current: number, total: number): number[] {
    if (total <= 5) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 4, 5];
    if (current >= total - 2) return [total - 4, total - 3, total - 2, total - 1, total];
    return [current - 2, current - 1, current, current + 1, current + 2];
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="container mx-auto px-4 py-6 space-y-6 max-w-6xl">

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-center gap-3">
          <Link
            to="/admin"
            className="p-2 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            title="Kembali ke Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="font-display font-bold text-xl text-foreground flex items-center gap-2">
              <Activity className="w-5 h-5 text-primary" />
              Log Aktivitas
            </h1>
            <p className="text-muted-foreground text-xs mt-0.5">
              Riwayat seluruh perubahan dan aktivitas pada sistem
              {meta && (
                <span className="ml-2 font-semibold text-foreground">
                  · {meta.total.toLocaleString("id-ID")} total entri
                </span>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-1.5 text-xs h-9"
            data-ocid="admin_log.refresh_button"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={exportExcel}
            disabled={!logs.length}
            className="gap-1.5 text-xs h-9 border-green-500 text-green-700 hover:bg-green-50 hover:text-green-800 hover:border-green-600 shadow-sm"
            data-ocid="admin_log.export_button"
          >
            <Download className="w-3.5 h-3.5" />
            Ekspor Excel
          </Button>
        </div>
      </div>

      {/* ── Filter Bar ─────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-sm">
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 flex-wrap items-end">

          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <label className="text-xs text-muted-foreground font-medium mb-1 block">Cari Deskripsi</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Cari aktivitas..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9 h-9 text-sm"
                data-ocid="admin_log.search_input"
              />
            </div>
          </div>

          {/* Lokasi */}
          <div className="min-w-[160px]">
            <label className="text-xs text-muted-foreground font-medium mb-1 block">Modul / Lokasi</label>
            <Select value={lokasi} onValueChange={(v) => { setLokasi(v); setPage(1); }}>
              <SelectTrigger className="h-9 text-sm" data-ocid="admin_log.lokasi_filter">
                <MapPin className="w-3.5 h-3.5 text-muted-foreground mr-1.5 flex-shrink-0" />
                <SelectValue placeholder="Semua" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Semua Lokasi</SelectItem>
                {lokasiList.map((l) => (
                  <SelectItem key={l} value={l} className="capitalize">{l}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Per halaman */}
          <div className="min-w-[120px]">
            <label className="text-xs text-muted-foreground font-medium mb-1 block">Per Halaman</label>
            <Select value={String(limit)} onValueChange={(v) => { setLimit(Number(v)); setPage(1); }}>
              <SelectTrigger className="h-9 text-sm" data-ocid="admin_log.limit_select">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {[10, 20, 50, 100].map((n) => (
                  <SelectItem key={n} value={String(n)}>{n} baris</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2">
            <Button type="submit" size="sm" className="h-9 gap-1.5 text-sm px-4" data-ocid="admin_log.search_button">
              <Filter className="w-3.5 h-3.5" />
              Terapkan
            </Button>
            {hasFilter && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="h-9 gap-1.5 text-xs text-muted-foreground border-dashed hover:text-foreground"
                data-ocid="admin_log.reset_button"
              >
                <X className="w-3.5 h-3.5" />
                Reset
              </Button>
            )}
          </div>
        </form>
      </div>

      {/* ── Tabel Log ──────────────────────────────────────────────────────── */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">

        {/* Summary bar */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border bg-muted/20">
          <p className="text-xs text-muted-foreground">
            {isLoading
              ? "Memuat data..."
              : meta
              ? `Halaman ${meta.page} dari ${meta.totalPages} · ${meta.total.toLocaleString("id-ID")} total entri`
              : "Tidak ada data"}
          </p>
          {isFetching && !isLoading && (
            <span className="text-[11px] text-muted-foreground/70 animate-pulse flex items-center gap-1">
              <RefreshCw className="w-3 h-3 animate-spin" /> Memperbarui...
            </span>
          )}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted/30 text-left border-b border-border">
                <th className="px-5 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap w-36">
                  <span className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5" /> Waktu
                  </span>
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap w-32">
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Lokasi
                  </span>
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Deskripsi Aktivitas
                </th>
                <th className="px-4 py-3 text-[11px] font-bold uppercase tracking-wider text-muted-foreground whitespace-nowrap w-40">
                  <span className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Dilakukan Oleh
                  </span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60">
              {isLoading ? (
                // Skeleton rows
                Array.from({ length: limit > 10 ? 10 : limit }).map((_, i) => (
                  <tr key={i} className={i % 2 === 1 ? "bg-muted/5" : ""}>
                    <td className="px-5 py-4">
                      <div className="space-y-1.5">
                        <div className="h-3 bg-muted animate-pulse rounded w-24" />
                        <div className="h-3 bg-muted animate-pulse rounded w-16 opacity-60" />
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-6 bg-muted animate-pulse rounded-full w-20" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 bg-muted animate-pulse rounded w-full max-w-sm" />
                    </td>
                    <td className="px-4 py-4">
                      <div className="h-3 bg-muted animate-pulse rounded w-24" />
                    </td>
                  </tr>
                ))
              ) : isError ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Activity className="w-10 h-10 text-muted-foreground/30" />
                      <p className="text-sm text-muted-foreground">Gagal memuat data log.</p>
                      <button
                        type="button"
                        onClick={() => refetch()}
                        className="text-primary text-xs underline"
                      >
                        Coba lagi
                      </button>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-5 py-16 text-center">
                    <div className="flex flex-col items-center gap-2">
                      <Activity className="w-10 h-10 text-muted-foreground/30" />
                      <p className="text-sm font-medium text-muted-foreground">Tidak ada log ditemukan</p>
                      {hasFilter && (
                        <button
                          type="button"
                          onClick={handleReset}
                          className="text-primary text-xs underline"
                        >
                          Hapus filter
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => {
                  const { tanggal, jam, relative } = formatWaktu(log.waktu);
                  return (
                    <tr
                      key={log.id}
                      className={`hover:bg-primary/[0.02] transition-colors ${idx % 2 === 1 ? "bg-muted/[0.03]" : ""}`}
                      data-ocid={`admin_log.row.${idx + 1}`}
                    >
                      {/* Waktu */}
                      <td className="px-5 py-4 align-top whitespace-nowrap">
                        <p className="text-xs font-semibold text-foreground">{tanggal}</p>
                        <p className="text-[11px] font-mono text-muted-foreground mt-0.5">{jam}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-0.5 italic">{relative}</p>
                      </td>

                      {/* Lokasi */}
                      <td className="px-4 py-4 align-top whitespace-nowrap">
                        {lokasiBadge(log.lokasi)}
                        {log.sumber === "workflow" && (
                          <p className="text-[10px] text-muted-foreground/60 mt-1 italic">workflow</p>
                        )}
                      </td>

                      {/* Deskripsi */}
                      <td className="px-4 py-4 align-top max-w-md">
                        <p className="text-sm text-foreground leading-relaxed">{log.deskripsi}</p>
                      </td>

                      {/* Pelaku */}
                      <td className="px-4 py-4 align-top">
                        {log.pelaku ? (
                          <div className="flex items-start gap-2">
                            <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-[11px] font-bold text-primary flex-shrink-0 mt-0.5">
                              {log.pelaku[0]?.toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-medium text-foreground leading-tight">{log.pelaku}</p>
                              {log.peran && (
                                <div className="mt-1">{peranBadge(log.peran)}</div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">Sistem</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── Pagination ─────────────────────────────────────────────────────── */}
      {meta && meta.totalPages > 1 && (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-muted-foreground">
            Halaman <span className="font-bold text-foreground">{meta.page}</span> dari{" "}
            <span className="font-bold text-foreground">{meta.totalPages}</span>
            {" "}({meta.total.toLocaleString("id-ID")} entri)
          </p>

          <div className="flex items-center gap-1">
            <Button
              variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setPage(1)} disabled={page <= 1}
              title="Halaman pertama"
            >
              <ChevronsLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1}
              title="Halaman sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {pageNumbers(meta.page, meta.totalPages).map((p) => (
              <Button
                key={p}
                variant={p === page ? "default" : "outline"}
                size="icon"
                className={`h-8 w-8 text-xs ${p === page ? "" : "text-muted-foreground"}`}
                onClick={() => setPage(p)}
                data-ocid={`admin_log.page_${p}`}
              >
                {p}
              </Button>
            ))}

            <Button
              variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))} disabled={page >= meta.totalPages}
              title="Halaman berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline" size="icon" className="h-8 w-8"
              onClick={() => setPage(meta.totalPages)} disabled={page >= meta.totalPages}
              title="Halaman terakhir"
            >
              <ChevronsRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
