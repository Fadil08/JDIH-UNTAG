import { useQuery } from "@tanstack/react-query";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, Legend
} from "recharts";
import { Layout } from "../components/layout/Layout";
import { PageHeader } from "../components/ui/PageHeader";
import { LoadingSpinner } from "../components/ui/LoadingSpinner";
import { ErrorState } from "../components/ui/ErrorState";
import { api } from "../api";
import { FileText, Download, TrendingUp, Archive } from "lucide-react";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d', '#ffc658', '#f46a9b'];

export function StatistikPublik() {
  const { data: stats, isLoading, isError, refetch } = useQuery({
    queryKey: ["statistik_publik"],
    queryFn: () => api.statistik.get(),
    staleTime: 60_000,
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-[50vh] flex items-center justify-center">
          <LoadingSpinner size="lg" text="Memuat data statistik..." />
        </div>
      </Layout>
    );
  }

  if (isError || !stats) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12">
          <ErrorState 
            title="Gagal Memuat Statistik" 
            message="Terjadi kesalahan saat mengambil data statistik terbaru." 
            onRetry={refetch} 
          />
        </div>
      </Layout>
    );
  }

  // Format data for Pie Chart
  const pieData = (stats.perKategori || []).map((k) => ({
    name: k.nama,
    value: k.jumlah
  }));

  // Format data for Bar Chart (Trend Tahun)
  const barData = (stats.trenTahun || []).map((t) => ({
    name: t.tahun,
    "Jumlah Peraturan": t.jumlah
  }));

  return (
    <Layout>
      <PageHeader 
        title="Statistik & Data" 
        description="Visualisasi data JDIH dalam angka"
      />

      <div className="container mx-auto px-4 py-12 space-y-12">
        
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0">
              <FileText className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Produk Hukum</p>
              <h3 className="text-3xl font-bold font-display text-foreground">
                {stats.totalDokumen.toLocaleString("id-ID")}
              </h3>
            </div>
          </div>
          
          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center flex-shrink-0">
              <Download className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Diunduh</p>
              <h3 className="text-3xl font-bold font-display text-foreground">
                {stats.totalUnduhan.toLocaleString("id-ID")}
              </h3>
            </div>
          </div>

          <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex items-center gap-5">
            <div className="w-14 h-14 rounded-full bg-orange-50 flex items-center justify-center flex-shrink-0">
              <Archive className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">Total Artikel Hukum</p>
              <h3 className="text-3xl font-bold font-display text-foreground">
                {stats.totalArtikel.toLocaleString("id-ID")}
              </h3>
            </div>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          
          {/* Trend Publikasi */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-display font-semibold text-lg mb-6">Tren Publikasi per Tahun</h3>
            {barData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#6b7280' }} />
                    <Tooltip 
                      cursor={{ fill: '#f3f4f6' }}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="Jumlah Peraturan" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                Tidak ada data tren tahun
              </div>
            )}
          </div>

          {/* Distribusi Kategori */}
          <div className="bg-card border border-border rounded-xl shadow-sm p-6">
            <h3 className="font-display font-semibold text-lg mb-6">Distribusi Kategori Dokumen</h3>
            {pieData.length > 0 ? (
              <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="45%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                      dataKey="value"
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value) => [`${value} Dokumen`, 'Jumlah']}
                      contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36} 
                      iconType="circle"
                      wrapperStyle={{ fontSize: '12px', paddingTop: '20px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-[300px] flex items-center justify-center text-muted-foreground text-sm">
                Tidak ada data kategori
              </div>
            )}
          </div>

        </div>
      </div>
    </Layout>
  );
}
