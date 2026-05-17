import { useEffect, useRef, useState, createContext, useContext, useCallback } from "react";
import { Link, useLocation, useLocation as useNav } from "wouter";
import {
  Menu, X, LayoutDashboard, MessageSquare, Upload, User, Settings, Bell,
  LogOut, Activity, BookOpen, Layout as LayoutIcon, Sun, Shield,
  Crown, Lock, Telescope, Search, Tag, ArrowRight, ImageIcon,
  Home, Compass, FolderOpen, Sparkles, CloudUpload, Moon, Palette,
  Award, Package,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "./notifications";
import { useAuth } from "@/contexts/auth-context";
import { LiveChat } from "./live-chat";
import { useUploadProgress } from "@/contexts/upload-progress-context";

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

// ─── Unread notifications badge hook ──────────────────────────────────────────
function useUnreadNotifications() {
  const [unread, setUnread] = useState(0);
  const { authFetch } = useAuth();

  useEffect(() => {
    async function check() {
      try {
        const res = await authFetch("/api/notifications");
        if (res.ok) {
          const data = await res.json() as { unreadCount: number };
          setUnread(data.unreadCount ?? 0);
        }
      } catch {}
    }

    void check();

    const es = new EventSource("/api/notifications/stream", { withCredentials: true });
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data) as { unreadCount: number };
        setUnread(data.unreadCount ?? 0);
      } catch {}
    };
    es.onerror = () => es.close();

    return () => es.close();
  }, [authFetch]);

  return unread;
}

// ─── Nav config ───────────────────────────────────────────────────────────────
const PRIMARY_LINKS = [
  { href: "/photos", label: "Explore" },
  { href: "/illustrations", label: "Illustrations" },
  { href: "/collections", label: "Collections" },
  { href: "/series", label: "Series" },
  { href: "/challenges", label: "Challenges" },
  { href: "/packs", label: "Packs" },
  { href: "/discover", label: "Today's Edit" },
];

const MENU_LINKS = [
  { href: "/profile", label: "Profile", icon: User },
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/messages", label: "Messages", icon: MessageSquare },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/moodboard", label: "Mood Board", icon: LayoutIcon },
  { href: "/series", label: "Series", icon: BookOpen },
  { href: "/challenges", label: "Challenges", icon: Award },
  { href: "/packs", label: "Download Packs", icon: Package },
  { href: "/photo-of-the-day", label: "Photo of the Day", icon: Sun },
  { href: "/activity", label: "Activity", icon: Activity },
  { href: "/settings", label: "Settings", icon: Settings },
];

const ADMIN_LINK = { href: "/admin", label: "Admin Panel", icon: Shield };
const PREMIUM_LINK = { href: "/premium", label: "Premium", icon: Crown };

// ─── Page Progress Bar ────────────────────────────────────────────────────────
function PageProgressBar() {
  const [location] = useLocation();
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const prevLocation = useRef(location);
  const t1 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t2 = useRef<ReturnType<typeof setTimeout> | null>(null);
  const t3 = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (location === prevLocation.current) return;
    prevLocation.current = location;

    [t1, t2, t3].forEach(r => { if (r.current) clearTimeout(r.current); });

    setVisible(true);
    setWidth(0);
    t1.current = setTimeout(() => setWidth(75), 30);
    t2.current = setTimeout(() => setWidth(100), 350);
    t3.current = setTimeout(() => { setVisible(false); setWidth(0); }, 650);
  }, [location]);

  return (
    <div
      className="fixed top-0 left-0 z-[9999] h-[2px] bg-foreground pointer-events-none"
      style={{
        width: `${width}%`,
        transition: width === 0 ? "none" : "width 320ms cubic-bezier(0.4,0,0.2,1)",
        opacity: visible ? 1 : 0,
        transitionProperty: width === 100 ? "width, opacity" : "width",
        transitionDuration: width === 100 ? "200ms, 200ms" : "320ms",
        transitionDelay: width === 100 ? "0ms, 100ms" : "0ms",
      }}
    />
  );
}

// ─── Swipe navigation ─────────────────────────────────────────────────────────
const SWIPE_TABS = ["/", "/photos", "/collections", "/discover", "/profile"];

function SwipeNav() {
  const [location, navigate] = useLocation();
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    }

    function onTouchEnd(e: TouchEvent) {
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      const dy = e.changedTouches[0].clientY - touchStartY.current;
      // Only trigger on predominantly horizontal swipes > 60px
      if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.6) return;

      const cur = SWIPE_TABS.findIndex(t =>
        t === "/" ? location === "/" : location === t || location.startsWith(t + "/")
      );
      if (cur === -1) return;

      if (dx < 0 && cur < SWIPE_TABS.length - 1) navigate(SWIPE_TABS[cur + 1]);
      if (dx > 0 && cur > 0) navigate(SWIPE_TABS[cur - 1]);
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [location, navigate]);

  return null;
}

