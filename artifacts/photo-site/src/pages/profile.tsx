import { useState, useEffect, useCallback } from "react";
import { Link, useRoute } from "wouter";
import { Layout } from "@/components/layout";
import { PhotoCard } from "@/components/photo-card";
import { Lightbox } from "@/components/lightbox";
import { Skeleton } from "@/components/ui/skeleton";
import { useListPhotos } from "@workspace/api-client-react";
import type { Photo } from "@workspace/api-client-react";
import {
  BadgeCheck, Camera, MapPin, Globe, MessageSquare, Calendar,
  Instagram, Twitter, UserPlus, UserCheck, Loader2, Users,
  Trophy, Award, Star, Zap, TrendingUp, X, BookOpen,
} from "lucide-react";
import { SeriesManagerTab } from "@/components/series-manager-tab";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

const SETTINGS_KEY = "affuaa_settings";

interface ProfileSettings {
  profileImageDataUrl: string;
  displayName: string;
  bio: string;
  location: string;
  website: string;
  instagram: string;
  twitter: string;
}

function loadSettings(): ProfileSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Record<string, unknown>;
      return {
        profileImageDataUrl: (parsed.profileImageDataUrl as string) ?? "",
        displayName: (parsed.displayName as string) ?? "",
        bio: (parsed.bio as string) ?? "",
        location: (parsed.location as string) ?? "",
        website: (parsed.website as string) ?? "",
        instagram: (parsed.instagram as string) ?? "",
        twitter: (parsed.twitter as string) ?? "",
      };
    }
  } catch { /* ignore */ }
  return { profileImageDataUrl: "", displayName: "", bio: "", location: "", website: "", instagram: "", twitter: "" };
}

const VERIFIED_PHOTOGRAPHERS = [
  "Aria Chen", "Marcus Reid", "Hiroshi Nakamura", "Lena Fischer",
  "Miguel Santos", "Amara Osei",
];

// Deterministic avatar color from name
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

interface RelatedPhotographer {
  name: string;
  photoCount: number;
  sharedTags: string[];
  coverUrl: string | null;
}

function computeRelated(
  allPhotos: Photo[],
  viewingName: string,
  myTags: string[],
  limit = 6
): RelatedPhotographer[] {
  if (myTags.length === 0) return [];
  const myTagSet = new Set(myTags);

  // Group photos by photographer (excluding self)
  const byName = new Map<string, Photo[]>();
  for (const p of allPhotos) {
    const n = p.photographerName;
    if (n.toLowerCase() === viewingName.toLowerCase()) continue;
    if (!byName.has(n)) byName.set(n, []);
    byName.get(n)!.push(p);
  }

  const candidates: RelatedPhotographer[] = [];
  for (const [name, photos] of byName.entries()) {
    const allTags = Array.from(new Set(photos.flatMap((p) => p.tags)));
    const shared = allTags.filter((t) => myTagSet.has(t));
    if (shared.length > 0) {
      candidates.push({
        name,
        photoCount: photos.filter((p) => p.status !== "draft").length,
        sharedTags: shared.slice(0, 3),
        coverUrl: photos[0]?.imageUrl ?? null,
      });
    }
  }

  // Sort by shared tag count desc, then photo count desc
  return candidates
    .sort((a, b) =>
      b.sharedTags.length - a.sharedTags.length ||
      b.photoCount - a.photoCount
    )
    .slice(0, limit);
}

