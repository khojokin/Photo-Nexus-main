import {
  createContext,
  useCallback,
  useContext,
  useState,
  useEffect,
} from "react";

export interface AuthUser {
  id: string;
  email: string | null;
  username?: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

const ADMIN_EMAILS = new Set(["photographer@affuaa.com", "kingsfordkojo7@gmail.com", "kingsfordkojo7@icloud.com"]);

interface AuthContextValue {
  user: AuthUser | null;
  isAdmin: boolean;
  isLoading: boolean;
  isAuthenticated: boolean;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
  login: () => void;
  loginWithUser: (user: AuthUser) => void;
  loginAsDemo: () => void;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      if (res.ok) {
        const data = await res.json() as { user: AuthUser | null };
        setUser(data.user ?? null);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchUser();
  }, [fetchUser]);

  const login = useCallback(() => {
    const base = (import.meta.env.BASE_URL as string).replace(/\/+$/, "") || "/";
    window.location.href = `/api/login?returnTo=${encodeURIComponent(base)}`;
  }, []);

  const logout = useCallback(async () => {
    window.location.href = "/api/logout";
  }, []);

  const refetch = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const loginWithUser = useCallback((_u: AuthUser) => {
    window.location.href = "/";
  }, []);

  const loginAsDemo = useCallback(() => {
    login();
  }, [login]);

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      return fetch(input, {
        ...init,
        credentials: (init?.credentials ?? "include"),
      });
    },
    [],
  );

  const userEmail = user?.email?.toLowerCase() ?? "";
  const isAdmin = Boolean(userEmail && ADMIN_EMAILS.has(userEmail));

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        isAuthenticated: !!user,
        refetch,
        logout,
        login,
        loginWithUser,
        loginAsDemo,
        authFetch,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
