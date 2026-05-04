import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { useAuth } from "@/context/AuthContext";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import api, { API_BASE } from "@/api";
import {
  BookOpen,
  Building2,
  ChevronDown,
  FileText,
  Info,
  LogIn,
  LogOut,
  Menu,
  Scale,
  X,
} from "lucide-react";
import { useState } from "react";

const NAV_LINKS = [
  { to: "/", label: "Beranda" },
  { to: "/katalog", label: "Katalog Hukum" },
  { to: "/berita", label: "Berita & Pengumuman" },
  { to: "/statistik", label: "Statistik" },
  { to: "/galeri", label: "Galeri" },
  { to: "/kontak", label: "Kontak" },
];

const TENTANG_SUBMENU = [
  { to: "/tentang/sejarah", label: "Sejarah", icon: Scale },
  { to: "/tentang/visi-misi", label: "Visi & Misi", icon: BookOpen },
  { to: "/tentang/dasar-hukum", label: "Dasar Hukum", icon: FileText },
  { to: "/tentang/fungsi", label: "Fungsi JDIH", icon: Info },
  {
    to: "/tentang/struktur-organisasi",
    label: "Struktur Organisasi",
    icon: Building2,
  },
];

export function Header() {
  const { isLoggedIn, logout } = useAuth();
  const navigate = useNavigate();
  const routerState = useRouterState();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileTentangOpen, setMobileTentangOpen] = useState(false);

  const { data: settings } = useQuery({
    queryKey: ['settings'],
    queryFn: () => api.settings.get(),
  });

  const currentPath = routerState.location.pathname;
  const isTentangActive = currentPath.startsWith("/tentang");

  const handleLogin = () => {
    if (isLoggedIn) {
      logout();
    } else {
      navigate({ to: "/admin" });
    }
  };

  const handleAdminClick = () => {
    navigate({ to: "/admin" });
    setMobileOpen(false);
  };

  return (
    <header
      className="bg-white/80 backdrop-blur-lg sticky top-0 z-50 shadow-sm border-b border-border/40 transition-all duration-300"
      data-ocid="header"
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            to="/"
            className="flex items-center gap-2.5 min-w-0"
            data-ocid="header.logo_link"
          >
            {settings?.logo_url ? (
              <img src={settings.logo_url.startsWith('http') ? settings.logo_url : API_BASE + settings.logo_url} alt="Logo" className="w-10 h-10 object-contain bg-white rounded p-1" />
            ) : (
              <div className="flex-shrink-0 w-9 h-9 bg-accent rounded flex items-center justify-center">
                <Scale className="w-5 h-5 text-accent-foreground" />
              </div>
            )}
            <div className="min-w-0">
              <div className="text-foreground font-display font-bold text-base leading-tight truncate">
                {settings?.app_name || "JDIH UNTAG Banyuwangi"}
              </div>
              <div className="text-muted-foreground text-xs leading-tight hidden sm:block font-medium">
                Jaringan Dokumentasi &amp; Informasi Hukum
              </div>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav
            className="hidden lg:flex items-center gap-1"
            data-ocid="header.desktop_nav"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="px-3 py-2 text-sm text-foreground/70 hover:text-primary hover:bg-primary/5 rounded-full transition-smooth font-medium"
                activeProps={{
                  className: "text-primary bg-primary/10 font-semibold",
                }}
                data-ocid={`header.nav_link.${link.label.toLowerCase().replace(/[\s&]+/g, "_")}`}
              >
                {link.label}
              </Link>
            ))}

            {/* Tentang JDIH Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  type="button"
                  className={`px-3 py-2 text-sm font-medium rounded-full transition-smooth flex items-center gap-1 outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                    isTentangActive
                      ? "text-primary bg-primary/10 font-semibold"
                      : "text-foreground/70 hover:text-primary hover:bg-primary/5"
                  }`}
                  data-ocid="header.tentang_dropdown_trigger"
                >
                  Tentang JDIH
                  <ChevronDown className="w-3.5 h-3.5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-52"
                data-ocid="header.tentang_dropdown"
              >
                {TENTANG_SUBMENU.map((item) => {
                  const Icon = item.icon;
                  return (
                    <DropdownMenuItem key={item.to} asChild>
                      <Link
                        to={item.to}
                        className="flex items-center gap-2 cursor-pointer w-full"
                        data-ocid={`header.tentang_link.${item.label.toLowerCase().replace(/[\s&]+/g, "_")}`}
                      >
                        <Icon className="w-4 h-4 text-primary" />
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-2">
            {isLoggedIn && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAdminClick}
                className="hidden md:flex text-foreground/70 hover:text-primary hover:bg-primary/5 text-xs gap-1 rounded-full font-medium"
                data-ocid="header.admin_button"
              >
                Panel Admin
                <ChevronDown className="w-3 h-3" />
              </Button>
            )}
            <Button
              onClick={handleLogin}
              size="sm"
              className="hidden md:flex bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 text-sm font-semibold transition-smooth rounded-full shadow-sm hover:shadow-md hover:-translate-y-0.5"
              data-ocid="header.login_button"
            >
              {isLoggedIn ? (
                <>
                  <LogOut className="w-4 h-4" />
                  Keluar
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Masuk
                </>
              )}
            </Button>

            {/* Mobile Menu */}
            <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="lg:hidden text-foreground hover:bg-primary/5 rounded-full"
                  data-ocid="header.mobile_menu_button"
                >
                  {mobileOpen ? (
                    <X className="w-5 h-5" />
                  ) : (
                    <Menu className="w-5 h-5" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-72 bg-white border-l border-border/40 p-0 shadow-2xl"
              >
                <div className="flex flex-col h-full">
                  <div className="flex items-center gap-2.5 px-5 py-5 border-b border-border/40 bg-muted/30">
                    {settings?.logo_url ? (
                      <img src={settings.logo_url.startsWith('http') ? settings.logo_url : API_BASE + settings.logo_url} alt="Logo" className="w-9 h-9 object-contain bg-white rounded p-1 shadow-sm" />
                    ) : (
                      <div className="w-8 h-8 bg-accent rounded flex items-center justify-center shadow-sm">
                        <Scale className="w-4 h-4 text-accent-foreground" />
                      </div>
                    )}
                    <span className="text-foreground font-bold text-sm">
                      {settings?.app_name || "JDIH UNTAG Banyuwangi"}
                    </span>
                  </div>
                  <nav
                    className="flex flex-col p-3 gap-1 flex-1 overflow-y-auto"
                    data-ocid="header.mobile_nav"
                  >
                    {NAV_LINKS.map((link) => (
                      <SheetClose asChild key={link.to}>
                        <Link
                          to={link.to}
                          className="px-4 py-3 text-sm text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-lg transition-smooth font-medium"
                          activeProps={{
                            className: "text-primary bg-primary/10 font-semibold",
                          }}
                        >
                          {link.label}
                        </Link>
                      </SheetClose>
                    ))}

                    {/* Mobile Tentang Expandable */}
                    <div data-ocid="header.mobile_tentang_section">
                      <button
                        type="button"
                        onClick={() => setMobileTentangOpen((prev) => !prev)}
                        className={`w-full px-4 py-3 text-sm font-medium rounded-lg transition-smooth flex items-center justify-between ${
                          isTentangActive
                            ? "text-primary bg-primary/10 font-semibold"
                            : "text-foreground/80 hover:text-primary hover:bg-primary/5"
                        }`}
                        data-ocid="header.mobile_tentang_toggle"
                      >
                        <span>Tentang JDIH</span>
                        <ChevronDown
                          className={`w-4 h-4 transition-transform duration-200 ${mobileTentangOpen ? "rotate-180" : ""}`}
                        />
                      </button>
                      {mobileTentangOpen && (
                        <div className="mt-1 ml-3 border-l border-border pl-3 space-y-0.5">
                          {TENTANG_SUBMENU.map((item) => {
                            const Icon = item.icon;
                            return (
                              <SheetClose asChild key={item.to}>
                                <Link
                                  to={item.to}
                                  className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-foreground/70 hover:text-primary hover:bg-primary/5 rounded-lg transition-smooth font-medium"
                                  activeProps={{
                                    className: "text-primary bg-primary/10 font-semibold",
                                  }}
                                  data-ocid={`header.mobile_tentang_link.${item.label.toLowerCase().replace(/[\s&]+/g, "_")}`}
                                >
                                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                                  {item.label}
                                </Link>
                              </SheetClose>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    {isLoggedIn && (
                      <button
                        type="button"
                        onClick={handleAdminClick}
                        className="px-4 py-3 text-sm text-foreground/80 hover:text-primary hover:bg-primary/5 rounded-lg transition-smooth font-medium text-left"
                      >
                        Panel Admin
                      </button>
                    )}
                  </nav>
                  <div className="p-4 border-t border-border/40 bg-muted/10">
                    <Button
                      onClick={() => {
                        handleLogin();
                        setMobileOpen(false);
                      }}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground gap-2 font-semibold shadow-sm"
                      data-ocid="header.mobile_login_button"
                    >
                      {isLoggedIn ? (
                        <>
                          <LogOut className="w-4 h-4" /> Keluar
                        </>
                      ) : (
                        <>
                          <LogIn className="w-4 h-4" /> Masuk Admin
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </div>
    </header>
  );
}