function useFollowStats(name: string) {
  const [followerCount, setFollowerCount] = useState<number | null>(null);
  const [followingCount, setFollowingCount] = useState<number | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [toggling, setToggling] = useState(false);

  const myName = loadSettings().displayName;

  const fetchStats = useCallback(async () => {
    if (!name) return;
    try {
      const res = await fetch(`/api/photographers/${encodeURIComponent(name)}/follow-stats`);
      if (res.ok) {
        const data = await res.json() as { followerCount: number; followingCount: number };
        setFollowerCount(data.followerCount);
        setFollowingCount(data.followingCount);
      }
    } catch { /* ignore */ }
  }, [name]);

  const fetchIsFollowing = useCallback(async () => {
    if (!name || !myName || myName.toLowerCase() === name.toLowerCase()) return;
    try {
      const res = await fetch(
        `/api/photographers/${encodeURIComponent(name)}/is-followed-by/${encodeURIComponent(myName)}`
      );
      if (res.ok) {
        const data = await res.json() as { isFollowing: boolean };
        setIsFollowing(data.isFollowing);
      }
    } catch { /* ignore */ }
  }, [name, myName]);

  useEffect(() => {
    void fetchStats();
    void fetchIsFollowing();
  }, [fetchStats, fetchIsFollowing]);

  async function toggle() {
    if (!myName || toggling) return;
    setToggling(true);
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/photographers/${encodeURIComponent(name)}/follow`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerName: myName }),
      });
      if (res.ok || res.status === 201) {
        const data = await res.json() as { followerCount: number };
        setFollowerCount(data.followerCount);
        setIsFollowing((prev) => !prev);
      }
    } finally {
      setToggling(false);
    }
  }

  return { followerCount, followingCount, isFollowing, toggling, toggle, myName };
}

// ─── Related photographers sidebar card ─────────────────────────────────────

interface RelatedCardProps {
  photographer: RelatedPhotographer;
  myName: string;
}

function RelatedCard({ photographer, myName }: RelatedCardProps) {
  const [isFollowing, setIsFollowing] = useState(false);
  const [toggling, setToggling] = useState(false);
  const canFollow = !!myName && myName.toLowerCase() !== photographer.name.toLowerCase();

  useEffect(() => {
    if (!canFollow) return;
    void (async () => {
      try {
        const res = await fetch(
          `/api/photographers/${encodeURIComponent(photographer.name)}/is-followed-by/${encodeURIComponent(myName)}`
        );
        if (res.ok) {
          const data = await res.json() as { isFollowing: boolean };
          setIsFollowing(data.isFollowing);
        }
      } catch { /* ignore */ }
    })();
  }, [canFollow, myName, photographer.name]);

  async function toggleFollow(e: React.MouseEvent) {
    e.preventDefault();
    if (!myName || toggling) return;
    setToggling(true);
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(
        `/api/photographers/${encodeURIComponent(photographer.name)}/follow`,
        {
          method,
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ followerName: myName }),
        }
      );
      if (res.ok || res.status === 201) setIsFollowing((prev) => !prev);
    } finally {
      setToggling(false);
    }
  }

  const initial = photographer.name.charAt(0).toUpperCase();
  const isVerified = VERIFIED_PHOTOGRAPHERS.some(
    (n) => n.toLowerCase() === photographer.name.toLowerCase()
  );

  return (
    <Link
      href={`/profile/${encodeURIComponent(photographer.name)}`}
      className="group flex items-center gap-3 p-3 -mx-3 hover:bg-muted/30 transition-colors"
    >
      {/* Avatar with mini cover */}
      <div className={cn(
        "w-10 h-10 rounded-full flex items-center justify-center text-sm font-serif flex-shrink-0 border border-border/50 relative overflow-hidden",
        avatarColor(photographer.name)
      )}>
        {photographer.coverUrl ? (
          <img
            src={photographer.coverUrl}
            alt={photographer.name}
            className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity"
          />
        ) : null}
        <span className="relative z-10 text-white/90 drop-shadow">{initial}</span>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5">
          <p className="text-sm font-medium truncate group-hover:text-foreground transition-colors">
            {photographer.name}
          </p>
          {isVerified && <BadgeCheck className="w-3 h-3 text-blue-400 flex-shrink-0" />}
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <p className="text-xs text-muted-foreground">
            {photographer.photoCount} {photographer.photoCount === 1 ? "photo" : "photos"}
          </p>
          <span className="text-muted-foreground/30 text-xs">·</span>
          <p className="text-xs text-muted-foreground truncate">
            {photographer.sharedTags.join(", ")}
          </p>
        </div>
      </div>

      {canFollow && (
        <button
          onClick={toggleFollow}
          disabled={toggling}
          aria-label={isFollowing ? "Unfollow" : "Follow"}
          className={cn(
            "flex-shrink-0 p-1.5 border transition-all disabled:opacity-40",
            isFollowing
              ? "border-border text-muted-foreground hover:border-destructive hover:text-destructive"
              : "border-foreground/30 text-foreground/70 hover:border-foreground hover:text-foreground hover:bg-foreground/5"
          )}
        >
          {toggling ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : isFollowing ? (
            <UserCheck className="w-3 h-3" />
          ) : (
            <UserPlus className="w-3 h-3" />
          )}
        </button>
      )}
    </Link>
  );
}

// ─── Followers / Following modal ─────────────────────────────────────────────

interface FollowListEntry {
  name: string;
  since: string;
}

interface FollowListModalProps {
  subjectName: string;
  mode: "followers" | "following";
  myName: string;
  onClose: () => void;
}

function FollowListModal({ subjectName, mode, myName, onClose }: FollowListModalProps) {
  const [list, setList] = useState<FollowListEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [followStates, setFollowStates] = useState<Record<string, boolean>>({});
  const [togglingName, setTogglingName] = useState<string | null>(null);

  useEffect(() => {
    const endpoint = mode === "followers"
      ? `/api/photographers/${encodeURIComponent(subjectName)}/followers`
      : `/api/photographers/${encodeURIComponent(subjectName)}/following`;

    fetch(endpoint)
      .then((r) => r.json() as Promise<{ list: FollowListEntry[] }>)
      .then((d) => {
        setList(d.list ?? []);
        if (myName) {
          Promise.all(
            (d.list ?? []).map(async (entry) => {
              if (entry.name.toLowerCase() === myName.toLowerCase()) return null;
              const r = await fetch(
                `/api/photographers/${encodeURIComponent(entry.name)}/is-followed-by/${encodeURIComponent(myName)}`
              );
              if (!r.ok) return null;
              const data = await r.json() as { isFollowing: boolean };
              return { name: entry.name, isFollowing: data.isFollowing };
            })
          ).then((results) => {
            const map: Record<string, boolean> = {};
            for (const r of results) if (r) map[r.name] = r.isFollowing;
            setFollowStates(map);
          }).catch(() => {});
        }
      })
      .catch(() => setList([]))
      .finally(() => setLoading(false));
  }, [subjectName, mode, myName]);

  async function toggleFollow(name: string) {
    if (!myName || togglingName) return;
    setTogglingName(name);
    const isFollowing = !!followStates[name];
    try {
      const res = await fetch(`/api/photographers/${encodeURIComponent(name)}/follow`, {
        method: isFollowing ? "DELETE" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followerName: myName }),
      });
      if (res.ok || res.status === 201) {
        setFollowStates((prev) => ({ ...prev, [name]: !isFollowing }));
      }
    } finally {
      setTogglingName(null);
    }
  }

  const title = mode === "followers" ? "Followers" : "Following";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-card border border-border w-full max-w-sm mx-4 flex flex-col max-h-[80vh]">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border px-5 py-4 flex-shrink-0">
          <div>
            <h3 className="font-serif text-lg">{title}</h3>
            <p className="text-xs text-muted-foreground truncate max-w-[180px]">{subjectName}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="overflow-y-auto flex-1">
          {loading ? (
            <div className="space-y-px py-2">
              {Array(5).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3">
                  <Skeleton className="w-9 h-9 rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ) : list.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center px-6">
              <Users className="w-8 h-8 text-muted-foreground/30 mb-3" />
              <p className="text-sm text-muted-foreground">
                {mode === "followers" ? "No followers yet." : "Not following anyone yet."}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {list.map((entry) => {
                const isSelf = entry.name.toLowerCase() === myName.toLowerCase();
                const isFollowing = !!followStates[entry.name];
                const isToggling = togglingName === entry.name;
                const initial = entry.name.charAt(0).toUpperCase();

                return (
                  <div key={entry.name} className="flex items-center gap-3 px-5 py-3 hover:bg-muted/20 transition-colors">
                    <Link
                      href={`/profile/${encodeURIComponent(entry.name)}`}
                      onClick={onClose}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <div className={cn(
                        "w-9 h-9 rounded-full flex items-center justify-center text-sm font-serif flex-shrink-0 border border-border/50",
                        avatarColor(entry.name)
                      )}>
                        <span className="text-white/90 drop-shadow">{initial}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-sm font-medium truncate">{entry.name}</p>
                          {VERIFIED_PHOTOGRAPHERS.some((n) => n.toLowerCase() === entry.name.toLowerCase()) && (
                            <BadgeCheck className="w-3 h-3 text-blue-400 flex-shrink-0" />
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Since {format(new Date(entry.since), "MMM yyyy")}
                        </p>
                      </div>
                    </Link>

                    {!isSelf && myName && (
                      <button
                        onClick={() => void toggleFollow(entry.name)}
                        disabled={!!isToggling}
                        className={cn(
                          "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium border transition-all disabled:opacity-40",
                          isFollowing
                            ? "border-border text-muted-foreground hover:border-destructive hover:text-destructive"
                            : "border-foreground/40 text-foreground hover:border-foreground hover:bg-foreground/5"
                        )}
                      >
                        {isToggling ? (
                          <Loader2 className="w-3 h-3 animate-spin" />
                        ) : isFollowing ? (
                          <><UserCheck className="w-3 h-3" /> Following</>
                        ) : (
                          <><UserPlus className="w-3 h-3" /> Follow</>
                        )}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Achievement badges ───────────────────────────────────────────────────────

const ACHIEVEMENTS = [
  { id: "first_upload", label: "First Upload", icon: Camera, desc: "Uploaded your first photo", check: (p: { photoCount: number; totalLikes: number; totalDownloads: number; totalViews: number }) => p.photoCount >= 1, color: "text-blue-400" },
  { id: "ten_photos", label: "Prolific", icon: TrendingUp, desc: "10+ photos uploaded", check: (p: { photoCount: number; totalLikes: number; totalDownloads: number; totalViews: number }) => p.photoCount >= 10, color: "text-green-400" },
  { id: "fifty_likes", label: "Fan Favourite", icon: Star, desc: "50+ total likes", check: (p: { photoCount: number; totalLikes: number; totalDownloads: number; totalViews: number }) => p.totalLikes >= 50, color: "text-yellow-400" },
  { id: "hundred_downloads", label: "Widely Shared", icon: Zap, desc: "100+ total downloads", check: (p: { photoCount: number; totalLikes: number; totalDownloads: number; totalViews: number }) => p.totalDownloads >= 100, color: "text-purple-400" },
  { id: "top_view", label: "Viral", icon: Trophy, desc: "1,000+ total views", check: (p: { photoCount: number; totalLikes: number; totalDownloads: number; totalViews: number }) => p.totalViews >= 1000, color: "text-orange-400" },
  { id: "hundred_photos", label: "Master", icon: Award, desc: "100+ photos uploaded", check: (p: { photoCount: number; totalLikes: number; totalDownloads: number; totalViews: number }) => p.photoCount >= 100, color: "text-rose-400" },
];

interface AchievementBadgesProps {
  photoCount: number;
  totalLikes: number;
  totalDownloads: number;
  totalViews: number;
}

function AchievementBadges({ photoCount, totalLikes, totalDownloads, totalViews }: AchievementBadgesProps) {
  const stats = { photoCount, totalLikes, totalDownloads, totalViews };
  const earned = ACHIEVEMENTS.filter((a) => a.check(stats));
  const locked = ACHIEVEMENTS.filter((a) => !a.check(stats));

  if (earned.length === 0 && photoCount === 0) return null;

  return (
    <div className="border border-border bg-card p-6 mb-8">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Achievements</h3>
      <div className="flex flex-wrap gap-3">
        {earned.map(({ id, label, icon: Icon, desc, color }) => (
          <div key={id} title={desc} className="group relative flex flex-col items-center gap-1.5">
            <div className={cn("w-10 h-10 border border-border/60 bg-muted/20 flex items-center justify-center transition-transform group-hover:scale-110", color)}>
              <Icon className="w-5 h-5" />
            </div>
            <p className="text-[10px] text-muted-foreground text-center max-w-[52px] leading-tight">{label}</p>
          </div>
        ))}
        {locked.slice(0, 3).map(({ id, label, icon: Icon, desc }) => (
          <div key={id} title={`Locked: ${desc}`} className="flex flex-col items-center gap-1.5 opacity-25">
            <div className="w-10 h-10 border border-border/30 bg-muted/10 flex items-center justify-center">
              <Icon className="w-5 h-5 text-muted-foreground" />
            </div>
            <p className="text-[10px] text-muted-foreground text-center max-w-[52px] leading-tight">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Profile completion bar ───────────────────────────────────────────────────

interface ProfileCompletionProps {
  settings: { displayName: string; bio: string; location: string; website: string; instagram: string; twitter: string };
  photoCount: number;
}

function ProfileCompletion({ settings, photoCount }: ProfileCompletionProps) {
  const checks = [
    { label: "Display name", done: !!settings.displayName },
    { label: "Bio", done: !!settings.bio },
    { label: "Location", done: !!settings.location },
    { label: "Website", done: !!settings.website },
    { label: "Social link", done: !!(settings.instagram || settings.twitter) },
    { label: "First photo", done: photoCount > 0 },
  ];
  const pct = Math.round((checks.filter((c) => c.done).length / checks.length) * 100);

  if (pct === 100) return null;

  return (
    <div className="border border-border bg-card/50 p-4 mb-6">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Profile Completion</p>
        <p className="text-xs font-medium">{pct}%</p>
      </div>
      <div className="h-1 bg-muted rounded-full overflow-hidden mb-3">
        <div className="h-full bg-foreground transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <div className="flex flex-wrap gap-x-4 gap-y-1">
        {checks.filter((c) => !c.done).map((c) => (
          <p key={c.label} className="text-xs text-muted-foreground flex items-center gap-1">
            <span className="w-1 h-1 rounded-full bg-muted-foreground/50 inline-block" />
            Add {c.label.toLowerCase()}
          </p>
        ))}
      </div>
    </div>
  );
}

// ─── Main Profile page ────────────────────────────────────────────────────────

export function Profile() {
  const [matchOwn] = useRoute("/profile");
  const [matchPublic, publicParams] = useRoute("/profile/:name");

  const settings = loadSettings();
  const viewingName = matchPublic && publicParams?.name
    ? decodeURIComponent(publicParams.name)
    : settings.displayName;

  const isOwnProfile = matchOwn || viewingName === settings.displayName;
  const isVerified = VERIFIED_PHOTOGRAPHERS.some(
    (n) => n.toLowerCase() === viewingName.toLowerCase()
  );

  const { followerCount, followingCount, isFollowing, toggling, toggle, myName } =
    useFollowStats(viewingName ?? "");

  const canFollow = !!myName && !isOwnProfile && !!viewingName;

  const { data: photosData, isLoading: loadingPhotos } = useListPhotos({ limit: 200 });

  const allPhotos = photosData?.photos ?? [];
  const myPhotos = allPhotos.filter(
    (p) => viewingName && p.photographerName.toLowerCase() === viewingName.toLowerCase()
  );

  const publishedPhotos = myPhotos.filter((p) => p.status !== "draft" || isOwnProfile);
  const draftPhotos = isOwnProfile ? myPhotos.filter((p) => p.status === "draft") : [];

  const totalLikes = publishedPhotos.reduce((acc, p) => acc + p.likes, 0);
  const totalDownloads = publishedPhotos.reduce((acc, p) => acc + p.downloads, 0);

  const myTags = Array.from(
    new Set(publishedPhotos.flatMap((p) => p.tags))
  ).slice(0, 8);

  const relatedPhotographers = computeRelated(allPhotos, viewingName ?? "", myTags);

  const displayName = viewingName || "Unknown Photographer";
  const initial = displayName.charAt(0).toUpperCase();

  const [showVerify, setShowVerify] = useState(false);
  const [verifyStep, setVerifyStep] = useState<"form" | "pending" | "done">("form");
  const [verifyName, setVerifyName] = useState("");
  const [verifyLinks, setVerifyLinks] = useState("");
  const [activeTab, setActiveTab] = useState<"published" | "drafts" | "series">("published");
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [followModal, setFollowModal] = useState<"followers" | "following" | null>(null);

  interface ProfileSeries {
    id: number; name: string; description: string | null;
    coverImageUrl: string | null; photographerName: string; photoCount?: number;
  }
  const [profileSeries, setProfileSeries] = useState<ProfileSeries[]>([]);
  useEffect(() => {
    if (!viewingName) return;
    fetch("/api/series")
      .then((r) => r.json())
      .then((d: { series: ProfileSeries[] }) => {
        setProfileSeries(
          (d.series ?? []).filter(
            (s) => s.photographerName.toLowerCase() === viewingName.toLowerCase()
          )
        );
      })
      .catch(() => setProfileSeries([]));
  }, [viewingName]);

  function submitVerification() {
    setVerifyStep("pending");
    setTimeout(() => setVerifyStep("done"), 1800);
  }

  const displayedPhotos = activeTab === "drafts" ? draftPhotos : activeTab === "series" ? [] : publishedPhotos;

  function openLightbox(photo: Photo) {
    const idx = displayedPhotos.findIndex((p) => p.id === photo.id);
    if (idx !== -1) setLightboxIndex(idx);
  }

  if (!viewingName) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-32 text-center max-w-md">
          <Camera className="w-12 h-12 mx-auto mb-6 text-muted-foreground opacity-30" />
          <h1 className="text-3xl font-serif mb-3">Your Profile</h1>
          <p className="text-muted-foreground text-sm mb-8">
            Set a display name in Settings to create your photographer profile.
          </p>
          <Link
            href="/settings"
            className="inline-flex items-center justify-center bg-foreground text-background px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity"
          >
            Go to Settings
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {/* Profile header */}
      <div className="bg-muted/10 border-b border-border">
        <div className="container mx-auto px-4 py-16 max-w-5xl">
          <div className="flex items-start gap-8">
            <div className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-serif flex-shrink-0 border-2 border-border relative overflow-hidden">
              {isOwnProfile && settings.profileImageDataUrl ? (
                <img
                  src={settings.profileImageDataUrl}
                  alt={`${displayName} profile`}
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <>
                  <div className={cn("absolute inset-0", avatarColor(displayName))} />
                  <span className="relative z-10 text-white drop-shadow">{initial}</span>
                </>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap mb-2">
                <h1 className="text-3xl font-serif">{displayName}</h1>
                {isVerified && (
                  <span className="flex items-center gap-1 bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs px-2 py-0.5">
                    <BadgeCheck className="w-3.5 h-3.5" />
                    Verified
                  </span>
                )}
              </div>

              {isOwnProfile && settings.bio && (
                <p className="text-muted-foreground text-sm mb-4 max-w-xl">{settings.bio}</p>
              )}

              <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground mb-5">
                {isOwnProfile && settings.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {settings.location}
                  </span>
                )}
                {isOwnProfile && settings.website && (
                  <a
                    href={settings.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    {settings.website.replace(/^https?:\/\//, "")}
                  </a>
                )}
                {isOwnProfile && settings.instagram && (
                  <a
                    href={`https://instagram.com/${settings.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    <Instagram className="w-3.5 h-3.5" />
                    @{settings.instagram}
                  </a>
                )}
                {isOwnProfile && settings.twitter && (
                  <a
                    href={`https://x.com/${settings.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    <Twitter className="w-3.5 h-3.5" />
                    @{settings.twitter}
                  </a>
                )}
                {publishedPhotos.length > 0 && (
                  <span className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" />
                    Since {format(new Date(publishedPhotos[publishedPhotos.length - 1]?.createdAt ?? new Date()), "MMM yyyy")}
                  </span>
                )}
              </div>

              {/* Stats row */}
              <div className="flex items-center gap-6 mb-6 flex-wrap">
                <div className="text-center">
                  <p className="text-2xl font-serif">{publishedPhotos.length}</p>
                  <p className="text-xs text-muted-foreground">Photos</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-serif">{totalLikes}</p>
                  <p className="text-xs text-muted-foreground">Likes</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div className="text-center">
                  <p className="text-2xl font-serif">{totalDownloads}</p>
                  <p className="text-xs text-muted-foreground">Downloads</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <button
                  onClick={() => setFollowModal("followers")}
                  className="text-center group hover:opacity-70 transition-opacity"
                >
                  <p className="text-2xl font-serif group-hover:underline underline-offset-4 decoration-muted-foreground/40">
                    {followerCount === null
                      ? <span className="text-sm text-muted-foreground">—</span>
                      : followerCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Followers</p>
                </button>
                <div className="w-px h-8 bg-border" />
                <button
                  onClick={() => setFollowModal("following")}
                  className="text-center group hover:opacity-70 transition-opacity"
                >
                  <p className="text-2xl font-serif group-hover:underline underline-offset-4 decoration-muted-foreground/40">
                    {followingCount === null
                      ? <span className="text-sm text-muted-foreground">—</span>
                      : followingCount}
                  </p>
                  <p className="text-xs text-muted-foreground">Following</p>
                </button>
                {isOwnProfile && draftPhotos.length > 0 && (
                  <>
                    <div className="w-px h-8 bg-border" />
                    <div className="text-center">
                      <p className="text-2xl font-serif text-amber-400">{draftPhotos.length}</p>
                      <p className="text-xs text-muted-foreground">Drafts</p>
                    </div>
                  </>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {!isOwnProfile && (
                  <>
                    {canFollow && (
                      <button
                        onClick={() => void toggle()}
                        disabled={toggling}
                        className={cn(
                          "inline-flex items-center gap-2 px-4 py-2 text-sm font-medium transition-all border disabled:opacity-50",
                          isFollowing
                            ? "border-border bg-muted text-foreground hover:border-destructive hover:text-destructive hover:bg-destructive/5"
                            : "border-foreground bg-foreground text-background hover:opacity-90"
                        )}
                      >
                        {toggling ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isFollowing ? (
                          <UserCheck className="w-3.5 h-3.5" />
                        ) : (
                          <UserPlus className="w-3.5 h-3.5" />
                        )}
                        {isFollowing ? "Following" : "Follow"}
                      </button>
                    )}
                    <Link
                      href={`/messages?to=${encodeURIComponent(displayName)}`}
                      className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      Message
                    </Link>
                  </>
                )}
                {isOwnProfile && (
                  <>
                    <Link
                      href="/settings"
                      className="inline-flex items-center gap-2 border border-border px-4 py-2 text-sm text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                    >
                      Edit Profile
                    </Link>
                    {!isVerified && (
                      <button
                        onClick={() => setShowVerify(true)}
                        className="inline-flex items-center gap-2 border border-blue-500/30 text-blue-400 px-4 py-2 text-sm hover:bg-blue-500/10 transition-colors"
                      >
                        <BadgeCheck className="w-3.5 h-3.5" />
                        Request Verification
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Verification modal */}
      {showVerify && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
          <div className="bg-card border border-border w-full max-w-md mx-4">
            <div className="border-b border-border px-6 py-4">
              <h3 className="font-serif text-xl flex items-center gap-2">
                <BadgeCheck className="w-5 h-5 text-blue-400" />
                Verification Request
              </h3>
            </div>
            <div className="p-6">
              {verifyStep === "form" && (
                <div className="space-y-5">
                  <p className="text-sm text-muted-foreground">
                    Verified photographers have an established online presence. Provide your details and we'll review within 5–7 days.
                  </p>
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Full Name</label>
                    <input
                      type="text"
                      value={verifyName}
                      onChange={(e) => setVerifyName(e.target.value)}
                      className="w-full bg-transparent border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors"
                      placeholder="As it appears on your work"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs uppercase tracking-widest text-muted-foreground">Portfolio / Social Links</label>
                    <textarea
                      rows={3}
                      value={verifyLinks}
                      onChange={(e) => setVerifyLinks(e.target.value)}
                      className="w-full bg-transparent border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
                      placeholder="Instagram, personal site, 500px…"
                    />
                  </div>
                  <div className="flex gap-3 pt-1">
                    <button
                      onClick={submitVerification}
                      disabled={!verifyName.trim()}
                      className="flex-1 bg-foreground text-background py-2.5 text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      Submit Request
                    </button>
                    <button
                      onClick={() => setShowVerify(false)}
                      className="px-5 py-2.5 text-sm border border-border text-muted-foreground hover:text-foreground hover:border-foreground transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
              {verifyStep === "pending" && (
                <div className="text-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Submitting…</p>
                </div>
              )}
              {verifyStep === "done" && (
                <div className="text-center py-8">
                  <BadgeCheck className="w-10 h-10 text-blue-400 mx-auto mb-4" />
                  <p className="font-serif text-xl mb-2">Request Submitted</p>
                  <p className="text-sm text-muted-foreground mb-6">
                    We'll review your profile and get back to you within 5–7 days.
                  </p>
                  <button
                    onClick={() => { setShowVerify(false); setVerifyStep("form"); }}
                    className="bg-foreground text-background px-6 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Done
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Body: photos + sidebar */}
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className={cn(
          "gap-12",
          relatedPhotographers.length > 0
            ? "lg:grid lg:grid-cols-[1fr_260px]"
            : ""
        )}>
          {/* ── Left: tags + tabs + grid ───────────────────────── */}
          <div className="min-w-0">
            {isOwnProfile && (
              <ProfileCompletion settings={settings} photoCount={publishedPhotos.length} />
            )}
            <AchievementBadges
              photoCount={publishedPhotos.length}
              totalLikes={totalLikes}
              totalDownloads={totalDownloads}
              totalViews={publishedPhotos.reduce((acc, p) => acc + p.views, 0)}
            />
            {myTags.length > 0 && (
              <div className="mb-10 flex flex-wrap gap-2">
                {myTags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${tag}`}
                    className="px-3 py-1 text-xs border border-border/50 bg-muted/20 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}

            {/* ── Public series strip ─────────────────────────── */}
            {profileSeries.length > 0 && (
              <div className="mb-10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium tracking-wide">Series</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{profileSeries.length} series</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {profileSeries.map((s) => (
                    <Link
                      key={s.id}
                      href={`/series/${s.id}`}
                      className="group block border border-border/50 bg-card hover:border-border transition-colors overflow-hidden"
                    >
                      {/* Cover image */}
                      <div className="aspect-[16/9] overflow-hidden bg-muted/30 relative">
                        {s.coverImageUrl ? (
                          <img
                            src={s.coverImageUrl}
                            alt={s.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <BookOpen className="w-8 h-8 text-muted-foreground/20" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute bottom-2 right-2 bg-black/60 text-white text-xs px-1.5 py-0.5 backdrop-blur-sm">
                          {s.photoCount ?? 0} photo{(s.photoCount ?? 0) !== 1 ? "s" : ""}
                        </div>
                      </div>
                      {/* Info */}
                      <div className="px-3 py-2.5">
                        <p className="font-serif text-sm leading-snug group-hover:text-foreground transition-colors">{s.name}</p>
                        {s.description && (
                          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                            {s.description}
                          </p>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setActiveTab("published")}
                  className={cn(
                    "px-4 py-2 text-sm font-medium transition-colors border-b-2",
                    activeTab === "published"
                      ? "text-foreground border-foreground"
                      : "text-muted-foreground border-transparent hover:text-foreground"
                  )}
                >
                  {isOwnProfile ? "Your Photos" : "Photos"}
                  {publishedPhotos.length > 0 && (
                    <span className="ml-2 text-xs text-muted-foreground">{publishedPhotos.length}</span>
                  )}
                </button>
                {isOwnProfile && draftPhotos.length > 0 && (
                  <button
                    onClick={() => setActiveTab("drafts")}
                    className={cn(
                      "px-4 py-2 text-sm font-medium transition-colors border-b-2",
                      activeTab === "drafts"
                        ? "text-foreground border-foreground"
                        : "text-muted-foreground border-transparent hover:text-foreground"
                    )}
                  >
                    Drafts
                    <span className="ml-2 text-xs text-amber-400">{draftPhotos.length}</span>
                  </button>
                )}
                {isOwnProfile && (
                  <button
                    onClick={() => setActiveTab("series")}
                    className={cn(
                      "px-4 py-2 text-sm font-medium transition-colors border-b-2 flex items-center gap-1.5",
                      activeTab === "series"
                        ? "text-foreground border-foreground"
                        : "text-muted-foreground border-transparent hover:text-foreground"
                    )}
                  >
                    <BookOpen className="w-3.5 h-3.5" />
                    Series
                  </button>
                )}
              </div>
              {isOwnProfile && (
                <Link
                  href="/upload"
                  className="bg-foreground text-background px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
                >
                  + Upload
                </Link>
              )}
            </div>

            {activeTab === "series" ? (
              <SeriesManagerTab
                photographerName={displayName}
                myPhotos={publishedPhotos}
              />
            ) : loadingPhotos ? (
              <div className="masonry-grid">
                {Array(8).fill(0).map((_, i) => (
                  <div key={i} className="masonry-item">
                    <Skeleton className="w-full h-[280px]" />
                  </div>
                ))}
              </div>
            ) : displayedPhotos.length === 0 ? (
              <div className="py-24 text-center border border-dashed border-border">
                <Camera className="w-8 h-8 mx-auto mb-3 opacity-20" />
                <p className="text-muted-foreground text-sm">
                  {activeTab === "drafts"
                    ? "No drafts."
                    : isOwnProfile
                    ? "No photos yet."
                    : `No photos by ${displayName}.`}
                </p>
                {isOwnProfile && activeTab === "published" && (
                  <Link
                    href="/upload"
                    className="mt-4 inline-block text-sm underline underline-offset-4 hover:text-foreground transition-colors text-muted-foreground"
                  >
                    Upload your first photo
                  </Link>
                )}
              </div>
            ) : (
              <div className="masonry-grid">
                {displayedPhotos.map((photo, i) => (
                  <div key={photo.id} className="masonry-item relative">
                    {photo.status === "draft" && (
                      <div className="absolute top-2 left-2 z-10 bg-amber-500/90 text-black text-xs font-semibold px-2 py-0.5 pointer-events-none">
                        DRAFT
                      </div>
                    )}
                    <PhotoCard photo={photo} priority={i < 3} onOpen={openLightbox} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── Right: related photographers sidebar ────────────── */}
          {relatedPhotographers.length > 0 && (
            <aside className="mt-16 lg:mt-0">
              <div className="lg:sticky lg:top-8">
                <div className="flex items-center gap-2 mb-5 pb-4 border-b border-border/50">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <h2 className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                    Similar Photographers
                  </h2>
                </div>

                <div className="space-y-1">
                  {relatedPhotographers.map((p) => (
                    <RelatedCard key={p.name} photographer={p} myName={myName} />
                  ))}
                </div>

                {myTags.length > 0 && (
                  <div className="mt-6 pt-5 border-t border-border/40">
                    <p className="text-xs text-muted-foreground/60 mb-3">Shared styles</p>
                    <div className="flex flex-wrap gap-1.5">
                      {myTags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/tags/${tag}`}
                          className="text-xs px-2 py-0.5 border border-border/40 text-muted-foreground/70 hover:text-foreground hover:border-border transition-colors"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </aside>
          )}
        </div>
      </div>

      {lightboxIndex !== null && displayedPhotos.length > 0 && (
        <Lightbox
          photos={displayedPhotos}
          initialIndex={lightboxIndex}
          onClose={() => setLightboxIndex(null)}
        />
      )}

      {followModal !== null && viewingName && (
        <FollowListModal
          subjectName={viewingName}
          mode={followModal}
          myName={myName ?? ""}
          onClose={() => setFollowModal(null)}
        />
      )}
    </Layout>
  );
}
