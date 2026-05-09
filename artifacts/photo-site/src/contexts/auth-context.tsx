import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface AuthUser {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refetch: () => Promise<void>;
  logout: () => Promise<void>;
  login: () => void;
  loginAsDemo: () => void;
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

const DEMO_KEY = "affuaa_demo_session";

const DEMO_USER: AuthUser = {
  id: "demo-user",
  email: "demo@affuaa.com",
  firstName: "Demo",
  lastName: "Photographer",
  profileImageUrl: null,
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setIsLoading(true);
    try {
      // Check for demo session first
      if (localStorage.getItem(DEMO_KEY) === "1") {
        setUser(DEMO_USER);
        setIsLoading(false);
        return;
      }
      const res = await fetch("/api/auth/user", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
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

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      return fetch(input, {
        ...init,
        credentials: init?.credentials ?? "include",
      });
    },
    [],
  );

  const loginAsDemo = useCallback(() => {
    localStorage.setItem(DEMO_KEY, "1");
    setUser(DEMO_USER);
    window.location.href = "/";
  }, []);

  const login = useCallback(() => {
    const base = import.meta.env.BASE_URL.replace(/\/+$/, "") || "/";
    window.location.href = `/login?returnTo=${encodeURIComponent(base)}`;
  }, []);

  const logout = useCallback(async () => {
    localStorage.removeItem(DEMO_KEY);
    await fetch("/api/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
    setUser(null);
    window.location.href = "/";
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: user !== null,
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
