import {
  createContext,
  useCallback,
  useContext,
} from "react";

export interface AuthUser {
  id: string;
  email: string | null;
  username?: string | null;
  firstName: string | null;
  lastName: string | null;
  profileImageUrl: string | null;
}

const DEFAULT_USER: AuthUser = {
  id: "default-user-001",
  email: "photographer@affuaa.com",
  firstName: "Alex",
  lastName: "Morgan",
  profileImageUrl: null,
};

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
  const login = useCallback(() => {
    window.location.href = "/";
  }, []);

  const logout = useCallback(async () => {
    window.location.href = "/";
  }, []);

  const refetch = useCallback(async () => {
    // Always logged in — no-op
  }, []);

  const loginWithUser = useCallback((_u: AuthUser) => {
    window.location.href = "/";
  }, []);

  const loginAsDemo = useCallback(() => {
    window.location.href = "/";
  }, []);

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      return fetch(input, {
        ...init,
        credentials: (init?.credentials ?? "include"),
      });
    },
    [],
  );

  const userEmail = DEFAULT_USER.email?.toLowerCase() ?? "";
  const isAdmin = Boolean(userEmail && ADMIN_EMAILS.has(userEmail));

  return (
    <AuthContext.Provider
      value={{
        user: DEFAULT_USER,
        isAdmin,
        isLoading: false,
        isAuthenticated: true,
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
