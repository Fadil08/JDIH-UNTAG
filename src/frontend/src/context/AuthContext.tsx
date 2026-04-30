import {
  type ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import api, {
  type AuthUser,
  type LoginResult,
  clearToken,
  getStoredUser,
  getToken,
  setStoredUser,
  setToken,
} from '../api';

// ── Context type ──────────────────────────────────────────────────────────────

interface AuthContextType {
  user: AuthUser | null;
  isLoggedIn: boolean;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<LoginResult>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

// ── Provider ──────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inisialisasi: cek token yang tersimpan
  useEffect(() => {
    const token = getToken();
    const stored = getStoredUser();
    if (token && stored) {
      setUser(stored);
      // Verify token masih valid dengan memanggil /api/auth/me
      api.auth.me()
        .then((me) => {
          const updated: AuthUser = {
            id: me.id,
            username: me.username,
            nama: me.nama,
            role: me.role,
            granted_menus: me.grantedMenus ?? me.granted_menus ?? [],
          };
          setUser(updated);
          setStoredUser(updated);
        })
        .catch(() => {
          clearToken();
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (username: string, password: string): Promise<LoginResult> => {
    const result = await api.auth.login(username, password);
    setToken(result.token);
    setStoredUser(result.user);
    setUser(result.user);
    return result;
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoggedIn: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

// ── Hook ──────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth harus digunakan di dalam AuthProvider');
  return ctx;
}
