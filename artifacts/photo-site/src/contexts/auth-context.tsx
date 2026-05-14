import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const ADMIN_EMAILS = new Set(["kingsfordkojo7@gmail.com", "kingsfordkojo7@icloud.com"]);

export interface AuthUser {
  id: string;
  email: string | null;
  username?: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

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

function ReplitAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/user", { credentials: "include" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = (await res.json()) as { user: AuthUser | null };
      setUser(data.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const refetch = useCallback(async () => {
    await fetchUser();
  }, [fetchUser]);

  const login = useCallback(() => {
    const base = (import.meta.env.BASE_URL as string).replace(/\/+$/, "") || "/";
    window.location.href = `/api/login?returnTo=${encodeURIComponent(base)}`;
  }, []);

  const logout = useCallback(async () => {
    window.location.href = "/api/logout";
  }, []);

  const loginWithUser = useCallback((_u: AuthUser) => {
    login();
  }, [login]);

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
        isAuthenticated: Boolean(user),
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <ReplitAuthProvider>{children}</ReplitAuthProvider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
