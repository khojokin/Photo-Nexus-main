import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { useListPhotos } from "@workspace/api-client-react";
import type { Photo } from "@workspace/api-client-react";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import {
  Heart, Download, Eye, Users, Image, Camera, MessageSquare,
  ExternalLink, Instagram, Twitter, Globe, Mail, Star,
  Award, Briefcase, ChevronRight,
} from "lucide-react";

interface FollowStats { followerCount: number; followingCount: number; isFollowing?: boolean }
interface ProfileData {
  bio?: string; website?: string; instagram?: string; twitter?: string;
  country?: string; specialties?: string; isVerified?: boolean;
}

function Sparkline({ values, color = "currentColor" }: { values: number[]; color?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const w = 80; const h = 24;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="opacity-60">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

export function PhotographerPortfolio() {
  const params = useParams<{ username: string }>();
  const username = params.username ?? "";
  const { user } = useAuth();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [followStats, setFollowStats] = useState<FollowStats>({ followerCount: 0, followingCount: 0 });
  const [following, setFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [hireOpen, setHireOpen] = useState(false);
  const [hireMsg, setHireMsg] = useState("");
  const [hireSent, setHireSent] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"all" | "popular" | "recent">("all");

  const { data } = useListPhotos({ photographer: username, limit: 100 });
  const allPhotos = data?.photos ?? [];

  const photos = activeFilter === "popular"
    ? [...allPhotos].sort((a, b) => (b.likes + b.downloads) - (a.likes + a.downloads))
    : activeFilter === "recent"
    ? [...allPhotos].sort((a, b) => new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime())
    : allPhotos;

  const totalLikes = allPhotos.reduce((s, p) => s + (p.likes ?? 0), 0);
  const totalDownloads = allPhotos.reduce((s, p) => s + (p.downloads ?? 0), 0);
  const totalViews = allPhotos.reduce((s, p) => s + (p.views ?? 0), 0);

  useEffect(() => {
    if (!username) return;
    fetch(`/api/photographers/${encodeURIComponent(username)}/follow-stats`)
      .then(r => r.json())
      .then((d: FollowStats) => {
        setFollowStats(d);
        setFollowing(d.isFollowing ?? false);
      })
      .catch(() => {});

    fetch(`/api/userprofile/${encodeURIComponent(username)}`)
      .then(r => r.json())
      .then((d: ProfileData) => setProfile(d))
      .catch(() => {});
  }, [username]);

  async function toggleFollow() {
    if (!user) { window.location.href = "/signin"; return; }
    setFollowLoading(true);
    const method = following ? "DELETE" : "POST";
    await fetch(`/api/follows/${encodeURIComponent(username)}`, { method, credentials: "include" });
    setFollowing(prev => !prev);
    setFollowStats(prev => ({ ...prev, followerCount: prev.followerCount + (following ? -1 : 1) }));
    setFollowLoading(false);
  }

  async function sendHire() {
    if (!hireMsg.trim()) return;
    setHireSent(true);
    setHireOpen(false);
  }

  const avatarInitial = username.charAt(0).toUpperCase();

  return (
    <Layout>
      {/* Hire modal */}
      {hireOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-background border border-border p-6 w-full max-w-md space-y-4">
            <h2 className="font-medium">Commission {username}</h2>
            <p className="text-xs text-muted-foreground">Describe your project and budget. The photographer will be notified.</p>
            <textarea value={hireMsg} onChange={e => setHireMsg(e.target.value)} rows={5}
              placeholder="Hi, I'm working on a commercial campaign and looking for…"
              className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground resize-none" />
            <div className="flex gap-3">
              <button onClick={() => void sendHire()}
                className="flex-1 py-2 bg-foreground text-background text-sm hover:opacity-90 transition-opacity">
                Send Request
              </button>
              <button onClick={() => setHireOpen(false)}
                className="px-4 py-2 border border-border text-sm hover:border-foreground/50 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero */}
        <div className="border border-border bg-card p-8 mb-10">
          <div className="flex items-start gap-6 flex-wrap">
            <div className="w-20 h-20 bg-muted flex-shrink-0 flex items-center justify-center text-2xl font-serif border border-border">
              {avatarInitial}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h1 className="font-serif text-3xl">{username}</h1>
                {profile?.isVerified && (
                  <Star className="w-4 h-4 text-amber-400 fill-current flex-shrink-0" />
                )}
              </div>
              {profile?.specialties && (
                <p className="text-sm text-muted-foreground mb-2">{profile.specialties}</p>
              )}
              {profile?.bio && (
                <p className="text-sm text-muted-foreground max-w-xl leading-relaxed mb-3">{profile.bio}</p>
              )}
              {profile?.country && (
                <p className="text-xs text-muted-foreground mb-3">{profile.country}</p>
              )}
              {/* Social links */}
              <div className="flex items-center gap-3 flex-wrap">
                {profile?.website && (
                  <a href={profile.website} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Globe className="w-3 h-3" /> Website
                  </a>
                )}
                {profile?.instagram && (
                  <a href={`https://instagram.com/${profile.instagram}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Instagram className="w-3 h-3" /> @{profile.instagram}
                  </a>
                )}
                {profile?.twitter && (
                  <a href={`https://x.com/${profile.twitter}`} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors">
                    <Twitter className="w-3 h-3" /> @{profile.twitter}
                  </a>
                )}
              </div>
            </div>
            {/* Actions */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              <button onClick={() => void toggleFollow()} disabled={followLoading}
                className={cn("px-5 py-2 text-sm transition-colors",
                  following
                    ? "border border-border text-muted-foreground hover:border-destructive/50 hover:text-destructive"
                    : "bg-foreground text-background hover:opacity-90"
                )}>
                {following ? "Following" : "Follow"}
              </button>
              <button onClick={() => setHireOpen(true)}
                className="px-5 py-2 border border-border text-sm hover:border-foreground/50 transition-colors flex items-center gap-2 justify-center">
                <Briefcase className="w-3.5 h-3.5" /> Hire Me
              </button>
              {hireSent && <p className="text-xs text-green-400 text-center">Request sent!</p>}
            </div>
          </div>

          {/* Stats bar */}
          <div className="mt-8 pt-6 border-t border-border grid grid-cols-2 sm:grid-cols-5 gap-4">
            {[
              { label: "Photos", value: allPhotos.length, icon: Camera },
              { label: "Followers", value: followStats.followerCount, icon: Users },
              { label: "Following", value: followStats.followingCount, icon: Users },
              { label: "Likes", value: totalLikes.toLocaleString(), icon: Heart },
              { label: "Downloads", value: totalDownloads.toLocaleString(), icon: Download },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="text-center">
                <p className="text-xl font-serif">{value}</p>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Filter + gallery */}
        <div className="mb-6 flex items-center justify-between gap-4 flex-wrap">
          <div className="flex gap-1">
            {(["all", "popular", "recent"] as const).map(f => (
              <button key={f} onClick={() => setActiveFilter(f)}
                className={cn("px-3 py-1.5 text-xs border transition-colors capitalize",
                  activeFilter === f ? "border-foreground text-foreground bg-foreground/5" : "border-border text-muted-foreground hover:text-foreground")}>
                {f}
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">{photos.length} photos</p>
        </div>

        {photos.length === 0 ? (
          <div className="border border-border bg-card p-16 text-center">
            <Camera className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-muted-foreground text-sm">No published photos yet.</p>
          </div>
        ) : (
          <div className="columns-2 sm:columns-3 md:columns-4 gap-3 space-y-3">
            {photos.map(photo => (
              <Link key={photo.id} href={`/photos/${photo.id}`}
                className="group block overflow-hidden border border-border bg-muted break-inside-avoid mb-3 relative">
                <img
                  src={photo.imageUrl}
                  alt={photo.title}
                  className="w-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all duration-200">
                  <p className="text-white text-xs font-medium truncate">{photo.title}</p>
                  <div className="flex items-center gap-2 mt-1 text-white/80 text-[10px]">
                    <span className="flex items-center gap-0.5"><Heart className="w-2.5 h-2.5" />{photo.likes}</span>
                    <span className="flex items-center gap-0.5"><Download className="w-2.5 h-2.5" />{photo.downloads}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
