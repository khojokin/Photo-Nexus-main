import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { PhotoCard } from "@/components/photo-card";
import { Lightbox } from "@/components/lightbox";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, ArrowLeft } from "lucide-react";
import type { Photo } from "@workspace/api-client-react";

interface Series {
  id: number; name: string; description: string | null;
  photographerName: string; coverImageUrl: string | null; createdAt: string;
}

export function SeriesDetail() {
  const { id } = useParams<{ id: string }>();
  const [series, setSeries] = useState<Series | null>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [loading, setLoading] = useState(true);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/series/${id}`)
      .then((r) => r.json())
      .then((d: { series: Series; photos: Photo[] }) => { setSeries(d.series); setPhotos(d.photos ?? []); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <Link href="/series" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> All Series
        </Link>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
            <div className="masonry-grid mt-8">
              {Array(6).fill(0).map((_, i) => <div key={i} className="masonry-item"><Skeleton className="w-full h-64" /></div>)}
            </div>
          </div>
        ) : !series ? (
          <div className="py-24 text-center text-muted-foreground">Series not found.</div>
        ) : (
          <>
            <div className="mb-12">
              <div className="flex items-center gap-2 text-muted-foreground text-xs uppercase tracking-widest mb-3">
                <BookOpen className="w-3.5 h-3.5" /> Photo Series
              </div>
              <h1 className="text-5xl font-serif mb-3">{series.name}</h1>
              <Link href={`/profile/${encodeURIComponent(series.photographerName)}`}
                className="text-muted-foreground hover:text-foreground transition-colors">{series.photographerName}</Link>
              {series.description && <p className="text-muted-foreground mt-4 max-w-2xl">{series.description}</p>}
              <p className="text-xs text-muted-foreground/60 mt-3">{photos.length} photograph{photos.length !== 1 ? "s" : ""}</p>
            </div>

            {photos.length === 0 ? (
              <div className="py-16 text-center border border-dashed border-border text-muted-foreground">
                <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No photos in this series yet.</p>
                <p className="text-xs mt-1">Assign a series ID when uploading photos.</p>
              </div>
            ) : (
              <div className="masonry-grid">
                {photos.map((photo) => (
                  <div key={photo.id} className="masonry-item">
                    <PhotoCard photo={photo} onOpen={(p) => { const idx = photos.findIndex((x) => x.id === p.id); if (idx !== -1) setLightboxIndex(idx); }} />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {lightboxIndex !== null && (
        <Lightbox photos={photos} initialIndex={lightboxIndex} onClose={() => setLightboxIndex(null)} />
      )}
    </Layout>
  );
}
