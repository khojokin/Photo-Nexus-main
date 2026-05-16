import { useState, useEffect, useRef, useCallback } from "react";
import { useRoute, Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import { PhotoCard } from "@/components/photo-card";
import { Lightbox } from "@/components/lightbox";
import { MoodFilter } from "@/components/mood-filter";
import { useListPhotos, useListTags, ListPhotosSort } from "@workspace/api-client-react";
import type { Photo } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import {
  Search, LayoutGrid, Rows, X, Shuffle, Clock, History,
  RectangleVertical, RectangleHorizontal, Square, Layers, ArrowUp,
} from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;
const HISTORY_KEY = "affuaa_search_history";
const MAX_HISTORY = 8;

function saveSearchHistory(term: string) {
  if (!term.trim()) return;
  try {
    const prev: string[] = JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]");
    const next = [term, ...prev.filter(t => t !== term)].slice(0, MAX_HISTORY);
    localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
  } catch {}
}

function loadSearchHistory(): string[] {
  try { return JSON.parse(localStorage.getItem(HISTORY_KEY) ?? "[]"); }
  catch { return []; }
}

function clearSearchHistory() {
  localStorage.removeItem(HISTORY_KEY);
}

type AspectRatio = "all" | "portrait" | "landscape" | "square";
type SeasonFilter = "all" | "spring" | "summer" | "autumn" | "winter";
type TimeFilter = "all" | "golden-hour" | "blue-hour" | "night" | "midday";

const SEASON_TAGS: Record<Exclude<SeasonFilter, "all">, string[]> = {
  spring: ["spring", "blossom", "flowers", "green", "rain"],
  summer: ["summer", "beach", "sun", "golden", "desert"],
  autumn: ["autumn", "fall", "leaves", "amber", "forest"],
  winter: ["winter", "snow", "frost", "ice", "cold"],
};

const TIME_TAGS: Record<Exclude<TimeFilter, "all">, string[]> = {
  "golden-hour": ["golden hour", "golden", "sunset", "sunrise", "warm light"],
  "blue-hour": ["blue hour", "dusk", "twilight", "evening", "blue"],
  "night": ["night", "stars", "long exposure", "city lights", "dark"],
  "midday": ["midday", "bright", "harsh light", "noon"],
};

const ASPECT_KEYWORDS: Record<Exclude<AspectRatio, "all">, string[]> = {
  portrait: ["portrait", "people", "person", "face", "vertical"],
  landscape: ["landscape", "nature", "mountains", "ocean", "city", "architecture"],
  square: ["square", "symmetry", "minimal"],
};

function matchesAspect(photo: Photo, ratio: AspectRatio): boolean {
  if (ratio === "all") return true;
  const tags = photo.tags ?? [];
  const keywords = ASPECT_KEYWORDS[ratio] ?? [];
  return tags.some(t => keywords.some(k => t.toLowerCase().includes(k)));
}

function matchesSeason(photo: Photo, season: SeasonFilter): boolean {
  if (season === "all") return true;
  const tags = photo.tags ?? [];
  const keywords = SEASON_TAGS[season] ?? [];
  return tags.some(t => keywords.some(k => t.toLowerCase().includes(k)));
}

function matchesTime(photo: Photo, time: TimeFilter): boolean {
  if (time === "all") return true;
  const tags = photo.tags ?? [];
  const keywords = TIME_TAGS[time] ?? [];
  return tags.some(t => keywords.some(k => t.toLowerCase().includes(k)));
}

function TrendingTagsRow({
  tags,
  activeSearch,
  onTagClick,
}: {
  tags: Array<{ name: string; photoCount: number }>;
  activeSearch: string;
  onTagClick: (tag: string) => void;
}) {
  if (tags.length === 0) return null;
  const top = tags.slice(0, 14);
  return (
    <div className="flex items-center gap-1.5 flex-wrap mt-1">
      <span className="text-xs text-muted-foreground mr-0.5">Popular:</span>
      {top.map((t) => (
        <button
          key={t.name}
          onClick={() => onTagClick(t.name)}
          className={cn(
            "px-2.5 py-1 text-xs border transition-colors",
            activeSearch === t.name
              ? "border-foreground text-foreground bg-foreground/5"
              : "border-border/40 text-muted-foreground hover:text-foreground hover:border-border"
          )}
        >
          {t.name}
          <span className="ml-1 opacity-40 text-[10px]">{t.photoCount}</span>
        </button>
      ))}
    </div>
  );
}

