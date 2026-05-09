import { useEffect, useRef, useState, createContext, useContext } from "react";
import { Link, useLocation } from "wouter";
import {
  Menu, X, LayoutDashboard, MessageSquare, Upload, User, Settings, Bell,
  LogOut, Activity, BookOpen, Layout as LayoutIcon, Sun, Shield, DollarSign,
  Moon, Sunset, Monitor, Lock, Telescope,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./notifications";
import { useAuth } from "@/contexts/auth-context";

// ─── Theme ────────────────────────────────────────────────────────────────────
type Theme = "dark" | "light" | "sepia";
const THEME_KEY = "affuaa_theme";

function applyTheme(t: Theme) {
  const root = document.documentElement;
  root.classList.remove("theme-light", "theme-sepia");
  if (t === "light") root.classList.add("theme-light");
  if (t === "sepia") root.classList.add("theme-sepia");
}

const ThemeContext = createContext<{ theme: Theme; setTheme: (t: Theme) => void }>({
  theme: "dark",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    return stored ?? "dark";
  });

  useEffect(() => { applyTheme(theme); }, [theme]);

  function setTheme(t: Theme) {
    setThemeState(t);
    localStorage.setItem(THEME_KEY, t);
    applyTheme(t);
  }

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() { return useContext(ThemeContext); }

function ThemeCycler() {
  const { theme, setTheme } = useTheme();
  const order: Theme[] = ["dark", "light", "sepia"];
  const next = order[(order.indexOf(theme) + 1) % order.length];
  const icons: Record<Theme, React.ElementType> = { dark: Moon, light: Sun, sepia: Sunset };
  const labels: Record<Theme, string> = { dark: "Dark", light: "Light", sepia: "Sepia" };
  const Icon = icons[theme];
  return (
    <button
      onClick={() => setTheme(next)}
      title={`Switch to ${labels[next]} mode`}
      aria-label={`Current theme: ${labels[theme]}. Switch to ${labels[next]}.`}
      className="flex items-center gap-1.5 px-2 py-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-transparent hover:border-border/50 rounded-sm"
    >
      <Icon className="w-3.5 h-3.5" />
      <span className="hidden sm:inline">{labels[theme]}</span>
    </button>
  );
}

// ─── Monetise qualification hook ──────────────────────────────────────────────
const FOLLOWER_THRESHOLD = 1000;
const VIEWS_THRESHOLD = 10000;

function useMonetiseQualification(displayName: string) {
  const [followers, setFollowers] = useState<number | null>(null);
  const [views, setViews] = useState<number | null>(null);

  useEffect(() => {
    if (!displayName) return;
    fetch(`/api/photographers/${encodeURIComponent(displayName)}/follow-stats`)
      .then(r => r.ok ? r.json() : Promise.reject())
      .then((d: { followerCount: number }) => setFollowers(d.followerCount ?? 0))
      .catch(() => setFollowers(0));

    fetch(`/api/photos?limit=200`)
      .then(r => r.json())
      .then((d: { photos: Array<{ photographerName: string; views?: number }> }) => {
        const totalViews = (d.photos ?? [])
          .filter(p => p.photographerName === displayName)
          .reduce((s, p) => s + (p.views ?? 0), 0);
        setViews(totalViews);
      })
      .catch(() => setViews(0));
  }, [displayName]);

  const isQualified = (followers ?? 0) >= FOLLOWER_THRESHOLD && (views ?? 0) >= VIEWS_THRESHOLD;
  return { isQualified, followers: followers ?? 0, views: views ?? 0 };
}

// ─── Nav config ───────────────────────────────────────────────────────────────
const PRIMARY_LINKS = [
  { href: "/photos", label: "Explore" },
  { href: "/collections", label: "Collections" },
  { href: "/discover", label: "Today's Edit" },
];

const MENU_LINKS = [
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard", label: "Analytics", icon: LayoutDashboard },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/moodboard", label: "Mood Board", icon: LayoutIcon },
  { href: "/series", label: "Series", icon: BookOpen },
  { href: "/challenges", label: "Challenges", icon: Telescope },
  { href: "/photo-of-the-day", label: "Photo of the Day", icon: Sun },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

const ADMIN_LINK = { href: "/admin", label: "Admin Panel", icon: Shield };
const MONETISE_LINK = { href: "/monetise", label: "Monetise", icon: DollarSign };

// ─── Layout ───────────────────────────────────────────────────────────────────
export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, isLoading, login, logout } = useAuth();

  const displayName = (() => {
    try { return JSON.parse(localStorage.getItem("affuaa_settings") ?? "{}").displayName ?? ""; }
    catch { return ""; }
  })();

  const { isQualified } = useMonetiseQualification(user ? displayName : "");
  const isAdmin = localStorage.getItem("affuaa_admin_role") === "admin";

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => { setMenuOpen(false); }, [location]);

  const menuLinks = [
    ...MENU_LINKS,
    ...(isQualified || isAdmin ? [MONETISE_LINK] : []),
    ...(isAdmin ? [ADMIN_LINK] : [{ ...ADMIN_LINK, label: "Admin (locked)", icon: Lock }]),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight">
            Affuaa.
          </Link>

          <nav className="flex items-center gap-4 text-sm font-medium">
            {PRIMARY_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "transition-colors hidden sm:block",
                  location === l.href || location.startsWith(l.href + "/")
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {l.label}
              </Link>
            ))}

            <ThemeCycler />

            {!isLoading && (
              user ? (
                <>
                  <NotificationBell />

                  <div className="relative" ref={menuRef}>
                    <button
                      onClick={() => setMenuOpen((o) => !o)}
                      aria-label="Toggle menu"
                      aria-expanded={menuOpen}
                      className={cn(
                        "flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors",
                        menuOpen
                          ? "bg-accent text-foreground"
                          : "text-muted-foreground hover:text-foreground hover:bg-accent"
                      )}
                    >
                      {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                    </button>

                    {menuOpen && (
                      <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border bg-background/95 backdrop-blur shadow-xl overflow-hidden">
                        <div className="sm:hidden border-b border-border/60 pb-2 mb-1 px-2 pt-2">
                          {PRIMARY_LINKS.map((l) => (
                            <Link
                              key={l.href}
                              href={l.href}
                              className={cn(
                                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                                location === l.href
                                  ? "text-foreground bg-accent"
                                  : "text-muted-foreground hover:text-foreground hover:bg-accent"
                              )}
                            >
                              {l.label}
                            </Link>
                          ))}
                        </div>

                        {!isQualified && !isAdmin && (
                          <div className="px-3 pt-2 pb-1">
                            <Link href="/monetise"
                              className="flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors">
                              <Lock className="w-4 h-4 shrink-0" />
                              <span>Monetise</span>
                              <span className="ml-auto text-xs opacity-60">1k+ followers</span>
                            </Link>
                          </div>
                        )}

                        <div className="p-2">
                          {menuLinks.map((l) => {
                            const Icon = l.icon;
                            const isLocked = l.label.includes("(locked)");
                            return (
                              <Link
                                key={l.href}
                                href={l.href}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                                  isLocked
                                    ? "text-muted-foreground/50 hover:text-muted-foreground"
                                    : location === l.href
                                    ? "text-foreground bg-accent"
                                    : "text-muted-foreground hover:text-foreground hover:bg-accent"
                                )}
                              >
                                <Icon className="w-4 h-4 shrink-0" />
                                {isLocked ? "Admin Panel" : l.label}
                                {isLocked && <Lock className="w-3 h-3 ml-auto opacity-40" />}
                              </Link>
                            );
                          })}
                        </div>
                        <div className="border-t border-border/60 p-2">
                          <button
                            onClick={() => void logout()}
                            className="flex w-full items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                          >
                            <LogOut className="w-4 h-4 shrink-0" />
                            Sign Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/signin"
                    className="px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/signup"
                    className="px-4 py-1.5 text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity rounded-md"
                  >
                    Sign Up
                  </Link>
                </div>
              )
            )}
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <footer className="border-t border-border py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="font-serif text-2xl mb-1">Affuaa.</p>
              <p className="text-muted-foreground text-sm">Curated photography. Respect the craft.</p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <Link href="/photos" className="hover:text-foreground transition-colors">Explore</Link>
              <Link href="/collections" className="hover:text-foreground transition-colors">Collections</Link>
              <Link href="/challenges" className="hover:text-foreground transition-colors">Challenges</Link>
              <Link href="/leaderboard" className="hover:text-foreground transition-colors">Leaderboard</Link>
              <Link href="/activity" className="hover:text-foreground transition-colors">Activity</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
