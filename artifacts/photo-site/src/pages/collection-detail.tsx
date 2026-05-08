import { useState } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { PhotoCard } from "@/components/photo-card";
import { Lightbox } from "@/components/lightbox";
import { useGetCollection, getGetCollectionQueryKey } from "@workspace/api-client-react";
import type { Photo } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";

export function CollectionDetail() {
  const { id } = useParams<{ id: string }>();
  const collectionId = parseInt(id, 10);
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);

  const { data: collection, isLoading } = useGetCollection(collectionId, {
    query: { enabled: !!collectionId, queryKey: getGetCollectionQueryKey(collectionId) },
  });

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16">
          <Skeleton className="h-16 w-1/2 mb-4" />
          <Skeleton className="h-6 w-1/3 mb-16" />
          <div className="masonry-grid">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="masonry-item">
                <Skeleton className="w-full h-[400px]" />
              </div>
            ))}
          </div>
        </div>
      </Layout>
    );
  }

  if (!collection) {
    return (
      <Layout>
        <div className="py-32 text-center text-muted-foreground">
          <p className="font-serif text-xl">Collection not found.</p>
          <Link href="/collections" className="text-sm mt-4 block underline">
            Browse collections
          </Link>
        </div>
      </Layout>
    );
  }

  const photos: Photo[] = collection.photos;

  function openLightbox(photo: Photo) {
    const idx = photos.findIndex((p) => p.id === photo.id);
    if (idx !== -1) setLightboxIndex(idx);
  }

  return (
    <Layout>
      <div className="relative min-h-[50vh] flex items-center justify-center overflow-hidden mb-16 border-b border-border">
        {collection.coverImageUrl && (
          <div className="absolute inset-0 z-0">
            <img
              src={collection.coverImageUrl}
              alt={collection.name}
              className="w-full h-full object-cover opacity-20 mix-blend-overlay blur-sm"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background" />
          </div>
        )}

        <div className="container relative z-10 mx-auto px-4 py-24 text-center max-w-4xl">
          <h1 className="text-5xl md:text-6xl font-serif mb-6">{collection.name}</h1>
          {collection.description && (
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto font-light leading-relaxed">
              {collection.description}
            </p>
          )}
          <div className="flex items-center justify-center gap-6 text-sm text-muted-foreground uppercase tracking-widest">
            <span>{collection.photoCount} Photographs</span>
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50" />
            <span>Curated {format(new Date(collection.createdAt), "MMM yyyy")}</span>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-24">
        {photos.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground border border-dashed border-border/50">
            <p className="font-serif text-xl">This collection is currently empty.</p>
          </div>
        ) : (
          <div className="masonry-grid">
            {photos.map((photo) => (
              <div key={photo.id} className="masonry-item">
                <PhotoCard photo={photo} onOpen={openLightbox} />
              </div>
            ))}
          </div>
        )}
      </div>

      {lightboxIndex !== null && photos.length > 0 && (
        <Lightbox
          photos={photos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}
    </Layout>
  );
}