export function Explore() {
  const [match, params] = useRoute("/tags/:tag");
  const activeTag = match ? params.tag : null;
  const [, navigate] = useLocation();
  const [surprisingMe, setSurprisingMe] = useState(false);
  const [activeMood, setActiveMood] = useState<string | null>(null);
  const [moodPhotos, setMoodPhotos] = useState<Photo[]>([]);
  const [loadingMood, setLoadingMood] = useState(false);

  // New filters
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("all");
  const [season, setSeason] = useState<SeasonFilter>("all");
  const [timeOfDay, setTimeOfDay] = useState<TimeFilter>("all");

  // Search history
  const [searchHistory, setSearchHistory] = useState<string[]>(() => loadSearchHistory());
  const [showHistory, setShowHistory] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!activeMood) { setMoodPhotos([]); return; }
    setLoadingMood(true);
    fetch(`/api/recommendations/mood/${encodeURIComponent(activeMood)}?limit=24`)
      .then((r) => r.json())
      .then((d: { photos: Photo[] }) => setMoodPhotos(d.photos ?? []))
      .catch(() => setMoodPhotos([]))
      .finally(() => setLoadingMood(false));
  }, [activeMood]);

  async function handleSurpriseMe() {
    setSurprisingMe(true);
    try {
      const res = await fetch("/api/photos/random");
      if (res.ok) {
        const photo = await res.json() as { id: number };
        navigate(`/photos/${photo.id}`);
      }
    } finally { setSurprisingMe(false); }
  }

  const [inputValue, setInputValue] = useState(() => {
    try { return new URLSearchParams(window.location.search).get("search") ?? ""; } catch { return ""; }
  });
  const [search, setSearch] = useState(() => {
    try { return new URLSearchParams(window.location.search).get("search") ?? ""; } catch { return ""; }
  });
  const [sort, setSort] = useState<ListPhotosSort>(ListPhotosSort.latest);
  const [page, setPage] = useState(1);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [viewMode, setViewMode] = useState<"masonry" | "grid">("masonry");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevKey = useRef<string>("");
  const loadMoreRef = useRef<HTMLDivElement>(null);

  function handleSearchChange(value: string) {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      setSearch(value);
      if (value.trim()) { saveSearchHistory(value.trim()); setSearchHistory(loadSearchHistory()); }
    }, 300);
    setShowHistory(false);
  }

  function applyHistoryTerm(term: string) {
    setInputValue(term);
    setSearch(term);
    setShowHistory(false);
    saveSearchHistory(term);
  }

  function clearSearch() {
    setInputValue("");
    setSearch("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  // Close history on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setShowHistory(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Keyboard shortcut: / focuses search input on this page
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key !== "/") return;
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) return;
      e.preventDefault();
      searchInputRef.current?.focus();
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, []);

  // Back-to-top scroll tracking
  useEffect(() => {
    function onScroll() { setShowBackToTop(window.scrollY > 600); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const filterKey = `${search}|${sort}|${activeTag ?? ""}`;

  const { data: photosResponse, isLoading: loadingPhotos, isFetching } = useListPhotos({
    search: search || undefined,
    sort,
    tag: activeTag || undefined,
    page,
    limit: PAGE_SIZE,
  });

  const { data: tags, isLoading: loadingTags } = useListTags();

  useEffect(() => {
    if (filterKey !== prevKey.current) {
      prevKey.current = filterKey;
      setPage(1);
      setAllPhotos([]);
    }
  }, [filterKey]);

  useEffect(() => {
    if (photosResponse?.photos) {
      if (page === 1) {
        setAllPhotos(photosResponse.photos);
      } else {
        setAllPhotos((prev) => {
          const existingIds = new Set(prev.map((p) => p.id));
          const newPhotos = photosResponse.photos.filter((p) => !existingIds.has(p.id));
          return [...prev, ...newPhotos];
        });
      }
    }
  }, [photosResponse, page]);

  // Apply client-side filters
  const filteredPhotos = allPhotos.filter(p =>
    matchesAspect(p, aspectRatio) &&
    matchesSeason(p, season) &&
    matchesTime(p, timeOfDay)
  );

  const totalPhotos = photosResponse?.total ?? 0;
  const hasMore = allPhotos.length < totalPhotos;

  function handleLoadMore() { setPage((p) => p + 1); }

  function openLightbox(photo: Photo) {
    const idx = filteredPhotos.findIndex((p) => p.id === photo.id);
    if (idx !== -1) setLightboxIndex(idx);
  }

  // Keyboard navigation
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (lightboxIndex === null) return;
      if (e.key === "ArrowRight") setLightboxIndex(i => i !== null ? Math.min(i + 1, filteredPhotos.length - 1) : null);
      if (e.key === "ArrowLeft") setLightboxIndex(i => i !== null ? Math.max(i - 1, 0) : null);
      if (e.key === "Escape") setLightboxIndex(null);
    }
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [lightboxIndex, filteredPhotos.length]);

  // Infinite scroll
  useEffect(() => {
    const el = loadMoreRef.current;
    if (!el || !hasMore || isFetching) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) setPage((p) => p + 1);
      },
      { rootMargin: "400px" },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasMore, isFetching]);

  const isFirstLoad = loadingPhotos && page === 1;
  const hasActiveClientFilter = aspectRatio !== "all" || season !== "all" || timeOfDay !== "all";

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-serif mb-6">
            {activeTag ? `Tag: ${activeTag}` : "Explore Gallery"}
          </h1>

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            {/* Search with history */}
            <div className="relative w-full md:w-96" ref={searchContainerRef}>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
              <Input
                ref={searchInputRef}
                placeholder="Search by title, photographer, or tag…"
                value={inputValue}
                onChange={(e) => handleSearchChange(e.target.value)}
                onFocus={() => !inputValue && setShowHistory(true)}
                className="pl-10 pr-8 bg-transparent border-muted rounded-none focus-visible:ring-1 focus-visible:ring-primary"
                data-testid="input-search-photos"
              />
              {inputValue && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
              {/* Search history dropdown */}
              {showHistory && searchHistory.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border shadow-xl z-50">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
                    <span className="text-xs text-muted-foreground flex items-center gap-1.5"><History className="w-3 h-3" /> Recent searches</span>
                    <button
                      onClick={() => { clearSearchHistory(); setSearchHistory([]); setShowHistory(false); }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >Clear</button>
                  </div>
                  {searchHistory.map(term => (
                    <button
                      key={term}
                      onClick={() => applyHistoryTerm(term)}
                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors text-left"
                    >
                      <Clock className="w-3 h-3 flex-shrink-0" />
                      {term}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center gap-6 flex-wrap">
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">Sort:</span>
                <div className="flex gap-2">
                  {Object.values(ListPhotosSort).map((s) => (
                    <button
                      key={s}
                      onClick={() => setSort(s as ListPhotosSort)}
                      className={cn(
                        "text-sm pb-1 border-b transition-colors",
                        sort === s
                          ? "border-primary text-foreground"
                          : "border-transparent text-muted-foreground hover:text-foreground"
                      )}
                      data-testid={`btn-sort-${s}`}
                    >
                      {s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={() => void handleSurpriseMe()}
                disabled={surprisingMe}
                className="flex items-center gap-1.5 px-3 py-1.5 border border-border/50 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors disabled:opacity-50"
                title="Take me to a random photo"
              >
                <Shuffle className="h-3.5 w-3.5" />
                {surprisingMe ? "…" : "Surprise Me"}
              </button>

              <div className="flex items-center gap-1 border border-border/50 p-1">
                <button
                  onClick={() => setViewMode("masonry")}
                  className={cn(
                    "p-1.5 transition-colors",
                    viewMode === "masonry" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Masonry layout"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-1.5 transition-colors",
                    viewMode === "grid" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Grid layout"
                >
                  <Rows className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {/* ── Client-side filter row ── */}
          {!activeTag && (
            <div className="mt-5 flex flex-wrap gap-4 items-center">
              {/* Aspect ratio */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground mr-1">Shape:</span>
                {(["all", "portrait", "landscape", "square"] as AspectRatio[]).map(r => {
                  const icons: Record<AspectRatio, React.ElementType> = {
                    all: Layers, portrait: RectangleVertical, landscape: RectangleHorizontal, square: Square,
                  };
                  const Icon = icons[r];
                  return (
                    <button
                      key={r}
                      onClick={() => setAspectRatio(r)}
                      className={cn(
                        "flex items-center gap-1 px-2.5 py-1 text-xs border transition-colors",
                        aspectRatio === r
                          ? "border-foreground text-foreground bg-foreground/5"
                          : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                      )}
                    >
                      <Icon className="w-3 h-3" />
                      {r === "all" ? "All" : r.charAt(0).toUpperCase() + r.slice(1)}
                    </button>
                  );
                })}
              </div>

              {/* Season */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground mr-1">Season:</span>
                {(["all", "spring", "summer", "autumn", "winter"] as SeasonFilter[]).map(s => (
                  <button
                    key={s}
                    onClick={() => setSeason(s)}
                    className={cn(
                      "px-2.5 py-1 text-xs border transition-colors",
                      season === s
                        ? "border-foreground text-foreground bg-foreground/5"
                        : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                    )}
                  >
                    {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
                  </button>
                ))}
              </div>

              {/* Time of day */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground mr-1">Time:</span>
                {(["all", "golden-hour", "blue-hour", "night", "midday"] as TimeFilter[]).map(t => (
                  <button
                    key={t}
                    onClick={() => setTimeOfDay(t)}
                    className={cn(
                      "px-2.5 py-1 text-xs border transition-colors",
                      timeOfDay === t
                        ? "border-foreground text-foreground bg-foreground/5"
                        : "border-border/50 text-muted-foreground hover:text-foreground hover:border-border"
                    )}
                  >
                    {t === "all" ? "All" : t.split("-").map(w => w[0].toUpperCase() + w.slice(1)).join(" ")}
                  </button>
                ))}
              </div>

              {/* Popular Tags */}
              {Array.isArray(tags) && tags.length > 0 && (
                <TrendingTagsRow
                  tags={tags}
                  activeSearch={search}
                  onTagClick={(tag) => {
                    setInputValue(tag);
                    setSearch(tag);
                    saveSearchHistory(tag);
                    setSearchHistory(loadSearchHistory());
                  }}
                />
              )}

              {hasActiveClientFilter && (
                <button
                  onClick={() => { setAspectRatio("all"); setSeason("all"); setTimeOfDay("all"); }}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs border border-border/50 text-muted-foreground hover:text-foreground hover:border-foreground/30 transition-colors"
                >
                  <X className="w-3 h-3" /> Reset filters
                </button>
              )}
            </div>
          )}

          {!activeTag && (
            <MoodFilter activeMood={activeMood} onMoodChange={(mood) => { setActiveMood(mood); setPage(1); }} />
          )}

          {!loadingTags && Array.isArray(tags) && tags.length > 0 && !activeTag && !activeMood && (
            <div className="mt-6 flex flex-wrap gap-2">
              {tags.map((tag) => (
                <Link
                  key={tag.name}
                  href={`/tags/${tag.name}`}
                  className="px-3 py-1 bg-muted/50 text-xs text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-border/50"
                  data-testid={`link-tag-${tag.name}`}
                >
                  {tag.name} <span className="opacity-50 ml-1">{tag.photoCount}</span>
                </Link>
              ))}
            </div>
          )}

          {activeTag && (
            <div className="mt-8">
              <Link href="/photos" className="text-sm text-muted-foreground hover:text-foreground border-b border-muted pb-1">
                &larr; Clear tag filter
              </Link>
            </div>
          )}

          {!isFirstLoad && !activeMood && (
            <p className="mt-6 text-sm text-muted-foreground">
              {hasActiveClientFilter
                ? `${filteredPhotos.length} of ${allPhotos.length} loaded photographs match your filters`
                : totalPhotos > 0 ? `Showing ${allPhotos.length} of ${totalPhotos} photographs` : ""}
            </p>
          )}
          {activeMood && !loadingMood && (
            <p className="mt-6 text-sm text-muted-foreground">{moodPhotos.length} photographs in this mood</p>
          )}
        </div>

        {activeMood ? (
          loadingMood ? (
            <div className="masonry-grid">
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="masonry-item"><Skeleton className="w-full h-[300px]" /></div>
              ))}
            </div>
          ) : moodPhotos.length === 0 ? (
            <div className="py-32 text-center text-muted-foreground">
              <p className="font-serif text-xl">No photographs match this mood yet.</p>
              <p className="text-sm mt-2">Try a different mood or explore all photos.</p>
            </div>
          ) : (
            <div className="masonry-grid">
              {moodPhotos.map((photo) => (
                <div key={photo.id} className="masonry-item">
                  <PhotoCard photo={photo} onOpen={(p) => { const idx = moodPhotos.findIndex(x => x.id === p.id); setLightboxIndex(idx); }} />
                </div>
              ))}
            </div>
          )
        ) : isFirstLoad ? (
          <div className={viewMode === "masonry" ? "masonry-grid" : "grid grid-cols-2 md:grid-cols-3 gap-4"}>
            {Array(PAGE_SIZE).fill(0).map((_, i) => (
              <div key={i} className={viewMode === "masonry" ? "masonry-item" : ""}>
                <Skeleton className="w-full h-[300px]" />
              </div>
            ))}
          </div>
        ) : filteredPhotos.length === 0 ? (
          <div className="py-32 text-center text-muted-foreground">
            <p className="font-serif text-xl">No photographs match your current filters.</p>
            <p className="text-sm mt-2">
              {hasActiveClientFilter
                ? <button onClick={() => { setAspectRatio("all"); setSeason("all"); setTimeOfDay("all"); }} className="underline hover:text-foreground transition-colors">Clear filters</button>
                : "Try a different search."}
            </p>
          </div>
        ) : (
          <>
            {viewMode === "masonry" ? (
              <div className="masonry-grid">
                {filteredPhotos.map((photo) => (
                  <div key={photo.id} className="masonry-item">
                    <PhotoCard photo={photo} onOpen={openLightbox} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {filteredPhotos.map((photo) => (
                  <div key={photo.id} className="aspect-square overflow-hidden">
                    <PhotoCard photo={photo} className="h-full w-full" onOpen={openLightbox} />
                  </div>
                ))}
              </div>
            )}

            {hasMore && (
              <div ref={loadMoreRef} className="mt-16 py-8 flex flex-col items-center gap-3">
                {isFetching && (
                  <>
                    <div className="w-5 h-5 rounded-full border-2 border-muted border-t-foreground animate-spin" />
                    <p className="text-xs text-muted-foreground">Loading more photographs…</p>
                  </>
                )}
              </div>
            )}
            {!hasMore && allPhotos.length > 0 && (
              <div className="mt-16 py-10 text-center border-t border-border/30">
                <p className="text-xs uppercase tracking-widest text-muted-foreground">
                  You've seen all {totalPhotos} photographs
                </p>
              </div>
            )}
          </>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={activeMood ? moodPhotos : filteredPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {/* Back to top */}
      {showBackToTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-8 right-8 z-40 w-10 h-10 bg-foreground text-background flex items-center justify-center shadow-lg hover:opacity-80 transition-opacity"
          title="Back to top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}
    </Layout>
  );
}
