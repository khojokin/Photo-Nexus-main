import { useEffect, useRef, useState, createContext, useContext, useCallback } from "react";
import { Link, useLocation, useLocation as useNav } from "wouter";
import {
  Menu, X, LayoutDashboard, MessageSquare, Upload, User, Settings, Bell,
  LogOut, Activity, BookOpen, Layout as LayoutIcon, Sun, Shield,
  Crown, Lock, Telescope, Search, Tag, ArrowRight, ImageIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./notifications";
import { useAuth } from "@/contexts/auth-context";
import { LiveChat } from "./live-chat";

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
  theme: "light",
  setTheme: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const stored = localStorage.getItem(THEME_KEY) as Theme | null;
    return stored ?? "light";
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

// ─── Nav Search ───────────────────────────────────────────────────────────────
interface PhotoSuggestion {
  id: number;
  title: string;
  imageUrl: string;
  photographerName: string;
  tags?: string[];
}

interface TagSuggestion {
  name: string;
  photoCount: number;
}

type Suggestion =
  | { kind: "photo"; photo: PhotoSuggestion }
  | { kind: "tag"; tag: TagSuggestion }
  | { kind: "photographer"; name: string; count: number }
  | { kind: "all"; query: string };

function NavSearch() {
  const [, navigate] = useNav();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<PhotoSuggestion[]>([]);
  const [tags, setTags] = useState<TagSuggestion[]>([]);
  const [photographers, setPhotographers] = useState<{ name: string; count: number }[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIdx, setActiveIdx] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // All suggestions in one flat list for keyboard nav
  const suggestions: Suggestion[] = [
    ...photos.slice(0, 5).map(p => ({ kind: "photo" as const, photo: p })),
    ...tags.slice(0, 3).map(t => ({ kind: "tag" as const, tag: t })),
    ...photographers.slice(0, 2).map(p => ({ kind: "photographer" as const, name: p.name, count: p.count })),
    ...(query.trim().length > 0 ? [{ kind: "all" as const, query: query.trim() }] : []),
  ];

  function openSearch() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  function closeSearch() {
    setOpen(false);
    setQuery("");
    setPhotos([]);
    setTags([]);
    setPhotographers([]);
    setActiveIdx(-1);
  }

  // Fetch suggestions with debounce
  const fetchSuggestions = useCallback((q: string) => {
    if (!q.trim()) {
      setPhotos([]); setTags([]); setPhotographers([]); setLoading(false);
      return;
    }
    setLoading(true);
    const lq = q.toLowerCase();

    Promise.all([
      fetch(`/api/photos?search=${encodeURIComponent(q)}&limit=6`).then(r => r.json()),
      fetch(`/api/tags`).then(r => r.json()),
    ]).then(([photoData, tagData]: [{ photos?: PhotoSuggestion[] }, TagSuggestion[] | { tags?: TagSuggestion[] }]) => {
      const photoResults: PhotoSuggestion[] = photoData.photos ?? [];

      // Tags: filter matching tags
      const allTags: TagSuggestion[] = Array.isArray(tagData)
        ? tagData
        : (tagData as { tags?: TagSuggestion[] }).tags ?? [];
      const matchingTags = allTags
        .filter(t => t.name.toLowerCase().includes(lq))
        .sort((a, b) => b.photoCount - a.photoCount)
        .slice(0, 3);

      // Photographers: dedupe from photo results
      const photographerMap = new Map<string, number>();
      photoResults.forEach(p => {
        if (p.photographerName.toLowerCase().includes(lq)) {
          photographerMap.set(p.photographerName, (photographerMap.get(p.photographerName) ?? 0) + 1);
        }
      });
      const matchingPhotographers = Array.from(photographerMap.entries())
        .map(([name, count]) => ({ name, count }))
        .slice(0, 2);

      setPhotos(photoResults.filter(p => !matchingPhotographers.some(ph => ph.name === p.photographerName) || true).slice(0, 5));
      setTags(matchingTags);
      setPhotographers(matchingPhotographers);
    }).catch(() => {
      setPhotos([]); setTags([]);
    }).finally(() => setLoading(false));
  }, []);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    setActiveIdx(-1);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => fetchSuggestions(v), 220);
  }

  function selectSuggestion(s: Suggestion) {
    if (s.kind === "photo") navigate(`/photos/${s.photo.id}`);
    else if (s.kind === "tag") navigate(`/tags/${encodeURIComponent(s.tag.name)}`);
    else if (s.kind === "photographer") navigate(`/profile/${encodeURIComponent(s.name)}`);
    else navigate(`/photos?search=${encodeURIComponent(s.query)}`);
    closeSearch();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") { closeSearch(); return; }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx(i => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx(i => Math.max(i - 1, -1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (activeIdx >= 0 && suggestions[activeIdx]) {
        selectSuggestion(suggestions[activeIdx]);
      } else if (query.trim()) {
        navigate(`/photos?search=${encodeURIComponent(query.trim())}`);
        closeSearch();
      }
    }
  }

  // Close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        closeSearch();
      }
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  const showDropdown = open && query.trim().length > 0;
  const hasResults = photos.length > 0 || tags.length > 0 || photographers.length > 0;

  let globalIdx = 0;

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xs hidden md:block">
      {!open ? (
        <button
          onClick={openSearch}
          className="flex items-center gap-2 w-full px-3 py-2 border border-border/40 bg-muted/20 text-muted-foreground hover:border-border hover:text-foreground transition-colors text-sm"
          aria-label="Open search"
        >
          <Search className="w-3.5 h-3.5 flex-shrink-0" />
          <span className="text-xs">Search photos, tags, photographers…</span>
          <kbd className="ml-auto text-[10px] px-1.5 py-0.5 border border-border/50 text-muted-foreground/60 hidden xl:inline">
            /
          </kbd>
        </button>
      ) : (
        <div className="flex items-center border border-foreground/30 bg-background">
          <Search className="w-3.5 h-3.5 text-muted-foreground ml-3 flex-shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="Search photos, tags, photographers…"
            className="flex-1 bg-transparent px-3 py-2 text-sm focus:outline-none placeholder:text-muted-foreground/50"
            autoComplete="off"
            spellCheck={false}
          />
          {loading && (
            <div className="w-3.5 h-3.5 rounded-full border-2 border-muted border-t-muted-foreground animate-spin mr-3" />
          )}
          <button onClick={closeSearch} className="p-2 text-muted-foreground hover:text-foreground transition-colors">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Dropdown */}
      {showDropdown && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border shadow-2xl z-[200] max-h-[420px] overflow-y-auto">
          {!hasResults && !loading && (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">
              No results for "<span className="text-foreground">{query}</span>"
            </div>
          )}

          {/* Photos */}
          {photos.length > 0 && (
            <div>
              <div className="px-3 pt-3 pb-1.5">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <ImageIcon className="w-3 h-3" /> Photos
                </p>
              </div>
              {photos.map(p => {
                const idx = globalIdx++;
                const active = activeIdx === idx;
                return (
                  <button
                    key={p.id}
                    onClick={() => selectSuggestion({ kind: "photo", photo: p })}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 text-left transition-colors",
                      active ? "bg-muted/60" : "hover:bg-muted/30"
                    )}
                  >
                    <img
                      src={p.imageUrl}
                      alt={p.title}
                      className="w-10 h-10 object-cover flex-shrink-0 border border-border/30"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{p.photographerName}</p>
                    </div>
                    {active && <ArrowRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Tags */}
          {tags.length > 0 && (
            <div className={cn(photos.length > 0 && "border-t border-border/40")}>
              <div className="px-3 pt-3 pb-1.5">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <Tag className="w-3 h-3" /> Tags
                </p>
              </div>
              {tags.map(t => {
                const idx = globalIdx++;
                const active = activeIdx === idx;
                return (
                  <button
                    key={t.name}
                    onClick={() => selectSuggestion({ kind: "tag", tag: t })}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors",
                      active ? "bg-muted/60" : "hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 border border-border/40 bg-muted/40 flex items-center justify-center flex-shrink-0">
                        <Tag className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <span className="text-sm">{t.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{t.photoCount} photo{t.photoCount !== 1 ? "s" : ""}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* Photographers */}
          {photographers.length > 0 && (
            <div className={cn((photos.length > 0 || tags.length > 0) && "border-t border-border/40")}>
              <div className="px-3 pt-3 pb-1.5">
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                  <User className="w-3 h-3" /> Photographers
                </p>
              </div>
              {photographers.map(ph => {
                const idx = globalIdx++;
                const active = activeIdx === idx;
                return (
                  <button
                    key={ph.name}
                    onClick={() => selectSuggestion({ kind: "photographer", name: ph.name, count: ph.count })}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={cn(
                      "w-full flex items-center justify-between px-3 py-2.5 text-left transition-colors",
                      active ? "bg-muted/60" : "hover:bg-muted/30"
                    )}
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-full border border-border/40 bg-muted/40 flex items-center justify-center flex-shrink-0">
                        <User className="w-3 h-3 text-muted-foreground" />
                      </div>
                      <span className="text-sm">{ph.name}</span>
                    </div>
                    <span className="text-xs text-muted-foreground">{ph.count} photo{ph.count !== 1 ? "s" : ""}</span>
                  </button>
                );
              })}
            </div>
          )}

          {/* "View all results" footer */}
          {query.trim() && (
            <div className="border-t border-border/40">
              {(() => {
                const idx = globalIdx++;
                const active = activeIdx === idx;
                return (
                  <button
                    onClick={() => selectSuggestion({ kind: "all", query: query.trim() })}
                    onMouseEnter={() => setActiveIdx(idx)}
                    className={cn(
                      "w-full flex items-center gap-2.5 px-3 py-3 text-sm text-muted-foreground transition-colors",
                      active ? "bg-muted/60 text-foreground" : "hover:bg-muted/30 hover:text-foreground"
                    )}
                  >
                    <Search className="w-3.5 h-3.5 flex-shrink-0" />
                    View all results for "<span className="font-medium text-foreground">{query.trim()}</span>"
                    <ArrowRight className="w-3.5 h-3.5 ml-auto" />
                  </button>
                );
              })()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Mobile search button (opens full-screen search on small screens)
function MobileSearch() {
  const [, navigate] = useNav();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<PhotoSuggestion[]>([]);
  const [tags, setTags] = useState<TagSuggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function openModal() {
    setOpen(true);
    setTimeout(() => inputRef.current?.focus(), 80);
  }

  function closeModal() {
    setOpen(false);
    setQuery("");
    setPhotos([]);
    setTags([]);
  }

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const v = e.target.value;
    setQuery(v);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!v.trim()) { setPhotos([]); setTags([]); return; }
    setLoading(true);
    debounceRef.current = setTimeout(() => {
      Promise.all([
        fetch(`/api/photos?search=${encodeURIComponent(v)}&limit=6`).then(r => r.json()),
        fetch(`/api/tags`).then(r => r.json()),
      ]).then(([pd, td]: [{ photos?: PhotoSuggestion[] }, TagSuggestion[] | { tags?: TagSuggestion[] }]) => {
        setPhotos(pd.photos?.slice(0, 5) ?? []);
        const allTags: TagSuggestion[] = Array.isArray(td) ? td : (td as { tags?: TagSuggestion[] }).tags ?? [];
        setTags(allTags.filter(t => t.name.toLowerCase().includes(v.toLowerCase())).slice(0, 4));
      }).catch(() => {}).finally(() => setLoading(false));
    }, 220);
  }

  function go(path: string) { navigate(path); closeModal(); }

  // Keyboard: Escape closes
  useEffect(() => {
    if (!open) return;
    function handler(e: KeyboardEvent) { if (e.key === "Escape") closeModal(); }
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <>
      <button
        onClick={openModal}
        aria-label="Search"
        className="md:hidden p-2 text-muted-foreground hover:text-foreground transition-colors"
      >
        <Search className="w-4.5 h-4.5" />
      </button>

      {open && (
        <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-[300] flex flex-col">
          {/* Header */}
          <div className="flex items-center gap-2 p-4 border-b border-border">
            <Search className="w-4 h-4 text-muted-foreground flex-shrink-0" />
            <input
              ref={inputRef}
              value={query}
              onChange={handleChange}
              onKeyDown={e => {
                if (e.key === "Enter" && query.trim()) {
                  go(`/photos?search=${encodeURIComponent(query.trim())}`);
                }
              }}
              placeholder="Search photos, tags, photographers…"
              className="flex-1 bg-transparent text-base focus:outline-none placeholder:text-muted-foreground/50"
              autoComplete="off"
            />
            {loading && <div className="w-4 h-4 rounded-full border-2 border-muted border-t-muted-foreground animate-spin" />}
            <button onClick={closeModal} className="text-muted-foreground hover:text-foreground transition-colors ml-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Results */}
          <div className="flex-1 overflow-y-auto">
            {photos.length === 0 && tags.length === 0 && !loading && query.trim() && (
              <div className="py-16 text-center text-muted-foreground text-sm">No results for "{query}"</div>
            )}
            {!query.trim() && (
              <div className="py-12 text-center text-muted-foreground text-sm">
                <Search className="w-8 h-8 mx-auto mb-3 opacity-30" />
                Type to search photos, tags and photographers
              </div>
            )}

            {photos.length > 0 && (
              <div>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-4 pt-4 pb-2">Photos</p>
                {photos.map(p => (
                  <button key={p.id} onClick={() => go(`/photos/${p.id}`)}
                    className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/30 transition-colors text-left">
                    <img src={p.imageUrl} alt={p.title} className="w-12 h-12 object-cover flex-shrink-0 border border-border/30" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{p.title}</p>
                      <p className="text-xs text-muted-foreground">{p.photographerName}</p>
                    </div>
                  </button>
                ))}
              </div>
            )}

            {tags.length > 0 && (
              <div className={cn(photos.length > 0 && "border-t border-border/40 mt-2")}>
                <p className="text-[10px] uppercase tracking-widest text-muted-foreground px-4 pt-4 pb-2">Tags</p>
                <div className="flex flex-wrap gap-2 px-4 pb-4">
                  {tags.map(t => (
                    <button key={t.name} onClick={() => go(`/tags/${encodeURIComponent(t.name)}`)}
                      className="flex items-center gap-1.5 px-3 py-1.5 border border-border text-sm hover:border-foreground/40 transition-colors">
                      <Tag className="w-3 h-3 text-muted-foreground" />
                      {t.name}
                      <span className="text-muted-foreground text-xs ml-0.5">{t.photoCount}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {query.trim() && (
              <div className="px-4 py-3 border-t border-border/40">
                <button onClick={() => go(`/photos?search=${encodeURIComponent(query.trim())}`)}
                  className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Search className="w-3.5 h-3.5" />
                  View all results for "<span className="font-medium text-foreground">{query.trim()}</span>"
                  <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ─── Unread messages badge hook ───────────────────────────────────────────────
const MSG_NAME_KEY = "affuaa_display_name";

function useUnreadMessages() {
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    const myName = localStorage.getItem(MSG_NAME_KEY);
    if (!myName) return;

    async function check() {
      try {
        const res = await fetch(`/api/messages?name=${encodeURIComponent(myName!)}`);
        if (res.ok) {
          const data = await res.json() as { conversations: Array<{ unread: number }> };
          const total = (data.conversations ?? []).reduce((s, c) => s + (c.unread ?? 0), 0);
          setUnread(total);
        }
      } catch {}
    }

    void check();
    const id = setInterval(() => void check(), 15_000);
    return () => clearInterval(id);
  }, []);

  return unread;
}

// ─── Nav config ───────────────────────────────────────────────────────────────
const PRIMARY_LINKS = [
  { href: "/photos", label: "Explore" },
  { href: "/collections", label: "Collections" },
  { href: "/discover", label: "Today's Edit" },
];

const MENU_LINKS = [
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/moodboard", label: "Mood Board", icon: LayoutIcon },
  { href: "/series", label: "Series", icon: BookOpen },
  { href: "/photo-of-the-day", label: "Photo of the Day", icon: Sun },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/profile", label: "Profile", icon: User },
  { href: "/settings", label: "Settings", icon: Settings },
];

const ADMIN_LINK = { href: "/admin", label: "Admin Panel", icon: Shield };
const PREMIUM_LINK = { href: "/premium", label: "Premium", icon: Crown };

// ─── Layout ───────────────────────────────────────────────────────────────────
const HIDDEN_PAGES_KEY = "affuaa_hidden_pages";
function getHiddenPages(): string[] {
  try { return JSON.parse(localStorage.getItem(HIDDEN_PAGES_KEY) ?? "[]") as string[]; }
  catch { return []; }
}

interface MaintenanceConfig { enabled: boolean; message: string; returnTime: string; }
const MAINTENANCE_KEY = "affuaa_maintenance";
function getMaintenance(): MaintenanceConfig {
  try { return JSON.parse(localStorage.getItem(MAINTENANCE_KEY) ?? "null") as MaintenanceConfig ?? { enabled: false, message: "", returnTime: "" }; }
  catch { return { enabled: false, message: "", returnTime: "" }; }
}

function MaintenanceSplash({ config }: { config: MaintenanceConfig }) {
  return (
    <div className="fixed inset-0 z-[500] bg-background flex flex-col items-center justify-center text-center px-6">
      <div className="max-w-md w-full">
        <p className="font-serif text-5xl mb-6 tracking-tight">Affuaa.</p>
        <div className="w-12 h-px bg-foreground/20 mx-auto mb-8" />
        <p className="font-serif text-2xl mb-3">We'll be back soon.</p>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {config.message || "We're making things even better. The site is temporarily down for scheduled maintenance."}
        </p>
        {config.returnTime && (
          <p className="mt-4 text-xs font-medium uppercase tracking-widest text-muted-foreground/60">{config.returnTime}</p>
        )}
        <div className="mt-10 pt-8 border-t border-border/30 text-xs text-muted-foreground/40">
          © {new Date().getFullYear()} Affuaa. All rights reserved.
        </div>
      </div>
    </div>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { user, isAdmin, isLoading, logout } = useAuth();
  const unreadMessages = useUnreadMessages();
  const [hiddenPages] = useState<string[]>(() => getHiddenPages());
  const [maintenanceConfig] = useState<MaintenanceConfig>(() => getMaintenance());

  const displayName = (() => {
    try { return JSON.parse(localStorage.getItem("affuaa_settings") ?? "{}").displayName ?? ""; }
    catch { return ""; }
  })();

  const { isQualified } = useMonetiseQualification(user ? displayName : "");
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

  // Global "/" shortcut to focus search
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        document.querySelector<HTMLButtonElement>("[data-nav-search]")?.click();
      }
    }
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  const menuLinks = [
    PREMIUM_LINK,
    ...MENU_LINKS,
    ...(isAdmin ? [ADMIN_LINK] : []),
  ];

  function handleSignOut() {
    setIsSigningOut(true);
    setTimeout(() => {
      void logout();
    }, 420);
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {maintenanceConfig.enabled && !isAdmin && !isLoading && (
        <MaintenanceSplash config={maintenanceConfig} />
      )}
      {isSigningOut && (
        <div className="fixed inset-0 z-[400] bg-background/90 backdrop-blur-sm flex items-center justify-center animate-in fade-in duration-300">
          <div className="text-center">
            <p className="font-serif text-3xl mb-2 animate-pulse">Affuaa.</p>
            <p className="text-sm text-muted-foreground">Signing out...</p>
          </div>
        </div>
      )}
      <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">

          {/* Logo */}
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight flex-shrink-0">
            Affuaa.
          </Link>

          {/* Primary links — desktop */}
          <nav className="hidden lg:flex items-center gap-5 text-sm font-medium flex-shrink-0">
            {PRIMARY_LINKS.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className={cn(
                  "transition-colors whitespace-nowrap",
                  location === l.href || location.startsWith(l.href + "/")
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {l.label}
              </Link>
            ))}
          </nav>

          {/* ── Search bar — center ── */}
          <div className="flex-1 flex justify-center px-2" data-nav-search>
            <NavSearch />
          </div>

          {/* Right side controls */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Mobile search */}
            <MobileSearch />

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
                        {/* Mobile primary links */}
                        <div className="lg:hidden border-b border-border/60 pb-2 mb-1 px-2 pt-2">
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
                            const isMessages = l.href === "/messages";
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
                                {isMessages && unreadMessages > 0 && (
                                  <span className="ml-auto flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground px-1 text-[10px] font-medium text-background">
                                    {unreadMessages > 99 ? "99+" : unreadMessages}
                                  </span>
                                )}
                              </Link>
                            );
                          })}
                        </div>
                        <div className="border-t border-border/60 p-2">
                          <button
                            onClick={handleSignOut}
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
                    className="px-4 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors hidden sm:inline"
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
          </div>
        </div>
      </header>

      <main className="flex-1">
        {!isAdmin && hiddenPages.some(p => p === "/" ? location === "/" : location === p || location.startsWith(p + "/")) ? (
          <div className="min-h-[60vh] flex items-center justify-center text-center px-4">
            <div>
              <p className="font-serif text-4xl mb-3">Page Unavailable</p>
              <p className="text-muted-foreground text-sm">This page is currently not available. Check back soon.</p>
              <Link href="/" className="mt-6 inline-block text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground transition-colors">← Back to home</Link>
            </div>
          </div>
        ) : children}
      </main>

      <footer className="border-t border-border py-12 mt-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <p className="font-serif text-2xl mb-1">Affuaa.</p>
              <p className="text-muted-foreground text-sm">Curated photography. Respect the craft.</p>
              <p className="text-muted-foreground/70 text-xs mt-1">© {new Date().getFullYear()} Affuaa. All rights reserved.</p>
            </div>
            <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
              <Link href="/photos" className="hover:text-foreground transition-colors">Explore</Link>
              <Link href="/collections" className="hover:text-foreground transition-colors">Collections</Link>
              <Link href="/premium" className="hover:text-foreground transition-colors">Premium</Link>
              <Link href="/terms" className="hover:text-foreground transition-colors">Terms</Link>
              <Link href="/privacy" className="hover:text-foreground transition-colors">Privacy</Link>
            </div>
          </div>
        </div>
      </footer>
      <LiveChat />
    </div>
  );
}