// ─── Pull to refresh ──────────────────────────────────────────────────────────
const PTR_THRESHOLD = 72;

function PullToRefresh() {
  const [distance, setDistance] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [snapping, setSnapping] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);
  const distRef = useRef(0);

  useEffect(() => {
    function onTouchStart(e: TouchEvent) {
      if (window.scrollY > 2 || refreshing) return;
      pulling.current = true;
      startY.current = e.touches[0].clientY;
      distRef.current = 0;
    }

    function onTouchMove(e: TouchEvent) {
      if (!pulling.current) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        if (distRef.current > 0) { setDistance(0); distRef.current = 0; }
        return;
      }
      // Rubberband resistance
      const d = Math.min(dy * 0.42, PTR_THRESHOLD + 24);
      distRef.current = d;
      setSnapping(false);
      setDistance(d);
    }

    function onTouchEnd() {
      if (!pulling.current) return;
      pulling.current = false;
      const d = distRef.current;
      if (d >= PTR_THRESHOLD) {
        setRefreshing(true);
        setSnapping(true);
        setDistance(PTR_THRESHOLD);
        setTimeout(() => { window.location.reload(); }, 950);
      } else {
        setSnapping(true);
        setDistance(0);
        distRef.current = 0;
        setTimeout(() => setSnapping(false), 300);
      }
    }

    document.addEventListener("touchstart", onTouchStart, { passive: true });
    document.addEventListener("touchmove", onTouchMove, { passive: true });
    document.addEventListener("touchend", onTouchEnd, { passive: true });
    return () => {
      document.removeEventListener("touchstart", onTouchStart);
      document.removeEventListener("touchmove", onTouchMove);
      document.removeEventListener("touchend", onTouchEnd);
    };
  }, [refreshing]);

  const progress = Math.min(distance / PTR_THRESHOLD, 1);
  const circumference = 2 * Math.PI * 10;
  const visible = distance > 2 || refreshing;

  return (
    <div
      className="md:hidden fixed left-0 right-0 z-[9998] flex justify-center pointer-events-none"
      style={{
        top: 64,
        transform: `translateY(${distance - PTR_THRESHOLD}px)`,
        transition: snapping ? "transform 0.28s cubic-bezier(0.4,0,0.2,1)" : "none",
        opacity: visible ? 1 : 0,
      }}
    >
      <div className="w-9 h-9 rounded-full bg-background border border-border shadow-lg flex items-center justify-center mt-2">
        {refreshing ? (
          <div className="w-[18px] h-[18px] rounded-full border-2 border-border border-t-foreground animate-spin" />
        ) : (
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none"
            style={{ transform: `rotate(${progress * 300}deg)`, transition: "none" }}>
            <circle
              cx="11" cy="11" r="10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              className="text-muted-foreground/30"
              style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
            />
            <circle
              cx="11" cy="11" r="10"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeDasharray={circumference}
              strokeDashoffset={circumference * (1 - progress)}
              strokeLinecap="round"
              className="text-foreground"
              style={{ transformOrigin: "center", transform: "rotate(-90deg)" }}
            />
            <path
              d="M11 5v4l2.5-2.5"
              stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
              style={{ opacity: progress }}
            />
          </svg>
        )}
      </div>
    </div>
  );
}

// ─── Scroll to top on navigation ──────────────────────────────────────────────
function ScrollToTop() {
  const [location] = useLocation();
  const prev = useRef(location);

  useEffect(() => {
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
  }, []);

  useEffect(() => {
    if (location !== prev.current) {
      prev.current = location;
      window.scrollTo({ top: 0, left: 0, behavior: "instant" as ScrollBehavior });
    }
  }, [location]);
  return null;
}

