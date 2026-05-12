import { Scale } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/skeleton";
import { useTentangPage } from "../hooks/useBackend";

export function TentangSejarah() {
  const { data: page, isLoading } = useTentangPage("sejarah");

  const paragraphs: string[] =
    page?.konten?.blocks
      ?.filter((b) => b.__kind__ === "paragraf")
      .map((b) => (b as { __kind__: "paragraf"; paragraf: string }).paragraf) ?? [];

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
