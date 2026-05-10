import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const ADMIN_EMAILS = new Set(["kingsfordkojo7@gmail.com"]);
const ADMIN_USERNAMES = new Set(["kingsfordkojo7", "kingsfordkojo"]);

const DEMO_USER_KEY = "affuaa_demo_user";

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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check localStorage for demo user first
      const stored = localStorage.getItem(DEMO_USER_KEY);
      if (stored) {
        const demoUser = JSON.parse(stored) as AuthUser;
        setUser(demoUser);
        setIsLoading(false);
        return;
      }

      // Fall back to session-based auth
      const res = await fetch("/api/auth/user", {
        credentials: "include",
        cache: "no-store",
        headers: { "Cache-Control": "no-cache" },
      });
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
    void fetchUser();
  }, [fetchUser]);

  const loginWithUser = useCallback((u: AuthUser) => {
    localStorage.setItem(DEMO_USER_KEY, JSON.stringify(u));
    setUser(u);
  }, []);

  const userEmail = user?.email?.toLowerCase() ?? "";
  const userUsername = user?.username?.toLowerCase() ?? "";
  const isAdmin = ADMIN_EMAILS.has(userEmail) || ADMIN_USERNAMES.has(userUsername);

  useEffect(() => {
    if (isAdmin) {
      localStorage.setItem("affuaa_admin_role", "admin");
      return;
    }
    localStorage.removeItem("affuaa_admin_role");
  }, [isAdmin]);

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      return fetch(input, {
        ...init,
        credentials: init?.credentials ?? "include",
      });
    },
    [],
  );

  const login = useCallback(() => {
    window.location.href = "/api/login";
  }, []);

  const loginAsDemo = useCallback(() => {
    window.location.href = "/api/login";
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem(DEMO_USER_KEY);
    setUser(null);
    window.location.href = "/api/logout";
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        isAuthenticated: !!user,
        refetch: fetchUser,
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
