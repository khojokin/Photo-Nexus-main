import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { PhotoCard } from "@/components/photo-card";
import { Lightbox } from "@/components/lightbox";
import { useListPhotos } from "@workspace/api-client-react";
import type { Photo } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { Palette, Search, X, ArrowUp } from "lucide-react";

const PAGE_SIZE = 16;

const ART_STYLE_TAGS = [
  { label: "All", value: "all" },
  { label: "Digital Art", value: "digital art" },
  { label: "Illustration", value: "illustration" },
  { label: "Painting", value: "painting" },
  { label: "Drawing", value: "drawing" },
  { label: "Concept Art", value: "concept art" },
  { label: "Watercolour", value: "watercolour" },
  { label: "Sketch", value: "sketch" },
  { label: "Portrait", value: "portrait art" },
  { label: "Abstract", value: "abstract" },
  { label: "Fantasy", value: "fantasy" },
  { label: "Character", value: "character design" },
];

const ART_SEARCH_TAGS = [
  "illustration", "digital art", "painting", "drawing", "artwork",
  "sketch", "concept art", "watercolour", "abstract", "fantasy",
  "character design", "portrait art", "comic", "anime", "graffiti",
  "murals", "ink", "oil painting", "acrylic", "pastel",
];

function isArtPhoto(photo: Photo): boolean {
  const tags = (photo.tags ?? []).map(t => t.toLowerCase());
  const title = (photo.title ?? "").toLowerCase();
  const desc = (photo.description ?? "").toLowerCase();
  return ART_SEARCH_TAGS.some(t =>
    tags.some(tag => tag.includes(t)) ||
    title.includes(t) ||
    desc.includes(t)
  );
}

function matchesStyle(photo: Photo, style: string): boolean {
  if (style === "all") return true;
  const tags = (photo.tags ?? []).map(t => t.toLowerCase());
  const title = (photo.title ?? "").toLowerCase();
  return tags.some(t => t.includes(style)) || title.includes(style);
}

