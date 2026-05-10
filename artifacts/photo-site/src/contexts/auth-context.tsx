import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

const ADMIN_EMAILS = new Set(["kingsfordkojo7@gmail.com"]);

const DEFAULT_USER = {
  id: "guest-user-001",
  email: "kingsfordkojo7@gmail.com",
  username: "kingsfordkojo7",
  firstName: "Kingsford",
  lastName: "Kojo",
  profileImageUrl: null,
};

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
  const [user, setUser] = useState<AuthUser | null>(DEFAULT_USER);
  const [isLoading, setIsLoading] = useState(false);

  const fetchUser = useCallback(async () => {
    setUser(DEFAULT_USER);
  }, []);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  const loginWithUser = useCallback((u: AuthUser) => {
    setUser(u);
  }, []);

  const userEmail = user?.email?.toLowerCase() ?? "";
  const isAdmin = ADMIN_EMAILS.has(userEmail);

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
    setUser(DEFAULT_USER);
  }, []);

  const loginAsDemo = useCallback(() => {
    setUser(DEFAULT_USER);
  }, []);

  const logout = useCallback(async () => {
    setUser(DEFAULT_USER);
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        isAuthenticated: true,
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
