import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useListCollections } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";

export function Collections() {
  const { data: collections, isLoading } = useListCollections();

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mb-16">
          <h1 className="text-4xl md:text-5xl font-serif mb-6">Collections</h1>
          <p className="text-lg text-muted-foreground font-light">
            Carefully curated selections exploring specific themes, subjects, and moments in time.
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="w-full aspect-[4/5]" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/4" />
              </div>
            ))}
          </div>
        ) : Array.isArray(collections) && collections.length === 0 ? (
          <div className="py-32 text-center text-muted-foreground">
            <p className="font-serif text-xl">No collections yet.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {Array.isArray(collections) && collections.map((collection) => (
              <Link key={collection.id} href={`/collections/${collection.id}`} className="group block">
                <div className="relative aspect-[4/5] mb-6 overflow-hidden bg-muted">
                  {collection.coverImageUrl ? (
                    <img 
                      src={collection.coverImageUrl} 
                      alt={collection.name}
                      className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground font-serif opacity-30 text-2xl">
                      {collection.name.charAt(0)}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-colors duration-500" />
                </div>
                <h2 className="text-2xl font-serif group-hover:text-primary/80 transition-colors">{collection.name}</h2>
                {collection.description && (
                  <p className="text-muted-foreground mt-3 line-clamp-2 leading-relaxed">{collection.description}</p>
                )}
                <p className="text-xs uppercase tracking-widest text-muted-foreground mt-4">{collection.photoCount} photographs</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
