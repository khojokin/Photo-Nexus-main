import { useEffect, useState, useRef } from "react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import {
  useGetSiteSummary, useListPhotos, useListCollections, useListTags,
  useGetTrendingPhotos,
} from "@workspace/api-client-react";
import type { Photo, Collection } from "@workspace/api-client-react";
import {
  LayoutDashboard, Image, Users, FolderOpen, Shield, Tag, DollarSign,
  Settings, Mail, Server, Star, StarOff, Check, X,
  ExternalLink, AlertTriangle, TrendingUp, Download, Heart, Eye,
  BarChart3, Activity, Zap, Database, HardDrive,
  Bell, Send, UserCheck, UserX, BadgeCheck, RefreshCw, ToggleLeft, ToggleRight,
  Plus, CreditCard, ArrowUpRight, Wifi, WifiOff, ChevronRight,
  Globe, Monitor, Smartphone, Tablet, Search, Filter,
  Calendar, Clock, ChevronDown, Edit3, Trash2, Copy, ExternalLink as LinkIcon,
  Layers, GitBranch, Package, AlertCircle,
} from "lucide-react";

type Section =
  | "dashboard" | "analytics" | "photos" | "users" | "collections"
  | "moderation" | "tags" | "monetisation" | "settings" | "comms" | "system";

interface DailyStat {
  label: string;
  date: string;
  uploads: number;
  likes: number;
  downloads: number;
  views: number;
}

interface PhotographerStat {
  photographer_name: string;
  photo_count: number;
  total_likes: number;
  total_downloads: number;
  total_views: number;
}

interface RealReport {
  id: number;
  photoId: number;
  reporterName: string;
  reason: string;
  body: string | null;
  status: string;
  createdAt: string;
}

const NAV: { id: Section; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "photos", label: "Photos", icon: Image, badge: "33" },
  { id: "users", label: "Users", icon: Users, badge: "8" },
  { id: "collections", label: "Collections", icon: FolderOpen },
  { id: "moderation", label: "Moderation", icon: Shield },
  { id: "tags", label: "Tags", icon: Tag },
  { id: "monetisation", label: "Monetisation", icon: DollarSign },
  { id: "settings", label: "Site Settings", icon: Settings },
  { id: "comms", label: "Communications", icon: Mail },
  { id: "system", label: "System", icon: Server },
];

const MOCK_USERS = [
  { id: 1, name: "Aria Chen", handle: "@aria.chen", role: "photographer", photos: 5, verified: true, joined: "Jan 2026", status: "active", earnings: "$94" },
  { id: 2, name: "Marcus Reid", handle: "@marcus.reid", role: "photographer", photos: 5, verified: true, joined: "Feb 2026", status: "active", earnings: "$60" },
  { id: 3, name: "Hiroshi Nakamura", handle: "@hiroshi.nakamura", role: "photographer", photos: 4, verified: false, joined: "Feb 2026", status: "active", earnings: "$0" },
  { id: 4, name: "Lena Fischer", handle: "@lena.fischer", role: "photographer", photos: 4, verified: true, joined: "Mar 2026", status: "active", earnings: "$475" },
  { id: 5, name: "Miguel Santos", handle: "@miguel.santos", role: "photographer", photos: 4, verified: false, joined: "Mar 2026", status: "active", earnings: "$0" },
  { id: 6, name: "Amara Osei", handle: "@amara.osei", role: "photographer", photos: 4, verified: true, joined: "Apr 2026", status: "active", earnings: "$34" },
  { id: 7, name: "Sofia Petrov", handle: "@sofia.petrov", role: "photographer", photos: 4, verified: false, joined: "Apr 2026", status: "suspended", earnings: "$0" },
  { id: 8, name: "James Harlow", handle: "@james.harlow", role: "photographer", photos: 3, verified: false, joined: "May 2026", status: "active", earnings: "$0" },
];

const MOCK_TRANSACTIONS = [
  { id: 1, photographer: "Lena Fischer", type: "license", desc: "Commercial license — Fashion editorial", amount: 120.00, date: "May 8, 2026", status: "paid" },
  { id: 2, photographer: "Aria Chen", type: "print", desc: "A3 Print — Mountain at Dusk", amount: 28.00, date: "May 7, 2026", status: "paid" },
  { id: 3, photographer: "Marcus Reid", type: "commission", desc: "Corporate portraits commission", amount: 350.00, date: "May 6, 2026", status: "pending" },
  { id: 4, photographer: "Amara Osei", type: "tip", desc: "Tip from @silentframe", amount: 5.00, date: "May 5, 2026", status: "paid" },
  { id: 5, photographer: "Hiroshi Nakamura", type: "license", desc: "Editorial license — Architecture series", amount: 60.00, date: "May 4, 2026", status: "paid" },
  { id: 6, photographer: "Sofia Petrov", type: "print", desc: "A4 Print — Fog Series", amount: 18.00, date: "May 3, 2026", status: "pending" },
  { id: 7, photographer: "Lena Fischer", type: "commission", desc: "Wedding photography — June 14th", amount: 800.00, date: "May 2, 2026", status: "pending" },
  { id: 8, photographer: "Aria Chen", type: "tip", desc: "Tip from @nomad.lens", amount: 3.00, date: "May 1, 2026", status: "paid" },
];

const MOCK_SUBSCRIBERS = [
  { id: 1, email: "aria@studio.io", name: "Aria Chen", subscribed: "Jan 12, 2026", pref: "weekly" },
  { id: 2, email: "marcus@film.co", name: "Marcus Reid", subscribed: "Feb 3, 2026", pref: "daily" },
  { id: 3, email: "visitor@photo.com", name: "Guest", subscribed: "Mar 15, 2026", pref: "weekly" },
  { id: 4, email: "collector@art.me", name: "Art Collector", subscribed: "Apr 1, 2026", pref: "monthly" },
  { id: 5, email: "press@media.co", name: "Press Desk", subscribed: "May 2, 2026", pref: "weekly" },
];

const MOCK_AUDIT = [
  { id: 1, actor: "Demo Admin", action: "Featured photo", target: "Into the Mist", time: "10 min ago" },
  { id: 2, actor: "Demo Admin", action: "Resolved report #4", target: "Photo #8", time: "2h ago" },
  { id: 3, actor: "Demo Admin", action: "Updated site settings", target: "Homepage hero", time: "5h ago" },
  { id: 4, actor: "System", action: "Seed data loaded", target: "33 photos, 6 collections", time: "Yesterday" },
  { id: 5, actor: "Demo Admin", action: "Toggled feature flag", target: "demo_mode → ON", time: "Yesterday" },
  { id: 6, actor: "Demo Admin", action: "Suspended user", target: "@sofia.petrov", time: "2 days ago" },
  { id: 7, actor: "System", action: "Backup completed", target: "Full DB snapshot", time: "2 days ago" },
  { id: 8, actor: "Demo Admin", action: "Merged tags", target: '"landscape" + "nature" → "nature"', time: "3 days ago" },
];

const MOCK_REDIRECTS = [
  { id: 1, from: "/old-gallery", to: "/photos", status: 301, hits: 142 },
  { id: 2, from: "/upload-photo", to: "/upload", status: 301, hits: 89 },
  { id: 3, from: "/featured", to: "/?section=featured", status: 302, hits: 34 },
];

const MOCK_DEPLOYS = [
  { id: 1, version: "v2.4.1", actor: "Demo Admin", status: "live", time: "1h ago", notes: "Admin panel, analytics" },
  { id: 2, version: "v2.4.0", actor: "System", status: "superseded", time: "2d ago", notes: "Monetise page" },
  { id: 3, version: "v2.3.9", actor: "System", status: "superseded", time: "5d ago", notes: "Demo seed data" },
  { id: 4, version: "v2.3.8", actor: "System", status: "superseded", time: "1w ago", notes: "Photo reactions" },
];

const MOCK_ERRORS = [
  { id: 1, level: "warn", msg: "Slow query: /api/photos (120ms)", time: "5m ago", count: 3 },
  { id: 2, level: "error", msg: "401 Unauthorized: /api/notifications", time: "8m ago", count: 12 },
  { id: 3, level: "info", msg: "Cache miss: /api/stats/summary", time: "12m ago", count: 1 },
  { id: 4, level: "warn", msg: "Rate limit approach: 95% on /api/photos/*/like", time: "1h ago", count: 1 },
];

