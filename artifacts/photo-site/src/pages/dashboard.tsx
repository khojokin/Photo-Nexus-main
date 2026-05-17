import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import {
  useGetSiteSummary, useGetTrendingPhotos, useListPhotos, useListTags,
} from "@workspace/api-client-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { useSubscription } from "@/hooks/use-subscription";
import { useAuth } from "@/contexts/auth-context";
import { usePremiumGate } from "@/hooks/use-premium-gate";
import { PremiumGateModal } from "@/components/premium-gate-modal";
import { cn } from "@/lib/utils";
import {
  Heart, Download, Camera, LayoutGrid, TrendingUp, Tag, Clock, Award,
  LayoutDashboard, DollarSign, Image, BarChart3, Crown,
  Printer, MessageSquare, Coffee, FileText, CreditCard,
  Check, Info, ArrowUp, Users, Zap, Star, Eye, Upload,
} from "lucide-react";
import { format } from "date-fns";
import type { Photo } from "@workspace/api-client-react";

// ─── Types ────────────────────────────────────────────────────────────────────
type DashTab = "overview" | "analytics" | "monetise" | "photos";
type MonetiseTab = "revenue" | "prints" | "commissions" | "tips" | "licensing" | "payouts";

interface LivePayoutTransaction {
  id: number;
  type: string;
  description: string;
  amount: string;
  requestedAt: string;
  status: string;
}

const DEFAULT_PRINT_SIZES = [
  { id: "a5",   label: "A5",         dims: "148 × 210 mm", enabled: true,  price: "12" },
  { id: "a4",   label: "A4",         dims: "210 × 297 mm", enabled: true,  price: "18" },
  { id: "a3",   label: "A3",         dims: "297 × 420 mm", enabled: true,  price: "28" },
  { id: "a2",   label: "A2",         dims: "420 × 594 mm", enabled: false, price: "45" },
  { id: "a1",   label: "A1",         dims: "594 × 841 mm", enabled: false, price: "70" },
  { id: "sq30", label: "Square 30cm",dims: "300 × 300 mm", enabled: true,  price: "22" },
];
const DEFAULT_COMMISSIONS: Array<{ id: number; from: string; subject: string; budget: string; date: string; status: "pending" | "accepted" | "declined" }> = [];
const LICENSE_TIERS = [
  {
    id: "free",       label: "Free (CC0)",   price: "Free",
    desc: "Anyone can use your photos with no restrictions or attribution required.",
    features: ["No revenue", "Maximum reach", "Public domain"],
  },
  {
    id: "editorial",  label: "Editorial",    price: "From $25",
    desc: "Permitted for news, education, and editorial use.",
    features: ["News & editorial use", "Attribution required", "No commercial ads"],
  },
  {
    id: "commercial", label: "Commercial",   price: "From $120",
    desc: "Full commercial rights for advertising, products, and branded content.",
    features: ["All commercial uses", "Exclusive license option", "You set the price"],
    highlighted: true,
  },
];

