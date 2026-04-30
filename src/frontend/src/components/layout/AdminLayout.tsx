import { useLocation } from "@tanstack/react-router";
import { Menu } from "lucide-react";
import { useState } from "react";
import type { ReactNode } from "react";
import { usePermissions } from "../../hooks/usePermissions";
import { AdminSidebar } from "./AdminSidebar";

const pageTitles: Record<string, string> = {
  "/admin": "Dashboard",
  "/admin/verifikasi": "Pusat Verifikasi",
  "/admin/dokumen": "Kelola Dokumen",
  "/admin/kategori": "Kelola Kategori",
  "/admin/berita": "Kelola Berita",
  "/admin/statistik": "Statistik",
  "/admin/users": "Kelola Pengguna",
  "/admin/tentang": "Kelola Tentang JDIH",
};

function getPageTitle(path: string): string {
  if (pageTitles[path]) return pageTitles[path];
  for (const [key, title] of Object.entries(pageTitles)) {
    if (path.startsWith(key) && key !== "/admin") return title;
  }
  return "Panel Admin";
}

interface AdminLayoutProps {
  children: ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { grantedMenus, isAdmin } = usePermissions();
  const location = useLocation();
  const currentPath = location.pathname;
  const pageTitle = getPageTitle(currentPath);

  return (
    <div className="flex h-screen bg-white overflow-hidden">
      {/* Sidebar */}
      <AdminSidebar
        grantedMenus={grantedMenus}
        isAdmin={isAdmin}
        currentPath={currentPath}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        {/* Top header bar */}
        <header className="sticky top-0 z-30 flex items-center gap-3 bg-white border-b border-black/10 shadow-sm px-4 py-3">
          {/* Hamburger (mobile only) */}
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg text-black/70 hover:bg-white transition-colors"
            aria-label="Buka menu"
            data-ocid="admin.open_sidebar_button"
          >
            <Menu size={20} />
          </button>

          {/* Page title */}
          <h1 className="text-base font-semibold text-black flex-1 truncate">
            {pageTitle}
          </h1>

          {/* Breadcrumb label */}
          <span className="hidden sm:inline-flex items-center gap-1.5 text-xs text-black/60 bg-white border border-black/10 rounded-full px-3 py-1 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-red-600 inline-block" />
            JDIH UNTAG Banyuwangi
          </span>
        </header>

        {/* Scrollable content */}
        <main
          className="flex-1 overflow-y-auto p-6"
          data-ocid="admin.main_content"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