const BANNED_WORDS = ["spam", "click here", "free money", "buy followers", "discount code"];
const FEATURED_TAG = { tag: "golden hour", since: "May 6, 2026" };

function StatCard({ icon: Icon, label, value, sub, accent }: {
  icon: React.ElementType; label: string; value: string | number | undefined; sub?: string; accent?: string;
}) {
  return (
    <div className="border border-border bg-card p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className={cn("w-4 h-4", accent ?? "text-muted-foreground")} />
      </div>
      {value === undefined ? (
        <Skeleton className="h-8 w-20" />
      ) : (
        <p className="text-3xl font-serif">{typeof value === "number" ? value.toLocaleString() : value}</p>
      )}
      {sub && <p className="text-xs text-muted-foreground mt-1.5">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children, sub }: { children: React.ReactNode; sub?: string }) {
  return (
    <div className="mb-6">
      <h2 className="text-2xl font-serif">{children}</h2>
      {sub && <p className="text-sm text-muted-foreground mt-1">{sub}</p>}
    </div>
  );
}

function Badge({ color, children }: { color: string; children: React.ReactNode }) {
  return <span className={cn("text-xs px-2 py-0.5 border", color)}>{children}</span>;
}

function Toggle({ on, onToggle, label, sub }: { on: boolean; onToggle: () => void; label: string; sub?: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div>
        <p className="text-sm">{label}</p>
        {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
      </div>
      <button onClick={onToggle} className={cn("flex items-center gap-1.5 text-xs px-3 py-1 border transition-colors ml-4 flex-shrink-0",
        on ? "border-green-500/40 text-green-400 bg-green-500/10" : "border-border text-muted-foreground hover:text-foreground")}>
        {on ? <ToggleRight className="w-3.5 h-3.5" /> : <ToggleLeft className="w-3.5 h-3.5" />}
        {on ? "On" : "Off"}
      </button>
    </div>
  );
}

function HealthRow({ label, status, detail }: { label: string; status: "ok" | "warn" | "down"; detail: string }) {
  const colors = { ok: "text-green-400", warn: "text-amber-400", down: "text-red-400" };
  const icons = { ok: Wifi, warn: AlertTriangle, down: WifiOff };
  const Icon = icons[status];
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <div className="flex items-center gap-3">
        <Icon className={cn("w-3.5 h-3.5", colors[status])} />
        <span className="text-sm">{label}</span>
      </div>
      <span className={cn("text-xs", colors[status])}>{detail}</span>
    </div>
  );
}

function Sparkline({ data, color = "#6366f1", height = 40, width = 120 }: {
  data: number[]; color?: string; height?: number; width?: number;
}) {
  if (!data.length || data.length < 2) return <div style={{ width, height }} className="opacity-20 bg-border" />;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 4) - 2;
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });
  const last = pts[pts.length - 1]?.split(",") ?? ["0", "0"];
  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" points={pts.join(" ")} />
      <circle cx={parseFloat(last[0] ?? "0")} cy={parseFloat(last[1] ?? "0")} r="2.5" fill={color} />
    </svg>
  );
}

function MiniBar({ value, max, color = "bg-foreground/40" }: { value: number; max: number; color?: string }) {
  return (
    <div className="h-1.5 bg-border flex-1">
      <div className={cn("h-full transition-all", color)} style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
    </div>
  );
}

