import { useState, useEffect, useRef } from "react";
import { useRoute, Link } from "wouter";
import { Layout } from "@/components/layout";
import { PhotoCard } from "@/components/photo-card";
import { Lightbox } from "@/components/lightbox";
import { useListPhotos, useListTags, ListPhotosSort } from "@workspace/api-client-react";
import type { Photo } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Search, LayoutGrid, Rows, X } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

export function Explore() {
  const [match, params] = useRoute("/tags/:tag");
  const activeTag = match ? params.tag : null;

  const [inputValue, setInputValue] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<ListPhotosSort>(ListPhotosSort.latest);
  const [page, setPage] = useState(1);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [viewMode, setViewMode] = useState<"masonry" | "grid">("masonry");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const prevKey = useRef<string>("");

  function handleSearchChange(value: string) {
    setInputValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => { setSearch(value); }, 300);
  }

  function clearSearch() {
    setInputValue("");
    setSearch("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
  }

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
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

  const totalPhotos = photosResponse?.total ?? 0;
  const hasMore = allPhotos.length < totalPhotos;

  function handleLoadMore() { setPage((p) => p + 1); }

  function openLightbox(photo: Photo) {
    const idx = allPhotos.findIndex((p) => p.id === photo.id);
    if (idx !== -1) setLightboxIndex(idx);
  }

  const isFirstLoad = loadingPhotos && page === 1;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-4xl font-serif mb-6">
            {activeTag ? `Tag: ${activeTag}` : "Explore Gallery"}
          </h1>

          <div className="flex flex-col md:flex-row gap-6 items-start md:items-center justify-between">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by title, photographer, or tag…"
                value={inputValue}
                onChange={(e) => handleSearchChange(e.target.value)}
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
            </div>

            <div className="flex items-center gap-6">
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

              <div className="flex items-center gap-1 border border-border/50 p-1">
                <button
                  onClick={() => setViewMode("masonry")}
                  className={cn(
                    "p-1.5 transition-colors",
                    viewMode === "masonry"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Masonry layout"
                >
                  <LayoutGrid className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-1.5 transition-colors",
                    viewMode === "grid"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                  title="Grid layout"
                >
                  <Rows className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>

          {!loadingTags && Array.isArray(tags) && tags.length > 0 && !activeTag && (
            <div className="mt-8 flex flex-wrap gap-2">
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
              <Link
                href="/photos"
                className="text-sm text-muted-foreground hover:text-foreground border-b border-muted pb-1"
              >
                &larr; Clear tag filter
              </Link>
            </div>
          )}

          {!isFirstLoad && totalPhotos > 0 && (
            <p className="mt-6 text-sm text-muted-foreground">
              Showing {allPhotos.length} of {totalPhotos} photographs
            </p>
          )}
        </div>

        {isFirstLoad ? (
          <div className={viewMode === "masonry" ? "masonry-grid" : "grid grid-cols-2 md:grid-cols-3 gap-4"}>
            {Array(PAGE_SIZE).fill(0).map((_, i) => (
              <div key={i} className={viewMode === "masonry" ? "masonry-item" : ""}>
                <Skeleton className="w-full h-[300px]" />
              </div>
            ))}
          </div>
        ) : allPhotos.length === 0 ? (
          <div className="py-32 text-center text-muted-foreground">
            <p className="font-serif text-xl">No photographs found.</p>
            <p className="text-sm mt-2">Try a different search or filter.</p>
          </div>
        ) : (
          <>
            {viewMode === "masonry" ? (
              <div className="masonry-grid">
                {allPhotos.map((photo) => (
                  <div key={photo.id} className="masonry-item">
                    <PhotoCard photo={photo} onOpen={openLightbox} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {allPhotos.map((photo) => (
                  <div key={photo.id} className="aspect-square overflow-hidden">
                    <PhotoCard photo={photo} className="h-full w-full" onOpen={openLightbox} />
                  </div>
                ))}
              </div>
            )}

            {hasMore && (
              <div className="mt-16 text-center">
                <button
                  onClick={handleLoadMore}
                  disabled={isFetching}
                  className="inline-flex items-center justify-center border border-input bg-transparent px-10 py-3 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {isFetching ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-muted border-t-foreground animate-spin" />
                      Loading…
                    </span>
                  ) : (
                    `Load More (${totalPhotos - allPhotos.length} remaining)`
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={allPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </Layout>
  );
}
