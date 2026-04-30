import { Scale } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/skeleton";
import { useTentangPage } from "../hooks/useBackend";

const DEFAULT_PARAGRAPHS = [
  "JDIH (Jaringan Dokumentasi dan Informasi Hukum) Kampus Universitas 17 Agustus 1945 Banyuwangi dibentuk sebagai bagian dari upaya universitas dalam mendukung sistem dokumentasi hukum nasional yang diatur melalui Peraturan Presiden Nomor 33 Tahun 2012 tentang Jaringan Dokumentasi dan Informasi Hukum Nasional.",
  "Pembentukan JDIH UNTAG Banyuwangi juga dilandasi oleh Peraturan Menteri Hukum dan HAM Nomor 8 Tahun 2019 tentang Standar Pengelolaan Dokumen dan Informasi Hukum, yang mewajibkan setiap institusi, termasuk perguruan tinggi, untuk mengelola produk hukum secara tertib, terstruktur, dan mudah diakses.",
  "Portal ini hadir sebagai wujud komitmen UNTAG Banyuwangi terhadap transparansi tata kelola hukum dan kemudahan akses informasi regulasi bagi seluruh civitas akademika, serta sebagai bentuk integrasi dengan Jaringan Dokumentasi dan Informasi Hukum Nasional (JDIHN) yang dikoordinasikan oleh Kementerian Hukum dan HAM Republik Indonesia.",
  "Sejak didirikan, JDIH UNTAG Banyuwangi berkomitmen untuk terus memperbarui dan memperluas koleksi dokumen hukum agar seluruh civitas akademika, tenaga pendidik, tenaga kependidikan, dan masyarakat umum dapat mengakses regulasi kampus secara mudah, cepat, dan gratis.",
];

export function TentangSejarah() {
  const { data: page, isLoading } = useTentangPage("sejarah");

  const paragraphs: string[] =
    page?.konten?.blocks
      ?.filter((b) => b.__kind__ === "paragraf")
      .map((b) => (b as { __kind__: "paragraf"; paragraf: string }).paragraf) ??
    DEFAULT_PARAGRAPHS;

  return (
    <Layout>
      <PageHeader
        title="Sejarah & Latar Belakang"
        description="Sejarah pembentukan dan latar belakang JDIH Universitas 17 Agustus 1945 Banyuwangi"
        breadcrumbs={[
          { label: "Tentang JDIH", to: "/tentang/sejarah" },
          { label: "Sejarah" },
        ]}
      />

      <section
        className="py-12 bg-background"
        data-ocid="tentang_sejarah.section"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-display font-bold text-xl text-foreground">
                Sejarah &amp; Latar Belakang
              </h2>
            </div>
            <div className="bg-card border border-border rounded-lg p-6 shadow-card space-y-4">
              {isLoading ? (
                <>
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-12 w-3/4" />
                </>
              ) : (
                paragraphs.map((p, idx) => (
                  <p
                    key={`para-${idx}-${p.slice(0, 12)}`}
                    className="text-muted-foreground text-sm leading-relaxed"
                  >
                    {p}
                  </p>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
