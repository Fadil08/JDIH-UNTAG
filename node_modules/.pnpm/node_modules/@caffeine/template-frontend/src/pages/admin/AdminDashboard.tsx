
import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import {
  Bell,
  Download,
  FileText,
  FolderOpen,
  Newspaper,
  Plus,
  ScrollText,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

import { Skeleton } from "../../components/ui/skeleton";
import { useBerita, useStatistik } from "../../hooks/useBackend";
import api from "../../api";
import { usePermissions } from "../../hooks/usePermissions";

// ─── Stat Card ────────────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ElementType;
  accent: "red" | "black";
  ocid: string;
}

function StatCard({ label, value, icon: Icon, accent, ocid }: StatCardProps) {
  const iconCls =
    accent === "red" ? "bg-red-50 text-red-600" : "bg-zinc-900 text-white";
  return (
    <div
      className="bg-white rounded-xl shadow-sm border border-zinc-100 p-5 flex items-center gap-4"
      data-ocid={ocid}
    >
      <div
        className={`w-11 h-11 rounded-lg flex items-center justify-center flex-shrink-0 ${iconCls}`}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="min-w-0">
        <div className="text-2xl font-bold text-zinc-900 leading-tight">
          {typeof value === "number" ? value.toLocaleString("id-ID") : value}
        </div>
        <div className="text-xs text-zinc-500 mt-0.5 truncate">{label}</div>
      </div>
    </div>
  );
}

// ─── Pending Review Banner ─────────────────────────────────────────────────────

