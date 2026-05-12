import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Layout } from "../components/layout/Layout";
import { PageHeader } from "../components/ui/PageHeader";

import { useKontakInfo } from "../hooks/useBackend";
import { Skeleton } from "../components/ui/skeleton";

const ICON_MAP: Record<string, any> = { MapPin, Phone, Mail, Clock };

export function Kontak() {
  const { data: contacts, isLoading } = useKontakInfo();
  return (
    <Layout>
      <PageHeader
        title="Kontak Kami"
        description="Hubungi JDIH UNTAG Banyuwangi untuk pertanyaan atau bantuan seputar dokumen hukum kampus"
        breadcrumbs={[{ label: "Kontak" }]}
      />

      <section className="py-12 bg-background" data-ocid="kontak.page">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            {/* Intro */}
            <div className="text-center mb-10">
              <h2 className="font-display font-bold text-lg text-foreground mb-2">
                Informasi Kontak
              </h2>
              <p className="text-muted-foreground text-sm max-w-xl mx-auto">
                Kami siap membantu Anda menemukan informasi produk hukum kampus.
                Silakan hubungi kami melalui saluran berikut.
              </p>
            </div>

            {/* Contact Cards Grid */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 gap-5 mb-10"
              data-ocid="kontak.info_section"
            >
              {isLoading
                ? [1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-28 w-full rounded-xl" />
                  ))
                : contacts?.map((item) => {
                    const Icon = ICON_MAP[item.icon] || MapPin;
                    return (
                      <div
                        key={item.label}
                        className="bg-card border border-border rounded-xl p-6 flex items-start gap-4 shadow-card hover:border-primary/30 transition-smooth"
                      >
                        <div className="w-11 h-11 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0">
                          <Icon className="w-5 h-5 text-primary" />
                        </div>
                        <div className="min-w-0">
                          <dt className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">
                            {item.label}
                          </dt>
                          <dd className="text-sm font-semibold text-foreground break-words">
                            {item.value}
                          </dd>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {item.deskripsi}
                          </p>
                        </div>
                      </div>
                    );
                  })}
            </div>

            {/* Identity Card */}
            <div className="bg-primary rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row gap-6 items-start sm:items-center shadow-card">
              <div className="flex-1">
                <p className="text-xs font-bold uppercase tracking-widest text-primary-foreground/60 mb-2">
                  Unit Pengelola
                </p>
                <h3 className="font-display font-bold text-lg text-primary-foreground mb-1">
                  JDIH UNTAG Banyuwangi
                </h3>
                <p className="text-sm text-primary-foreground/80 leading-relaxed">
                  Biro Hukum &amp; Kerjasama
                  <br />
                  Universitas 17 Agustus 1945 Banyuwangi
                  <br />
                  Jl. Adi Sucipto No. 26, Banyuwangi, Jawa Timur
                </p>
              </div>
              <div className="flex-shrink-0 hidden sm:block">
                <div className="w-16 h-16 rounded-2xl bg-primary-foreground/10 border border-primary-foreground/20 flex items-center justify-center">
                  <MapPin className="w-8 h-8 text-primary-foreground/70" />
                </div>
              </div>
            </div>

            {/* Additional note */}
            <div className="mt-8 bg-secondary/40 border border-border rounded-xl p-5 flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-foreground mb-0.5">
                  Pengajuan Permohonan Informasi
                </p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Untuk permohonan salinan dokumen atau informasi hukum secara
                  formal, silakan kirimkan surat permohonan melalui email{" "}
                  <strong className="text-foreground">
                    jdih@untag-banyuwangi.ac.id
                  </strong>{" "}
                  atau datang langsung ke kantor Biro Hukum &amp; Kerjasama
                  UNTAG Banyuwangi pada jam operasional.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}
