import { useEffect, useState } from "react";
import { Link } from "wouter";
import { PhotoCard } from "@/components/photo-card";
import { Skeleton } from "@/components/ui/skeleton";
import { Sparkles } from "lucide-react";
import type { Photo } from "@workspace/api-client-react";
import { useTasteProfile } from "@/contexts/taste-profile-context";

interface SimilarPhotosProps {
  photoId: number;
  photoTags: string[];
  primaryTag?: string;
}

export function SimilarPhotos({ photoId, photoTags, primaryTag }: SimilarPhotosProps) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const { recordInteraction } = useTasteProfile();

  useEffect(() => {
    recordInteraction(photoTags);
  }, [photoId, photoTags, recordInteraction]);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/photos/${photoId}/similar?limit=8`)
      .then((r) => r.json())
      .then((d: { photos: Photo[] }) => setPhotos(d.photos ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [photoId]);

  if (!loading && photos.length === 0) return null;

  return (
    <div className="border-t border-border bg-muted/5 py-20">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-2xl font-serif">You Might Also Like</h2>
            </div>
            <p className="text-sm text-muted-foreground">
              Curated by tag similarity and community appreciation
            </p>
          </div>
          {primaryTag && (
            <Link
              href={`/tags/${primaryTag}`}
              className="text-sm border-b border-primary pb-1 hover:text-muted-foreground transition-colors"
            >
              View all {primaryTag} &rarr;
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(8).fill(0).map((_, i) => (
              <Skeleton key={i} className="w-full h-[220px]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {photos.map((p) => (
              <PhotoCard key={p.id} photo={p} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