function PendingReviewBanner() {
  const { data, isLoading } = useQuery<{ count: number }>({
    queryKey: ["pendingReviewCount"],
    queryFn: () => api.dokumen.pendingCount(),
    staleTime: 30_000,
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <Skeleton
        className="h-20 w-full rounded-xl"
        data-ocid="dashboard.pending_review.loading_state"
      />
    );
  }

  const count = data?.count ?? 0;

  if (count === 0) {
    return (
      <div
        className="flex items-center gap-3 px-5 py-3 rounded-xl border border-zinc-200 bg-zinc-50 text-zinc-400"
        data-ocid="dashboard.pending_review.empty_state"
      >
        <Bell className="w-4 h-4 flex-shrink-0" />
        <span className="text-sm">Tidak ada dokumen menunggu review</span>
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-between gap-4 px-5 py-4 rounded-xl border border-orange-200 bg-orange-50"
      data-ocid="dashboard.pending_review.card"
    >
      <div className="flex items-center gap-3 min-w-0">
        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
          <Bell className="w-5 h-5 text-orange-600" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-orange-900">
            {count.toLocaleString("id-ID")} Dokumen Menunggu Review
          </p>
          <p className="text-xs text-orange-600 mt-0.5">
            Perlu diperiksa dan diverifikasi sebelum diterbitkan
          </p>
        </div>
      </div>
      <a
        href="/admin/dokumen?filter=pending-review"
        data-ocid="dashboard.pending_review.link"
        className="flex-shrink-0 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
      >
        Lihat Dokumen
      </a>
    </div>
  );
}

// ─── Kategori Bar ─────────────────────────────────────────────────────────────

interface KategoriBarProps {
  nama: string;
  count: number;
  percentage: number;
  index: number;
}

function KategoriBar({ nama, count, percentage, index }: KategoriBarProps) {
  return (
    <div
      className="flex items-center gap-3"
      data-ocid={`dashboard.chart.item.${index}`}
    >
      <div className="w-32 text-xs text-zinc-600 text-right truncate flex-shrink-0">
        {nama}
      </div>
      <div className="flex-1 bg-zinc-100 rounded-full h-3 overflow-hidden">
        <div
          className="h-full bg-red-600 rounded-full transition-all duration-700"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <div className="w-10 text-xs text-zinc-500 text-right flex-shrink-0">
        {count}
      </div>
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────

export function AdminDashboard() {
  const { data: statistik, isLoading: loadingStats } = useStatistik();
  const { data: beritaList, isLoading: loadingBerita } = useBerita();
  const { can } = usePermissions();

  const totalBerita = beritaList?.length ?? 0;
  const rawKategori = statistik?.perKategori || (statistik?.dokumenPerKategori as any) || [];
  const perKategori = rawKategori.map((k: any) => ({
    id: k.id ?? k.kategoriId,
    nama: k.nama ?? k.kategoriNama,
    jumlah: k.jumlah
  }));
  const totalDokumenKategori =
    perKategori.reduce((s: number, k: any) => s + k.jumlah, 0) || 1;
  const chartData = perKategori.slice(0, 7);
  const totalKategoriCount = statistik?.totalKategori ?? perKategori.length;

  const barData = (statistik?.trenTahun || []).map((t) => ({
    name: t.tahun,
    Jumlah: t.jumlah
  }));

  return (
    <div className="p-6 space-y-6 bg-zinc-50 min-h-full">
      {/* Page Title */}
      <div data-ocid="dashboard.page">
        <h1 className="text-xl font-bold text-zinc-900">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Ringkasan data portal JDIH UNTAG Banyuwangi
        </p>
      </div>

      {/* ── PENDING REVIEW NOTIFICATION (Verifikator only) ──────────── */}
      {can('dokumen:review') && (
        <div data-ocid="dashboard.pending_review_section">
          <PendingReviewBanner />
        </div>
      )}

      {/* ── TOP ROW: Stat Cards ──────────────────────────────────────── */}
      <div
        className="grid grid-cols-2 lg:grid-cols-4 gap-4"
        data-ocid="dashboard.stats_section"
      >
        {loadingStats ? (
          Array.from({ length: 4 }, (_, i) => `stat-skel-${i}`).map((id) => (
            <Skeleton key={id} className="h-24 rounded-xl" />
          ))
        ) : (
          <>
            <StatCard
              label="Total Dokumen"
              value={statistik?.totalDokumen ?? 0}
              icon={FileText}
              accent="red"
              ocid="dashboard.stat.dokumen"
            />
            <StatCard
              label="Total Unduhan"
              value={statistik?.totalUnduhan ?? 0}
              icon={Download}
              accent="black"
              ocid="dashboard.stat.unduhan"
            />
            <StatCard
              label="Total Kategori"
              value={totalKategoriCount}
              icon={FolderOpen}
              accent="red"
              ocid="dashboard.stat.kategori"
            />
            <StatCard
              label="Total Berita"
              value={loadingBerita ? "—" : totalBerita}
              icon={Newspaper}
              accent="black"
              ocid="dashboard.stat.berita"
            />
          </>
        )}
      </div>

      {/* ── MIDDLE ROW: Quick Actions + Log shortcut ─────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quick Actions (2/3) */}
        <div
          className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-zinc-100 p-5"
          data-ocid="dashboard.quick_actions_section"
        >
          <div className="flex items-center gap-2 mb-4">
            <Plus className="w-4 h-4 text-red-600" />
            <h2 className="text-base font-semibold text-zinc-900">
              Aksi Cepat
            </h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <Link
              to="/admin/dokumen"
              data-ocid="dashboard.tambah_dokumen_button"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-800 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-colors group"
            >
              <div className="w-8 h-8 rounded-md bg-red-50 text-red-600 flex items-center justify-center group-hover:bg-red-100 transition-colors">
                <FileText className="w-4 h-4" />
              </div>
              Tambah Dokumen
            </Link>
            <Link
              to="/admin/berita"
              data-ocid="dashboard.tambah_berita_button"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-800 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-colors group"
            >
              <div className="w-8 h-8 rounded-md bg-zinc-100 text-zinc-600 flex items-center justify-center group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                <Newspaper className="w-4 h-4" />
              </div>
              Tambah Berita
            </Link>
            <Link
              to="/admin/kategori"
              data-ocid="dashboard.kelola_kategori_button"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-800 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-colors group"
            >
              <div className="w-8 h-8 rounded-md bg-zinc-100 text-zinc-600 flex items-center justify-center group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                <FolderOpen className="w-4 h-4" />
              </div>
              Kelola Kategori
            </Link>
            <Link
              to="/admin/log"
              data-ocid="dashboard.lihat_log_button"
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg border border-zinc-200 text-sm font-medium text-zinc-800 hover:border-red-300 hover:bg-red-50 hover:text-red-700 transition-colors group"
            >
              <div className="w-8 h-8 rounded-md bg-zinc-100 text-zinc-600 flex items-center justify-center group-hover:bg-red-100 group-hover:text-red-600 transition-colors">
                <ScrollText className="w-4 h-4" />
              </div>
              Log Aktivitas
            </Link>
          </div>
        </div>

        {/* Ringkasan Dokumen (1/3) */}
        <div
          className="bg-white rounded-xl shadow-sm border border-zinc-100 p-5"
          data-ocid="dashboard.summary_section"
        >
          <p className="text-xs text-zinc-400 mb-3 font-medium uppercase tracking-wide">
            Ringkasan Dokumen
          </p>
          {loadingStats ? (
            <div className="space-y-2">
              <Skeleton className="h-4 w-full rounded" />
              <Skeleton className="h-4 w-4/5 rounded" />
              <Skeleton className="h-4 w-3/5 rounded" />
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Total dokumen</span>
                <span className="font-semibold text-zinc-800">
                  {(statistik?.totalDokumen ?? 0).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Total unduhan</span>
                <span className="font-semibold text-zinc-800">
                  {(statistik?.totalUnduhan ?? 0).toLocaleString("id-ID")}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Total berita</span>
                <span className="font-semibold text-zinc-800">
                  {totalBerita}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Total kategori</span>
                <span className="font-semibold text-zinc-800">
                  {totalKategoriCount}
                </span>
              </div>
            </div>
          )}

          {/* Link ke log */}
          <div className="mt-5 pt-4 border-t border-zinc-100">
            <Link
              to="/admin/log"
              className="flex items-center justify-between text-xs text-zinc-500 hover:text-red-600 transition-colors group"
              data-ocid="dashboard.log_shortcut"
            >
              <span className="flex items-center gap-1.5">
                <ScrollText className="w-3.5 h-3.5" />
                Lihat semua log aktivitas
              </span>
              <span className="text-zinc-300 group-hover:text-red-400 transition-colors">→</span>
            </Link>
          </div>
        </div>
      </div>

      {/* ── BOTTOM ROW: Charts ───────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div
          className="bg-white rounded-xl shadow-sm border border-zinc-100 p-5"
          data-ocid="dashboard.chart_section"
        >
          <h2 className="text-base font-semibold text-zinc-900 mb-5">
            Dokumen per Kategori
          </h2>

          {loadingStats ? (
            <div className="space-y-3" data-ocid="dashboard.chart.loading_state">
              {Array.from({ length: 5 }, (_, i) => `chart-skel-${i}`).map(
                (id) => (
                  <Skeleton key={id} className="h-5 w-full rounded" />
                ),
              )}
            </div>
          ) : chartData.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center py-8 text-center"
              data-ocid="dashboard.chart.empty_state"
            >
              <FolderOpen className="w-8 h-8 text-zinc-300 mb-2" />
              <p className="text-sm text-zinc-400">Belum ada data kategori</p>
            </div>
          ) : (
            <div className="space-y-3">
              {chartData.map((k, i) => {
                const pct = Math.round((k.jumlah / totalDokumenKategori) * 100);
                return (
                  <KategoriBar
                    key={k.id}
                    nama={k.nama}
                    count={k.jumlah}
                    percentage={pct}
                    index={i + 1}
                  />
                );
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-zinc-100 p-5">
          <h2 className="text-base font-semibold text-zinc-900 mb-5">
            Tren Publikasi
          </h2>
          {loadingStats ? (
            <Skeleton className="h-[250px] w-full rounded" />
          ) : barData.length > 0 ? (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f4f4f5" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#71717a' }} />
                  <Tooltip 
                    cursor={{ fill: '#fafafa' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid #f4f4f5', boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)' }}
                  />
                  <Bar dataKey="Jumlah" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-[250px] text-center">
              <ScrollText className="w-8 h-8 text-zinc-300 mb-2" />
              <p className="text-sm text-zinc-400">Belum ada data tren</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
