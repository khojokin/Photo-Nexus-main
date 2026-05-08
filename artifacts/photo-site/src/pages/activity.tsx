import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Activity as ActivityIcon, Upload, MessageSquare, Heart, Zap } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface ActivityEvent {
  type: string;
  actorName: string;
  photoId?: number | null;
  photoTitle?: string;
  imageUrl?: string;
  body?: string;
  createdAt: string;
}

function EventRow({ event }: { event: ActivityEvent }) {
  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return format(new Date(date), "MMM d");
  };

  const config: Record<string, { icon: React.ElementType; color: string; label: (e: ActivityEvent) => string }> = {
    upload: { icon: Upload, color: "text-blue-400", label: (e) => `uploaded "${e.photoTitle ?? "a photo"}"` },
    comment: { icon: MessageSquare, color: "text-green-400", label: (e) => `commented: "${(e.body ?? "").slice(0, 60)}${(e.body ?? "").length > 60 ? "…" : ""}"` },
    like: { icon: Heart, color: "text-rose-400", label: (e) => `liked "${e.photoTitle ?? "a photo"}"` },
    follow: { icon: ActivityIcon, color: "text-violet-400", label: () => "followed a photographer" },
  };

  const cfg = config[event.type] ?? { icon: Zap, color: "text-muted-foreground", label: () => event.type };
  const Icon = cfg.icon;

  return (
    <div className="flex items-start gap-3 py-3 border-b border-border/40 last:border-0">
      {event.imageUrl && event.photoId ? (
        <Link href={`/photos/${event.photoId}`} className="flex-shrink-0">
          <img src={event.imageUrl} alt="" className="w-12 h-9 object-cover bg-muted" />
        </Link>
      ) : (
        <div className={cn("w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-muted/50 mt-0.5")}>
          <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-sm">
          <Link href={`/profile/${encodeURIComponent(event.actorName)}`} className="font-medium hover:underline">
            {event.actorName}
          </Link>{" "}
          <span className="text-muted-foreground">{cfg.label(event)}</span>
        </p>
        <p className="text-xs text-muted-foreground/60 mt-0.5">{timeAgo(event.createdAt)}</p>
      </div>
      <Icon className={cn("w-3.5 h-3.5 flex-shrink-0 mt-1", cfg.color)} />
    </div>
  );
}

export function Activity() {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/activity")
      .then((r) => r.json())
      .then((d: { events: ActivityEvent[] }) => setEvents(d.events ?? []))
      .catch(() => setEvents([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-2xl">
        <div className="flex items-center gap-3 mb-10">
          <ActivityIcon className="w-6 h-6 text-muted-foreground" />
          <div>
            <h1 className="text-4xl font-serif">Activity Feed</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Live stream of what's happening on Affuaa</p>
          </div>
        </div>

        <div className="border border-border bg-card px-6 py-2">
          {loading ? (
            <div className="space-y-4 py-4">
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <Skeleton className="w-12 h-9 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-3/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : events.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <ActivityIcon className="w-8 h-8 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No activity yet. Upload photos to get started.</p>
            </div>
          ) : (
            events.map((event, i) => <EventRow key={i} event={event} />)
          )}
        </div>
      </div>
    </Layout>
  );
}
