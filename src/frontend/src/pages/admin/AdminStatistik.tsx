import { Button } from "@/components/ui/button";
import {
  BarChart3,
  BookOpen,
  Download,
  FileText,
  Newspaper,
  RefreshCw,
} from "lucide-react";
import { ErrorState } from "../../components/ui/ErrorState";
import { LoadingSpinner } from "../../components/ui/LoadingSpinner";
import { PageHeader } from "../../components/ui/PageHeader";
import { useStatistik } from "../../hooks/useBackend";

export function AdminStatistik() {
  const {
    data: statistik,
    isLoading,
    isError,
    refetch,
    isFetching,
  } = useStatistik();

  const STAT_CARDS = [
    {
      icon: FileText,
      label: "Total Dokumen",
      value: Number(statistik?.totalDokumen ?? 0),
      colorBg: "bg-primary/10",
      colorText: "text-primary",
      ocid: "admin_statistik.stat.dokumen",
    },
    {
      icon: Download,
      label: "Total Unduhan",
      value: Number(statistik?.totalUnduhan ?? 0),
      colorBg: "bg-foreground/5",
      colorText: "text-foreground",
      ocid: "admin_statistik.stat.unduhan",
    },
    {
      icon: BookOpen,
      label: "Kategori",
      value: Number(statistik?.totalKategori ?? 0),
      colorBg: "bg-muted",
      colorText: "text-muted-foreground",
      ocid: "admin_statistik.stat.kategori",
    },
    {
      icon: Newspaper,
      label: "Artikel Berita",
      value: Number(statistik?.totalArtikel ?? 0),
      colorBg: "bg-accent/10",
      colorText: "text-accent",
      ocid: "admin_statistik.stat.artikel",
    },
  ];

  return (
    <>
      <PageHeader
        title="Statistik"
        description="Data penggunaan dan ringkasan konten portal JDIH"
        breadcrumbs={[{ label: "Admin", to: "/admin" }, { label: "Statistik" }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
            className="gap-2 text-sm border-border"
            data-ocid="admin_statistik.refresh_button"
          >
            <RefreshCw
              className={`w-4 h-4 ${isFetching ? "animate-spin" : ""}`}
            />
            Perbarui
          </Button>
        }
      />

      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div
            className="flex items-center justify-center py-24"
            data-ocid="admin_statistik.loading_state"
          >
            <LoadingSpinner size="lg" text="Memuat statistik..." />
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <>
            {/* Summary Cards */}
            <div
              className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
              data-ocid="admin_statistik.stats_section"
            >
              {STAT_CARDS.map((stat, idx) => (
                <div
                  key={stat.label}
                  className="bg-card border border-border rounded-xl p-5"
                  data-ocid={`admin_statistik.stat_card.${idx + 1}`}
                >
                  <div
                    className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${stat.colorBg} ${stat.colorText}`}
                  >
                    <stat.icon className="w-5 h-5" />
                  </div>
                  <div className="text-2xl font-display font-bold text-foreground mb-1">
                    {stat.value.toLocaleString("id-ID")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            {/* Dokumen Per Kategori */}
            <div
              className="bg-card border border-border rounded-xl p-6"
              data-ocid="admin_statistik.kategori_chart"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="font-display font-semibold text-foreground text-base">
                    Dokumen per Kategori
                  </h2>
                  <p className="text-xs text-muted-foreground">
                    Distribusi dokumen berdasarkan kategori hukum
                  </p>
                </div>
              </div>

              {!statistik?.dokumenPerKategori ||
              statistik.dokumenPerKategori.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  Belum ada data kategori
                </p>
              ) : (
                <div
                  className="space-y-5"
                  data-ocid="admin_statistik.kategori_bars"
                >
                  {(() => {
                    const maxVal = Math.max(
                      ...statistik.dokumenPerKategori.map((d) => d.jumlah),
                      1,
                    );
                    const totalDok = statistik.dokumenPerKategori.reduce(
                      (sum, d) => sum + d.jumlah,
                      0,
                    );
                    return statistik.dokumenPerKategori.map((item, idx) => {
                      const pct = Math.round((item.jumlah / maxVal) * 100);
                      const porsi =
                        totalDok > 0
                          ? Math.round((item.jumlah / totalDok) * 100)
                          : 0;
                      return (
                        <div
                          key={item.kategoriId}
                          data-ocid={`admin_statistik.kategori_bar.${idx + 1}`}
                        >
                          <div className="flex items-center justify-between text-sm mb-2">
                            <span className="text-foreground font-medium">
                              {item.kategoriNama}
                            </span>
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="font-mono">
                                {item.jumlah} dokumen
                              </span>
                              <span className="bg-muted rounded px-1.5 py-0.5">
                                {porsi}%
                              </span>
                            </div>
                          </div>
                          <div className="h-3 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