function MasonryGrid({ photos, onPhotoClick }: {
  photos: Photo[];
  onPhotoClick: (photo: Photo) => void;
}) {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4 space-y-0">
      {photos.map((photo) => (
        <div
          key={photo.id}
          className="break-inside-avoid mb-4 group cursor-pointer relative overflow-hidden"
          onClick={() => onPhotoClick(photo)}
        >
          <div className="relative">
            <img
              src={photo.imageUrl}
              alt={photo.title}
              loading="lazy"
              className="w-full block object-cover transition-transform duration-500 group-hover:scale-[1.02]"
              style={{ aspectRatio: `${photo.width ?? 4}/${photo.height ?? 5}` }}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="absolute bottom-0 left-0 right-0 p-4 translate-y-2 opacity-0 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
              <p className="text-white text-sm font-medium truncate">{photo.title}</p>
              <p className="text-white/70 text-xs truncate mt-0.5">{photo.photographerName}</p>
              {photo.tags && photo.tags.length > 0 && (
                <div className="flex gap-1 mt-1.5 flex-wrap">
                  {photo.tags.slice(0, 3).map(tag => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 bg-white/20 text-white/80 border border-white/20"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-4">
      {Array.from({ length: 12 }, (_, i) => (
        <div key={i} className="break-inside-avoid mb-4">
          <Skeleton
            className="w-full"
            style={{ height: `${200 + (i % 4) * 80}px` }}
          />
        </div>
      ))}
    </div>
  );
}

export function Illustrations() {
  const [activeStyle, setActiveStyle] = useState("all");
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [lightboxPhoto, setLightboxPhoto] = useState<Photo | null>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setDebouncedSearch(search), 280);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [search]);

  useEffect(() => { setPage(1); setAllPhotos([]); }, [activeStyle, debouncedSearch]);

  useEffect(() => {
    function onScroll() { setShowScrollTop(window.scrollY > 600); }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const queryTag = activeStyle !== "all" ? activeStyle : (debouncedSearch || undefined);
  const { data, isLoading } = useListPhotos({
    limit: 200,
    sort: "latest",
    ...(queryTag && !debouncedSearch ? { tag: queryTag } : {}),
    ...(debouncedSearch ? { search: debouncedSearch } : {}),
  });

  const rawPhotos: Photo[] = (() => {
    if (!data) return [];
    if (Array.isArray(data)) return data as Photo[];
    const d = data as { photos?: Photo[] };
    return d.photos ?? [];
  })();

  const filtered = rawPhotos.filter(p => {
    const matchesArt = isArtPhoto(p);
    const matchesSt = matchesStyle(p, activeStyle);
    return matchesArt && matchesSt;
  });

  const paginated = filtered.slice(0, page * PAGE_SIZE);
  const hasMore = filtered.length > paginated.length;

  return (
    <Layout>
      {/* ── Hero ── */}
      <div className="relative border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 via-pink-500/5 to-amber-500/5 pointer-events-none" />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20 relative">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-8 h-8 border border-border flex items-center justify-center bg-gradient-to-br from-violet-500/20 to-pink-500/20">
              <Palette className="w-4 h-4 text-foreground/70" />
            </div>
            <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Curated Gallery</span>
          </div>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif mb-4 leading-tight">
            Illustrations
            <br />
            <span className="italic text-muted-foreground font-light">&amp; Fine Art</span>
          </h1>
          <p className="text-muted-foreground max-w-lg text-base leading-relaxed">
            A curated collection of high-quality illustrations, digital paintings, concept art, and fine art works — hand-picked for visual excellence.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        {/* ── Filters ── */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          {/* Style chips */}
          <div className="flex items-center gap-2 flex-wrap flex-1">
            {ART_STYLE_TAGS.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => setActiveStyle(value)}
                className={cn(
                  "px-3 py-1.5 text-xs transition-colors border",
                  activeStyle === value
                    ? "bg-foreground text-background border-foreground"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/40"
                )}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="flex items-center border border-border bg-background focus-within:border-foreground/40 transition-colors flex-shrink-0 w-full sm:w-56">
            <Search className="w-3.5 h-3.5 text-muted-foreground ml-3 flex-shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search art…"
              className="flex-1 bg-transparent px-2 py-2 text-sm focus:outline-none min-w-0"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="mr-2.5 flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* ── Result count ── */}
        {!isLoading && (
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm text-muted-foreground">
              {filtered.length === 0
                ? "No artworks found"
                : `${filtered.length} artwork${filtered.length !== 1 ? "s" : ""}${activeStyle !== "all" ? ` in ${activeStyle}` : ""}`}
            </p>
            {debouncedSearch && (
              <button
                onClick={() => setSearch("")}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <X className="w-3 h-3" /> Clear search
              </button>
            )}
          </div>
        )}

        {/* ── Grid ── */}
        {isLoading ? (
          <SkeletonGrid />
        ) : filtered.length === 0 ? (
          <div className="py-24 text-center">
            <div className="w-16 h-16 border border-border mx-auto mb-6 flex items-center justify-center">
              <Palette className="w-8 h-8 text-muted-foreground/30" />
            </div>
            <h3 className="text-xl font-serif mb-2">No artworks found</h3>
            <p className="text-muted-foreground text-sm mb-6">
              {debouncedSearch
                ? `No illustrations match "${debouncedSearch}"`
                : `No artworks tagged with "${activeStyle}" yet`}
            </p>
            <button
              onClick={() => { setSearch(""); setActiveStyle("all"); }}
              className="text-sm border border-border px-6 py-2.5 hover:bg-muted/30 transition-colors"
            >
              View all artworks
            </button>
          </div>
        ) : (
          <>
            <MasonryGrid photos={paginated} onPhotoClick={setLightboxPhoto} />

            {/* Load more */}
            {hasMore && (
              <div className="mt-10 flex justify-center">
                <button
                  onClick={() => setPage(p => p + 1)}
                  className="px-8 py-3 border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
                >
                  Load more artworks ({filtered.length - paginated.length} remaining)
                </button>
              </div>
            )}
          </>
        )}

        {/* ── Editorial CTA ── */}
        {!isLoading && filtered.length > 0 && !hasMore && (
          <div className="mt-16 py-12 border-t border-border text-center">
            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground mb-3">Contribute</p>
            <h3 className="text-2xl font-serif mb-3">Share Your Art</h3>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
              Upload your illustrations and digital art to be featured in this gallery. Tag your work with relevant art styles.
            </p>
            <Link href="/upload" className="inline-block px-8 py-3 bg-foreground text-background text-sm hover:opacity-90 transition-opacity">
              Upload Artwork
            </Link>
          </div>
        )}
      </div>

      {/* Scroll to top */}
      {showScrollTop && (
        <button
          onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
          className="fixed bottom-6 right-6 w-10 h-10 bg-foreground text-background flex items-center justify-center hover:opacity-80 transition-opacity z-50 shadow-lg"
          aria-label="Scroll to top"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

      {/* Lightbox */}
      {lightboxPhoto && (
        <Lightbox
          photo={lightboxPhoto}
          photos={paginated}
          onClose={() => setLightboxPhoto(null)}
          onNavigate={setLightboxPhoto}
        />
      )}
    </Layout>
  );
}
