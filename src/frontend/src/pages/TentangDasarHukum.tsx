import { FileText } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/skeleton";
import { useTentangPage } from "../hooks/useBackend";

const DEFAULT_DASAR_HUKUM = [
  "Peraturan Presiden Nomor 33 Tahun 2012 tentang Jaringan Dokumentasi dan Informasi Hukum Nasional",
  "Peraturan Menteri Hukum dan HAM Nomor 8 Tahun 2019 tentang Standar Pengelolaan Dokumen dan Informasi Hukum",
  "Undang-Undang Nomor 12 Tahun 2011 tentang Pembentukan Peraturan Perundang-undangan",
  "Statuta Universitas 17 Agustus 1945 Banyuwangi",
  "Keputusan Rektor UNTAG Banyuwangi tentang Pembentukan JDIH Kampus",
];

export function TentangDasarHukum() {
  const { data: page, isLoading } = useTentangPage("dasarHukum");

  const items: string[] =
    (
      page?.konten?.blocks?.find((b) => b.__kind__ === "daftarItem") as
        | { __kind__: "daftarItem"; daftarItem: string[] }
        | undefined
    )?.daftarItem ?? DEFAULT_DASAR_HUKUM;

  return (
    <Layout>
      <PageHeader
        title="Dasar Hukum"
        description="Landasan hukum pembentukan dan penyelenggaraan JDIH Universitas 17 Agustus 1945 Banyuwangi"
        breadcrumbs={[
          { label: "Tentang JDIH", to: "/tentang/sejarah" },
          { label: "Dasar Hukum" },
        ]}
      />

      <section
        className="py-12 bg-background"
        data-ocid="tentang_dasar_hukum.section"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-display font-bold text-xl text-foreground">
                Dasar Hukum
              </h2>
            </div>

            {isLoading ? (
              <div className="bg-card border border-border rounded-xl p-4 space-y-3 shadow-card">
                {[1, 2, 3, 4, 5].map((n) => (
                  <Skeleton key={n} className="h-10 w-full" />
                ))}
              </div>
            ) : (
              <div className="bg-card border border-border rounded-xl divide-y divide-border shadow-card">
                {items.map((item, idx) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: ordered list
                    key={idx}
                    className="flex items-start gap-4 p-4"
                    data-ocid={`tentang_dasar_hukum.item.${idx + 1}`}
                  >
                    <span className="w-7 h-7 bg-primary text-primary-foreground text-xs font-bold rounded-md flex items-center justify-center flex-shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-foreground leading-relaxed">
                      {item}
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
