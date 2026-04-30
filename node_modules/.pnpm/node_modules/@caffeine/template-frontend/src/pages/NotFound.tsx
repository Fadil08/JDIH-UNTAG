import { Button } from "@/components/ui/button";
import { Link } from "@tanstack/react-router";
import { ArrowLeft, FileX } from "lucide-react";
import { Layout } from "../components/layout/Layout";

export function NotFound() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-24 flex flex-col items-center justify-center text-center">
        <div className="w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-8">
          <FileX className="w-12 h-12 text-muted-foreground" />
        </div>
        <h1 className="font-display font-bold text-5xl text-foreground mb-3">
          404
        </h1>
        <h2 className="font-display font-semibold text-xl text-foreground mb-3">
          Halaman Tidak Ditemukan
        </h2>
        <p className="text-muted-foreground text-sm max-w-sm leading-relaxed mb-8">
          Halaman yang Anda cari tidak ada atau telah dipindahkan. Silakan
          kembali ke beranda.
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button
            asChild
            className="bg-accent hover:bg-accent/90 text-accent-foreground gap-2"
          >
            <Link to="/">
              <ArrowLeft className="w-4 h-4" />
              Kembali ke Beranda
            </Link>
          </Button>
          <Button asChild variant="outline" className="gap-2 border-border">
            <Link to="/katalog">Katalog Dokumen Hukum</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
