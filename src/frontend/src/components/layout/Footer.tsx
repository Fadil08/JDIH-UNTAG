import { Link } from "@tanstack/react-router";
import { ExternalLink, Mail, MapPin, Phone, Scale } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api, { API_BASE, getFileUrl } from "@/api";

const FOOTER_LINKS = [
  { label: "Beranda", to: "/" },
  { label: "Katalog Hukum", to: "/katalog" },
  { label: "Berita & Pengumuman", to: "/berita" },
  { label: "Tentang JDIH", to: "/tentang" },
  { label: "Kontak", to: "/kontak" },
];

const JENIS_LINKS = [
  "Statuta",
  "Peraturan Rektor",
  "Keputusan Rektor",
  "Surat Edaran",
  "SOP",
  "Perjanjian / MoU",
];

export function Footer() {
  const year = new Date().getFullYear();
  const hostname =
    typeof window !== "undefined" ? window.location.hostname : "";
  const caffeineUrl = `https://perpenas.or.id/`;

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.settings.get(),
  });

  return (
    <footer className="bg-primary text-primary-foreground" data-ocid="footer">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div className="lg:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              {settings?.logo_url ? (
                <img src={getFileUrl(settings.logo_url)} alt="Logo" className="w-9 h-9 object-contain bg-white rounded p-1" />
              ) : (
                <div className="w-9 h-9 bg-accent rounded flex items-center justify-center flex-shrink-0">
                  <Scale className="w-5 h-5 text-accent-foreground" />
                </div>
              )}
              <div>
                <div className="font-display font-bold text-base leading-tight">
                  {settings?.app_name || "JDIH UNTAG Banyuwangi"}
                </div>
                <div className="text-primary-foreground/60 text-xs">
                  {settings?.unit_name || "Jaringan Dokumentasi & Informasi Hukum"}
                </div>
              </div>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              {settings?.app_description || "Portal resmi dokumentasi dan informasi hukum Universitas 17 Agustus 1945 Banyuwangi."}
            </p>
          </div>

          {/* Navigation */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-primary-foreground/90 uppercase tracking-wider">
              Navigasi
            </h3>
            <ul className="space-y-2">
              {FOOTER_LINKS.map((link) => (
                <li key={link.to}>
                  <Link
                    to={link.to}
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-smooth"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Jenis Dokumen */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-primary-foreground/90 uppercase tracking-wider">
              Produk Hukum
            </h3>
            <ul className="space-y-2">
              {JENIS_LINKS.map((jenis) => (
                <li key={jenis}>
                  <Link
                    to="/katalog"
                    className="text-sm text-primary-foreground/70 hover:text-primary-foreground transition-smooth"
                  >
                    {jenis}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-sm mb-4 text-primary-foreground/90 uppercase tracking-wider">
              Kontak
            </h3>
            <ul className="space-y-3">
              <li className="flex items-start gap-2.5 text-sm text-primary-foreground/70">
                <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0 text-accent" />
                <span>Jl. Adi Wijaya No. 46, Banyuwangi, Jawa Timur 68416</span>
              </li>
              {(settings?.contact_phone || "(0333) 424140") && (
                <li className="flex items-center gap-2.5 text-sm text-primary-foreground/70">
                  <Phone className="w-4 h-4 flex-shrink-0 text-accent" />
                  <span>{settings?.contact_phone || "(0333) 424140"}</span>
                </li>
              )}
              {(settings?.contact_email || "jdih@untag-banyuwangi.ac.id") && (
                <li className="flex items-center gap-2.5 text-sm text-primary-foreground/70">
                  <Mail className="w-4 h-4 flex-shrink-0 text-accent" />
                  <span>{settings?.contact_email || "jdih@untag-banyuwangi.ac.id"}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-10 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-primary-foreground/60 text-xs text-center sm:text-left">
            © {year} JDIH UNTAG Banyuwangi — Universitas 17 Agustus 1945
            Banyuwangi. Seluruh hak cipta dilindungi.
          </p>
          <a
            href={caffeineUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-foreground/50 text-xs hover:text-primary-foreground/80 transition-smooth flex items-center gap-1"
          >
            Develop by IT Perpenas
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </div>
    </footer>
  );
}
