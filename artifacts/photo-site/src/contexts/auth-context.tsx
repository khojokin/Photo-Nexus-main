import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { useLocation } from "wouter";
import {
  useAuth as useClerkAuth,
  useClerk,
  useUser,
} from "@clerk/clerk-react";

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
const STICKY_ADMIN_KEY = "affuaa_admin_sticky_v1";

function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  const [, navigate] = useLocation();
  const { user: clerkUser, isLoaded } = useUser();
  const { signOut } = useClerk();
  const {
    getToken,
    userId,
    sessionId,
    isLoaded: clerkAuthLoaded,
  } = useClerkAuth();
  const [stickyAdmin, setStickyAdmin] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STICKY_ADMIN_KEY) === "1";
    } catch {
      return false;
    }
  });

  const resolvedEmail = clerkUser?.primaryEmailAddress?.emailAddress
    ?? clerkUser?.emailAddresses?.[0]?.emailAddress
    ?? null;

  const user: AuthUser | null = clerkUser
    ? {
        id: clerkUser.id,
        email: resolvedEmail,
        username: clerkUser.username,
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        profileImageUrl: clerkUser.imageUrl,
      }
    : userId
      ? {
          id: userId,
          email: null,
          username: null,
          firstName: null,
          lastName: null,
          profileImageUrl: null,
        }
      : null;

  const userEmail = user?.email?.toLowerCase() ?? "";
  const isEmailVerified = Boolean(
    clerkUser?.emailAddresses?.some((email) => {
      if (email.emailAddress.toLowerCase() !== userEmail) return false;
      return email.verification?.status === "verified";
    }),
  );
  const metadataRole =
    (clerkUser?.publicMetadata?.role as string | undefined)
    ?? (clerkUser?.unsafeMetadata?.role as string | undefined)
    ?? "";
  const hasAdminRole = metadataRole.toLowerCase() === "admin";
  const hasAdminEmail = Boolean(userEmail && ADMIN_EMAILS.has(userEmail));

  const isAdminFromIdentity = Boolean(
    clerkUser
    && (hasAdminRole || (hasAdminEmail && isEmailVerified)),
  );
  const isAdmin = isAdminFromIdentity || (!clerkUser && stickyAdmin);

  useEffect(() => {
    if (isAdminFromIdentity) {
      try {
        localStorage.setItem(STICKY_ADMIN_KEY, "1");
      } catch {
        // Ignore storage failures.
      }
      setStickyAdmin(true);
      return;
    }

    if (clerkUser && !isAdminFromIdentity) {
      try {
        localStorage.removeItem(STICKY_ADMIN_KEY);
      } catch {
        // Ignore storage failures.
      }
      setStickyAdmin(false);
    }
  }, [clerkUser, isAdminFromIdentity]);

  const refetch = useCallback(async () => {
    // Clerk user state is managed by ClerkProvider.
  }, []);

  const logout = useCallback(async () => {
    try {
      localStorage.removeItem(STICKY_ADMIN_KEY);
      localStorage.removeItem("affuaa_logged_out");
      await signOut({ redirectUrl: `${window.location.origin}/` });
    } finally {
      window.location.assign("/");
    }
  }, [signOut]);

  const login = useCallback(() => {
    navigate("/signin");
  }, [navigate]);

  const loginWithUser = useCallback(() => {
    navigate("/signin");
  }, [navigate]);

  const loginAsDemo = useCallback(() => {
    navigate("/signin");
  }, [navigate]);

  const authFetch = useCallback(
    async (input: RequestInfo | URL, init?: RequestInit) => {
      const token = await getToken();
      const headers = new Headers(init?.headers ?? {});
      if (token && !headers.has("Authorization")) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      return fetch(input, {
        ...init,
        headers,
        credentials: init?.credentials ?? "include",
      });
    },
    [getToken],
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        isLoading: !isLoaded || !clerkAuthLoaded,
        isAuthenticated: Boolean(userId || sessionId || user),
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
  return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
  return ctx;
}
