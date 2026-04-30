import { Info } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/skeleton";
import { useTentangPage } from "../hooks/useBackend";

const DEFAULT_FUNGSI = [
  "Mendokumentasikan seluruh produk hukum yang diterbitkan oleh Universitas 17 Agustus 1945 Banyuwangi",
  "Menyediakan layanan informasi hukum yang mudah diakses oleh civitas akademika dan masyarakat umum",
  "Menjaga ketertiban, kelengkapan, dan kemutakhiran data produk hukum kampus",
  "Mendukung integrasi dan sinkronisasi data dengan Jaringan Dokumentasi dan Informasi Hukum Nasional (JDIHN)",
  "Meningkatkan transparansi dan akuntabilitas tata kelola hukum universitas",
  "Menyediakan sarana publikasi dan sosialisasi regulasi internal kampus",
];

export function TentangFungsi() {
  const { data: page, isLoading } = useTentangPage("fungsi");

  const items: string[] =
    (
      page?.konten?.blocks?.find((b) => b.__kind__ === "daftarItem") as
        | { __kind__: "daftarItem"; daftarItem: string[] }
        | undefined
    )?.daftarItem ?? DEFAULT_FUNGSI;

  return (
    <Layout>
      <PageHeader
        title="Fungsi JDIH"
        description="Peran dan fungsi JDIH dalam mendukung tata kelola hukum Universitas 17 Agustus 1945 Banyuwangi"
        breadcrumbs={[
          { label: "Tentang JDIH", to: "/tentang/sejarah" },
          { label: "Fungsi JDIH" },
        ]}
      />

      <section className="py-12 bg-muted/30" data-ocid="tentang_fungsi.section">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Info className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-display font-bold text-xl text-foreground">
                Fungsi JDIH
              </h2>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[1, 2, 3, 4].map((n) => (
                  <Skeleton key={n} className="h-24 w-full rounded-xl" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((fungsi, idx) => (
                  <div
                    key={fungsi}
                    className="bg-card border border-border rounded-xl p-5 flex items-start gap-3 shadow-card"
                    data-ocid={`tentang_fungsi.item.${idx + 1}`}
                  >
                    <span className="w-6 h-6 bg-accent/10 text-accent text-xs font-bold rounded flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-foreground leading-relaxed">
                      {fungsi}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
