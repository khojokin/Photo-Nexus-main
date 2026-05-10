import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const ADMIN_EMAILS = new Set(["kingsfordkojo7@gmail.com"]);
const ADMIN_USERNAMES = new Set(["kingsfordkojo7", "kingsfordkojo"]);

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
    void fetchUser();
  }, [fetchUser]);

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
