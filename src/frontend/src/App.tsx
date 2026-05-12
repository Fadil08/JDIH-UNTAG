import {
  Outlet,
  RouterProvider,
  createRootRoute,
  createRoute,
  createRouter,
} from "@tanstack/react-router";
import { Suspense, lazy } from "react";
import { AuthGuard } from "./components/guards/AuthGuard";
import { AdminLayout } from "./components/layout/AdminLayout";
import { LoadingSpinner } from "./components/ui/LoadingSpinner";
import { NotFound } from "./pages/NotFound";

// Lazy-loaded pages — public
const Beranda = lazy(() =>
  import("./pages/Beranda").then((m) => ({ default: m.Beranda })),
);
const Katalog = lazy(() =>
  import("./pages/Katalog").then((m) => ({ default: m.Katalog })),
);
const DokumenDetail = lazy(() =>
  import("./pages/DokumenDetail").then((m) => ({ default: m.DokumenDetail })),
);
const Berita = lazy(() =>
  import("./pages/Berita").then((m) => ({ default: m.Berita })),
);
const BeritaDetail = lazy(() =>
  import("./pages/BeritaDetail").then((m) => ({ default: m.BeritaDetail })),
);
const Tentang = lazy(() =>
  import("./pages/Tentang").then((m) => ({ default: m.Tentang })),
);
const TentangSejarah = lazy(() =>
  import("./pages/TentangSejarah").then((m) => ({ default: m.TentangSejarah })),
);
const TentangVisiMisi = lazy(() =>
  import("./pages/TentangVisiMisi").then((m) => ({
    default: m.TentangVisiMisi,
  })),
);
const TentangDasarHukum = lazy(() =>
  import("./pages/TentangDasarHukum").then((m) => ({
    default: m.TentangDasarHukum,
  })),
);
const TentangFungsi = lazy(() =>
  import("./pages/TentangFungsi").then((m) => ({ default: m.TentangFungsi })),
);
const TentangStrukturOrganisasi = lazy(() =>
  import("./pages/TentangStrukturOrganisasi").then((m) => ({
    default: m.TentangStrukturOrganisasi,
  })),
);
const Kontak = lazy(() =>
  import("./pages/Kontak").then((m) => ({ default: m.Kontak })),
);
const Galeri = lazy(() =>
  import("./pages/Galeri").then((m) => ({ default: m.Galeri })),
);
const StatistikPublik = lazy(() =>
  import("./pages/StatistikPublik").then((m) => ({ default: m.StatistikPublik })),
);

// Lazy-loaded pages — admin
const AdminLogin = lazy(() =>
  import("./pages/admin/AdminLogin").then((m) => ({
    default: m.AdminLogin,
  })),
);
const AdminDashboard = lazy(() =>
  import("./pages/admin/AdminDashboard").then((m) => ({
    default: m.AdminDashboard,
  })),
);
const AdminDokumen = lazy(() =>
  import("./pages/admin/AdminDokumen").then((m) => ({
    default: m.AdminDokumen,
  })),
);
const AdminKategori = lazy(() =>
  import("./pages/admin/AdminKategori").then((m) => ({
    default: m.AdminKategori,
  })),
);
const AdminStatus = lazy(() =>
  import("./pages/admin/AdminStatus").then((m) => ({
    default: m.AdminStatus,
  })),
);
const AdminBerita = lazy(() =>
  import("./pages/admin/AdminBerita").then((m) => ({ default: m.AdminBerita })),
);
const AdminStatistik = lazy(() =>
  import("./pages/admin/AdminStatistik").then((m) => ({
    default: m.AdminStatistik,
  })),
);
const AdminUsers = lazy(() =>
  import("./pages/admin/AdminUsers").then((m) => ({ default: m.AdminUsers })),
);
const AdminTentang = lazy(() =>
  import("./pages/admin/AdminTentang").then((m) => ({
    default: m.AdminTentang,
  })),
);
const AdminKontak = lazy(() =>
  import("./pages/admin/AdminKontak").then((m) => ({
    default: m.AdminKontak,
  })),
);
const AdminGaleri = lazy(() =>
  import("./pages/admin/AdminGaleri").then((m) => ({
    default: m.AdminGaleri,
  })),
);
const AdminRoles = lazy(() =>
  import("./pages/admin/AdminRoles").then((m) => ({ default: m.default })),
);
const AdminVerifikasi = lazy(() =>
  import("./pages/admin/AdminVerifikasi").then((m) => ({
    default: m.AdminVerifikasi,
  })),
);
const AdminSettings = lazy(() =>
  import("./pages/admin/AdminSettings").then((m) => ({
    default: m.AdminSettings,
  })),
);
const AdminLog = lazy(() =>
  import("./pages/admin/AdminLog").then((m) => ({
    default: m.AdminLog,
  })),
);

// ─── Fallback ────────────────────────────────────────────────────────────────

function PageFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <LoadingSpinner size="lg" text="Memuat halaman..." />
    </div>
  );
}

function AdminPageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AdminLayout>
        <Suspense fallback={<PageFallback />}>{children}</Suspense>
      </AdminLayout>
    </AuthGuard>
  );
}

