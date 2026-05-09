import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PhotoCard } from "@/components/photo-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbox } from "@/components/lightbox";
import { User2, Sparkles, RotateCcw } from "lucide-react";
import type { Photo } from "@workspace/api-client-react";
import { useTasteProfile } from "@/contexts/taste-profile-context";

export function ForYouSection() {
  const { tasteTags, clearProfile } = useTasteProfile();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [personalized, setPersonalized] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    const params = tasteTags.length > 0
      ? `?taste=${encodeURIComponent(tasteTags.slice(0, 15).join(","))}&limit=8`
      : "?limit=8";

    fetch(`/api/recommendations/for-you${params}`)
      .then((r) => r.json())
      .then((d: { photos: Photo[]; personalized: boolean }) => {
        setPhotos(d.photos ?? []);
        setPersonalized(d.personalized ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tasteTags.join(",")]);

  if (!loading && photos.length === 0) return null;

  return (
    <section className="py-24 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2 mb-2">
              {personalized ? (
                <Sparkles className="w-4 h-4 text-yellow-400" />
              ) : (
                <User2 className="w-4 h-4 text-muted-foreground" />
              )}
              <h2 className="text-3xl font-serif">
                {personalized ? "For You" : "Top Picks"}
              </h2>
            </div>
            <p className="text-muted-foreground text-sm">
              {personalized
                ? "Personalised to your taste — based on photos you've engaged with."
                : "Explore a photo to personalise this feed to your taste."}
            </p>
          </div>
          <div className="flex items-center gap-4">
            {personalized && (
              <button
                onClick={clearProfile}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground border-b border-transparent hover:border-muted pb-0.5 transition-colors"
                title="Clear your taste profile"
              >
                <RotateCcw className="w-3 h-3" />
                Reset taste
              </button>
            )}
            <Link
              href="/photos"
              className="text-sm border-b border-primary pb-1 hover:text-muted-foreground transition-colors"
            >
              View all
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="masonry-grid">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="masonry-item">
                <Skeleton className="w-full h-[280px]" />
              </div>
            ))}
          </div>
        ) : (
          <div className="masonry-grid">
            {photos.map((photo, i) => (
              <div key={photo.id} className="masonry-item">
                <PhotoCard
                  photo={photo}
                  onOpen={(p) => setLightboxIndex(photos.findIndex((x) => x.id === p.id))}
                  priority={i < 2}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </section>
  );
}
