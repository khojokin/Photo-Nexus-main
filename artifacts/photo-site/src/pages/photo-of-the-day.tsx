import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Sun, Heart, Download, Calendar, ArrowRight } from "lucide-react";
import { format } from "date-fns";

interface Photo {
  id: number; title: string; imageUrl: string; photographerName: string;
  description: string | null; likes: number; downloads: number; tags: string[];
  width: number; height: number; createdAt: string;
}

export function PhotoOfTheDay() {
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/photo-of-the-day")
      .then((r) => r.json())
      .then((d: { photo: Photo | null }) => setPhoto(d.photo ?? null))
      .catch(() => setPhoto(null))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="min-h-[80vh]">
        <div className="border-b border-border bg-muted/10">
          <div className="container mx-auto px-4 py-12 max-w-5xl">
            <div className="flex items-center gap-3 mb-2">
              <Sun className="w-6 h-6 text-yellow-400" />
              <p className="text-xs uppercase tracking-widest text-muted-foreground">Photo of the Day</p>
            </div>
            <p className="font-serif text-2xl">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
          </div>
        </div>

        {loading ? (
          <div className="container mx-auto px-4 py-16 max-w-5xl space-y-6">
            <Skeleton className="w-full h-[60vh]" />
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        ) : !photo ? (
          <div className="py-32 text-center text-muted-foreground">
            <Sun className="w-12 h-12 mx-auto mb-4 opacity-30" />
            <p className="font-serif text-xl">No photo of the day yet.</p>
            <p className="text-sm mt-2">Upload and feature photos to see them here.</p>
          </div>
        ) : (
          <>
            <div className="bg-black">
              <img src={photo.imageUrl} alt={photo.title}
                className="w-full max-h-[75vh] object-contain mx-auto" />
            </div>

            <div className="container mx-auto px-4 py-16 max-w-4xl">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
                <div className="lg:col-span-2">
                  <h1 className="text-4xl md:text-5xl font-serif mb-4 leading-tight">{photo.title}</h1>
                  {photo.description && <p className="text-lg text-muted-foreground font-light">{photo.description}</p>}
                  <div className="flex flex-wrap gap-2 mt-6">
                    {photo.tags.map((tag) => (
                      <Link key={tag} href={`/tags/${tag}`}
                        className="px-3 py-1 bg-muted/30 text-xs text-muted-foreground hover:bg-muted hover:text-foreground border border-border/50 transition-colors">
                        {tag}
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="border border-border bg-card p-6">
                    <Link href={`/profile/${encodeURIComponent(photo.photographerName)}`}
                      className="font-serif text-xl hover:underline block mb-4">{photo.photographerName}</Link>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" />Published</span>
                        <span>{format(new Date(photo.createdAt), "MMM d, yyyy")}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><Heart className="w-4 h-4" />Likes</span>
                        <span>{photo.likes}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground flex items-center gap-2"><Download className="w-4 h-4" />Downloads</span>
                        <span>{photo.downloads}</span>
                      </div>
                    </div>
                    <Link href={`/photos/${photo.id}`}
                      className="mt-6 flex items-center justify-center gap-2 border border-border px-4 py-2.5 text-sm hover:bg-accent transition-colors">
                      View Full Details <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  );
}
