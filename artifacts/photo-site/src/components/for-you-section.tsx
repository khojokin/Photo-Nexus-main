import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PhotoCard } from "@/components/photo-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Lightbox } from "@/components/lightbox";
import { Sparkles, RotateCcw, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { Photo } from "@workspace/api-client-react";
import { useTasteProfile } from "@/contexts/taste-profile-context";

interface Mood {
  id: string;
  label: string;
  description: string;
  tags: string[];
}

const MOOD_EMOJIS: Record<string, string> = {
  moody: "🌑",
  serene: "🌊",
  vibrant: "🎨",
  epic: "🏔️",
  intimate: "🫀",
  golden: "🌅",
  monochrome: "⚫",
  wild: "🌿",
};

export function ForYouSection() {
  const { tasteTags, recordInteraction, clearProfile } = useTasteProfile();
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [personalized, setPersonalized] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  // Mood picker state (shown when no taste profile yet)
  const [moods, setMoods] = useState<Mood[]>([]);
  const [moodsLoading, setMoodsLoading] = useState(false);
  const [pickedMoodId, setPickedMoodId] = useState<string | null>(null);
  const [showMoodPicker, setShowMoodPicker] = useState(false);

  // Show mood picker when no taste tags on first load
  useEffect(() => {
    if (tasteTags.length === 0 && moods.length === 0 && !moodsLoading) {
      setShowMoodPicker(true);
      setMoodsLoading(true);
      fetch("/api/recommendations/moods")
        .then((r) => r.json())
        .then((d: { moods: Mood[] }) => setMoods(d.moods ?? []))
        .catch(() => {})
        .finally(() => setMoodsLoading(false));
    } else if (tasteTags.length > 0) {
      setShowMoodPicker(false);
    }
  }, [tasteTags.length]);

  useEffect(() => {
    setLoading(true);
    const params = tasteTags.length > 0
      ? `?taste=${encodeURIComponent(tasteTags.slice(0, 20).join(","))}&limit=12`
      : "?limit=12";

    fetch(`/api/recommendations/for-you${params}`)
      .then((r) => r.json())
      .then((d: { photos: Photo[]; personalized: boolean }) => {
        setPhotos(d.photos ?? []);
        setPersonalized(d.personalized ?? false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [tasteTags.join(",")]);

  function selectMood(mood: Mood) {
    setPickedMoodId(mood.id);
    recordInteraction(mood.tags);
    setShowMoodPicker(false);
  }

  function handleReset() {
    clearProfile();
    setPickedMoodId(null);
    setShowMoodPicker(true);
    setMoodsLoading(true);
    fetch("/api/recommendations/moods")
      .then((r) => r.json())
      .then((d: { moods: Mood[] }) => setMoods(d.moods ?? []))
      .catch(() => {})
      .finally(() => setMoodsLoading(false));
  }

  if (!loading && photos.length === 0 && !showMoodPicker) return null;

  return (
    <section className="py-24">
      <div className="container mx-auto px-4">

        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <div className="flex items-center gap-2.5 mb-3">
              <p className="text-xs uppercase tracking-widest text-muted-foreground">
                Personalised For You
              </p>
              {personalized && !showMoodPicker && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-widest border border-foreground/20 text-muted-foreground/70">
                  <Sparkles className="w-2.5 h-2.5" />
                  Tailored
                </span>
              )}
            </div>
            <h2 className="text-4xl font-serif">
              {showMoodPicker ? "What draws your eye?" : personalized ? "For You" : "Top Picks"}
            </h2>
            {showMoodPicker && (
              <p className="text-sm text-muted-foreground mt-2 max-w-md leading-relaxed">
                Pick a mood to seed your taste profile. It gets sharper every time you like a photo.
              </p>
            )}
          </div>

          <div className="flex items-center gap-5 mb-1">
            {personalized && !showMoodPicker && (
              <button
                onClick={handleReset}
                className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors group"
                title="Reset your taste profile"
              >
                <RotateCcw className="w-3 h-3 group-hover:-rotate-180 transition-transform duration-500" />
                Change taste
              </button>
            )}
            {!showMoodPicker && (
              <Link
                href="/photos"
                className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors group"
              >
                View all{" "}
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            )}
          </div>
        </div>

        {/* ── Mood Picker ─────────────────────────────────────────────────── */}
        {showMoodPicker && (
          <div className="mb-16">
            {moodsLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {Array(8).fill(0).map((_, i) => (
                  <Skeleton key={i} className="h-[100px]" />
                ))}
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {moods.map((mood) => (
                    <button
                      key={mood.id}
                      onClick={() => selectMood(mood)}
                      className={cn(
                        "text-left p-5 border transition-all duration-200",
                        pickedMoodId === mood.id
                          ? "border-foreground bg-muted"
                          : "border-border hover:border-foreground/50 hover:bg-muted/30"
                      )}
                    >
                      <p className="text-xl mb-2">{MOOD_EMOJIS[mood.id] ?? "✦"}</p>
                      <p className="font-serif text-base mb-0.5 leading-snug">{mood.label}</p>
                      <p className="text-xs text-muted-foreground leading-snug">{mood.description}</p>
                    </button>
                  ))}
                </div>
                <p className="mt-6 text-xs text-muted-foreground/60">
                  You can also just start liking photos — we'll learn your taste automatically.
                </p>
              </>
            )}
          </div>
        )}

        {/* ── Photo Grid ──────────────────────────────────────────────────── */}
        {loading ? (
          <div className="masonry-grid">
            {Array(8).fill(0).map((_, i) => (
              <div key={i} className="masonry-item">
                <Skeleton className="w-full h-[280px]" />
              </div>
            ))}
          </div>
        ) : photos.length > 0 ? (
          <>
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

            {personalized && (
              <div className="mt-12 text-center">
                <p className="text-xs text-muted-foreground mb-3">
                  Like photos to sharpen your taste profile
                </p>
                <Link
                  href="/photos"
                  className="inline-flex items-center gap-2 text-sm border border-border px-6 py-2.5 hover:border-foreground/40 transition-colors"
                >
                  Explore more <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            )}
          </>
        ) : null}
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
