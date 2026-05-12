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
  useGetFollowingFeed,
} from "@workspace/api-client-react";
import type { Photo } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowRight, ArrowUpRight, Camera, Download, Heart, LayoutGrid, Users, UserPlus } from "lucide-react";
import { format } from "date-fns";

const SETTINGS_KEY = "affuaa_settings";
function getDisplayName(): string {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return (parsed.displayName as string) ?? "";
    }
  } catch { /* ignore */ }
  return "";
}

function AnimatedNumber({ value }: { value: number | undefined }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    if (value === undefined) return;
    const start = 0;
    const end = value;
    const duration = 1200;
    const step = 16;
    const increment = (end - start) / (duration / step);
    let current = start;
    const timer = setInterval(() => {
      current += increment;
      if (current >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(current));
    }, step);
    return () => clearInterval(timer);
  }, [value]);
  if (value === undefined) return <Skeleton className="h-10 w-20 inline-block" />;
  return <span>{display.toLocaleString()}</span>;
}

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
    <section className="border-y border-border/50 bg-muted/5">
      <div className="container mx-auto px-4 py-14">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            Photo of the Day &nbsp;·&nbsp; {format(new Date(), "MMMM d, yyyy")}
          </p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-0 border border-border overflow-hidden">
          <Link href={`/photos/${photo.id}`} className="block lg:col-span-3 overflow-hidden group relative">
            <img
              src={photo.imageUrl}
              alt={photo.title}
              className="w-full h-72 lg:h-full object-cover group-hover:scale-103 transition-transform duration-700"
              style={{ minHeight: "320px" }}
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-500" />
          </Link>
          <div className="lg:col-span-2 flex flex-col justify-between p-8 bg-card border-l border-border">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Selected Work</p>
              <h2 className="text-3xl font-serif mb-4 leading-snug">{photo.title}</h2>
              {photo.description && (
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">{photo.description}</p>
              )}
              <Link
                href={`/profile/${encodeURIComponent(photo.photographerName)}`}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center text-xs">
                  {photo.photographerName.charAt(0)}
                </div>
                {photo.photographerName}
              </Link>
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-border mt-6">
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" />{photo.likes}</span>
                <span className="flex items-center gap-1.5"><Download className="w-3.5 h-3.5" />{photo.downloads}</span>
              </div>
              <Link
                href={`/photos/${photo.id}`}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
              >
                View photo <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              </Link>
            </div>
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

  const [feedTab, setFeedTab] = useState<"trending" | "following">("trending");
  const [myName] = useState(() => getDisplayName());

  const { data: followingFeedData, isLoading: loadingFollowing } = useGetFollowingFeed(
    { followerName: myName, limit: 20 },
    { query: { enabled: feedTab === "following" && !!myName } }
  );

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const trendingPhotos: Photo[] = Array.isArray(trending) ? trending : [];
  const featuredList: Photo[] = Array.isArray(featured) ? featured : [];
  const followingPhotos: Photo[] = followingFeedData?.photos ?? [];

  const activeFeedPhotos = feedTab === "following" ? followingPhotos : trendingPhotos;

  function openLightbox(photo: Photo) {
    const idx = activeFeedPhotos.findIndex((p) => p.id === photo.id);
    if (idx !== -1) setLightboxIndex(idx);
  }

  return (
    <Layout>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-end overflow-hidden">
        {/* Background image */}
        {!loadingFeatured && featuredList.length > 0 ? (
          <div className="absolute inset-0 z-0">
            <img
              src={featuredList[0].imageUrl}
              alt="Featured cover"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10" />
          </div>
        ) : (
          <div className="absolute inset-0 z-0 bg-gradient-to-br from-muted/30 via-background to-background" />
        )}

        {/* Hero content — bottom-aligned editorial style */}
        <div className="container relative z-10 mx-auto px-4 pb-20 pt-48 max-w-6xl w-full">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">
              Gallery-quality curation &nbsp;·&nbsp; Since 2024
            </p>
            <h1 className="text-5xl md:text-7xl font-serif mb-8 leading-[1.05] tracking-tight">
              Photography
              <br />
              <span className="text-muted-foreground/70 italic">worth looking at.</span>
            </h1>
            <p className="text-base text-muted-foreground mb-10 max-w-xl font-light leading-relaxed">
              Affuaa is a curated platform for photographers who take the craft seriously —
              darkroom-inspired, editorial in spirit, uncompromising in quality.
            </p>
            <div className="flex items-center gap-4 flex-wrap">
              <Link
                href="/photos"
                className="inline-flex h-12 items-center justify-center bg-foreground text-background px-8 text-sm font-medium hover:opacity-90 transition-opacity"
                data-testid="link-hero-explore"
              >
                Explore Gallery
              </Link>
              <Link
                href="/collections"
                className="inline-flex h-12 items-center justify-center border border-border/60 bg-transparent px-8 text-sm font-medium hover:border-border transition-colors"
                data-testid="link-hero-collections"
              >
                View Collections
              </Link>
            </div>
          </div>

          {/* Featured row — bottom right */}
          {featuredList.length > 1 && (
            <div className="hidden lg:flex items-end gap-2 absolute right-4 bottom-20">
              {featuredList.slice(1, 4).map((photo, i) => (
                <Link key={photo.id} href={`/photos/${photo.id}`} className="group relative overflow-hidden border border-border/30">
                  <img
                    src={photo.imageUrl}
                    alt={photo.title}
                    className="w-24 h-16 object-cover group-hover:scale-105 transition-transform duration-500 opacity-60 group-hover:opacity-100"
                  />
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── Stats Strip ──────────────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-card/50">
        <div className="container mx-auto px-4 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-0 divide-x divide-border/40">
            {[
              { icon: Camera,      value: summary?.totalPhotos,      label: "Photographs" },
              { icon: LayoutGrid,  value: summary?.totalCollections, label: "Collections" },
              { icon: Heart,       value: summary?.totalLikes,        label: "Appreciations" },
              { icon: Download,    value: summary?.totalDownloads,    label: "Downloads" },
            ].map(({ icon: Icon, value, label }) => (
              <div key={label} className="flex flex-col items-center py-4 px-6 gap-2 text-center">
                <Icon className="w-4 h-4 text-muted-foreground/60 mb-1" />
                <div className="text-3xl font-serif">
                  {loadingSummary ? <Skeleton className="h-9 w-20" /> : <AnimatedNumber value={value} />}
                </div>
                <div className="text-xs text-muted-foreground uppercase tracking-widest">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Photo of the Day ─────────────────────────────────────────────── */}
      <PhotoOfDayBanner />

      {/* ── Feed: Trending / Following ────────────────────────────────── */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          {/* Header row with tab switcher */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Discover</p>
              <div className="flex items-center gap-1 border border-border/50 p-0.5 bg-muted/10 w-fit">
                <button
                  onClick={() => setFeedTab("trending")}
                  className={`px-5 py-2 text-sm font-medium transition-all ${
                    feedTab === "trending"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Trending
                </button>
                <button
                  onClick={() => setFeedTab("following")}
                  className={`inline-flex items-center gap-1.5 px-5 py-2 text-sm font-medium transition-all ${
                    feedTab === "following"
                      ? "bg-foreground text-background"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  Following
                </button>
              </div>
            </div>
            {feedTab === "trending" && (
              <Link
                href="/photos"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-1"
              >
                View all <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>

          {/* Trending tab */}
          {feedTab === "trending" && (
            loadingTrending ? (
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
            )
          )}

          {/* Following tab */}
          {feedTab === "following" && (
            !myName ? (
              <div className="flex flex-col items-center py-24 text-center max-w-sm mx-auto">
                <div className="w-14 h-14 border border-border/50 flex items-center justify-center mb-6 bg-muted/10">
                  <UserPlus className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <h3 className="font-serif text-2xl mb-3">Set up your profile first</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                  Add a display name in Settings to start following photographers and see their latest work here.
                </p>
                <Link
                  href="/settings"
                  className="inline-flex h-10 items-center justify-center bg-foreground text-background px-6 text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Go to Settings
                </Link>
              </div>
            ) : loadingFollowing ? (
              <div className="masonry-grid">
                {Array(6).fill(0).map((_, i) => (
                  <div key={i} className="masonry-item">
                    <Skeleton className="w-full h-[300px]" />
                  </div>
                ))}
              </div>
            ) : followingPhotos.length === 0 ? (
              <div className="flex flex-col items-center py-24 text-center max-w-sm mx-auto">
                <div className="w-14 h-14 border border-border/50 flex items-center justify-center mb-6 bg-muted/10">
                  <Users className="w-6 h-6 text-muted-foreground/50" />
                </div>
                <h3 className="font-serif text-2xl mb-3">Your feed is empty</h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-8">
                  Follow photographers you admire and their latest photos will appear here.
                </p>
                <Link
                  href="/photos"
                  className="inline-flex h-10 items-center justify-center bg-foreground text-background px-6 text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  Discover photographers
                </Link>
              </div>
            ) : (
              <div className="masonry-grid">
                {followingPhotos.map((photo) => (
                  <div key={photo.id} className="masonry-item">
                    <PhotoCard photo={photo} onOpen={openLightbox} />
                  </div>
                ))}
              </div>
            )
          )}
        </div>
      </section>

      {/* ── Editorial strip ──────────────────────────────────────────────── */}
      <section className="border-y border-border/40 bg-muted/5 py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-border/30">
            {[
              {
                heading: "Curated, not crowded.",
                body: "Every photo on Affuaa passes an editorial review. We prioritise quality over volume — fewer, better images.",
              },
              {
                heading: "Darkroom aesthetic.",
                body: "Built for photographers who grew up in the darkroom or wish they had. Minimal UI, maximum focus on the image.",
              },
              {
                heading: "Your work, your terms.",
                body: "Set your own license, sell prints, accept commissions. Affuaa gives you the tools without taking over your creative voice.",
              },
            ].map(({ heading, body }) => (
              <div key={heading} className="bg-background p-8">
                <h3 className="font-serif text-xl mb-3">{heading}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Collections Preview ──────────────────────────────────────────── */}
      <section className="py-24">
        <div className="container mx-auto px-4">
          <div className="flex items-end justify-between mb-12">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Thematic Galleries</p>
              <h2 className="text-4xl font-serif">Curated Collections</h2>
            </div>
            <Link
              href="/collections"
              className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group mb-1"
            >
              All collections <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>

          {loadingCollections ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-[400px] w-full" />)}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {Array.isArray(collections) && collections.slice(0, 3).map((collection, i) => (
                <Link key={collection.id} href={`/collections/${collection.id}`} className="group block">
                  <div className={`relative overflow-hidden bg-muted mb-4 ${i === 1 ? "h-[480px]" : "h-[380px]"}`}>
                    {collection.coverImageUrl && (
                      <img
                        src={collection.coverImageUrl}
                        alt={collection.name}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    )}
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/5 transition-colors duration-500" />
                    <div className="absolute bottom-4 left-4">
                      <span className="text-xs text-white/70 uppercase tracking-widest bg-black/30 px-2 py-1">
                        {collection.photoCount} photographs
                      </span>
                    </div>
                  </div>
                  <h3 className="text-lg font-serif group-hover:text-muted-foreground transition-colors">{collection.name}</h3>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ── For You ──────────────────────────────────────────────────────── */}
      <div className="border-t border-border/40">
        <ForYouSection />
      </div>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-24 border-t border-border/40">
        <div className="container mx-auto px-4 text-center max-w-2xl">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">Join the community</p>
          <h2 className="text-4xl font-serif mb-6 leading-snug">
            Your best work<br />deserves a proper home.
          </h2>
          <p className="text-sm text-muted-foreground mb-10 leading-relaxed max-w-lg mx-auto">
            Upload your photography, reach an audience that cares, and — when you're ready — turn your craft into income.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center justify-center bg-foreground text-background px-10 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Start for free
            </Link>
            <Link
              href="/photos"
              className="inline-flex h-12 items-center justify-center border border-border px-10 text-sm font-medium hover:border-foreground/40 transition-colors"
            >
              Browse gallery
            </Link>
          </div>
        </div>
      </section>

      {lightboxIndex !== null && activeFeedPhotos.length > 0 && (
        <Lightbox
          photos={activeFeedPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </Layout>
  );
}
