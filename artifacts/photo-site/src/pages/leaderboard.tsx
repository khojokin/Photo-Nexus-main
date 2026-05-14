import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Heart, Download, Eye, Camera, Medal } from "lucide-react";
import { cn } from "@/lib/utils";

type Metric = "likes" | "downloads" | "views";

interface LeaderboardEntry {
  photographerName: string;
  photographerAvatarUrl: string | null;
  totalLikes: number;
  totalDownloads: number;
  totalViews: number;
  photoCount: number;
}

const MEDAL_COLORS = ["text-yellow-400", "text-slate-300", "text-amber-600"];
const AVATAR_COLORS = [
  "bg-rose-900/60", "bg-orange-900/60", "bg-amber-900/60",
  "bg-emerald-900/60", "bg-cyan-900/60", "bg-blue-900/60",
  "bg-violet-900/60", "bg-fuchsia-900/60",
];
function avatarColor(name: string) {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

export function Leaderboard() {
  const [metric, setMetric] = useState<Metric>("likes");
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/leaderboard?metric=${metric}`)
      .then((r) => r.json())
      .then((d: { leaderboard: LeaderboardEntry[] }) => setData(d.leaderboard ?? []))
      .catch(() => setData([]))
      .finally(() => setLoading(false));
  }, [metric]);

  const METRICS: { key: Metric; label: string; icon: React.ElementType; field: keyof LeaderboardEntry }[] = [
    { key: "likes", label: "Most Liked", icon: Heart, field: "totalLikes" },
    { key: "downloads", label: "Most Downloaded", icon: Download, field: "totalDownloads" },
    { key: "views", label: "Most Viewed", icon: Eye, field: "totalViews" },
  ];

  const activeMetric = METRICS.find((m) => m.key === metric)!;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="mb-10 flex items-center gap-4">
          <Trophy className="w-7 h-7 text-yellow-400" />
          <div>
            <h1 className="text-4xl font-serif">Leaderboard</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Top photographers by community engagement</p>
          </div>
        </div>

        <div className="flex gap-2 mb-8">
          {METRICS.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setMetric(key)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 text-sm border transition-colors",
                metric === key
                  ? "border-foreground bg-foreground text-background"
                  : "border-border text-muted-foreground hover:text-foreground hover:border-foreground/50"
              )}
            >
              <Icon className="w-3.5 h-3.5" />
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array(10).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4 p-4 border border-border">
                <Skeleton className="w-6 h-6" />
                <Skeleton className="w-10 h-10 rounded-full" />
                <Skeleton className="flex-1 h-4" />
                <Skeleton className="w-20 h-4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((entry, i) => {
              const value = entry[activeMetric.field] as number;
              const Icon = activeMetric.icon;
              return (
                <Link
                  key={entry.photographerName}
                  href={`/profile/${encodeURIComponent(entry.photographerName)}`}
                  className={cn(
                    "flex items-center gap-4 p-4 border transition-colors hover:bg-muted/30",
                    i === 0 ? "border-yellow-400/40 bg-yellow-400/5" :
                    i === 1 ? "border-slate-400/30 bg-slate-400/5" :
                    i === 2 ? "border-amber-600/30 bg-amber-600/5" :
                    "border-border"
                  )}
                >
                  <div className="w-7 flex-shrink-0 text-center">
                    {i < 3 ? (
                      <Medal className={cn("w-5 h-5 mx-auto", MEDAL_COLORS[i])} />
                    ) : (
                      <span className="text-sm text-muted-foreground font-mono">{i + 1}</span>
                    )}
                  </div>

                  <div className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center text-sm font-serif flex-shrink-0",
                    avatarColor(entry.photographerName)
                  )}>
                    {entry.photographerAvatarUrl ? (
                      <img src={entry.photographerAvatarUrl} alt={entry.photographerName} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <span className="text-white">{entry.photographerName.charAt(0).toUpperCase()}</span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{entry.photographerName}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground mt-0.5">
                      <span className="flex items-center gap-1"><Camera className="w-3 h-3" />{entry.photoCount} photos</span>
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{entry.totalLikes}</span>
                      <span className="flex items-center gap-1"><Download className="w-3 h-3" />{entry.totalDownloads}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 text-sm font-medium flex-shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                    {value.toLocaleString()}
                  </div>
                </Link>
              );
            })}
            {data.length === 0 && (
              <div className="py-20 text-center text-muted-foreground border border-dashed border-border">
                <Trophy className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No data yet. Upload photos to appear here.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
}
