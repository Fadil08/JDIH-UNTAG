import { Building2, Users } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { PageHeader } from "../components/ui/PageHeader";
import { Skeleton } from "../components/ui/skeleton";
import { useTentangPage } from "../hooks/useBackend";

interface StrukturMember {
  jabatan: string;
  nama: string;
  unit: string;
}

function parseStrukturItem(raw: string): StrukturMember {
  const parts: Record<string, string> = {};
  for (const seg of raw.split(" | ")) {
    const colonIdx = seg.indexOf(": ");
    if (colonIdx !== -1) {
      parts[seg.slice(0, colonIdx).trim()] = seg.slice(colonIdx + 2).trim();
    }
  }
  return {
    jabatan: parts.Jabatan ?? "",
    nama: parts.Nama ?? "",
    unit: parts.Unit ?? "",
  };
}

export function TentangStrukturOrganisasi() {
  const { data: page, isLoading } = useTentangPage("struktur");

  const rawItems = (
    page?.konten?.blocks?.find((b) => b.__kind__ === "daftarItem") as
      | { __kind__: "daftarItem"; daftarItem: string[] }
      | undefined
  )?.daftarItem;

  const struktur: StrukturMember[] = rawItems
    ? rawItems.map(parseStrukturItem).filter((m) => m.jabatan || m.nama)
    : [];

  return (
    <Layout>
      <PageHeader
        title="Struktur Organisasi"
        description="Susunan pengurus dan pengelola JDIH Universitas 17 Agustus 1945 Banyuwangi"
        breadcrumbs={[
          { label: "Tentang JDIH", to: "/tentang/sejarah" },
          { label: "Struktur Organisasi" },
        ]}
      />

      <section
        className="py-12 bg-background"
        data-ocid="tentang_struktur.section"
      >
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <h2 className="font-display font-bold text-xl text-foreground">
                Struktur Organisasi
              </h2>
            </div>

            {isLoading ? (
              <div className="space-y-2">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <Skeleton key={n} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <>
                {/* Desktop table */}
                <div className="hidden sm:block bg-card border border-border rounded-xl overflow-hidden shadow-card">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-primary/5 border-b border-border">
                        <th className="text-left py-3 px-4 font-semibold text-foreground w-8">
                          No.
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Jabatan
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Nama
                        </th>
                        <th className="text-left py-3 px-4 font-semibold text-foreground">
                          Unit
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {struktur.map((item, idx) => (
                        <tr
                          key={`${item.jabatan}-${item.nama}`}
                          className="hover:bg-muted/20 transition-colors"
                          data-ocid={`tentang_struktur.row.${idx + 1}`}
                        >
                          <td className="py-3 px-4 text-muted-foreground">
                            {idx + 1}
                          </td>
                          <td className="py-3 px-4 font-medium text-foreground">
                            {item.jabatan}
                          </td>
                          <td className="py-3 px-4 text-foreground">
                            {item.nama}
                          </td>
                          <td className="py-3 px-4 text-muted-foreground text-xs">
                            {item.unit}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile cards */}
                <div className="sm:hidden space-y-3">
                  {struktur.map((item, idx) => (
                    <div
                      key={item.jabatan}
                      className="bg-card border border-border rounded-xl p-4 shadow-card"
                      data-ocid={`tentang_struktur.card.${idx + 1}`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <Building2 className="w-4 h-4 text-primary" />
                        <span className="text-xs font-semibold text-accent uppercase tracking-wide">
                          {item.jabatan}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-foreground">
                        {item.nama}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {item.unit}
                      </p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
