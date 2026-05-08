import { useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { PhotoCard } from "@/components/photo-card";
import { Lightbox } from "@/components/lightbox";
import {
  useGetSiteSummary,
  useGetFeaturedPhotos,
  useGetTrendingPhotos,
  useListCollections,
} from "@workspace/api-client-react";
import type { Photo } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export function Home() {
  const { data: summary, isLoading: loadingSummary } = useGetSiteSummary();
  const { data: featured, isLoading: loadingFeatured } = useGetFeaturedPhotos();
  const { data: trending, isLoading: loadingTrending } = useGetTrendingPhotos();
  const { data: collections, isLoading: loadingCollections } = useListCollections();

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const trendingPhotos: Photo[] = Array.isArray(trending) ? trending : [];

  function openLightbox(photo: Photo) {
    const idx = trendingPhotos.findIndex((p) => p.id === photo.id);
    if (idx !== -1) setLightboxIndex(idx);
  }

  return (
    <Layout>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        {Array.isArray(featured) && featured.length > 0 && (
          <div className="absolute inset-0 z-0">
            <img
              src={featured[0].imageUrl}
              alt="Featured cover"
              className="w-full h-full object-cover opacity-40 mix-blend-overlay"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/10 via-background/50 to-background" />
          </div>
        )}

        <div className="container relative z-10 mx-auto px-4 py-32 text-center max-w-4xl">
          <h1 className="text-5xl md:text-7xl font-serif mb-6 leading-tight">
            The world's most <br /> <span className="italic text-white/80">curated</span> photography.
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto font-light">
            No algorithms. No noise. Just extraordinary images carefully selected for those who care about the craft.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/photos"
              className="inline-flex h-12 items-center justify-center bg-primary px-8 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors rounded-none"
              data-testid="link-hero-explore"
            >
              Explore Gallery
            </Link>
            <Link
              href="/collections"
              className="inline-flex h-12 items-center justify-center border border-input bg-transparent px-8 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground transition-colors rounded-none"
              data-testid="link-hero-collections"
            >
              View Collections
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Strip */}
      <section className="border-y border-border/50 bg-muted/20 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {loadingSummary ? (
              Array(4).fill(0).map((_, i) => (
                <div key={i} className="flex flex-col items-center space-y-2">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))
            ) : (
              <>
                <div>
                  <p className="text-4xl font-serif mb-2">{summary?.totalPhotos}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Photographs</p>
                </div>
                <div>
                  <p className="text-4xl font-serif mb-2">{summary?.totalCollections}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Collections</p>
                </div>
                <div>
                  <p className="text-4xl font-serif mb-2">{summary?.totalLikes}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Appreciations</p>
                </div>
                <div>
                  <p className="text-4xl font-serif mb-2">{summary?.totalDownloads}</p>
                  <p className="text-xs text-muted-foreground uppercase tracking-widest">Downloads</p>
                </div>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Trending Section */}
      <section className="py-24 container mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <h2 className="text-3xl font-serif mb-2">Trending Now</h2>
            <p className="text-muted-foreground">The work resonating with our community today.</p>
          </div>
          <Link href="/photos" className="text-sm border-b border-primary pb-1 hover:text-muted-foreground transition-colors">
            View all
          </Link>
        </div>

        {loadingTrending ? (
          <div className="masonry-grid">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="masonry-item">
                <Skeleton className="w-full h-[300px]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="masonry-grid">
            {trendingPhotos.map((photo) => (
              <div key={photo.id} className="masonry-item">
                <PhotoCard photo={photo} onOpen={openLightbox} />
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Collections Preview */}
      <section className="py-24 bg-muted/10 border-t border-border">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-serif mb-4">Curated Collections</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Thematic explorations of light, subject, and form.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {loadingCollections ? (
              Array(3).fill(0).map((_, i) => (
                <Skeleton key={i} className="h-[400px] w-full" />
              ))
            ) : (
              Array.isArray(collections) &&
              collections.slice(0, 3).map((collection) => (
                <Link key={collection.id} href={`/collections/${collection.id}`} className="group block">
                  <div className="relative h-[400px] mb-4 overflow-hidden bg-muted">
                    {collection.coverImageUrl && (
                      <img
                        src={collection.coverImageUrl}
                        alt={collection.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500" />
                  </div>
                  <h3 className="text-xl font-serif group-hover:text-primary/80 transition-colors">{collection.name}</h3>
                  <p className="text-sm text-muted-foreground mt-2">{collection.photoCount} photographs</p>
                </Link>
              ))
            )}
          </div>

          <div className="mt-16 text-center">
            <Link
              href="/collections"
              className="inline-flex items-center justify-center border border-input bg-transparent px-8 py-3 text-sm font-medium hover:bg-accent transition-colors rounded-none"
            >
              Explore All Collections
            </Link>
          </div>
        </div>
      </section>

      {lightboxIndex !== null && trendingPhotos.length > 0 && (
        <Lightbox
          photos={trendingPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </Layout>
  );
}
