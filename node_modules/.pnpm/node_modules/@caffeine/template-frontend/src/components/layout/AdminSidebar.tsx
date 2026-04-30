import { useNavigate } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  BarChart2,
  BookOpen,
  FileText,
  FolderTree,
  Image as ImageIcon,
  Inbox,
  LayoutDashboard,
  LogOut,
  Newspaper,
  ScrollText,
  Shield,
  Tag,
  Users,
  Settings as SettingsIcon,
  X,
} from "lucide-react";
import { usePermissions, type GrantedMenu } from "../../hooks/usePermissions";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";

interface MenuItem {
  label: string;
  path: string;
  icon: React.ReactNode;
  permission?: GrantedMenu;
  isInbox?: boolean;
}

interface MenuSection {
  title: string;
  items: MenuItem[];
}

const menuSections: MenuSection[] = [
  {
    title: "Utama",
    items: [
      {
        label: "Dashboard",
        path: "/admin",
        icon: <LayoutDashboard size={18} />,
        permission: "dashboard:view",
      },
    ]
  },
  {
    title: "Konten Hukum",
    items: [
      {
        label: "Pusat Verifikasi",
        path: "/admin/verifikasi",
        icon: <Inbox size={18} />,
        permission: "dokumen:review",
        isInbox: true,
      },
      {
        label: "Dokumen",
        path: "/admin/dokumen",
        icon: <FileText size={18} />,
        permission: "dokumen:view",
      },
      {
        label: "Kategori Dokumen",
        path: "/admin/kategori",
        icon: <FolderTree size={18} />,
        permission: "kategori:view",
      },
      {
        label: "Status Dokumen",
        path: "/admin/status",
        icon: <Tag size={18} />,
        permission: "status:view",
      },
    ]
  },
  {
    title: "Informasi & Media",
    items: [
      {
        label: "Berita",
        path: "/admin/berita",
        icon: <Newspaper size={18} />,
        permission: "berita:view",
      },
      {
        label: "Galeri",
        path: "/admin/galeri",
        icon: <ImageIcon size={18} />,
        permission: "galeri:view",
      },
    ]
  },
  {
    title: "Pengaturan Sistem",
    items: [
      {
        label: "Statistik",
        path: "/admin/statistik",
        icon: <BarChart2 size={18} />,
        permission: "statistik:view",
      },
      {
        label: "Pengguna",
        path: "/admin/users",
        icon: <Users size={18} />,
        permission: "userManagement:view",
      },
      {
        label: "Role & Akses",
        path: "/admin/roles",
        icon: <Shield size={18} />,
        permission: "roleManagement:view",
      },
      {
        label: "Tentang JDIH",
        path: "/admin/tentang",
        icon: <BookOpen size={18} />,
        permission: "tentang:view",
      },
      {
        label: "Log Aktivitas",
        path: "/admin/log",
        icon: <ScrollText size={18} />,
        permission: "activityLog:view",
      },
      {
        label: "Pengaturan",
        path: "/admin/settings",
        icon: <SettingsIcon size={18} />,
        permission: "settings:view",
      },
    ]
  }
];

interface AdminSidebarProps {
  grantedMenus: GrantedMenu[];
  isAdmin: boolean;
  currentPath: string;
  isOpen: boolean;
  onClose: () => void;
}

export function AdminSidebar({
  grantedMenus,
  isAdmin,
  currentPath,
  isOpen,
  onClose,
}: AdminSidebarProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { can } = usePermissions();

  const { data: pending } = useQuery({
    queryKey: ['pendingCount'],
    queryFn: () => api.dokumen.pendingCount(),
    refetchInterval: 30000 
  });

  const displayName = user?.nama ?? user?.username ?? '';
  const truncatedName =
    displayName.length > 22 ? `${displayName.slice(0, 19)}...` : displayName;

  const canAccess = (item: MenuItem) => {
    if (!item.permission) return true;
    return can(item.permission);
  };

  const isActive = (path: string) => {
    if (path === "/admin") return currentPath === "/admin";
    return currentPath.startsWith(path);
  };

  const sidebarContent = (
    <div className="flex flex-col h-full bg-red-700 text-white">
      {/* Logo + Title */}
      <div className="flex items-center justify-between px-5 py-5 border-b border-red-600 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-white rounded-lg flex items-center justify-center flex-shrink-0 shadow-inner">
            <span className="text-red-700 font-bold text-sm">JD</span>
          </div>
          <div>
            <p className="font-bold text-white text-sm leading-tight tracking-wider">JDIH UNTAG</p>
            <p className="text-red-200 text-[10px] uppercase font-bold tracking-tighter opacity-80">Panel Administrasi</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="lg:hidden p-1.5 rounded-full hover:bg-red-600 transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 px-3 py-6 space-y-7 overflow-y-auto custom-scrollbar">
        {menuSections.map((section) => {
          const visibleItems = section.items.filter(canAccess);
          if (visibleItems.length === 0) return null;

          return (
            <div key={section.title} className="space-y-1.5">
              <h4 className="px-3 text-[10px] font-bold text-red-200/60 uppercase tracking-[0.15em]">
                {section.title}
              </h4>
              <div className="space-y-1">
                {visibleItems.map((item) => {
                  const active = isActive(item.path);
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-all duration-200 group ${
                        active
                          ? "bg-white text-red-700 font-bold shadow-md transform scale-[1.02]"
                          : "text-red-50 hover:bg-red-600 hover:translate-x-1"
                      }`}
                    >
                      <span className={`${active ? "text-red-700" : "text-red-300 group-hover:text-white"}`}>
                        {item.icon}
                      </span>
                      <span className="truncate flex-1">{item.label}</span>
                      {item.isInbox && pending && pending.count > 0 && (
                         <span className="bg-red-100 text-red-800 text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm animate-pulse ml-2 flex-shrink-0">
                           {pending.count}
                         </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-3 border-t border-red-600 bg-red-800/50">
        {user && (
          <div className="px-3 py-3 mb-2 rounded-xl bg-red-900/30 border border-red-500/20 backdrop-blur-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-xs font-bold ring-2 ring-red-400/30">
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0">
                <p className="text-white text-xs font-bold truncate leading-tight">
                  {truncatedName}
                </p>
                <div className="flex items-center gap-1.5 mt-0.5">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                   <p className="text-red-300 text-[10px] uppercase font-bold tracking-wider">{user.role}</p>
                </div>
              </div>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={() => { logout(); navigate({ to: '/admin/login' }); }}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold text-white bg-red-900/50 hover:bg-red-600 border border-red-500/30 transition-all active:scale-95"
        >
          <LogOut size={16} className="text-red-300" />
          <span>KELUAR SISTEM</span>
        </button>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 h-screen sticky top-0 border-r border-red-600/20 shadow-2xl">
        {sidebarContent}
      </aside>

      {isOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <aside className="relative flex flex-col w-72 h-full z-10 animate-in slide-in-from-left duration-300 shadow-2xl">
            {sidebarContent}
          </aside>
        </div>
      )}
    </>
  );
}