// ─── Shared sub-components ────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: string | number | undefined; sub?: string; accent?: boolean;
}) {
  return (
    <div className={cn("border p-6 space-y-3", accent ? "border-foreground/30 bg-foreground/5" : "border-border bg-card")}>
      <div className="flex items-center justify-between">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      {value === undefined ? (
        <Skeleton className="h-9 w-24" />
      ) : (
        <p className="text-3xl font-serif">{typeof value === "number" ? value.toLocaleString() : value}</p>
      )}
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function MonStatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub?: string; icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className={cn("border p-5 space-y-3", accent ? "border-foreground/30 bg-foreground/5" : "border-border bg-card")}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="text-2xl font-serif">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ─── Overview Tab ─────────────────────────────────────────────────────────────
function OverviewTab({ user, summary, trending, payoutStats }: {
  user: { firstName?: string | null } | null;
  summary: { totalPhotos: number; totalLikes: number; totalDownloads: number; totalCollections: number } | undefined;
  trending: Photo[] | undefined;
  payoutStats: { thisMonth: number; pendingPayout: number; totalEarned: number };
}) {
  const firstName = user?.firstName ?? "there";
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  const QUICK_ACTIONS = [
    { href: "/upload",      icon: Upload,       label: "Upload Photo",   desc: "Add to your portfolio" },
    { href: "/monetise",    icon: Zap,          label: "Monetise",       desc: "Earnings & payouts" },
    { href: "/collections", icon: LayoutGrid,   label: "Collections",    desc: "Browse curated sets" },
    { href: "/photos",      icon: Camera,       label: "Explore",        desc: "Discover new work" },
  ];

  return (
    <div className="space-y-10">
      {/* Greeting */}
      <div className="border border-border bg-card p-8">
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">{greeting}</p>
        <h2 className="text-3xl font-serif mb-1">{firstName}.</h2>
        <p className="text-sm text-muted-foreground">Here's what's happening across the platform today.</p>
      </div>

      {/* Platform stats */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Platform at a Glance</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Camera}      label="Photographs"   value={summary?.totalPhotos}      sub="Total published" />
          <StatCard icon={LayoutGrid}  label="Collections"   value={summary?.totalCollections} sub="Curated sets" />
          <StatCard icon={Heart}       label="Appreciations" value={summary?.totalLikes}        sub="Total likes" />
          <StatCard icon={Download}    label="Downloads"     value={summary?.totalDownloads}    sub="Total downloads" />
        </div>
      </div>

      {/* Quick actions */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Quick Actions</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {QUICK_ACTIONS.map((a) => (
            <Link key={a.href} href={a.href} className="border border-border bg-card p-5 hover:border-foreground/40 transition-colors group">
              <a.icon className="w-5 h-5 text-muted-foreground mb-3 group-hover:text-foreground transition-colors" />
              <p className="text-sm font-medium mb-0.5">{a.label}</p>
              <p className="text-xs text-muted-foreground">{a.desc}</p>
            </Link>
          ))}
        </div>
      </div>

      {/* Trending right now */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Trending Right Now</h3>
          <Link href="/photos" className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all →</Link>
        </div>
        <div className="border border-border bg-card divide-y divide-border">
          {!trending
            ? Array(5).fill(0).map((_, i) => (
              <div key={i} className="flex items-center gap-4 px-5 py-3">
                <Skeleton className="w-12 h-9 flex-shrink-0" />
                <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-48" /><Skeleton className="h-3 w-24" /></div>
              </div>
            ))
            : (Array.isArray(trending) ? trending : []).slice(0, 6).map((photo, i) => (
              <Link key={photo.id} href={`/photos/${photo.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors group">
                <span className="w-5 text-center text-xs font-mono text-muted-foreground flex-shrink-0">{i + 1}</span>
                <div className="w-12 h-9 bg-muted overflow-hidden flex-shrink-0">
                  <img src={photo.imageUrl} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{photo.title}</p>
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

      {/* Revenue snapshot */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xs uppercase tracking-widest text-muted-foreground">Revenue Snapshot</h3>
          <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">View full →</button>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <MonStatCard label="This Month"      value={`$${payoutStats.thisMonth.toFixed(2)}`}       icon={TrendingUp} accent />
          <MonStatCard label="Pending Payout"  value={`$${payoutStats.pendingPayout.toFixed(2)}`}   icon={CreditCard} />
          <MonStatCard label="Total Earned"    value={`$${payoutStats.totalEarned.toFixed(2)}`}      icon={DollarSign} />
        </div>
      </div>
    </div>
  );
}

// ─── Analytics Tab ────────────────────────────────────────────────────────────
interface MyAnalytics {
  totals: { views: number; likes: number; downloads: number; photos: number };
  photos: Array<{ id: number; title: string; image_url: string; views: number; likes: number; downloads: number; created_at: string }>;
  daily: Array<{ label: string; date: string; views: number; likes: number; downloads: number }>;
}

function Sparkline({ values, color = "currentColor" }: { values: number[]; color?: string }) {
  if (values.length < 2) return <span className="text-[10px] text-muted-foreground/40">—</span>;
  const max = Math.max(...values, 1);
  const w = 64; const h = 20;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * w},${h - (v / max) * h}`).join(" ");
  return (
    <svg width={w} height={h} className="inline-block opacity-70">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function AnalyticsTab({ summary, trending, latest, tags }: {
  summary: { totalPhotos: number; totalLikes: number; totalDownloads: number; totalCollections: number } | undefined;
  trending: Photo[] | undefined;
  latest: { photos: Photo[] } | undefined;
  tags: Array<{ name: string; photoCount: number }> | undefined;
}) {
  const [myStats, setMyStats] = useState<MyAnalytics | null>(null);
  const [myLoading, setMyLoading] = useState(true);

  useEffect(() => {
    fetch("/api/analytics/my", { credentials: "include" })
      .then(r => r.json())
      .then((d: MyAnalytics) => setMyStats(d))
      .catch(() => {})
      .finally(() => setMyLoading(false));
  }, []);

  const popular = trending ?? [];

  const topPhotographers = (() => {
    const map = new Map<string, { name: string; likes: number; downloads: number; count: number }>();
    for (const p of popular) {
      const ex = map.get(p.photographerName);
      if (ex) { ex.likes += p.likes; ex.downloads += p.downloads; ex.count++; }
      else map.set(p.photographerName, { name: p.photographerName, likes: p.likes, downloads: p.downloads, count: 1 });
    }
    return Array.from(map.values()).sort((a, b) => (b.likes + b.downloads) - (a.likes + a.downloads)).slice(0, 5);
  })();

  const maxTagCount = Array.isArray(tags) && tags.length > 0 ? tags[0].photoCount : 1;

  return (
    <div className="space-y-10">
      {/* ── My Portfolio Stats ── */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
          <BarChart3 className="w-3.5 h-3.5" /> My Portfolio Analytics
        </h3>
        {myLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array(4).fill(0).map((_, i) => <div key={i} className="border border-border bg-card p-6 h-24 animate-pulse" />)}
          </div>
        ) : !myStats || (myStats.totals.photos === 0) ? (
          <div className="border border-border bg-card p-6 text-sm text-muted-foreground">
            No photos published under your account yet.{" "}
            <a href="/upload" className="underline hover:text-foreground transition-colors">Upload your first photo</a>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "My Photos", value: myStats.totals.photos, key: "views" as const },
                { label: "Total Views", value: myStats.totals.views, key: "views" as const },
                { label: "Total Likes", value: myStats.totals.likes, key: "likes" as const },
                { label: "Total Downloads", value: myStats.totals.downloads, key: "downloads" as const },
              ].map(({ label, value }) => (
                <div key={label} className="border border-border bg-card p-5 space-y-2">
                  <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
                  <p className="text-3xl font-serif">{value.toLocaleString()}</p>
                  {myStats.daily.length > 1 && (
                    <Sparkline values={myStats.daily.map(d => label.includes("Views") ? d.views : label.includes("Likes") ? d.likes : label.includes("Downloads") ? d.downloads : 0)} />
                  )}
                </div>
              ))}
            </div>

            {/* Top performing photos */}
            {myStats.photos.length > 0 && (
              <div className="border border-border bg-card">
                <div className="border-b border-border px-5 py-3 flex items-center gap-2">
                  <Star className="w-4 h-4 text-muted-foreground" />
                  <h3 className="text-sm font-medium">Top Performing Photos</h3>
                </div>
                <div className="divide-y divide-border">
                  {myStats.photos.slice(0, 8).map((photo, i) => (
                    <a key={photo.id} href={`/photos/${photo.id}`}
                      className="flex items-center gap-4 px-5 py-3 hover:bg-muted/30 transition-colors group">
                      <span className="w-5 text-center text-xs font-mono text-muted-foreground flex-shrink-0">{i + 1}</span>
                      <div className="w-12 h-9 bg-muted overflow-hidden flex-shrink-0">
                        <img src={photo.image_url} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{photo.title}</p>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground flex-shrink-0">
                        <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{photo.views}</span>
                        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{photo.likes}</span>
                        <span className="flex items-center gap-1"><Download className="w-3 h-3" />{photo.downloads}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Headline stats */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Platform Metrics</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard icon={Camera}     label="Photographs"   value={summary?.totalPhotos}      sub="Total published" />
          <StatCard icon={LayoutGrid} label="Collections"   value={summary?.totalCollections} sub="Curated sets" />
          <StatCard icon={Heart}      label="Appreciations" value={summary?.totalLikes}        sub="Total likes given" />
          <StatCard icon={Download}   label="Downloads"     value={summary?.totalDownloads}    sub="Total downloads" />
        </div>
      </div>

      {/* Engagement metrics */}
      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Engagement</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Avg. Likes / Photo</p>
            <p className="text-3xl font-serif">
              {summary ? Math.round(summary.totalLikes / Math.max(summary.totalPhotos, 1)) : <Skeleton className="h-9 w-16 inline-block" />}
            </p>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><ArrowUp className="w-3 h-3 text-green-400" />12% vs last month</p>
          </div>
          <div className="border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Avg. Downloads / Photo</p>
            <p className="text-3xl font-serif">
              {summary ? Math.round(summary.totalDownloads / Math.max(summary.totalPhotos, 1)) : <Skeleton className="h-9 w-16 inline-block" />}
            </p>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><ArrowUp className="w-3 h-3 text-green-400" />8% vs last month</p>
          </div>
          <div className="border border-border bg-card p-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Photos / Collection</p>
            <p className="text-3xl font-serif">
              {summary ? Math.round(summary.totalPhotos / Math.max(summary.totalCollections, 1)) : <Skeleton className="h-9 w-16 inline-block" />}
            </p>
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1"><ArrowUp className="w-3 h-3 text-green-400" />Avg. collection size</p>
          </div>
        </div>
      </div>

      {/* Trending + Photographers + Tags */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 border border-border bg-card">
          <div className="border-b border-border px-6 py-4 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-muted-foreground" />
            <h2 className="font-serif text-lg">Trending Photos</h2>
          </div>
          <div className="divide-y divide-border">
            {!trending
              ? Array(8).fill(0).map((_, i) => (
                <div key={i} className="flex items-center gap-4 px-6 py-3">
                  <Skeleton className="w-12 h-9 flex-shrink-0" />
                  <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-48" /><Skeleton className="h-3 w-24" /></div>
                </div>
              ))
              : (Array.isArray(trending) ? trending : []).slice(0, 10).map((photo, i) => (
                <Link key={photo.id} href={`/photos/${photo.id}`} className="flex items-center gap-4 px-6 py-3 hover:bg-muted/30 transition-colors group">
                  <span className="w-5 text-center text-xs font-mono text-muted-foreground flex-shrink-0">{i + 1}</span>
                  <div className="w-14 h-10 bg-muted overflow-hidden flex-shrink-0">
                    <img src={photo.imageUrl} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{photo.title}</p>
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

        <div className="space-y-6">
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
                      <div className="h-full bg-foreground/40 group-hover:bg-foreground/70 transition-colors" style={{ width: `${(tag.photoCount / maxTagCount) * 100}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground w-4 text-right">{tag.photoCount}</span>
                  </Link>
                ))
              }
            </div>
          </div>
        </div>
      </div>

      {/* Recently published */}
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
                <div className="flex-1 space-y-1.5"><Skeleton className="h-3.5 w-48" /><Skeleton className="h-3 w-32" /></div>
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
  );
}

// ─── Monetise Tab ─────────────────────────────────────────────────────────────
function MonetiseTab({ isAdmin, transactions }: { isAdmin: boolean; transactions: LivePayoutTransaction[] }) {
  const [tab, setTab] = useState<MonetiseTab>("revenue");
  const [printSizes, setPrintSizes] = useState(DEFAULT_PRINT_SIZES);
  const [commissions, setCommissions] = useState(DEFAULT_COMMISSIONS);
  const [commOpen, setCommOpen] = useState(false);
  const [tipEnabled, setTipEnabled] = useState(true);
  const [licenseSelected, setLicenseSelected] = useState("commercial");
  const [tipCustom, setTipCustom] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("bank");
  const totalEarned = transactions.filter((t) => t.status === "paid").reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
  const thisMonth = transactions
    .filter((t) => t.status === "paid" && new Date(t.requestedAt).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
  const pendingPayout = transactions
    .filter((t) => t.status === "pending" || t.status === "approved")
    .reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
  const printRevenue = transactions.filter((t) => t.type === "print").reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
  const licenseRevenue = transactions.filter((t) => t.type === "license").reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);
  const tipRevenue = transactions.filter((t) => t.type === "tip").reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0);

  const MONETISE_TABS: { id: MonetiseTab; label: string; icon: React.ElementType }[] = [
    { id: "revenue",     label: "Revenue",     icon: TrendingUp },
    { id: "prints",      label: "Prints",       icon: Printer },
    { id: "commissions", label: "Commissions",  icon: MessageSquare },
    { id: "tips",        label: "Tips",          icon: Coffee },
    { id: "licensing",   label: "Licensing",    icon: FileText },
    { id: "payouts",     label: "Payouts",      icon: CreditCard },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h2 className="font-serif text-2xl">Monetise Your Work</h2>
          </div>
          <p className="text-sm text-muted-foreground">Turn your craft into income — prints, commissions, licensing, and payouts.</p>
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-0 border-b border-border overflow-x-auto">
        {MONETISE_TABS.map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors",
                tab === t.id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              <Icon className="w-3.5 h-3.5" />{t.label}
            </button>
          );
        })}
      </div>

      {/* ── Revenue ── */}
      {tab === "revenue" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <MonStatCard label="Total Earned"    value={`$${totalEarned.toFixed(2)}`}     icon={DollarSign} accent />
            <MonStatCard label="This Month"      value={`$${thisMonth.toFixed(2)}`}        icon={TrendingUp} />
            <MonStatCard label="Pending Payout"  value={`$${pendingPayout.toFixed(2)}`}   icon={CreditCard} />
            <MonStatCard label="Print Sales"     value={`$${printRevenue.toFixed(2)}`}           icon={Printer} />
            <MonStatCard label="License Revenue" value={`$${licenseRevenue.toFixed(2)}`}         icon={FileText} />
            <MonStatCard label="Tips Received"   value={`$${tipRevenue.toFixed(2)}`}             icon={Coffee} />
          </div>
          <div className="border border-border bg-card">
            <div className="px-5 py-4 border-b border-border flex items-center justify-between">
              <h3 className="text-sm font-medium">Recent Transactions</h3>
              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors">View all</button>
            </div>
            <div className="divide-y divide-border">
              {transactions.slice(0, 8).map((tx) => (
                <div key={tx.id} className="px-5 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm truncate">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.requestedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })} · {tx.type}</p>
                  </div>
                  <span className="text-sm font-medium text-green-400 flex-shrink-0">+${parseFloat(tx.amount || "0").toFixed(2)}</span>
                </div>
              ))}
              {transactions.length === 0 && <div className="px-5 py-4 text-sm text-muted-foreground">No live transactions yet.</div>}
            </div>
          </div>
          <div className="border border-border/40 bg-muted/20 p-5 flex items-start gap-3">
            <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium mb-1">Next payout: May 15, 2026</p>
              <p className="text-xs text-muted-foreground">Affuaa processes payouts on the 15th of each month. Minimum payout threshold is $20.00.</p>
            </div>
          </div>
        </div>
      )}

      {/* ── Prints ── */}
      {tab === "prints" && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">Enable print sizes for your photos. Buyers can order physical prints through our print-on-demand partner. You earn 30% of each sale.</p>
          <div className="divide-y divide-border border border-border">
            {printSizes.map((size) => (
              <div key={size.id} className="flex items-center justify-between px-5 py-4">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 border border-border bg-card flex items-center justify-center text-xs font-medium">{size.label}</div>
                  <div>
                    <p className="text-sm">{size.label}</p>
                    <p className="text-xs text-muted-foreground">{size.dims}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground text-sm">$</span>
                    <input
                      type="number"
                      value={size.price}
                      onChange={(e) => setPrintSizes((prev) => prev.map((s) => s.id === size.id ? { ...s, price: e.target.value } : s))}
                      className="w-16 bg-transparent border border-border px-2 py-1 text-sm text-right focus:outline-none focus:border-foreground"
                    />
                  </div>
                  <button
                    onClick={() => setPrintSizes((prev) => prev.map((s) => s.id === size.id ? { ...s, enabled: !s.enabled } : s))}
                    className={cn(
                      "text-xs px-3 py-1.5 border transition-colors",
                      size.enabled ? "border-green-500/40 text-green-400 bg-green-500/10" : "border-border text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {size.enabled ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>
            ))}
          </div>
          <button className="px-5 py-2.5 bg-foreground text-background text-sm hover:opacity-90 transition-opacity">Save Print Settings</button>
        </div>
      )}

      {/* ── Commissions ── */}
      {tab === "commissions" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-serif">Commission Requests</h3>
              <p className="text-sm text-muted-foreground mt-1">{commissions.filter((c) => c.status === "pending").length} pending request{commissions.filter((c) => c.status === "pending").length !== 1 ? "s" : ""}</p>
            </div>
            <button
              onClick={() => setCommOpen((o) => !o)}
              className={cn("flex items-center gap-1.5 text-xs px-3 py-2 border transition-colors",
                commOpen ? "border-green-500/40 text-green-400" : "border-border text-muted-foreground hover:text-foreground")}
            >
              {commOpen ? <Check className="w-3 h-3" /> : <MessageSquare className="w-3 h-3" />}
              {commOpen ? "Accepting commissions" : "Commissions closed"}
            </button>
          </div>
          <div className="space-y-3">
            {commissions.map((req) => (
              <div key={req.id} className="border border-border p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <p className="font-medium text-sm">{req.subject}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{req.from} · {req.date} · Budget: {req.budget}</p>
                  </div>
                  <span className={cn("text-xs px-2 py-0.5 border flex-shrink-0",
                    req.status === "pending" ? "border-amber-500/30 text-amber-400" :
                    req.status === "accepted" ? "border-green-500/30 text-green-400" : "border-border text-muted-foreground")}>
                    {req.status}
                  </span>
                </div>
                {req.status === "pending" && (
                  <div className="flex gap-2">
                    <button onClick={() => setCommissions((prev) => prev.map((c) => c.id === req.id ? { ...c, status: "accepted" } : c))}
                      className="px-3 py-1.5 text-xs border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors">Accept</button>
                    <button onClick={() => setCommissions((prev) => prev.map((c) => c.id === req.id ? { ...c, status: "declined" } : c))}
                      className="px-3 py-1.5 text-xs border border-border text-muted-foreground hover:text-foreground transition-colors">Decline</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Tips ── */}
      {tab === "tips" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-serif">Tips & Support</h3>
              <p className="text-sm text-muted-foreground mt-1">Allow visitors to send you a tip as appreciation for your work.</p>
            </div>
            <button
              onClick={() => setTipEnabled((v) => !v)}
              className={cn("text-xs px-3 py-2 border transition-colors",
                tipEnabled ? "border-green-500/40 text-green-400 bg-green-500/10" : "border-border text-muted-foreground hover:text-foreground")}>
              {tipEnabled ? "Tips enabled" : "Tips disabled"}
            </button>
          </div>
          <div className="border border-border bg-card p-6">
            <h4 className="text-sm font-medium mb-4">Preset Amounts</h4>
            <div className="flex gap-3 flex-wrap mb-4">
              {["$3", "$5", "$10", "$25"].map((a) => (
                <div key={a} className="px-4 py-2 border border-border text-sm">{a}</div>
              ))}
              <div className="flex items-center gap-2">
                <span className="text-muted-foreground text-sm">Custom: $</span>
                <input type="number" value={tipCustom} onChange={(e) => setTipCustom(e.target.value)} placeholder="amount"
                  className="w-20 bg-transparent border border-border px-2 py-1.5 text-sm focus:outline-none focus:border-foreground" />
              </div>
            </div>
            <button className="px-4 py-2 bg-foreground text-background text-sm hover:opacity-90 transition-opacity">Save Tip Settings</button>
          </div>
          <div className="border border-border bg-card divide-y divide-border">
            <div className="px-5 py-4"><h4 className="text-sm font-medium">Recent Tips</h4></div>
            {transactions.filter((t) => t.type === "tip").map((t) => (
              <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                <div><p className="text-sm">{t.description}</p><p className="text-xs text-muted-foreground">{new Date(t.requestedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p></div>
                <span className="text-sm font-medium text-green-400">+${parseFloat(t.amount || "0").toFixed(2)}</span>
              </div>
            ))}
            {transactions.filter((t) => t.type === "tip").length === 0 && <div className="px-5 py-4 text-sm text-muted-foreground">No live tips yet.</div>}
          </div>
        </div>
      )}

      {/* ── Licensing ── */}
      {tab === "licensing" && (
        <div className="space-y-6">
          <p className="text-sm text-muted-foreground">Choose how your photos can be used. You can set different licenses per photo from the photo detail page.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {LICENSE_TIERS.map((tier) => (
              <div
                key={tier.id}
                onClick={() => setLicenseSelected(tier.id)}
                className={cn("border p-5 cursor-pointer transition-colors",
                  licenseSelected === tier.id ? "border-foreground/60 bg-foreground/5" : "border-border hover:border-border/80")}
              >
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm">{tier.label}</h4>
                  {licenseSelected === tier.id && <Check className="w-4 h-4 text-green-400" />}
                </div>
                <p className="text-xl font-serif mb-3">{tier.price}</p>
                <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{tier.desc}</p>
                <ul className="space-y-1.5">
                  {tier.features.map((f) => (
                    <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground"><Check className="w-3 h-3" /> {f}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <button className="px-5 py-2.5 bg-foreground text-background text-sm hover:opacity-90 transition-opacity">Apply Default License</button>
        </div>
      )}

      {/* ── Payouts ── */}
      {tab === "payouts" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <MonStatCard label="Available Balance"  value="$94.50"  icon={DollarSign} accent />
            <MonStatCard label="Lifetime Paid Out"  value="$429.50" icon={CreditCard} />
          </div>
          <div className="border border-border bg-card p-6">
            <h4 className="text-sm font-medium mb-5">Payout Method</h4>
            <div className="flex gap-3 mb-5">
              {["bank", "paypal", "stripe"].map((m) => (
                <button key={m} onClick={() => setPayoutMethod(m)}
                  className={cn("px-4 py-2 text-sm border transition-colors capitalize",
                    payoutMethod === m ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:text-foreground")}>
                  {m === "bank" ? "Bank Transfer" : m === "paypal" ? "PayPal" : "Stripe"}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              <input type="text" placeholder={payoutMethod === "paypal" ? "PayPal email address" : payoutMethod === "stripe" ? "Stripe account ID" : "Account holder name"}
                className="w-full bg-transparent border border-border px-4 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors" />
              {payoutMethod === "bank" && (
                <>
                  <input type="text" placeholder="IBAN / Account number" className="w-full bg-transparent border border-border px-4 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors" />
                  <input type="text" placeholder="Sort code / Routing number" className="w-full bg-transparent border border-border px-4 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors" />
                </>
              )}
            </div>
            <div className="flex items-center gap-3 mt-5">
              <button className="px-5 py-2.5 bg-foreground text-background text-sm hover:opacity-90 transition-opacity">Save Payout Details</button>
              <button className="px-5 py-2.5 border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Request Payout ($94.50)</button>
            </div>
          </div>
          <div className="border border-border">
            <div className="px-5 py-4 border-b border-border"><h4 className="text-sm font-medium">Payout History</h4></div>
            <div className="divide-y divide-border">
              {[
                { date: "Apr 15, 2026", amount: 189.50, method: "Bank Transfer", status: "paid" },
                { date: "Mar 15, 2026", amount: 140.00, method: "Bank Transfer", status: "paid" },
                { date: "Feb 15, 2026", amount: 100.00, method: "PayPal",        status: "paid" },
              ].map((p, i) => (
                <div key={i} className="px-5 py-3 flex items-center justify-between">
                  <div><p className="text-sm">{p.date} · {p.method}</p><p className="text-xs text-green-400">{p.status}</p></div>
                  <span className="text-sm font-medium">-${p.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── My Photos Tab ────────────────────────────────────────────────────────────
function MyPhotosTab() {
  const { data: photos, isLoading } = useListPhotos({ sort: "latest", limit: 20 });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-serif text-2xl mb-1">My Photos</h2>
          <p className="text-sm text-muted-foreground">Manage your published work.</p>
        </div>
        <Button asChild className="rounded-none">
          <Link href="/upload">Upload New</Link>
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array(8).fill(0).map((_, i) => <Skeleton key={i} className="aspect-square w-full" />)}
        </div>
      ) : (
        <>
          {/* Summary row */}
          <div className="grid grid-cols-3 gap-4">
            <div className="border border-border bg-card p-5 text-center">
              <p className="text-2xl font-serif">{photos?.photos?.length ?? 0}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Photos</p>
            </div>
            <div className="border border-border bg-card p-5 text-center">
              <p className="text-2xl font-serif">{photos?.photos?.reduce((s, p) => s + p.likes, 0) ?? 0}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Total Likes</p>
            </div>
            <div className="border border-border bg-card p-5 text-center">
              <p className="text-2xl font-serif">{photos?.photos?.reduce((s, p) => s + p.downloads, 0) ?? 0}</p>
              <p className="text-xs text-muted-foreground uppercase tracking-widest mt-1">Downloads</p>
            </div>
          </div>

          {/* Photo grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(photos?.photos ?? []).map((photo) => (
              <Link key={photo.id} href={`/photos/${photo.id}`} className="group relative aspect-square bg-muted overflow-hidden block">
                <img src={photo.imageUrl} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors duration-300 flex items-end p-3">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <p className="text-white text-xs font-medium truncate">{photo.title}</p>
                    <div className="flex items-center gap-2 text-white/70 text-xs mt-1">
                      <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{photo.likes}</span>
                      <span className="flex items-center gap-1"><Download className="w-3 h-3" />{photo.downloads}</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {(!photos?.photos || photos.photos.length === 0) && (
            <div className="border border-border bg-card p-12 text-center">
              <Camera className="w-8 h-8 text-muted-foreground mx-auto mb-4" />
              <p className="font-serif text-xl mb-2">No photos yet</p>
              <p className="text-sm text-muted-foreground mb-6">Upload your first photo to start building your portfolio.</p>
              <Button asChild className="rounded-none">
                <Link href="/upload">Upload a Photo</Link>
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export function Dashboard() {
  const { user, isAdmin } = useAuth();
  const { isPremium, isLoading: subLoading } = useSubscription();
  const { gate, isOpen: gateOpen, closeGate, activeFeature } = usePremiumGate();
  const { data: summary } = useGetSiteSummary();
  const { data: trending } = useGetTrendingPhotos();
  const { data: latest } = useListPhotos({ sort: "latest", limit: 5 });
  const { data: tagsRaw } = useListTags();
  const tags = Array.isArray(tagsRaw) ? tagsRaw : undefined;
  const [transactions, setTransactions] = useState<LivePayoutTransaction[]>([]);

  useEffect(() => {
    fetch("/api/payouts/my")
      .then((r) => r.json())
      .then((d: { payouts?: LivePayoutTransaction[] }) => setTransactions(d.payouts ?? []))
      .catch(() => setTransactions([]));
  }, []);

  const payoutStats = {
    totalEarned: transactions.filter((t) => t.status === "paid").reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0),
    thisMonth: transactions
      .filter((t) => t.status === "paid" && new Date(t.requestedAt).getMonth() === new Date().getMonth())
      .reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0),
    pendingPayout: transactions
      .filter((t) => t.status === "pending" || t.status === "approved")
      .reduce((sum, t) => sum + parseFloat(t.amount || "0"), 0),
  };

  const [tab, setTab] = useState<DashTab>("overview");

  const hiddenPages: string[] = (() => {
    try { return JSON.parse(localStorage.getItem("affuaa_hidden_pages") ?? "[]") as string[]; }
    catch { return []; }
  })();
  const monetiseHidden = hiddenPages.includes("/monetise") && !isAdmin;

  const ALL_TABS: { id: DashTab; label: string; icon: React.ElementType }[] = [
    { id: "overview",  label: "Overview",    icon: LayoutDashboard },
    { id: "analytics", label: "Analytics",   icon: BarChart3 },
    { id: "monetise",  label: "Monetise",    icon: DollarSign },
    { id: "photos",    label: "My Photos",   icon: Image },
  ];
  const TABS = ALL_TABS.filter((t) => !(t.id === "monetise" && monetiseHidden));

  if (!subLoading && !isPremium && !isAdmin) {
    return (
      <Layout>
        <PremiumGateModal open={gateOpen} onClose={closeGate} feature={activeFeature} />
        <div className="min-h-screen flex items-center justify-center px-4">
          <div className="border border-border bg-card max-w-sm w-full">
            <div className="px-8 pt-8 pb-6 border-b border-border">
              <div className="flex items-center gap-2 mb-5">
                <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-amber-400 font-medium">
                  <LayoutDashboard className="w-3 h-3" />
                  Premium feature
                </span>
              </div>
              <h1 className="font-serif text-3xl leading-tight mb-2">Creator Dashboard</h1>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Analytics, monetisation tools, and full portfolio management — all in one place.
              </p>
            </div>
            <div className="px-8 py-5 border-b border-border space-y-2">
              {["Advanced analytics dashboard", "Revenue and payout tracking", "Portfolio management", "Monetisation tools"].map((perk) => (
                <div key={perk} className="flex items-center gap-2.5 text-xs">
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  <span className="text-muted-foreground">{perk}</span>
                </div>
              ))}
            </div>
            <div className="px-8 py-6 space-y-2.5">
              <Button
                className="w-full rounded-none bg-amber-500 hover:bg-amber-400 text-black font-medium"
                onClick={() => gate("analytics")}
              >
                <Crown className="w-4 h-4 mr-2" />
                Get Premium · $6.99/mo
              </Button>
              <Button asChild variant="ghost" className="w-full rounded-none text-xs">
                <Link href="/premium">See everything included</Link>
              </Button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-6xl">
        {/* Page header */}
        <div className="mb-10 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-serif mb-2">Dashboard</h1>
            <p className="text-muted-foreground text-sm">Your creative hub — overview, analytics, monetisation, and portfolio.</p>
          </div>
          <p className="text-xs text-muted-foreground hidden sm:block">{format(new Date(), "EEEE, MMMM d, yyyy")}</p>
        </div>

        {/* Tab navigation */}
        <div className="flex gap-0 border-b border-border mb-10 overflow-x-auto">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 px-5 py-3 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors",
                  tab === t.id ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-4 h-4" />{t.label}
              </button>
            );
          })}
        </div>

        {/* Tab content */}
        {tab === "overview"  && <OverviewTab  user={user}   summary={summary} trending={Array.isArray(trending) ? trending : undefined} payoutStats={payoutStats} />}
        {tab === "analytics" && <AnalyticsTab summary={summary} trending={Array.isArray(trending) ? trending : undefined} latest={latest} tags={tags} />}
        {tab === "monetise"  && !monetiseHidden && <MonetiseTab  isAdmin={isAdmin} transactions={transactions} />}
        {tab === "photos"    && <MyPhotosTab />}
      </div>
    </Layout>
  );
}