export function Admin() {
  const { user, loginAsDemo } = useAuth();
  const [section, setSection] = useState<Section>("dashboard");
  const [reports, setReports] = useState<RealReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [users, setUsers] = useState(MOCK_USERS);
  const [userSearch, setUserSearch] = useState("");
  const [photoSearch, setPhotoSearch] = useState("");
  const [selectedPhotos, setSelectedPhotos] = useState<Set<number>>(new Set());
  const [analyticsData, setAnalyticsData] = useState<{ dailyStats: DailyStat[]; photographerStats: PhotographerStat[] } | null>(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [announcementText, setAnnouncementText] = useState("");
  const [campaignSubject, setCampaignSubject] = useState("");
  const [campaignBody, setCampaignBody] = useState("");
  const [campaignDate, setCampaignDate] = useState("");
  const [banInput, setBanInput] = useState("");
  const [bannedWords, setBannedWords] = useState(BANNED_WORDS);
  const [featuredTag, setFeaturedTag] = useState(FEATURED_TAG.tag);
  const [apiPing, setApiPing] = useState<number | null>(null);
  const [pingLoading, setPingLoading] = useState(false);
  const [editingPhotoId, setEditingPhotoId] = useState<number | null>(null);
  const [spotlightIdx, setSpotlightIdx] = useState(0);
  const [rateLimit, setRateLimit] = useState(120);
  const [seoSettings, setSeoSettings] = useState({ title: "Affuaa — Gallery-quality photography", desc: "Discover extraordinary images carefully selected for those who care about the craft.", ogImage: "" });
  const [socialLinks, setSocialLinks] = useState({ instagram: "@affuaa", twitter: "@affuaa_photos", facebook: "", pinterest: "affuaa" });
  const [flags, setFlags] = useState({
    demo_mode: true, uploads_open: true, collections_public: true,
    comments_enabled: true, tips_enabled: true, licensing_enabled: true,
    maintenance_mode: false, registration_open: true, nsfw_detection: false,
    auto_flag_reports: true, watermark_enabled: false, email_notifications: true,
  });

  const { data: summary } = useGetSiteSummary();
  const { data: photosData } = useListPhotos({ limit: 50 });
  const { data: collectionsData } = useListCollections();
  const { data: tagsData } = useListTags();
  const { data: trendingData } = useGetTrendingPhotos();

  const photos = photosData?.photos ?? [];
  const collections = collectionsData ?? [];
  const tags = tagsData ?? [];
  const trending = trendingData ?? [];

  const [featuredPhotos, setFeaturedPhotos] = useState<Set<number>>(new Set());
  const [featureUpdating, setFeatureUpdating] = useState<Set<number>>(new Set());

  useEffect(() => {
    if (photos.length) {
      setFeaturedPhotos(new Set(photos.filter(p => p.isFeatured).map(p => p.id)));
    }
  }, [photos]);

  useEffect(() => {
    fetch("/api/admin/reports", { credentials: "include" })
      .then(r => r.json())
      .then((d: { reports: RealReport[] }) => setReports(d.reports ?? []))
      .catch(() => setReports([]))
      .finally(() => setReportsLoading(false));
  }, []);

  useEffect(() => {
    if (section === "analytics" || section === "dashboard") {
      fetch("/api/stats/analytics")
        .then(r => r.json())
        .then((d: { dailyStats: DailyStat[]; photographerStats: PhotographerStat[] }) => setAnalyticsData(d))
        .catch(() => {})
        .finally(() => setAnalyticsLoading(false));
    }
  }, [section]);

  function toggleFlag(key: keyof typeof flags) {
    setFlags(prev => ({ ...prev, [key]: !prev[key] }));
  }

  async function resolveReport(id: number, status: string) {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
    await fetch(`/api/admin/reports/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    }).catch(() => {});
  }

  async function toggleFeature(photoId: number) {
    const isFeatured = !featuredPhotos.has(photoId);
    setFeatureUpdating(prev => new Set(prev).add(photoId));
    setFeaturedPhotos(prev => {
      const next = new Set(prev);
      if (isFeatured) next.add(photoId); else next.delete(photoId);
      return next;
    });
    try {
      await fetch(`/api/photos/${photoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured }),
      });
    } catch {
      setFeaturedPhotos(prev => {
        const next = new Set(prev);
        if (isFeatured) next.delete(photoId); else next.add(photoId);
        return next;
      });
    } finally {
      setFeatureUpdating(prev => { const n = new Set(prev); n.delete(photoId); return n; });
    }
  }

  async function bulkFeature(ids: number[], feature: boolean) {
    setSelectedPhotos(new Set());
    for (const id of ids) {
      if (feature) setFeaturedPhotos(prev => new Set(prev).add(id));
      else setFeaturedPhotos(prev => { const n = new Set(prev); n.delete(id); return n; });
      await fetch(`/api/photos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isFeatured: feature }),
      }).catch(() => {});
    }
  }

  function toggleVerify(id: number) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, verified: !u.verified } : u));
  }

  function toggleSuspend(id: number) {
    setUsers(prev => prev.map(u =>
      u.id === id ? { ...u, status: u.status === "suspended" ? "active" : "suspended" } : u
    ));
  }

  function changeRole(id: number, role: string) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, role } : u));
  }

  async function pingApi() {
    setPingLoading(true);
    const start = Date.now();
    try {
      await fetch("/api/health");
      setApiPing(Date.now() - start);
    } catch {
      setApiPing(-1);
    } finally {
      setPingLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-serif text-2xl mb-2">Admin access required</p>
          <p className="text-muted-foreground text-sm mb-6">Sign in to access the admin panel.</p>
          <div className="flex items-center gap-3 justify-center">
            <button onClick={() => loginAsDemo()}
              className="px-4 py-2 bg-foreground text-background text-sm hover:opacity-90 transition-opacity">
              Enter as Demo
            </button>
            <Link href="/signin" className="px-4 py-2 border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Sign in</Link>
          </div>
        </div>
      </div>
    );
  }

  const pending = reports.filter(r => r.status === "pending");
  const reviewed = reports.filter(r => r.status !== "pending");
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.handle.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredPhotos = photos.filter(p =>
    p.title.toLowerCase().includes(photoSearch.toLowerCase()) ||
    p.photographerName.toLowerCase().includes(photoSearch.toLowerCase())
  );
  const selectedList = Array.from(selectedPhotos);
  const dailyUploads = analyticsData?.dailyStats.map(d => d.uploads) ?? [];
  const dailyDownloads = analyticsData?.dailyStats.map(d => d.downloads) ?? [];
  const dailyLikes = analyticsData?.dailyStats.map(d => d.likes) ?? [];
  const photographerStats = analyticsData?.photographerStats ?? [];
  const maxPhotographerScore = photographerStats.reduce((m, p) => Math.max(m, p.total_likes + p.total_downloads), 1);
  const spotlightUser = MOCK_USERS.filter(u => u.status === "active" && u.verified)[spotlightIdx % MOCK_USERS.filter(u => u.status === "active" && u.verified).length];

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar */}
      <aside className="w-56 border-r border-border flex flex-col flex-shrink-0 sticky top-0 h-screen overflow-y-auto">
        <div className="px-5 py-5 border-b border-border">
          <Link href="/" className="text-lg font-serif tracking-tight">Affuaa.</Link>
          <p className="text-xs text-muted-foreground mt-0.5">Admin Panel</p>
        </div>
        <nav className="flex-1 py-3">
          {NAV.map(item => {
            const Icon = item.icon;
            const active = section === item.id;
            const badgeVal = item.id === "moderation" ? pending.length : undefined;
            return (
              <button key={item.id} onClick={() => setSection(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-5 py-2.5 text-sm transition-colors text-left",
                  active ? "text-foreground bg-foreground/5" : "text-muted-foreground hover:text-foreground"
                )}>
                <span className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {item.label}
                </span>
                {badgeVal !== undefined && badgeVal > 0 && (
                  <span className="text-xs px-1.5 py-0.5 min-w-[20px] text-center bg-amber-500/20 text-amber-400">{badgeVal}</span>
                )}
                {item.badge && badgeVal === undefined && (
                  <span className="text-xs px-1.5 py-0.5 min-w-[20px] text-center bg-foreground/10 text-muted-foreground">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-border">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="text-sm font-medium mt-0.5 truncate">{user.firstName} {user.lastName}</p>
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground mt-1 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> View site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="max-w-6xl mx-auto px-8 py-10">

          {/* ── DASHBOARD ── */}
          {section === "dashboard" && (
            <div>
              <SectionTitle sub="Platform health and performance at a glance">Dashboard</SectionTitle>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Image} label="Total Photos" value={summary?.totalPhotos} sub="in gallery" accent="text-blue-400" />
                <StatCard icon={Users} label="Photographers" value={8} sub="8 active" accent="text-purple-400" />
                <StatCard icon={Heart} label="Total Likes" value={summary?.totalLikes} sub="all time" accent="text-rose-400" />
                <StatCard icon={Download} label="Downloads" value={summary?.totalDownloads} sub="all time" accent="text-green-400" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <StatCard icon={FolderOpen} label="Collections" value={summary?.totalCollections} />
                <StatCard icon={Tag} label="Unique Tags" value={tags.length} />
                <StatCard icon={Eye} label="Total Views" value={photos.reduce((s, p) => s + (p.views ?? 0), 0)} />
                <StatCard icon={Star} label="Featured" value={photos.filter(p => p.isFeatured).length} sub="photos" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="border border-border bg-card p-5">
                  <h3 className="text-sm font-medium mb-1">Uploads (last 30d)</h3>
                  <p className="text-2xl font-serif mb-3">{dailyUploads.reduce((a, b) => a + b, 0)}</p>
                  <Sparkline data={dailyUploads.length ? dailyUploads : [0, 1, 3, 5, 8, 6, 10]} color="#818cf8" width={180} />
                </div>
                <div className="border border-border bg-card p-5">
                  <h3 className="text-sm font-medium mb-1">Likes (last 30d)</h3>
                  <p className="text-2xl font-serif mb-3">{dailyLikes.reduce((a, b) => a + b, 0).toLocaleString()}</p>
                  <Sparkline data={dailyLikes.length ? dailyLikes : [20, 40, 55, 70, 80, 65, 90]} color="#f43f5e" width={180} />
                </div>
                <div className="border border-border bg-card p-5">
                  <h3 className="text-sm font-medium mb-1">Downloads (last 30d)</h3>
                  <p className="text-2xl font-serif mb-3">{dailyDownloads.reduce((a, b) => a + b, 0).toLocaleString()}</p>
                  <Sparkline data={dailyDownloads.length ? dailyDownloads : [10, 15, 22, 18, 30, 25, 35]} color="#34d399" width={180} />
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="border border-border bg-card p-5">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" /> Trending Right Now
                  </h3>
                  <div className="space-y-2.5">
                    {trending.slice(0, 6).map((p, i) => (
                      <div key={p.id} className="flex items-center gap-3">
                        <span className="text-xs text-muted-foreground w-4">{i + 1}</span>
                        <img src={p.imageUrl} alt={p.title} className="w-8 h-8 object-cover flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm truncate">{p.title}</p>
                          <p className="text-xs text-muted-foreground">{p.photographerName}</p>
                        </div>
                        <span className="text-xs text-muted-foreground">{(p.likes + p.downloads).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="border border-border bg-card p-5">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-muted-foreground" /> Recent Audit Activity
                  </h3>
                  <div className="space-y-1">
                    {MOCK_AUDIT.slice(0, 6).map(e => (
                      <div key={e.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                        <span className="text-xs text-muted-foreground w-20 flex-shrink-0">{e.time}</span>
                        <span className="text-xs flex-shrink-0 text-muted-foreground">{e.actor}</span>
                        <span className="text-xs flex-1 truncate">{e.action} — {e.target}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border border-border bg-card p-5">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-muted-foreground" /> Top Photographers
                </h3>
                <div className="space-y-3">
                  {photographerStats.slice(0, 6).map(p => (
                    <div key={p.photographer_name} className="flex items-center gap-3">
                      <span className="text-sm w-36 truncate">{p.photographer_name}</span>
                      <MiniBar value={p.total_likes + p.total_downloads} max={maxPhotographerScore} color="bg-purple-500/60" />
                      <span className="text-xs text-muted-foreground w-16 text-right">{(p.total_likes + p.total_downloads).toLocaleString()}</span>
                    </div>
                  ))}
                  {analyticsLoading && <Skeleton className="h-4 w-full" />}
                </div>
              </div>
            </div>
          )}

          {/* ── ANALYTICS ── */}
          {section === "analytics" && (
            <div>
              <SectionTitle sub="Traffic, engagement, and growth over time">Analytics</SectionTitle>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium">Daily Uploads</h3>
                    <span className="text-xs text-muted-foreground">last 30d</span>
                  </div>
                  <p className="text-3xl font-serif mb-4">{dailyUploads.reduce((a, b) => a + b, 0)}</p>
                  {analyticsLoading ? <Skeleton className="h-10 w-full" /> : (
                    <Sparkline data={dailyUploads.length ? dailyUploads : [0]} color="#818cf8" width={260} height={50} />
                  )}
                  {analyticsData && (
                    <div className="mt-3 flex gap-3 overflow-x-auto">
                      {analyticsData.dailyStats.slice(-7).map(d => (
                        <div key={d.date} className="flex-shrink-0 text-center">
                          <p className="text-sm font-medium">{d.uploads}</p>
                          <p className="text-xs text-muted-foreground">{d.label}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium">Daily Likes</h3>
                    <span className="text-xs text-muted-foreground">last 30d</span>
                  </div>
                  <p className="text-3xl font-serif mb-4">{dailyLikes.reduce((a, b) => a + b, 0).toLocaleString()}</p>
                  {analyticsLoading ? <Skeleton className="h-10 w-full" /> : (
                    <Sparkline data={dailyLikes.length ? dailyLikes : [0]} color="#f43f5e" width={260} height={50} />
                  )}
                </div>
                <div className="border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="text-sm font-medium">Daily Downloads</h3>
                    <span className="text-xs text-muted-foreground">last 30d</span>
                  </div>
                  <p className="text-3xl font-serif mb-4">{dailyDownloads.reduce((a, b) => a + b, 0).toLocaleString()}</p>
                  {analyticsLoading ? <Skeleton className="h-10 w-full" /> : (
                    <Sparkline data={dailyDownloads.length ? dailyDownloads : [0]} color="#34d399" width={260} height={50} />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="border border-border bg-card p-5">
                  <h3 className="text-sm font-medium mb-4">Photographer Performance</h3>
                  <div className="space-y-3">
                    {photographerStats.map(p => (
                      <div key={p.photographer_name}>
                        <div className="flex justify-between text-xs mb-1">
                          <span>{p.photographer_name} <span className="text-muted-foreground">({p.photo_count} photos)</span></span>
                          <span className="text-muted-foreground">{(p.total_likes + p.total_downloads).toLocaleString()}</span>
                        </div>
                        <MiniBar value={p.total_likes + p.total_downloads} max={maxPhotographerScore} color="bg-indigo-500/60" />
                      </div>
                    ))}
                    {analyticsLoading && Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="border border-border bg-card p-5">
                    <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-muted-foreground" /> Geographic Distribution
                    </h3>
                    {[
                      { country: "United States", pct: 34, flag: "🇺🇸" },
                      { country: "Germany", pct: 18, flag: "🇩🇪" },
                      { country: "United Kingdom", pct: 14, flag: "🇬🇧" },
                      { country: "Japan", pct: 11, flag: "🇯🇵" },
                      { country: "France", pct: 9, flag: "🇫🇷" },
                      { country: "Other", pct: 14, flag: "🌍" },
                    ].map(({ country, pct, flag }) => (
                      <div key={country} className="mb-2.5">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{flag} {country}</span>
                          <span className="text-muted-foreground">{pct}%</span>
                        </div>
                        <MiniBar value={pct} max={100} color="bg-blue-500/50" />
                      </div>
                    ))}
                  </div>
                  <div className="border border-border bg-card p-5">
                    <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Monitor className="w-4 h-4 text-muted-foreground" /> Device Breakdown
                    </h3>
                    {[
                      { device: "Desktop", icon: Monitor, pct: 58 },
                      { device: "Mobile", icon: Smartphone, pct: 35 },
                      { device: "Tablet", icon: Tablet, pct: 7 },
                    ].map(({ device, icon: DIcon, pct }) => (
                      <div key={device} className="flex items-center gap-3 mb-2.5">
                        <DIcon className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm w-16">{device}</span>
                        <MiniBar value={pct} max={100} color="bg-purple-500/50" />
                        <span className="text-xs text-muted-foreground w-8">{pct}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border border-border bg-card p-5">
                <h3 className="text-sm font-medium mb-4">Traffic Sources</h3>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { source: "Direct", visits: 3240, change: "+12%" },
                    { source: "Organic Search", visits: 2180, change: "+8%" },
                    { source: "Social", visits: 1560, change: "+24%" },
                    { source: "Referral", visits: 820, change: "-3%" },
                  ].map(s => (
                    <div key={s.source} className="border border-border p-4">
                      <p className="text-xs text-muted-foreground mb-1">{s.source}</p>
                      <p className="text-2xl font-serif">{s.visits.toLocaleString()}</p>
                      <p className={cn("text-xs mt-1", s.change.startsWith("+") ? "text-green-400" : "text-red-400")}>{s.change} this month</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── PHOTOS ── */}
          {section === "photos" && (
            <div>
              <SectionTitle sub="Browse, feature, and manage all submitted photos">Photos</SectionTitle>
              <div className="flex items-center gap-3 mb-5 flex-wrap">
                <div className="relative flex-1 min-w-48">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input value={photoSearch} onChange={e => setPhotoSearch(e.target.value)}
                    placeholder="Search photos or photographer…"
                    className="w-full bg-card border border-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-foreground/30" />
                </div>
                {selectedList.length > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{selectedList.length} selected</span>
                    <button onClick={() => void bulkFeature(selectedList, true)}
                      className="text-xs px-3 py-1.5 border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center gap-1.5">
                      <Star className="w-3 h-3" /> Feature all
                    </button>
                    <button onClick={() => void bulkFeature(selectedList, false)}
                      className="text-xs px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1.5">
                      <StarOff className="w-3 h-3" /> Unfeature all
                    </button>
                    <button onClick={() => setSelectedPhotos(new Set())}
                      className="text-xs text-muted-foreground hover:text-foreground"><X className="w-3.5 h-3.5" /></button>
                  </div>
                )}
                <span className="text-xs text-muted-foreground ml-auto">{filteredPhotos.length} photos</span>
              </div>
              <div className="border border-border overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-border bg-card/50">
                      <th className="w-10 px-3 py-3"><input type="checkbox"
                        checked={selectedPhotos.size === filteredPhotos.length && filteredPhotos.length > 0}
                        onChange={e => setSelectedPhotos(e.target.checked ? new Set(filteredPhotos.map(p => p.id)) : new Set())}
                        className="accent-foreground" /></th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Photo</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Photographer</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">License</th>
                      <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Likes</th>
                      <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">DL</th>
                      <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Featured</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPhotos.map(p => {
                      const isFeatured = featuredPhotos.has(p.id);
                      const isUpdating = featureUpdating.has(p.id);
                      const isSelected = selectedPhotos.has(p.id);
                      return (
                        <tr key={p.id} className={cn("border-b border-border transition-colors", isSelected ? "bg-foreground/5" : "hover:bg-card/40")}>
                          <td className="px-3 py-2.5 text-center">
                            <input type="checkbox" checked={isSelected}
                              onChange={e => setSelectedPhotos(prev => {
                                const n = new Set(prev);
                                if (e.target.checked) n.add(p.id); else n.delete(p.id);
                                return n;
                              })} className="accent-foreground" />
                          </td>
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <img src={p.imageUrl} alt={p.title} className="w-10 h-10 object-cover flex-shrink-0" />
                              <span className="font-medium truncate max-w-[140px]">{p.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground text-xs">{p.photographerName}</td>
                          <td className="px-4 py-2.5">
                            <Badge color="border-border text-muted-foreground">{p.license?.replace(/-/g, " ") ?? "—"}</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{p.likes.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{p.downloads.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-center">
                            <button onClick={() => void toggleFeature(p.id)} disabled={isUpdating}
                              className={cn("transition-all", isUpdating && "opacity-40")}>
                              {isFeatured
                                ? <Star className="w-4 h-4 text-amber-400 fill-amber-400 mx-auto" />
                                : <StarOff className="w-4 h-4 text-border mx-auto hover:text-muted-foreground" />}
                            </button>
                          </td>
                          <td className="px-4 py-2.5 flex items-center gap-2">
                            <button onClick={() => setEditingPhotoId(editingPhotoId === p.id ? null : p.id)}
                              className="text-muted-foreground hover:text-foreground transition-colors"><Edit3 className="w-3.5 h-3.5" /></button>
                            <Link href={`/photos/${p.id}`}
                              className="text-muted-foreground hover:text-foreground transition-colors">
                              <ExternalLink className="w-3.5 h-3.5" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {editingPhotoId !== null && (() => {
                const photo = photos.find(p => p.id === editingPhotoId);
                if (!photo) return null;
                return (
                  <div className="mt-4 border border-border bg-card p-5">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-medium">Photo Analytics — {photo.title}</h3>
                      <button onClick={() => setEditingPhotoId(null)}><X className="w-4 h-4 text-muted-foreground hover:text-foreground" /></button>
                    </div>
                    <div className="grid grid-cols-4 gap-4 mb-4">
                      {[
                        { label: "Likes", value: photo.likes, icon: Heart, color: "text-rose-400" },
                        { label: "Downloads", value: photo.downloads, icon: Download, color: "text-green-400" },
                        { label: "Views", value: photo.views ?? 0, icon: Eye, color: "text-blue-400" },
                        { label: "Conv. Rate", value: `${photo.downloads ? Math.round((photo.downloads / (photo.views || 1)) * 100) : 0}%`, icon: TrendingUp, color: "text-purple-400" },
                      ].map(({ label, value, icon: Icon, color }) => (
                        <div key={label} className="border border-border p-4 text-center">
                          <Icon className={cn("w-4 h-4 mx-auto mb-2", color)} />
                          <p className="text-xl font-serif">{typeof value === "number" ? value.toLocaleString() : value}</p>
                          <p className="text-xs text-muted-foreground">{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-4 text-xs text-muted-foreground">
                      <span>License: <span className="text-foreground">{photo.license?.replace(/-/g, " ")}</span></span>
                      <span>Tags: <span className="text-foreground">{photo.tags?.slice(0, 4).join(", ")}</span></span>
                      {photo.camera && <span>Camera: <span className="text-foreground">{photo.camera}</span></span>}
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* ── USERS ── */}
          {section === "users" && (
            <div>
              <SectionTitle sub="Manage photographer accounts, roles, and access">Users</SectionTitle>

              {/* Creator Spotlight */}
              <div className="border border-border bg-card p-5 mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium flex items-center gap-2"><Star className="w-4 h-4 text-amber-400" /> Creator Spotlight</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setSpotlightIdx(i => i - 1)} className="text-xs px-2 py-1 border border-border text-muted-foreground hover:text-foreground">←</button>
                    <button onClick={() => setSpotlightIdx(i => i + 1)} className="text-xs px-2 py-1 border border-border text-muted-foreground hover:text-foreground">→</button>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-900/60 to-blue-900/60 flex items-center justify-center text-xl font-serif border border-border">
                    {spotlightUser?.name.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{spotlightUser?.name}</p>
                      {spotlightUser?.verified && <BadgeCheck className="w-4 h-4 text-blue-400" />}
                    </div>
                    <p className="text-sm text-muted-foreground">{spotlightUser?.handle} · {spotlightUser?.photos} photos</p>
                    <p className="text-xs text-green-400 mt-0.5">Earnings: {spotlightUser?.earnings}</p>
                  </div>
                  <div className="flex gap-2">
                    <button className="text-xs px-3 py-1.5 bg-foreground text-background hover:opacity-90 transition-opacity">Feature this month</button>
                    <Link href={`/profile/${encodeURIComponent(spotlightUser?.name ?? "")}`} className="text-xs px-3 py-1.5 border border-border text-muted-foreground hover:text-foreground flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" /> View profile
                    </Link>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search by name or handle…"
                    className="w-full bg-card border border-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-foreground/30" />
                </div>
              </div>
              <div className="border border-border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-card/50">
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">User</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Role</th>
                      <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Photos</th>
                      <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Earnings</th>
                      <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Verified</th>
                      <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Status</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Joined</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="border-b border-border hover:bg-card/40 transition-colors">
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium">{u.name}</p>
                            <p className="text-xs text-muted-foreground">{u.handle}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <select value={u.role} onChange={e => changeRole(u.id, e.target.value)}
                            className="bg-transparent text-xs border border-border px-2 py-1 text-muted-foreground">
                            <option value="photographer">photographer</option>
                            <option value="curator">curator</option>
                            <option value="member">member</option>
                            <option value="admin">admin</option>
                          </select>
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">{u.photos}</td>
                        <td className="px-4 py-3 text-right text-xs text-green-400">{u.earnings}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => toggleVerify(u.id)} title="Toggle verified">
                            {u.verified
                              ? <BadgeCheck className="w-4 h-4 text-blue-400 mx-auto" />
                              : <span className="block w-4 h-4 border border-border mx-auto rounded-sm" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge color={u.status === "active" ? "border-green-500/30 text-green-400 bg-green-500/5" : "border-red-500/30 text-red-400 bg-red-500/5"}>
                            {u.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{u.joined}</td>
                        <td className="px-4 py-3 flex items-center gap-2">
                          <button onClick={() => toggleSuspend(u.id)} title={u.status === "suspended" ? "Reinstate" : "Suspend"}
                            className="text-muted-foreground hover:text-foreground transition-colors">
                            {u.status === "suspended" ? <UserCheck className="w-3.5 h-3.5" /> : <UserX className="w-3.5 h-3.5" />}
                          </button>
                          <Link href={`/profile/${encodeURIComponent(u.name)}`} className="text-muted-foreground hover:text-foreground">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── COLLECTIONS ── */}
          {section === "collections" && (
            <div>
              <SectionTitle sub="Manage curated photo collections">Collections</SectionTitle>
              <div className="flex items-center gap-3 mb-5">
                <button className="flex items-center gap-1.5 text-xs px-3 py-2 border border-border text-muted-foreground hover:text-foreground transition-colors">
                  <Plus className="w-3.5 h-3.5" /> New Collection
                </button>
                <span className="text-xs text-muted-foreground">{collections.length} collections</span>
              </div>
              <div className="border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-card/50">
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Collection</th>
                      <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Photos</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Description</th>
                      <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Editorial</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {collections.map((c: Collection) => (
                      <tr key={c.id} className="border-b border-border hover:bg-card/40 transition-colors">
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-3">
                            {c.coverImageUrl && (
                              <img src={c.coverImageUrl} alt={c.name} className="w-10 h-10 object-cover flex-shrink-0" />
                            )}
                            <span className="font-medium">{c.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">{c.photoCount}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground truncate max-w-xs">{c.description ?? "—"}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge color="border-border text-muted-foreground">curated</Badge>
                        </td>
                        <td className="px-4 py-3 flex items-center gap-2">
                          <Link href={`/collections/${c.id}`} className="text-muted-foreground hover:text-foreground transition-colors">
                            <ExternalLink className="w-3.5 h-3.5" />
                          </Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── MODERATION ── */}
          {section === "moderation" && (
            <div>
              <SectionTitle sub="Review flagged content and configure auto-moderation">Moderation</SectionTitle>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                <div className="lg:col-span-2">
                  {reportsLoading ? (
                    <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
                  ) : (
                    <>
                      {pending.length > 0 && (
                        <div className="mb-8">
                          <h3 className="text-xs uppercase tracking-widest text-amber-400 mb-4 flex items-center gap-2">
                            <AlertTriangle className="w-3.5 h-3.5" /> Pending ({pending.length})
                          </h3>
                          <div className="space-y-3">
                            {pending.map(r => <ReportCard key={r.id} report={r} onResolve={resolveReport} />)}
                          </div>
                        </div>
                      )}
                      {reviewed.length > 0 && (
                        <div className="opacity-60">
                          <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Reviewed ({reviewed.length})</h3>
                          <div className="space-y-3">
                            {reviewed.map(r => <ReportCard key={r.id} report={r} onResolve={resolveReport} />)}
                          </div>
                        </div>
                      )}
                      {reports.length === 0 && !reportsLoading && (
                        <div className="py-16 text-center border border-dashed border-border text-muted-foreground">
                          <Shield className="w-8 h-8 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">No reports yet. Community is behaving!</p>
                        </div>
                      )}
                    </>
                  )}
                </div>
                <div className="space-y-4">
                  <div className="border border-border bg-card p-5">
                    <h3 className="text-sm font-medium mb-3">Auto-Moderation Rules</h3>
                    <Toggle on={flags.auto_flag_reports} onToggle={() => toggleFlag("auto_flag_reports")} label="Auto-flag at 3 reports" sub="Flag photos automatically" />
                    <Toggle on={flags.nsfw_detection} onToggle={() => toggleFlag("nsfw_detection")} label="AI NSFW detection" sub="Scan uploads automatically" />
                    <div className="pt-3">
                      <p className="text-xs text-muted-foreground mb-2">Report threshold before auto-remove</p>
                      <div className="flex items-center gap-3">
                        <input type="range" min={3} max={20} defaultValue={5}
                          className="flex-1 accent-foreground" />
                        <span className="text-xs font-medium w-6">5</span>
                      </div>
                    </div>
                  </div>
                  <div className="border border-border bg-card p-5">
                    <h3 className="text-sm font-medium mb-3">Banned Words</h3>
                    <div className="flex flex-wrap gap-1.5 mb-3">
                      {bannedWords.map(w => (
                        <span key={w} className="text-xs border border-border px-2 py-0.5 flex items-center gap-1">
                          {w}
                          <button onClick={() => setBannedWords(prev => prev.filter(x => x !== w))} className="text-muted-foreground hover:text-red-400">
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input value={banInput} onChange={e => setBanInput(e.target.value)}
                        placeholder="Add word…" className="flex-1 bg-background border border-border px-2 py-1.5 text-xs focus:outline-none" />
                      <button onClick={() => { if (banInput.trim()) { setBannedWords(prev => [...prev, banInput.trim()]); setBanInput(""); } }}
                        className="px-3 py-1.5 border border-border text-xs hover:border-foreground/30 transition-colors">
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── TAGS ── */}
          {section === "tags" && (
            <div>
              <SectionTitle sub="Explore, merge, and manage the tag taxonomy">Tags</SectionTitle>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 border border-border bg-card p-5">
                  <h3 className="text-sm font-medium mb-4">All Tags ({tags.length})</h3>
                  <div className="flex flex-wrap gap-2 max-h-80 overflow-y-auto">
                    {tags.map(t => (
                      <div key={t.name} className="group flex items-center gap-1.5 border border-border px-2.5 py-1.5 hover:border-foreground/30 transition-colors">
                        <span className="text-sm">{t.name}</span>
                        <span className="text-xs text-muted-foreground">{t.photoCount}</span>
                        <button className="opacity-0 group-hover:opacity-100 transition-opacity ml-1 text-muted-foreground hover:text-red-400">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="border border-border bg-card p-5">
                    <h3 className="text-sm font-medium mb-3">Featured Tag of the Week</h3>
                    <div className="flex gap-2 mb-3">
                      <input value={featuredTag} onChange={e => setFeaturedTag(e.target.value)}
                        className="flex-1 bg-background border border-border px-2 py-1.5 text-sm focus:outline-none" />
                      <button className="px-3 py-1.5 border border-border text-xs hover:border-foreground/30 transition-colors">
                        <Check className="w-3 h-3" />
                      </button>
                    </div>
                    <p className="text-xs text-muted-foreground">Currently: <span className="text-amber-400">{FEATURED_TAG.tag}</span> · since {FEATURED_TAG.since}</p>
                  </div>
                  <div className="border border-border bg-card p-5">
                    <h3 className="text-sm font-medium mb-3">Top Tags by Usage</h3>
                    <div className="space-y-2.5">
                      {tags.slice(0, 8).map(t => {
                        const max = tags[0]?.photoCount ?? 1;
                        return (
                          <div key={t.name}>
                            <div className="flex justify-between text-xs mb-1">
                              <span>{t.name}</span>
                              <span className="text-muted-foreground">{t.photoCount}</span>
                            </div>
                            <MiniBar value={t.photoCount} max={max} />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="border border-border bg-card p-5">
                    <h3 className="text-sm font-medium mb-3">Tag Actions</h3>
                    {["Merge duplicate tags", "Delete unused tags", "Export taxonomy CSV", "Add tag synonym", "Set tag category"].map(action => (
                      <button key={action}
                        className="w-full text-left text-xs text-muted-foreground hover:text-foreground py-2.5 border-b border-border last:border-0 flex items-center gap-2 transition-colors">
                        <ChevronRight className="w-3 h-3" /> {action}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── MONETISATION ── */}
          {section === "monetisation" && (
            <div>
              <SectionTitle sub="Platform revenue, payouts, and creator earnings">Monetisation</SectionTitle>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={DollarSign} label="Total Revenue" value="$663" sub="all time" accent="text-green-400" />
                <StatCard icon={CreditCard} label="This Month" value="$189" sub="May 2026" />
                <StatCard icon={ArrowUpRight} label="Pending Payouts" value="$368" sub="3 transactions" accent="text-amber-400" />
                <StatCard icon={TrendingUp} label="Avg per Creator" value="$82" sub="monthly" />
              </div>

              <div className="mb-6">
                <h3 className="text-sm font-medium mb-4">Payout Approval Queue</h3>
                <div className="border border-border">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-card/50">
                        <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Photographer</th>
                        <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Description</th>
                        <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Amount</th>
                        <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Date</th>
                        <th className="px-4 py-3" />
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_TRANSACTIONS.filter(t => t.status === "pending").map(t => (
                        <tr key={t.id} className="border-b border-border hover:bg-card/40 transition-colors">
                          <td className="px-4 py-3 font-medium">{t.photographer}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{t.desc}</td>
                          <td className="px-4 py-3 text-right font-medium">${t.amount.toFixed(2)}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{t.date}</td>
                          <td className="px-4 py-3 flex gap-2">
                            <button className="flex items-center gap-1 text-xs px-2.5 py-1 border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors">
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button className="flex items-center gap-1 text-xs px-2.5 py-1 border border-border text-muted-foreground hover:text-foreground transition-colors">
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-border bg-card p-5">
                  <h3 className="text-sm font-medium mb-4">Revenue by Type</h3>
                  {[
                    { label: "Commissions", value: 1150, color: "bg-purple-500" },
                    { label: "Licensing", value: 180, color: "bg-blue-500" },
                    { label: "Prints", value: 124, color: "bg-green-500" },
                    { label: "Tips", value: 9, color: "bg-amber-500" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{label}</span>
                        <span className="text-muted-foreground">${value}</span>
                      </div>
                      <MiniBar value={value} max={1150} color={color} />
                    </div>
                  ))}
                </div>
                <div className="border border-border bg-card p-5">
                  <h3 className="text-sm font-medium mb-3">Commission Rate Settings</h3>
                  {[
                    { tier: "Standard photographer", rate: 15 },
                    { tier: "Verified photographer", rate: 10 },
                    { tier: "Top 10 earners", rate: 8 },
                    { tier: "Enterprise license", rate: 5 },
                  ].map(({ tier, rate }) => (
                    <div key={tier} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                      <span className="text-sm">{tier}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{rate}%</span>
                        <button className="text-xs text-muted-foreground hover:text-foreground"><Edit3 className="w-3 h-3" /></button>
                      </div>
                    </div>
                  ))}
                  <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-xs text-muted-foreground mb-2">Promo Code Generator</p>
                    <div className="flex gap-2">
                      <input placeholder="SUMMER25" className="flex-1 bg-background border border-border px-2 py-1.5 text-xs focus:outline-none" />
                      <button className="px-3 py-1.5 bg-foreground text-background text-xs hover:opacity-90 transition-opacity">Generate</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {section === "settings" && (
            <div>
              <SectionTitle sub="Feature flags, SEO, social media, redirects, and platform config">Site Settings</SectionTitle>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="border border-border bg-card p-5">
                  <h3 className="text-sm font-medium mb-4">Feature Flags</h3>
                  <Toggle on={flags.demo_mode} onToggle={() => toggleFlag("demo_mode")} label="Demo mode" sub="Bypass auth on sign-in" />
                  <Toggle on={flags.uploads_open} onToggle={() => toggleFlag("uploads_open")} label="Photo uploads open" />
                  <Toggle on={flags.registration_open} onToggle={() => toggleFlag("registration_open")} label="New registrations" />
                  <Toggle on={flags.collections_public} onToggle={() => toggleFlag("collections_public")} label="Public collections" />
                  <Toggle on={flags.comments_enabled} onToggle={() => toggleFlag("comments_enabled")} label="Comments enabled" />
                  <Toggle on={flags.tips_enabled} onToggle={() => toggleFlag("tips_enabled")} label="Creator tips" />
                  <Toggle on={flags.licensing_enabled} onToggle={() => toggleFlag("licensing_enabled")} label="Photo licensing" />
                  <Toggle on={flags.email_notifications} onToggle={() => toggleFlag("email_notifications")} label="Email notifications" />
                  <Toggle on={flags.watermark_enabled} onToggle={() => toggleFlag("watermark_enabled")} label="Auto watermarking" sub="Add watermark on download" />
                  <Toggle on={flags.maintenance_mode} onToggle={() => toggleFlag("maintenance_mode")} label="Maintenance mode" sub="Show maintenance banner" />
                </div>
                <div className="space-y-4">
                  <div className="border border-border bg-card p-5">
                    <h3 className="text-sm font-medium mb-4">SEO Settings</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Site Title</label>
                        <input value={seoSettings.title} onChange={e => setSeoSettings(p => ({ ...p, title: e.target.value }))}
                          className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Meta Description</label>
                        <textarea value={seoSettings.desc} onChange={e => setSeoSettings(p => ({ ...p, desc: e.target.value }))}
                          rows={3} className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30 resize-none" />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">OG Image URL</label>
                        <input value={seoSettings.ogImage} onChange={e => setSeoSettings(p => ({ ...p, ogImage: e.target.value }))}
                          placeholder="https://…" className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30" />
                      </div>
                      <button className="text-xs px-3 py-2 bg-foreground text-background hover:opacity-90 transition-opacity">Save SEO Settings</button>
                    </div>
                  </div>
                  <div className="border border-border bg-card p-5">
                    <h3 className="text-sm font-medium mb-3">Social Media Links</h3>
                    {(Object.entries(socialLinks) as [keyof typeof socialLinks, string][]).map(([k, v]) => (
                      <div key={k} className="flex items-center gap-2 mb-2">
                        <span className="text-xs text-muted-foreground w-16 capitalize">{k}</span>
                        <input value={v} onChange={e => setSocialLinks(p => ({ ...p, [k]: e.target.value }))}
                          className="flex-1 bg-background border border-border px-2 py-1.5 text-xs focus:outline-none" />
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border border-border bg-card p-5 mb-6">
                <h3 className="text-sm font-medium mb-4">Announcement Banner</h3>
                <textarea value={announcementText} onChange={e => setAnnouncementText(e.target.value)}
                  placeholder="Enter announcement text (leave blank to hide)…" rows={2}
                  className="w-full bg-background border border-border p-3 text-sm resize-none focus:outline-none focus:border-foreground/30 mb-2" />
                <button className="text-xs px-3 py-1.5 border border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-colors">Save Banner</button>
              </div>

              <div className="border border-border bg-card p-5">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-muted-foreground" /> Redirect Manager
                </h3>
                <div className="border border-border mb-3">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-card/30">
                        <th className="text-left px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground font-normal">From</th>
                        <th className="text-left px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground font-normal">To</th>
                        <th className="text-center px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground font-normal">Type</th>
                        <th className="text-right px-3 py-2 text-xs uppercase tracking-widest text-muted-foreground font-normal">Hits</th>
                        <th className="px-3 py-2" />
                      </tr>
                    </thead>
                    <tbody>
                      {MOCK_REDIRECTS.map(r => (
                        <tr key={r.id} className="border-b border-border last:border-0 hover:bg-card/40">
                          <td className="px-3 py-2 font-mono text-xs">{r.from}</td>
                          <td className="px-3 py-2 font-mono text-xs text-muted-foreground">{r.to}</td>
                          <td className="px-3 py-2 text-center"><Badge color="border-border text-muted-foreground">{r.status}</Badge></td>
                          <td className="px-3 py-2 text-right text-xs text-muted-foreground">{r.hits}</td>
                          <td className="px-3 py-2">
                            <button className="text-muted-foreground hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <button className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground transition-colors">
                  <Plus className="w-3 h-3" /> Add redirect
                </button>
              </div>
            </div>
          )}

          {/* ── COMMS ── */}
          {section === "comms" && (
            <div>
              <SectionTitle sub="Email subscribers, campaigns, and platform announcements">Communications</SectionTitle>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="border border-border bg-card p-5">
                  <h3 className="text-sm font-medium mb-1">Compose Campaign</h3>
                  <p className="text-xs text-muted-foreground mb-4">Send to all {MOCK_SUBSCRIBERS.length} subscribers</p>
                  <div className="space-y-3">
                    <input value={campaignSubject} onChange={e => setCampaignSubject(e.target.value)}
                      placeholder="Subject line…"
                      className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30" />
                    <textarea value={campaignBody} onChange={e => setCampaignBody(e.target.value)}
                      placeholder="Message body…" rows={5}
                      className="w-full bg-background border border-border p-3 text-sm resize-none focus:outline-none focus:border-foreground/30" />
                    <div className="flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                      <input type="datetime-local" value={campaignDate} onChange={e => setCampaignDate(e.target.value)}
                        className="flex-1 bg-background border border-border px-2 py-1.5 text-xs focus:outline-none" />
                    </div>
                    <div className="flex items-center gap-3">
                      <button className="flex items-center gap-1.5 px-3 py-2 bg-foreground text-background text-xs hover:opacity-90 transition-opacity">
                        <Send className="w-3 h-3" /> {campaignDate ? "Schedule" : "Send now"}
                      </button>
                      <button className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 border border-border transition-colors">Preview</button>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="border border-border bg-card p-5">
                    <h3 className="text-sm font-medium mb-3">Email Stats</h3>
                    {[
                      { label: "Total subscribers", value: MOCK_SUBSCRIBERS.length.toString() },
                      { label: "Last email sent", value: "May 1, 2026" },
                      { label: "Open rate", value: "74%" },
                      { label: "Click rate", value: "38%" },
                      { label: "Bounce rate", value: "1.2%" },
                      { label: "Unsubscribes", value: "0" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className="text-xs font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border border-border bg-card p-5">
                    <h3 className="text-sm font-medium mb-3">Template Library</h3>
                    {["Weekly curations digest", "New feature announcement", "Creator spotlight", "Platform update", "Welcome email", "Monthly recap"].map(t => (
                      <button key={t}
                        className="w-full text-left text-xs text-muted-foreground hover:text-foreground py-2.5 border-b border-border last:border-0 flex items-center gap-2 transition-colors">
                        <Mail className="w-3 h-3" /> {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="border border-border mb-6">
                <div className="px-5 py-3 border-b border-border bg-card/50 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Transactional Email Log</h3>
                  <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><Download className="w-3 h-3" /> Export</button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-card/30">
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Type</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">To</th>
                      <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Status</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Sent</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { type: "welcome", to: "james@photo.co", status: "delivered", sent: "May 8, 10:24" },
                      { type: "notification", to: "aria@studio.io", status: "opened", sent: "May 7, 15:02" },
                      { type: "payout", to: "lena@lens.de", status: "delivered", sent: "May 6, 09:15" },
                      { type: "newsletter", to: "all subscribers", status: "delivered", sent: "May 1, 08:00" },
                      { type: "password_reset", to: "marcus@film.co", status: "bounced", sent: "Apr 30, 14:38" },
                    ].map((log, i) => (
                      <tr key={i} className="border-b border-border last:border-0 hover:bg-card/40 transition-colors">
                        <td className="px-4 py-3 text-xs"><Badge color="border-border text-muted-foreground">{log.type}</Badge></td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{log.to}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge color={log.status === "opened" ? "border-green-500/30 text-green-400" : log.status === "bounced" ? "border-red-500/30 text-red-400" : "border-border text-muted-foreground"}>
                            {log.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{log.sent}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="border border-border">
                <div className="px-5 py-3 border-b border-border bg-card/50 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Subscribers ({MOCK_SUBSCRIBERS.length})</h3>
                  <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1"><Download className="w-3 h-3" /> Export</button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-card/30">
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Name</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Email</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Frequency</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Since</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_SUBSCRIBERS.map(s => (
                      <tr key={s.id} className="border-b border-border hover:bg-card/40 transition-colors">
                        <td className="px-4 py-3 font-medium">{s.name}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{s.email}</td>
                        <td className="px-4 py-3"><Badge color="border-border text-muted-foreground">{s.pref}</Badge></td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{s.subscribed}</td>
                        <td className="px-4 py-3">
                          <button className="text-muted-foreground hover:text-red-400 transition-colors"><X className="w-3.5 h-3.5" /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SYSTEM ── */}
          {section === "system" && (
            <div>
              <SectionTitle sub="API health, storage, error logs, and infrastructure">System</SectionTitle>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs uppercase tracking-widest text-muted-foreground">API Ping</span>
                    <Zap className="w-4 h-4 text-green-400" />
                  </div>
                  <p className="text-3xl font-serif mb-1">
                    {apiPing === null ? "—" : apiPing === -1 ? "err" : `${apiPing}ms`}
                  </p>
                  <button onClick={() => void pingApi()} disabled={pingLoading}
                    className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 mt-1 disabled:opacity-40">
                    <RefreshCw className={cn("w-3 h-3", pingLoading && "animate-spin")} /> Ping now
                  </button>
                </div>
                <StatCard icon={Database} label="DB Queries" value="1,204" sub="today" />
                <StatCard icon={HardDrive} label="Storage" value="2.1 GB" sub="of 10 GB" />
                <StatCard icon={Activity} label="Uptime" value="99.9%" sub="last 30 days" accent="text-green-400" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="border border-border bg-card p-5">
                  <h3 className="text-sm font-medium mb-4">Service Health</h3>
                  <HealthRow label="API Server (port 8080)" status="ok" detail="200 OK — 38ms" />
                  <HealthRow label="Photo Site (port 5000)" status="ok" detail="Vite HMR active" />
                  <HealthRow label="PostgreSQL" status="ok" detail="Connected" />
                  <HealthRow label="Image CDN (Unsplash)" status="ok" detail="200 OK" />
                  <HealthRow label="Email Service" status="warn" detail="Not configured" />
                  <HealthRow label="Payment Gateway" status="warn" detail="Demo mode" />
                  <HealthRow label="Analytics Pipeline" status="ok" detail="Active" />
                </div>
                <div className="space-y-4">
                  <div className="border border-border bg-card p-5">
                    <h3 className="text-sm font-medium mb-4">Storage Breakdown</h3>
                    {[
                      { label: "Photo metadata", value: 0.2, color: "bg-blue-500" },
                      { label: "Collection data", value: 0.1, color: "bg-purple-500" },
                      { label: "User data", value: 0.05, color: "bg-green-500" },
                      { label: "Logs & audit", value: 1.75, color: "bg-amber-500" },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{label}</span>
                          <span className="text-muted-foreground">{value} GB</span>
                        </div>
                        <MiniBar value={value} max={10} color={color} />
                      </div>
                    ))}
                    <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs">
                      <span className="text-muted-foreground">Total</span>
                      <span>2.1 / 10 GB</span>
                    </div>
                  </div>
                  <div className="border border-border bg-card p-5">
                    <h3 className="text-sm font-medium mb-3">API Rate Limit Config</h3>
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-xs mb-1">
                          <span>Requests / min (global)</span>
                          <span className="font-medium">{rateLimit}</span>
                        </div>
                        <input type="range" min={30} max={500} value={rateLimit} onChange={e => setRateLimit(Number(e.target.value))}
                          className="w-full accent-foreground" />
                      </div>
                      {[
                        { endpoint: "/api/photos/*/like", limit: 10 },
                        { endpoint: "/api/photos/*/comments", limit: 20 },
                        { endpoint: "/api/photos", limit: 60 },
                      ].map(({ endpoint, limit }) => (
                        <div key={endpoint} className="flex justify-between text-xs py-1.5 border-t border-border">
                          <span className="font-mono text-muted-foreground">{endpoint}</span>
                          <span>{limit}/min</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-border mb-6">
                <div className="px-5 py-3 border-b border-border bg-card/50 flex items-center justify-between">
                  <h3 className="text-sm font-medium flex items-center gap-2"><AlertCircle className="w-4 h-4 text-muted-foreground" /> Error Log</h3>
                  <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>
                <div className="divide-y divide-border">
                  {MOCK_ERRORS.map(e => (
                    <div key={e.id} className="px-5 py-3 flex items-center gap-4">
                      <Badge color={e.level === "error" ? "border-red-500/30 text-red-400 bg-red-500/5" : e.level === "warn" ? "border-amber-500/30 text-amber-400" : "border-border text-muted-foreground"}>
                        {e.level}
                      </Badge>
                      <span className="text-sm flex-1">{e.msg}</span>
                      <span className="text-xs text-muted-foreground flex-shrink-0">{e.time}</span>
                      {e.count > 1 && <span className="text-xs bg-muted/50 px-1.5 py-0.5 text-muted-foreground">×{e.count}</span>}
                    </div>
                  ))}
                </div>
              </div>

              <div className="border border-border">
                <div className="px-5 py-3 border-b border-border bg-card/50">
                  <h3 className="text-sm font-medium flex items-center gap-2"><GitBranch className="w-4 h-4 text-muted-foreground" /> Deploy History</h3>
                </div>
                <div className="divide-y divide-border">
                  {MOCK_DEPLOYS.map(d => (
                    <div key={d.id} className="px-5 py-3 flex items-center gap-4">
                      <Badge color={d.status === "live" ? "border-green-500/30 text-green-400 bg-green-500/5" : "border-border text-muted-foreground"}>
                        {d.status}
                      </Badge>
                      <span className="text-sm font-mono">{d.version}</span>
                      <span className="text-xs text-muted-foreground flex-1">{d.notes}</span>
                      <span className="text-xs text-muted-foreground">{d.time}</span>
                      {d.status !== "live" && (
                        <button className="text-xs text-muted-foreground hover:text-foreground border border-border px-2 py-1">Rollback</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}

function ReportCard({ report, onResolve }: {
  report: RealReport;
  onResolve: (id: number, status: string) => void;
}) {
  const STATUS_COLORS: Record<string, string> = {
    pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    resolved: "bg-green-500/10 text-green-400 border-green-500/30",
    dismissed: "bg-muted/50 text-muted-foreground border-border",
  };
  return (
    <div className="border border-border bg-card p-5">
      <div className="flex items-start gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-3 mb-2 flex-wrap">
            <Badge color={STATUS_COLORS[report.status] ?? STATUS_COLORS.pending}>{report.status}</Badge>
            <span className="text-xs text-muted-foreground font-medium">{report.reason}</span>
            <span className="text-xs text-muted-foreground">
              {new Date(report.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>
          <div className="flex items-center gap-3 mb-2">
            <Link href={`/photos/${report.photoId}`}
              className="text-sm flex items-center gap-1 hover:text-foreground text-muted-foreground transition-colors">
              <ExternalLink className="w-3 h-3" /> Photo #{report.photoId}
            </Link>
            <span className="text-xs text-muted-foreground">reported by {report.reporterName}</span>
          </div>
          {report.body && <p className="text-sm text-muted-foreground italic">"{report.body}"</p>}
        </div>
        {report.status === "pending" && (
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={() => onResolve(report.id, "resolved")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors">
              <Check className="w-3 h-3" /> Resolve
            </button>
            <button onClick={() => onResolve(report.id, "dismissed")}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-3 h-3" /> Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
