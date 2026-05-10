import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useAuth as useClerkAuth, useUser as useClerkUser } from "@clerk/clerk-react";
import { setAuthTokenGetter } from "@workspace/api-client-react";

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
  const { isLoaded, isSignedIn, getToken, signOut } = useClerkAuth();
  const { user: clerkUser } = useClerkUser();

  useEffect(() => {
    setAuthTokenGetter(async () => (await getToken()) ?? null);
    return () => {
      setAuthTokenGetter(null);
    };
  }, [getToken]);

  const fetchUser = useCallback(async () => {
    if (!isLoaded) {
      setIsLoading(true);
      return;
    }

    if (!isSignedIn) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    const fallbackUser: AuthUser | null = clerkUser
      ? {
          id: clerkUser.id,
          email: clerkUser.primaryEmailAddress?.emailAddress ?? null,
          username: clerkUser.username ?? null,
          firstName: clerkUser.firstName ?? null,
          lastName: clerkUser.lastName ?? null,
          profileImageUrl: clerkUser.imageUrl ?? null,
        }
      : null;

    if (fallbackUser) {
      setUser(fallbackUser);
    }

    setIsLoading(true);
    try {
      const token = await getToken();
      const headers = new Headers();
      if (token) headers.set("authorization", `Bearer ${token}`);

      const res = await fetch("/api/auth/user", {
        credentials: "include",
        headers,
      });
      if (res.ok) {
        const data = await res.json();
        const apiUser = (data.user ?? null) as Partial<AuthUser> | null;
        if (apiUser) {
          setUser({
            id: apiUser.id ?? fallbackUser?.id ?? "",
            email: apiUser.email ?? fallbackUser?.email ?? null,
            username: apiUser.username ?? fallbackUser?.username ?? null,
            firstName: apiUser.firstName ?? fallbackUser?.firstName ?? null,
            lastName: apiUser.lastName ?? fallbackUser?.lastName ?? null,
            profileImageUrl: apiUser.profileImageUrl ?? fallbackUser?.profileImageUrl ?? null,
          });
        } else {
          setUser(fallbackUser);
        }
      } else {
        setUser(fallbackUser);
      }
    } catch {
      setUser(fallbackUser);
    } finally {
      setIsLoading(false);
    }
  }, [clerkUser, getToken, isLoaded, isSignedIn]);

  const userEmail = user?.email?.toLowerCase() ?? "";
  const userUsername = user?.username?.toLowerCase() ?? "";
  const isAdmin = ADMIN_EMAILS.has(userEmail) || ADMIN_USERNAMES.has(userUsername);

  useEffect(() => {
    void fetchUser();
  }, [fetchUser]);

  useEffect(() => {
    if (isAdmin) {
      localStorage.setItem("affuaa_admin_role", "admin");
      return;
    }
    localStorage.removeItem("affuaa_admin_role");
  }, [isAdmin]);

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const token = await getToken();
      const headers = new Headers(init?.headers);
      if (token && !headers.has("authorization")) {
        headers.set("authorization", `Bearer ${token}`);
      }

      return fetch(input, {
        ...init,
        headers,
        credentials: init?.credentials ?? "include",
      });
    },
    [getToken],
  );

  const loginAsDemo = useCallback(() => {
    window.location.href = "/signin";
  }, []);

  const login = useCallback(() => {
    window.location.href = "/signin";
  }, []);

  const logout = useCallback(async () => {
    await signOut({ redirectUrl: "/signin" });
    setUser(null);
  }, [signOut]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading,
        isAuthenticated: (isLoaded && isSignedIn) === true,
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
