import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "wouter";
import { Menu, X, LayoutDashboard, MessageSquare, Upload, User, Settings, Bell, LogOut, Activity, BookOpen, Layout as LayoutIcon, Sun, Shield, DollarSign } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./notifications";
import { useAuth } from "@/contexts/auth-context";

const PRIMARY_LINKS = [
  { href: "/photos", label: "Explore" },
  { href: "/collections", label: "Collections" },
];

const MENU_LINKS = [
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard", label: "Analytics", icon: LayoutDashboard },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/monetise", label: "Monetise", icon: DollarSign },
  { href: "/moodboard", label: "Mood Board", icon: LayoutIcon },
  { href: "/series", label: "Series", icon: BookOpen },
  { href: "/photo-of-the-day", label: "Photo of the Day", icon: Sun },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/admin", label: "Moderation", icon: Shield },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, isLoading, login, logout } = useAuth();

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    if (menuOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [menuOpen]);

  useEffect(() => {
    setMenuOpen(false);
  }, [location]);

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
                      <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-background/95 backdrop-blur shadow-xl overflow-hidden">
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
                        <div className="p-2">
                          {MENU_LINKS.map((l) => {
                            const Icon = l.icon;
                            return (
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
                                <Icon className="w-4 h-4 shrink-0" />
                                {l.label}
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
        <div className="container mx-auto px-4 text-center">
          <p className="font-serif text-2xl mb-4">Affuaa.</p>
          <p className="text-muted-foreground text-sm">Curated photography. Respect the craft.</p>
        </div>
      </footer>
    </div>
  );
}