// ─── Mobile bottom navigation ─────────────────────────────────────────────────
function MobileBottomNav() {
  const [location] = useLocation();
  const { user, isAdmin } = useAuth();
  const unreadMessages = useUnreadMessages();
  const unreadNotifications = useUnreadNotifications();
  const totalUnread = unreadMessages + unreadNotifications;

  const items = [
    { href: "/", label: "Home", Icon: Home, exact: true },
    { href: "/photos", label: "Explore", Icon: Compass, exact: false },
    { href: "/illustrations", label: "Art", Icon: Palette, exact: false },
    { href: "/collections", label: "Collections", Icon: FolderOpen, exact: false },
    { href: "/profile", label: "Profile", Icon: null, exact: false },
    ...(isAdmin ? [{ href: "/admin", label: "Admin", Icon: Shield, exact: false }] : []),
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-background/95 backdrop-blur-md border-t border-border/60">
      <div className="flex items-center justify-around h-16 px-1">
        {items.map(({ href, label, Icon, exact }) => {
          const active = exact ? location === href : location === href || location.startsWith(href + "/");
          const isProfile = Icon === null;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 py-2 transition-colors",
                active ? "text-foreground" : "text-muted-foreground"
              )}
            >
              {Icon ? (
                <Icon className={cn("w-5 h-5 transition-all", active && "stroke-[2.2px]")} />
              ) : (
                <div className="relative">
                  <div className={cn(
                    "w-6 h-6 rounded-full flex items-center justify-center overflow-hidden border transition-all",
                    active ? "border-foreground" : "border-border bg-muted"
                  )}>
                    {user?.profileImageUrl ? (
                      <img src={user.profileImageUrl} alt="Profile" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-3.5 h-3.5" />
                    )}
                  </div>
                  {isProfile && totalUnread > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 bg-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center px-1 leading-none shadow-sm">
                      {totalUnread > 99 ? "99+" : totalUnread}
                    </span>
                  )}
                </div>
              )}
              <span className={cn(
                "text-[9px] leading-none tracking-wide",
                active ? "font-semibold" : "font-normal"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────
const HIDDEN_PAGES_KEY = "affuaa_hidden_pages";
function getHiddenPages(): string[] {
  try { return JSON.parse(localStorage.getItem(HIDDEN_PAGES_KEY) ?? "[]") as string[]; }
  catch { return []; }
}

interface MaintenanceConfig { enabled: boolean; message: string; returnTime: string; }
const MAINTENANCE_KEY = "affuaa_maintenance";
const MAINTENANCE_BYPASS_PATHS = ["/signin", "/signup", "/sso-callback", "/admin"];
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

function ThemeToggleRow() {
  const { theme, setTheme } = useTheme();
  const themes: { value: Theme; label: string; icon: React.ElementType }[] = [
    { value: "light", label: "Light", icon: Sun },
    { value: "dark", label: "Dark", icon: Moon },
    { value: "sepia", label: "Sepia", icon: Palette },
  ];
  return (
    <div className="border-t border-border/60 p-2">
      <div className="px-3 py-2">
        <p className="text-[11px] uppercase tracking-widest text-muted-foreground/50 mb-2">Appearance</p>
        <div className="flex gap-1">
          {themes.map(({ value, label, icon: Icon }) => (
            <button
              key={value}
              onClick={() => setTheme(value)}
              title={label}
              className={cn(
                "flex-1 flex flex-col items-center gap-1 py-2 rounded-lg text-xs transition-colors",
                theme === value
                  ? "bg-accent text-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
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
  const [maintenanceConfig, setMaintenanceConfig] = useState<MaintenanceConfig>(() => getMaintenance());
  const [aiChatEnabled, setAiChatEnabled] = useState<boolean>(() => {
    try {
      const raw = localStorage.getItem("affuaa_settings");
      if (raw) {
        const parsed = JSON.parse(raw) as { aiChatEnabled?: boolean };
        return parsed.aiChatEnabled !== false;
      }
    } catch { /* ignore */ }
    return true;
  });

  useEffect(() => {
    function onMaintenanceStorage(e: StorageEvent) {
      if (e.key !== MAINTENANCE_KEY) return;
      setMaintenanceConfig(getMaintenance());
    }
    function onMaintenanceChanged() {
      setMaintenanceConfig(getMaintenance());
    }
    function onStorage(e: StorageEvent) {
      if (e.key !== "affuaa_settings") return;
      try {
        const parsed = JSON.parse(e.newValue ?? "{}") as { aiChatEnabled?: boolean };
        setAiChatEnabled(parsed.aiChatEnabled !== false);
      } catch { /* ignore */ }
    }
    function onSettingsChanged(e: Event) {
      const detail = (e as CustomEvent<{ aiChatEnabled?: boolean }>).detail;
      setAiChatEnabled(detail?.aiChatEnabled !== false);
    }
    window.addEventListener("storage", onMaintenanceStorage);
    window.addEventListener("affuaa-maintenance-changed", onMaintenanceChanged);
    window.addEventListener("storage", onStorage);
    window.addEventListener("affuaa-settings-changed", onSettingsChanged);
    return () => {
      window.removeEventListener("storage", onMaintenanceStorage);
      window.removeEventListener("affuaa-maintenance-changed", onMaintenanceChanged);
      window.removeEventListener("storage", onStorage);
      window.removeEventListener("affuaa-settings-changed", onSettingsChanged);
    };
  }, []);

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
    ...MENU_LINKS,
    ...(isAdmin ? [ADMIN_LINK] : []),
    PREMIUM_LINK,
  ];
  const isMaintenanceBypassed = isAdmin || MAINTENANCE_BYPASS_PATHS.some(
    (path) => location === path || location.startsWith(`${path}/`),
  );

  function handleSignOut() {
    setIsSigningOut(true);
    setTimeout(() => {
      void logout();
    }, 800);
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <PageProgressBar />
      <ScrollToTop />
      <SwipeNav />
      <PullToRefresh />
      {maintenanceConfig.enabled && !isMaintenanceBypassed && !isLoading && (
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

            {isAdmin && (
              <Link
                href="/admin"
                className="px-3 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
              >
                Admin
              </Link>
            )}

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
                            const mobileHidden = l.href === "/profile" || l.href === "/notifications";
                            return (
                              <Link
                                key={l.href}
                                href={l.href}
                                className={cn(
                                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors",
                                  mobileHidden && "md:flex hidden",
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
                        <ThemeToggleRow />
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

      <main className="flex-1 pb-16 md:pb-0">
        {!isAdmin
          && location !== "/admin"
          && !location.startsWith("/admin/")
          && hiddenPages.some(p => p === "/" ? location === "/" : location === p || location.startsWith(p + "/")) ? (
          <div className="min-h-[60vh] flex items-center justify-center text-center px-4">
            <div>
              <p className="font-serif text-4xl mb-3">Page Unavailable</p>
              <p className="text-muted-foreground text-sm">This page is currently not available. Check back soon.</p>
              <Link href="/" className="mt-6 inline-block text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground transition-colors">← Back to home</Link>
            </div>
          </div>
        ) : children}
      </main>

      <footer className="border-t border-border mt-20 mb-16 md:mb-0">
        <div className="container mx-auto px-4 py-14">

          {/* ── Top row: brand + columns ────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">

            {/* Brand */}
            <div className="col-span-2 md:col-span-1">
              <p className="font-serif text-2xl mb-2">Affuaa.</p>
              <p className="text-muted-foreground text-sm leading-relaxed mb-5 max-w-[18ch]">
                Curated photography.<br />Respect the craft.
              </p>
              {/* Social icons */}
              <div className="flex items-center gap-3">
                {/* Instagram */}
                <a
                  href="https://instagram.com/affuaa"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Affuaa on Instagram"
                  className="w-8 h-8 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                    <circle cx="12" cy="12" r="4"/>
                    <circle cx="17.5" cy="6.5" r="0.5" fill="currentColor" stroke="none"/>
                  </svg>
                </a>
                {/* X / Twitter */}
                <a
                  href="https://x.com/affuaa"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Affuaa on X"
                  className="w-8 h-8 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </a>
                {/* Pinterest */}
                <a
                  href="https://pinterest.com/affuaa"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Affuaa on Pinterest"
                  className="w-8 h-8 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                    <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                  </svg>
                </a>
                {/* YouTube */}
                <a
                  href="https://youtube.com/@affuaa"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Affuaa on YouTube"
                  className="w-8 h-8 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
                {/* Behance */}
                <a
                  href="https://behance.net/affuaa"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Affuaa on Behance"
                  className="w-8 h-8 border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                >
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="currentColor">
                    <path d="M7.799 5.698c.589 0 1.12.051 1.606.156.482.104.894.274 1.237.507.344.235.612.546.804.938.188.392.284.871.284 1.435 0 .614-.138 1.129-.417 1.542-.278.411-.686.754-1.218 1.025.73.212 1.275.586 1.638 1.123.362.538.544 1.187.544 1.949 0 .621-.12 1.161-.358 1.618-.239.458-.566.833-.985 1.122-.416.289-.897.503-1.441.639-.547.135-1.12.202-1.713.202H0V5.698h7.799zm-.447 4.942c.508 0 .921-.119 1.237-.358.315-.238.474-.625.474-1.159 0-.296-.053-.541-.158-.741a1.157 1.157 0 00-.432-.47 1.84 1.84 0 00-.646-.249 3.994 3.994 0 00-.793-.076H2.616v3.053h4.736zm.207 5.189c.301 0 .583-.028.847-.084.263-.056.494-.152.692-.288.198-.135.357-.315.474-.543.117-.228.176-.516.176-.865 0-.692-.199-1.189-.594-1.491-.397-.302-.921-.453-1.573-.453H2.616v3.724h4.943zM20.671 18.07c-.408.407-.878.714-1.411.915-.533.204-1.107.305-1.718.305-.64 0-1.219-.107-1.735-.322-.516-.214-.957-.518-1.326-.914-.367-.395-.65-.867-.851-1.415-.2-.549-.3-1.156-.3-1.818 0-.636.1-1.228.3-1.771.2-.545.484-1.014.851-1.406.368-.393.81-.697 1.326-.911.516-.215 1.095-.322 1.735-.322.61 0 1.154.112 1.631.334.476.223.878.532 1.209.927.329.394.579.856.745 1.388.166.531.25 1.103.25 1.717v.585H16.04c.05.68.273 1.207.666 1.584.394.374.891.562 1.493.562.477 0 .877-.107 1.203-.322.327-.215.57-.5.73-.858l1.54.543zm-2.011-4.887c-.281-.302-.684-.453-1.213-.453-.359 0-.658.06-.896.18-.239.12-.432.271-.58.454-.148.183-.251.384-.311.602-.061.217-.097.434-.11.647h3.673c-.045-.617-.282-1.127-.563-1.43zm-3.456-5.047h4.52V6.786h-4.52v1.35z"/>
                  </svg>
                </a>
              </div>
            </div>

            {/* Discover */}
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-4">Discover</p>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link href="/photos" className="hover:text-foreground transition-colors">Explore Gallery</Link></li>
                <li><Link href="/illustrations" className="hover:text-foreground transition-colors">Illustrations</Link></li>
                <li><Link href="/collections" className="hover:text-foreground transition-colors">Collections</Link></li>
                <li><Link href="/series" className="hover:text-foreground transition-colors">Photo Series</Link></li>
                <li><Link href="/tags" className="hover:text-foreground transition-colors">Browse Tags</Link></li>
              </ul>
            </div>

            {/* Community */}
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-4">Community</p>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Your Dashboard</Link></li>
                <li><Link href="/upload" className="hover:text-foreground transition-colors">Upload a Photo</Link></li>
                <li><Link href="/premium" className="hover:text-foreground transition-colors">Go Premium</Link></li>
                <li><Link href="/monetise" className="hover:text-foreground transition-colors">Earn as a Photographer</Link></li>
                <li><Link href="/messages" className="hover:text-foreground transition-colors">Messages</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground/60 mb-4">Company</p>
              <ul className="space-y-2.5 text-sm text-muted-foreground">
                <li><Link href="/about" className="hover:text-foreground transition-colors">About Affuaa</Link></li>
                <li><Link href="/blog" className="hover:text-foreground transition-colors">The Edit (Blog)</Link></li>
                <li><a href="mailto:hello@affuaa.com" className="hover:text-foreground transition-colors">Contact Us</a></li>
                <li><Link href="/terms" className="hover:text-foreground transition-colors">Terms of Service</Link></li>
                <li><Link href="/privacy" className="hover:text-foreground transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>

          {/* ── Bottom bar ─────────────────────────────────────────────────── */}
          <div className="border-t border-border/40 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground/60">
              © {new Date().getFullYear()} Affuaa. All rights reserved.
            </p>
            <p className="text-xs text-muted-foreground/40 tracking-wide">
              Gallery-quality curation &nbsp;·&nbsp; Darkroom aesthetic &nbsp;·&nbsp; Photographers first
            </p>
          </div>

        </div>
      </footer>
      {aiChatEnabled && <LiveChat />}
      <UploadProgressWidget />
      <MobileBottomNav />
    </div>
  );
}

function UploadProgressWidget() {
  const { activeUploads, avgProgress } = useUploadProgress();
  const [, navigate] = useLocation();

  if (activeUploads === 0) return null;

  return (
    <button
      onClick={() => navigate("/upload")}
      className="fixed bottom-24 right-4 md:bottom-6 z-50 flex items-center gap-2.5 bg-foreground text-background px-4 py-2.5 shadow-xl text-xs font-medium hover:opacity-90 transition-all animate-in slide-in-from-bottom-2 duration-300"
      aria-label="View upload progress"
    >
      <CloudUpload className="w-4 h-4 flex-shrink-0" />
      <div className="flex flex-col items-start gap-0.5">
        <span>{activeUploads} photo{activeUploads > 1 ? "s" : ""} uploading</span>
        <div className="w-24 h-1 bg-background/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-background rounded-full transition-all duration-300"
            style={{ width: `${avgProgress}%` }}
          />
        </div>
      </div>
      <span className="text-background/60 font-mono text-[10px]">{avgProgress}%</span>
    </button>
  );
}