// ─── Routes ──────────────────────────────────────────────────────────────────

const rootRoute = createRootRoute({
  component: () => <Outlet />,
  notFoundComponent: () => <NotFound />,
});

const berandaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <Beranda />
    </Suspense>
  ),
});

const katalogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/katalog",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <Katalog />
    </Suspense>
  ),
});

const katalogDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/katalog/$slug",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <DokumenDetail />
    </Suspense>
  ),
});

const beritaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/berita",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <Berita />
    </Suspense>
  ),
});

const beritaDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/berita/$id",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <BeritaDetail />
    </Suspense>
  ),
});

const tentangRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tentang",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <Tentang />
    </Suspense>
  ),
});

const tentangSejarahRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tentang/sejarah",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <TentangSejarah />
    </Suspense>
  ),
});

const tentangVisiMisiRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tentang/visi-misi",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <TentangVisiMisi />
    </Suspense>
  ),
});

const tentangDasarHukumRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tentang/dasar-hukum",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <TentangDasarHukum />
    </Suspense>
  ),
});

const tentangFungsiRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tentang/fungsi",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <TentangFungsi />
    </Suspense>
  ),
});

const tentangStrukturOrganisasiRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/tentang/struktur-organisasi",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <TentangStrukturOrganisasi />
    </Suspense>
  ),
});

const kontakRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/kontak",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <Kontak />
    </Suspense>
  ),
});

const galeriRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/galeri",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <Galeri />
    </Suspense>
  ),
});

// Admin routes
const statistikPublikRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/statistik",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <StatistikPublik />
    </Suspense>
  ),
});

// Admin routes
const adminLoginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/login",
  component: () => (
    <Suspense fallback={<PageFallback />}>
      <AdminLogin />
    </Suspense>
  ),
});

const adminRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin",
  component: () => (
    <AdminPageWrapper>
      <AdminDashboard />
    </AdminPageWrapper>
  ),
});

const adminDokumenRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/dokumen",
  component: () => (
    <AdminPageWrapper>
      <AdminDokumen />
    </AdminPageWrapper>
  ),
});

const adminKategoriRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/kategori",
  component: () => (
    <AdminPageWrapper>
      <AdminKategori />
    </AdminPageWrapper>
  ),
});

const adminStatusRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/status",
  component: () => (
    <AdminPageWrapper>
      <AdminStatus />
    </AdminPageWrapper>
  ),
});

const adminBeritaRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/berita",
  component: () => (
    <AdminPageWrapper>
      <AdminBerita />
    </AdminPageWrapper>
  ),
});

const adminStatistikRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/statistik",
  component: () => (
    <AdminPageWrapper>
      <AdminStatistik />
    </AdminPageWrapper>
  ),
});

const adminUsersRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/users",
  component: () => (
    <AdminPageWrapper>
      <AdminUsers />
    </AdminPageWrapper>
  ),
});

const adminTentangRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/tentang",
  component: () => (
    <AdminPageWrapper>
      <AdminTentang />
    </AdminPageWrapper>
  ),
});

const adminKontakRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/kontak",
  component: () => (
    <AdminPageWrapper>
      <AdminKontak />
    </AdminPageWrapper>
  ),
});

const adminRolesRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/roles",
  component: () => (
    <AdminPageWrapper>
      <AdminRoles />
    </AdminPageWrapper>
  ),
});

const adminGaleriRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/galeri",
  component: () => (
    <AdminPageWrapper>
      <AdminGaleri />
    </AdminPageWrapper>
  ),
});

const adminVerifikasiRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/verifikasi",
  component: () => (
    <AdminPageWrapper>
      <AdminVerifikasi />
    </AdminPageWrapper>
  ),
});

const adminSettingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/settings",
  component: () => (
    <AdminPageWrapper>
      <AdminSettings />
    </AdminPageWrapper>
  ),
});

const adminLogRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/admin/log",
  component: () => (
    <AdminPageWrapper>
      <AdminLog />
    </AdminPageWrapper>
  ),
});

// ─── Router ───────────────────────────────────────────────────────────────────

const routeTree = rootRoute.addChildren([
  berandaRoute,
  katalogRoute,
  katalogDetailRoute,
  beritaRoute,
  beritaDetailRoute,
  tentangRoute,
  tentangSejarahRoute,
  tentangVisiMisiRoute,
  tentangDasarHukumRoute,
  tentangFungsiRoute,
  tentangStrukturOrganisasiRoute,
  kontakRoute,
  galeriRoute,
  statistikPublikRoute,
  adminLoginRoute,
  adminRoute,
  adminDokumenRoute,
  adminKategoriRoute,
  adminStatusRoute,
  adminBeritaRoute,
  adminStatistikRoute,
  adminUsersRoute,
  adminRolesRoute,
  adminTentangRoute,
  adminKontakRoute,
  adminGaleriRoute,
  adminVerifikasiRoute,
  adminSettingsRoute,
  adminLogRoute,
]);

const router = createRouter({
  routeTree,
  defaultPreload: "intent",
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

export default function App() {
  return <RouterProvider router={router} />;
}
