import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { UserPlus, UserCheck, Loader2, Users, RefreshCw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

const SETTINGS_KEY = "affuaa_settings";

function getDisplayName(): string {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return "";
    return (JSON.parse(raw) as { displayName?: string }).displayName ?? "";
  } catch {
    return "";
  }
}

function avatarColor(name: string): string {
  const colors = [
    "bg-stone-700", "bg-zinc-700", "bg-neutral-700", "bg-slate-700",
    "bg-gray-700", "bg-red-900", "bg-amber-900", "bg-emerald-900",
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return colors[Math.abs(hash) % colors.length];
}

interface Suggestion {
  name: string;
  topTags: string[];
  photoCount: number;
  followerCount: number;
  sampleImageUrl: string;
}

interface PhotographerCardProps {
  suggestion: Suggestion;
  myName: string;
  initialFollowing: boolean;
}

function PhotographerCard({ suggestion, myName, initialFollowing }: PhotographerCardProps) {
  const [isFollowing, setIsFollowing] = useState(initialFollowing);
  const [toggling, setToggling] = useState(false);

  async function toggle() {
    if (!myName || toggling) return;
    setToggling(true);
    try {
      const res = await fetch(
        `/api/photographers/${encodeURIComponent(suggestion.name)}/follow`,
        {
          method: isFollowing ? "DELETE" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followerName: myName }),
        }
      );
      if (res.ok || res.status === 201) setIsFollowing((f) => !f);
    } finally {
      setToggling(false);
    }
  }

  const initial = suggestion.name.charAt(0).toUpperCase();

  return (
    <div className="flex-shrink-0 w-[220px] border border-border bg-card overflow-hidden group flex flex-col">
      {/* Cover image */}
      <Link href={`/profile/${encodeURIComponent(suggestion.name)}`} className="block relative h-[140px] overflow-hidden bg-muted">
        {suggestion.sampleImageUrl ? (
          <img
            src={suggestion.sampleImageUrl}
            alt={suggestion.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 opacity-80 group-hover:opacity-100"
          />
        ) : (
          <div className={cn("w-full h-full flex items-center justify-center", avatarColor(suggestion.name))}>
            <span className="text-4xl font-serif text-white/30">{initial}</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Avatar */}
        <div className={cn(
          "absolute bottom-3 left-3 w-9 h-9 rounded-full border-2 border-card flex items-center justify-center text-sm font-serif",
          avatarColor(suggestion.name)
        )}>
          <span className="text-white/90 drop-shadow">{initial}</span>
        </div>
      </Link>

      {/* Body */}
      <div className="p-3 flex flex-col flex-1">
        <Link
          href={`/profile/${encodeURIComponent(suggestion.name)}`}
          className="font-medium text-sm truncate hover:text-muted-foreground transition-colors block mb-1"
        >
          {suggestion.name}
        </Link>

        {suggestion.topTags.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {suggestion.topTags.map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-1.5 py-0.5 border border-border/40 text-muted-foreground/70 bg-muted/20"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="flex items-center gap-3 text-[11px] text-muted-foreground/60 mb-3 mt-auto">
          <span>{suggestion.photoCount} photo{suggestion.photoCount !== 1 ? "s" : ""}</span>
          {suggestion.followerCount > 0 && (
            <>
              <span>·</span>
              <span>{suggestion.followerCount} follower{suggestion.followerCount !== 1 ? "s" : ""}</span>
            </>
          )}
        </div>

        <button
          onClick={() => void toggle()}
          disabled={toggling}
          className={cn(
            "w-full flex items-center justify-center gap-1.5 py-2 text-xs font-medium border transition-all disabled:opacity-40",
            isFollowing
              ? "border-border text-muted-foreground hover:border-destructive hover:text-destructive"
              : "border-foreground bg-foreground text-background hover:opacity-90"
          )}
        >
          {toggling ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isFollowing ? (
            <><UserCheck className="w-3 h-3" /> Following</>
          ) : (
            <><UserPlus className="w-3 h-3" /> Follow</>
          )}
        </button>
      </div>
    </div>
  );
}

export function SuggestedFollows() {
  const [myName] = useState(() => getDisplayName());
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const url = myName
        ? `/api/photographers/suggested?followerName=${encodeURIComponent(myName)}&limit=8`
        : `/api/photographers/suggested?limit=8`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json() as { suggestions: Suggestion[] };
        setSuggestions(data.suggestions ?? []);
      }
    } catch { /* swallow */ }
    finally { setLoading(false); }
  }, [myName, refreshKey]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => { void load(); }, [load]);

  // Don't render if no suggestions and not loading
  if (!loading && suggestions.length === 0) return null;

  const heading = myName
    ? "Photographers you might like"
    : "Photographers to discover";

  const subheading = myName
    ? "Based on the styles you follow"
    : "Explore the community";

  return (
    <section className="py-16 border-t border-border/40">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
              <Users className="w-3.5 h-3.5 inline mr-1.5 -mt-0.5" />
              Who to follow
            </p>
            <h2 className="text-3xl font-serif">{heading}</h2>
            <p className="text-sm text-muted-foreground mt-1">{subheading}</p>
          </div>
          <button
            onClick={() => setRefreshKey((k) => k + 1)}
            disabled={loading}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-2 disabled:opacity-40 mb-1"
            title="Refresh suggestions"
          >
            <RefreshCw className={cn("w-3.5 h-3.5", loading && "animate-spin")} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex gap-4 overflow-x-auto pb-2">
            {Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex-shrink-0 w-[220px] border border-border bg-card overflow-hidden">
                <Skeleton className="h-[140px] w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-8 w-full mt-3" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-thin">
            {suggestions.map((s) => (
              <PhotographerCard
                key={s.name}
                suggestion={s}
                myName={myName}
                initialFollowing={false}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
