import { BookOpen, CheckCircle2 } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/skeleton";
import { useTentangPage } from "../hooks/useBackend";

const DEFAULT_VISI =
  "Menjadi pusat dokumentasi dan informasi hukum kampus yang terpercaya, mudah diakses, dan bermanfaat bagi civitas akademika Universitas 17 Agustus 1945 Banyuwangi.";

const DEFAULT_MISI = [
  "Membangun sistem dokumentasi hukum kampus yang terstruktur, lengkap, dan mudah diakses",
  "Melakukan pengelolaan dan pemutakhiran data produk hukum secara berkala dan konsisten",
  "Menyebarluaskan informasi hukum kepada seluruh civitas akademika UNTAG Banyuwangi",
  "Mendukung penegakan hukum dan tata kelola universitas yang transparan dan akuntabel",
  "Menjalin koordinasi dan sinkronisasi dengan JDIHN pusat dan jaringan JDIH perguruan tinggi",
];

export function TentangVisiMisi() {
  const { data: page, isLoading } = useTentangPage("visiMisi");

  const visi: string =
    (
      page?.konten?.blocks?.find((b) => b.__kind__ === "paragraf") as
        | { __kind__: "paragraf"; paragraf: string }
        | undefined
    )?.paragraf ?? DEFAULT_VISI;

  const misi: string[] =
    (
      page?.konten?.blocks?.find((b) => b.__kind__ === "daftarItem") as
        | { __kind__: "daftarItem"; daftarItem: string[] }
        | undefined
    )?.daftarItem ?? DEFAULT_MISI;

  return (
    <Layout>
      <PageHeader
        title="Visi & Misi"
        description="Visi dan misi JDIH Universitas 17 Agustus 1945 Banyuwangi dalam pengelolaan dokumentasi hukum"
        breadcrumbs={[
          { label: "Tentang JDIH", to: "/tentang/sejarah" },
          { label: "Visi & Misi" },
        ]}
      />

      <section
        className="py-12 bg-muted/30"
        data-ocid="tentang_visi_misi.section"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-display font-bold text-xl text-foreground">
                Visi &amp; Misi
              </h2>
            </div>

            {/* Visi */}
            <div className="bg-primary rounded-xl p-6 mb-6 shadow-card">
              <div className="flex items-center gap-2 mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-primary-foreground/70">
                  Visi
                </span>
              </div>
              {isLoading ? (
                <Skeleton className="h-12 w-full bg-primary-foreground/20" />
              ) : (
                <p className="text-primary-foreground font-display font-semibold text-base sm:text-lg leading-relaxed">
                  "{visi}"
                </p>
              )}
            </div>

            {/* Misi */}
            <div className="bg-card border border-border rounded-xl p-6 shadow-card">
              <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-4">
                Misi
              </p>
              {isLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-5 w-full" />
                  <Skeleton className="h-5 w-5/6" />
                  <Skeleton className="h-5 w-full" />
                </div>
              ) : (
                <ul className="space-y-3">
                  {misi.map((item, idx) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: ordered list
                    <li key={idx} className="flex items-start gap-3">
                      <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground leading-relaxed">
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
