import api from '../api';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../context/AuthContext';

export type GrantedMenu = string;

export interface Permissions {
  isAdmin: boolean;
  grantedMenus: string[];
  isLoading: boolean;
  can: (permission: string) => boolean;
}

export function usePermissions(): Permissions {
  const { user, isLoggedIn } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ['permissions', user?.id],
    queryFn: () => api.users.permissions(),
    enabled: isLoggedIn,
    staleTime: 5 * 60_000,
  });

  const grantedMenus = (data?.grantedMenus ?? user?.granted_menus ?? []) as string[];
  const isSuperAdmin = user?.role === 'superadmin';
  const isAdmin = isSuperAdmin || user?.role === 'admin' || data?.isAdmin || false;

  const can = (permission: string): boolean => {
    if (isSuperAdmin) return true;
    return grantedMenus.includes(permission);
  };

  if (!isLoggedIn) {
    return { isAdmin: false, grantedMenus: [], isLoading: false, can: () => false };
  }

  return {
    isAdmin,
    grantedMenus,
    isLoading,
    can,
  };
}
