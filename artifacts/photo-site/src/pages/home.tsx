import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { PhotoCard } from "@/components/photo-card";
import { Lightbox } from "@/components/lightbox";
import { ForYouSection } from "@/components/for-you-section";
import {
  useGetSiteSummary,
  useGetFeaturedPhotos,
  useGetTrendingPhotos,
  useListCollections,
} from "@workspace/api-client-react";
import type { Photo } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Sun, ArrowRight } from "lucide-react";
import { format } from "date-fns";

function PhotoOfDayBanner() {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/photo-of-the-day")
      .then((r) => r.json())
      .then((d: { photo: Photo | null }) => setPhoto(d.photo))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading || !photo) return null;

  return (
    <section className="border-y border-border/50 bg-muted/10 py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <Sun className="w-4 h-4 text-yellow-400" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Photo of the Day · {format(new Date(), "MMMM d, yyyy")}</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <Link href={`/photos/${photo.id}`} className="block overflow-hidden group">
            <img src={photo.imageUrl} alt={photo.title} className="w-full h-64 object-cover group-hover:scale-105 transition-transform duration-500" />
          </Link>
          <div>
            <h2 className="text-3xl font-serif mb-3">{photo.title}</h2>
            {photo.description && <p className="text-muted-foreground mb-4">{photo.description}</p>}
            <Link href={`/profile/${encodeURIComponent(photo.photographerName)}`} className="text-sm text-muted-foreground hover:text-foreground transition-colors block mb-6">
              {photo.photographerName}
            </Link>
            <Link href="/photo-of-the-day" className="inline-flex items-center gap-2 text-sm border-b border-primary pb-1 hover:opacity-70 transition-opacity">
              Full story <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

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
            Exceptional photography <br /> for serious creatives.
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto font-light">
            A focused platform for high-quality visual storytelling, selected with editorial discipline for modern creators.
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

      {/* Photo of the Day */}
      <PhotoOfDayBanner />

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

      {/* For You Section */}
      <ForYouSection />

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
