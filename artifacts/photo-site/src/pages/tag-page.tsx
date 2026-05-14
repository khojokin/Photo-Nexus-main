import { useState, useEffect, useRef } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { PhotoCard } from "@/components/photo-card";
import { Lightbox } from "@/components/lightbox";
import { useListPhotos, useListTags, ListPhotosSort } from "@workspace/api-client-react";
import type { Photo } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Hash, LayoutGrid, Rows } from "lucide-react";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 16;

export function TagPage() {
  const { tag } = useParams<{ tag: string }>();
  const decodedTag = decodeURIComponent(tag ?? "");

  const [page, setPage] = useState(1);
  const [allPhotos, setAllPhotos] = useState<Photo[]>([]);
  const [sort, setSort] = useState<ListPhotosSort>(ListPhotosSort.latest);
  const [viewMode, setViewMode] = useState<"masonry" | "grid">("masonry");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const prevKey = useRef("");

  const { data: photosResponse, isLoading, isFetching } = useListPhotos({
    tag: decodedTag || undefined,
    sort,
    page,
    limit: PAGE_SIZE,
  });

  const { data: allTags } = useListTags();

  const filterKey = `${decodedTag}|${sort}`;

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
          const ids = new Set(prev.map((p) => p.id));
          return [...prev, ...photosResponse.photos.filter((p) => !ids.has(p.id))];
        });
      }
    }
  }, [photosResponse, page]);

  const total = photosResponse?.total ?? 0;
  const hasMore = allPhotos.length < total;
  const heroPhoto = allPhotos[0] ?? null;
  const isFirstLoad = isLoading && page === 1;

  const relatedTags = Array.isArray(allTags)
    ? allTags.filter((t) => t.name !== decodedTag).slice(0, 12)
    : [];

  function openLightbox(photo: Photo) {
    const idx = allPhotos.findIndex((p) => p.id === photo.id);
    if (idx !== -1) setLightboxIndex(idx);
  }

  return (
    <Layout>
      <div className="relative min-h-[52vh] flex items-end overflow-hidden bg-black">
        {heroPhoto ? (
          <>
            <img
              src={heroPhoto.imageUrl}
              alt={heroPhoto.title}
              className="absolute inset-0 w-full h-full object-cover opacity-30 scale-105 blur-[2px]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20" />
          </>
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 to-black" />
        )}

        <div className="relative z-10 container mx-auto px-4 pb-16 pt-28">
          <Link
            href="/photos"
            className="inline-flex items-center gap-2 text-xs text-white/50 hover:text-white/80 transition-colors mb-8 tracking-widest uppercase"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            All photographs
          </Link>

          <div className="flex items-center gap-3 mb-4">
            <Hash className="w-6 h-6 text-white/40" />
            <p className="text-xs text-white/40 uppercase tracking-widest">Tag</p>
          </div>

          <h1 className="text-6xl md:text-8xl font-serif text-white mb-6 leading-none capitalize">
            {decodedTag}
          </h1>

          {!isFirstLoad && (
            <p className="text-white/50 text-sm tracking-wide">
              {total} {total === 1 ? "photograph" : "photographs"}
            </p>
          )}
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="flex items-center justify-between mb-10 border-b border-border pb-6">
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">Sort:</span>
            <div className="flex gap-4">
              {Object.values(ListPhotosSort).map((s) => (
                <button
                  key={s}
                  onClick={() => setSort(s as ListPhotosSort)}
                  className={cn(
                    "text-sm pb-1 border-b transition-colors",
                    sort === s
                      ? "border-foreground text-foreground"
                      : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
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

        {isFirstLoad ? (
          <div className={viewMode === "masonry" ? "masonry-grid" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"}>
            {Array(PAGE_SIZE).fill(0).map((_, i) => (
              <div key={i} className={viewMode === "masonry" ? "masonry-item" : ""}>
                <Skeleton className="w-full h-[280px]" />
              </div>
            ))}
          </div>
        ) : allPhotos.length === 0 ? (
          <div className="py-32 text-center text-muted-foreground">
            <Hash className="w-10 h-10 mx-auto mb-4 opacity-20" />
            <p className="font-serif text-xl mb-2">No photographs tagged "{decodedTag}"</p>
            <Link href="/photos" className="text-sm underline underline-offset-4 hover:text-foreground transition-colors">
              Browse all photographs
            </Link>
          </div>
        ) : (
          <>
            {viewMode === "masonry" ? (
              <div className="masonry-grid">
                {allPhotos.map((photo, i) => (
                  <div key={photo.id} className="masonry-item">
                    <PhotoCard photo={photo} priority={i < 3} onOpen={openLightbox} />
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
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
                  onClick={() => setPage((p) => p + 1)}
                  disabled={isFetching}
                  className="inline-flex items-center justify-center border border-input bg-transparent px-10 py-3 text-sm font-medium hover:bg-accent transition-colors disabled:opacity-50"
                >
                  {isFetching ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 rounded-full border-2 border-muted border-t-foreground animate-spin" />
                      Loading…
                    </span>
                  ) : (
                    `Load More (${total - allPhotos.length} remaining)`
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {relatedTags.length > 0 && (
        <div className="border-t border-border bg-muted/5 py-16">
          <div className="container mx-auto px-4">
            <h2 className="text-sm uppercase tracking-widest text-muted-foreground mb-6">Explore Other Tags</h2>
            <div className="flex flex-wrap gap-2">
              {relatedTags.map((t) => (
                <Link
                  key={t.name}
                  href={`/tags/${t.name}`}
                  className="px-4 py-2 bg-muted/30 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-border/50 capitalize"
                >
                  {t.name}
                  <span className="ml-2 text-xs opacity-50">{t.photoCount}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}

      {lightboxIndex !== null && allPhotos.length > 0 && (
        <Lightbox
          photos={allPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </Layout>
  );
}
