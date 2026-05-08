import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useGetSiteSummary, useGetTrendingPhotos, useListPhotos, useListTags } from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Heart, Download, Camera, LayoutGrid, TrendingUp, Tag, Clock, Award } from "lucide-react";
import { format } from "date-fns";

function StatCard({ icon: Icon, label, value, sub }: { icon: React.ElementType; label: string; value: string | number | undefined; sub?: string }) {
  return (
    <div className="border border-border bg-card p-6">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      {value === undefined ? (
        <Skeleton className="h-9 w-24" />
      ) : (
        <p className="text-4xl font-serif">{value.toLocaleString()}</p>
      )}
      {sub && <p className="text-xs text-muted-foreground mt-2">{sub}</p>}
    </div>
  );
}

export function Dashboard() {
  const { data: summary } = useGetSiteSummary();
  const { data: trending } = useGetTrendingPhotos();
  const { data: latest } = useListPhotos({ sort: "latest", limit: 5 });
  const { data: popular } = useListPhotos({ sort: "popular", limit: 10 });
  const { data: tags } = useListTags();

  const topPhotographers = (() => {
    if (!popular?.photos) return [];
    const map = new Map<string, { name: string; likes: number; downloads: number; count: number }>();
    for (const p of popular.photos) {
      const existing = map.get(p.photographerName);
      if (existing) {
        existing.likes += p.likes;
        existing.downloads += p.downloads;
        existing.count++;
      } else {
        map.set(p.photographerName, {
          name: p.photographerName,
          likes: p.likes,
          downloads: p.downloads,
          count: 1,
        });
      }
    }
    return Array.from(map.values())
      .sort((a, b) => (b.likes + b.downloads) - (a.likes + a.downloads))
      .slice(0, 5);
  })();

  const maxTagCount = Array.isArray(tags) && tags.length > 0 ? tags[0].photoCount : 1;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        <div className="mb-12">
          <h1 className="text-4xl font-serif mb-2">Analytics</h1>
          <p className="text-muted-foreground text-sm">Platform-wide engagement and content metrics.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-16">
          <StatCard icon={Camera} label="Photographs" value={summary?.totalPhotos} sub="Total published" />
          <StatCard icon={LayoutGrid} label="Collections" value={summary?.totalCollections} sub="Curated sets" />
          <StatCard icon={Heart} label="Appreciations" value={summary?.totalLikes} sub="Total likes given" />
          <StatCard icon={Download} label="Downloads" value={summary?.totalDownloads} sub="Total downloads" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          <div className="lg:col-span-2 border border-border bg-card">
            <div className="border-b border-border px-6 py-4 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <h2 className="font-serif text-lg">Trending Photos</h2>
            </div>
            <div className="divide-y divide-border">
              {!trending
                ? Array(5).fill(0).map((_, i) => (
                  <div key={i} className="flex items-center gap-4 px-6 py-3">
                    <Skeleton className="w-12 h-9 flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3.5 w-48" />
                      <Skeleton className="h-3 w-24" />
                    </div>
                  </div>
                ))
                : Array.isArray(trending) && trending.slice(0, 8).map((photo, i) => (
                  <Link key={photo.id} href={`/photos/${photo.id}`} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors group">
                    <span className="w-5 text-center text-xs font-mono text-muted-foreground flex-shrink-0">{i + 1}</span>
                    <div className="w-14 h-10 bg-muted overflow-hidden flex-shrink-0">
                      <img src={photo.imageUrl} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors">{photo.title}</p>
                      <p className="text-xs text-muted-foreground">{photo.photographerName}</p>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{photo.likes}</span>
                      <span className="flex items-center gap-1"><Download className="w-3 h-3" />{photo.downloads}</span>
                    </div>
                  </Link>
                ))
              }
            </div>
          </div>

          <div className="space-y-8">
            <div className="border border-border bg-card">
              <div className="border-b border-border px-6 py-4 flex items-center gap-2">
                <Award className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-serif text-lg">Top Photographers</h2>
              </div>
              <div className="divide-y divide-border">
                {topPhotographers.length === 0
                  ? Array(4).fill(0).map((_, i) => (
                    <div key={i} className="flex items-center gap-3 px-6 py-3">
                      <Skeleton className="w-7 h-7 rounded-full flex-shrink-0" />
                      <Skeleton className="h-3.5 w-32" />
                    </div>
                  ))
                  : topPhotographers.map((p, i) => (
                    <div key={p.name} className="flex items-center gap-3 px-6 py-3">
                      <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center text-xs font-serif flex-shrink-0">
                        {p.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{p.name}</p>
                        <p className="text-xs text-muted-foreground">{p.count} photo{p.count !== 1 ? "s" : ""}</p>
                      </div>
                      <span className="text-xs text-muted-foreground flex-shrink-0">#{i + 1}</span>
                    </div>
                  ))
                }
              </div>
            </div>

            <div className="border border-border bg-card">
              <div className="border-b border-border px-6 py-4 flex items-center gap-2">
                <Tag className="w-4 h-4 text-muted-foreground" />
                <h2 className="font-serif text-lg">Top Tags</h2>
              </div>
              <div className="px-6 py-4 space-y-3">
                {!Array.isArray(tags)
                  ? Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-5 w-full" />)
                  : tags.slice(0, 8).map((tag) => (
                    <Link key={tag.name} href={`/tags/${tag.name}`} className="flex items-center gap-3 group">
                      <span className="text-xs text-muted-foreground w-16 truncate group-hover:text-foreground transition-colors">{tag.name}</span>
                      <div className="flex-1 bg-muted/40 h-1.5 overflow-hidden">
                        <div
                          className="h-full bg-foreground/40 group-hover:bg-foreground/70 transition-colors"
                          style={{ width: `${(tag.photoCount / maxTagCount) * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground w-4 text-right">{tag.photoCount}</span>
                    </Link>
                  ))
                }
              </div>
            </div>
          </div>
        </div>

        <div className="border border-border bg-card">
          <div className="border-b border-border px-6 py-4 flex items-center gap-2">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-serif text-lg">Recently Published</h2>
          </div>
          <div className="divide-y divide-border">
            {!latest?.photos
              ? Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-3">
                  <Skeleton className="w-12 h-9 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                </div>
              ))
              : latest.photos.map((photo) => (
                <Link key={photo.id} href={`/photos/${photo.id}`} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors group">
                  <div className="w-14 h-10 bg-muted overflow-hidden flex-shrink-0">
                    <img src={photo.imageUrl} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{photo.title}</p>
                    <p className="text-xs text-muted-foreground">{photo.photographerName}</p>
                  </div>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                    <span>{format(new Date(photo.createdAt), "MMM d")}</span>
                    <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{photo.likes}</span>
                  </div>
                </Link>
              ))
            }
          </div>
        </div>
      </div>
    </Layout>
  );
}
