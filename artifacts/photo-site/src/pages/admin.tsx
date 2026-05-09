import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import {
  useGetSiteSummary, useListPhotos, useListCollections, useListTags,
  useGetTrendingPhotos,
} from "@workspace/api-client-react";
import {
  LayoutDashboard, Image, Users, FolderOpen, Shield, Tag, DollarSign,
  Settings, Mail, Server, ChevronRight, Star, StarOff, Check, X,
  ExternalLink, AlertTriangle, TrendingUp, Download, Heart, Eye,
  Camera, BarChart3, Activity, Globe, Zap, Database, Cpu, HardDrive,
  Bell, Send, UserCheck, UserX, Ban, BadgeCheck, Trash2, Edit3,
  Filter, Search, RefreshCw, ToggleLeft, ToggleRight, Info, Plus,
  CreditCard, ArrowUpRight, Wifi, WifiOff, ChevronDown, MoreHorizontal,
} from "lucide-react";

type Section =
  | "dashboard" | "photos" | "users" | "collections"
  | "moderation" | "tags" | "monetisation" | "settings"
  | "comms" | "system";

const NAV: { id: Section; label: string; icon: React.ElementType; badge?: number }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "photos", label: "Photos", icon: Image, badge: 33 },
  { id: "users", label: "Users", icon: Users, badge: 8 },
  { id: "collections", label: "Collections", icon: FolderOpen },
  { id: "moderation", label: "Moderation", icon: Shield, badge: 3 },
  { id: "tags", label: "Tags", icon: Tag },
  { id: "monetisation", label: "Monetisation", icon: DollarSign },
  { id: "settings", label: "Site Settings", icon: Settings },
  { id: "comms", label: "Communications", icon: Mail },
  { id: "system", label: "System", icon: Server },
];

const MOCK_USERS = [
  { id: 1, name: "Aria Chen", handle: "@aria.chen", role: "photographer", photos: 5, verified: true, joined: "Jan 2026", status: "active" },
  { id: 2, name: "Marcus Reid", handle: "@marcus.reid", role: "photographer", photos: 5, verified: true, joined: "Feb 2026", status: "active" },
  { id: 3, name: "Hiroshi Nakamura", handle: "@hiroshi.nakamura", role: "photographer", photos: 4, verified: false, joined: "Feb 2026", status: "active" },
  { id: 4, name: "Lena Fischer", handle: "@lena.fischer", role: "photographer", photos: 4, verified: true, joined: "Mar 2026", status: "active" },
  { id: 5, name: "Miguel Santos", handle: "@miguel.santos", role: "photographer", photos: 4, verified: false, joined: "Mar 2026", status: "active" },
  { id: 6, name: "Amara Osei", handle: "@amara.osei", role: "photographer", photos: 4, verified: true, joined: "Apr 2026", status: "active" },
  { id: 7, name: "Sofia Petrov", handle: "@sofia.petrov", role: "photographer", photos: 4, verified: false, joined: "Apr 2026", status: "suspended" },
  { id: 8, name: "James Harlow", handle: "@james.harlow", role: "photographer", photos: 3, verified: false, joined: "May 2026", status: "active" },
];

const MOCK_REPORTS = [
  { id: 1, photoId: 4, reporterName: "@urban.eyes", reason: "copyright", body: "This looks like it was taken from my portfolio without credit.", status: "pending", createdAt: "2026-05-07T10:20:00Z" },
  { id: 2, photoId: 11, reporterName: "@nomad.lens", reason: "inappropriate", body: null, status: "pending", createdAt: "2026-05-06T14:55:00Z" },
  { id: 3, photoId: 22, reporterName: "@silentframe", reason: "spam", body: "Same photo submitted multiple times with different titles.", status: "pending", createdAt: "2026-05-05T09:10:00Z" },
  { id: 4, photoId: 8, reporterName: "@coldpixel", reason: "low-quality", body: null, status: "resolved", createdAt: "2026-05-03T16:30:00Z" },
  { id: 5, photoId: 17, reporterName: "@vista.works", reason: "copyright", body: "Original image with watermark removed.", status: "dismissed", createdAt: "2026-05-01T08:45:00Z" },
];

const MOCK_TRANSACTIONS = [
  { id: 1, photographer: "Lena Fischer", type: "license", desc: "Commercial license — Fashion editorial", amount: 120.00, date: "May 8, 2026", status: "paid" },
  { id: 2, photographer: "Aria Chen", type: "print", desc: "A3 Print — Mountain at Dusk", amount: 28.00, date: "May 7, 2026", status: "paid" },
  { id: 3, photographer: "Marcus Reid", type: "commission", desc: "Corporate portraits commission", amount: 350.00, date: "May 6, 2026", status: "pending" },
  { id: 4, photographer: "Amara Osei", type: "tip", desc: "Tip from @silentframe", amount: 5.00, date: "May 5, 2026", status: "paid" },
  { id: 5, photographer: "Hiroshi Nakamura", type: "license", desc: "Editorial license — Architecture series", amount: 60.00, date: "May 4, 2026", status: "paid" },
  { id: 6, photographer: "Sofia Petrov", type: "print", desc: "A4 Print — Fog Series", amount: 18.00, date: "May 3, 2026", status: "pending" },
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
];

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

function Toggle({ on, onToggle, label }: { on: boolean; onToggle: () => void; label: string }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-0">
      <span className="text-sm">{label}</span>
      <button onClick={onToggle} className={cn("flex items-center gap-1.5 text-xs px-3 py-1 border transition-colors",
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

export function Admin() {
  const { user, loginAsDemo } = useAuth();
  const [section, setSection] = useState<Section>("dashboard");
  const [reports, setReports] = useState(MOCK_REPORTS);
  const [users, setUsers] = useState(MOCK_USERS);
  const [userSearch, setUserSearch] = useState("");
  const [photoSearch, setPhotoSearch] = useState("");
  const [announcementText, setAnnouncementText] = useState("");
  const [flags, setFlags] = useState({
    demo_mode: true, uploads_open: true, collections_public: true,
    comments_enabled: false, tips_enabled: true, licensing_enabled: true,
    maintenance_mode: false, registration_open: true,
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
  useEffect(() => {
    if (photos.length) {
      setFeaturedPhotos(new Set(photos.filter(p => p.isFeatured).map(p => p.id)));
    }
  }, [photos]);

  function toggleFlag(key: keyof typeof flags) {
    setFlags(prev => ({ ...prev, [key]: !prev[key] }));
  }

  function resolveReport(id: number, status: "resolved" | "dismissed") {
    setReports(prev => prev.map(r => r.id === id ? { ...r, status } : r));
  }

  function toggleVerify(id: number) {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, verified: !u.verified } : u));
  }

  function toggleSuspend(id: number) {
    setUsers(prev => prev.map(u =>
      u.id === id ? { ...u, status: u.status === "suspended" ? "active" : "suspended" } : u
    ));
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
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
    u.handle.toLowerCase().includes(userSearch.toLowerCase())
  );
  const filteredPhotos = photos.filter(p =>
    p.title.toLowerCase().includes(photoSearch.toLowerCase()) ||
    p.photographerName.toLowerCase().includes(photoSearch.toLowerCase())
  );

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
            return (
              <button key={item.id} onClick={() => setSection(item.id)}
                className={cn(
                  "w-full flex items-center justify-between px-5 py-2.5 text-sm transition-colors text-left",
                  active ? "text-foreground bg-foreground/5" : "text-muted-foreground hover:text-foreground hover:bg-foreground/3"
                )}>
                <span className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 flex-shrink-0" />
                  {item.label}
                </span>
                {item.badge !== undefined && (
                  <span className={cn("text-xs px-1.5 py-0.5 min-w-[20px] text-center",
                    item.id === "moderation" && pending.length > 0
                      ? "bg-amber-500/20 text-amber-400"
                      : "bg-foreground/10 text-muted-foreground"
                  )}>
                    {item.id === "moderation" ? pending.length : item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="px-5 py-4 border-t border-border">
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="text-sm font-medium mt-0.5 truncate">{user.firstName} {user.lastName}</p>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-y-auto min-w-0">
        <div className="max-w-6xl mx-auto px-8 py-10">

          {/* ── DASHBOARD ── */}
          {section === "dashboard" && (
            <div>
              <SectionTitle sub="Platform health and performance at a glance">Dashboard</SectionTitle>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={Image} label="Total Photos" value={summary?.totalPhotos} sub="33 seeded" accent="text-blue-400" />
                <StatCard icon={Users} label="Photographers" value={8} sub="8 active" accent="text-purple-400" />
                <StatCard icon={Heart} label="Total Likes" value={summary?.totalLikes} sub="across all photos" accent="text-rose-400" />
                <StatCard icon={Download} label="Downloads" value={summary?.totalDownloads} sub="all time" accent="text-green-400" />
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
                <StatCard icon={FolderOpen} label="Collections" value={summary?.totalCollections} />
                <StatCard icon={Tag} label="Unique Tags" value={tags.length} />
                <StatCard icon={Eye} label="Total Views" value={photos.reduce((s, p) => s + (p.views ?? 0), 0)} />
                <StatCard icon={Star} label="Featured" value={photos.filter(p => p.isFeatured).length} sub="photos" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="border border-border bg-card p-5">
                  <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-muted-foreground" /> Trending Right Now
                  </h3>
                  <div className="space-y-2.5">
                    {trending.slice(0, 5).map((p, i) => (
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
                    <BarChart3 className="w-4 h-4 text-muted-foreground" /> Engagement Breakdown
                  </h3>
                  {[
                    { label: "Likes", value: summary?.totalLikes ?? 0, color: "bg-rose-500" },
                    { label: "Downloads", value: summary?.totalDownloads ?? 0, color: "bg-blue-500" },
                    { label: "Views", value: photos.reduce((s, p) => s + (p.views ?? 0), 0), color: "bg-purple-500" },
                  ].map(({ label, value, color }) => {
                    const max = Math.max(summary?.totalLikes ?? 1, summary?.totalDownloads ?? 1, photos.reduce((s, p) => s + (p.views ?? 0), 0));
                    return (
                      <div key={label} className="mb-3">
                        <div className="flex justify-between text-xs text-muted-foreground mb-1">
                          <span>{label}</span><span>{value.toLocaleString()}</span>
                        </div>
                        <div className="h-1.5 bg-border">
                          <div className={cn("h-full", color)} style={{ width: `${max ? (value / max) * 100 : 0}%` }} />
                        </div>
                      </div>
                    );
                  })}
                  <div className="mt-5 pt-4 border-t border-border">
                    <h4 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">Top Tags</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {tags.slice(0, 10).map(t => (
                        <span key={t.name} className="text-xs px-2 py-0.5 border border-border text-muted-foreground">
                          {t.name} <span className="text-foreground/60">{t.photoCount}</span>
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-border bg-card p-5">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-muted-foreground" /> Recent Audit Activity
                </h3>
                <div className="space-y-2">
                  {MOCK_AUDIT.map(e => (
                    <div key={e.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <span className="text-xs text-muted-foreground w-24 flex-shrink-0">{e.time}</span>
                      <span className="text-xs font-medium text-muted-foreground flex-shrink-0">{e.actor}</span>
                      <span className="text-xs flex-shrink-0">{e.action}</span>
                      <span className="text-xs text-muted-foreground truncate">{e.target}</span>
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
              <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input value={photoSearch} onChange={e => setPhotoSearch(e.target.value)}
                    placeholder="Search photos or photographer…"
                    className="w-full bg-card border border-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-foreground/30" />
                </div>
                <span className="text-xs text-muted-foreground">{filteredPhotos.length} photos</span>
              </div>
              <div className="border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-card/50">
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
                      return (
                        <tr key={p.id} className="border-b border-border hover:bg-card/40 transition-colors">
                          <td className="px-4 py-2.5">
                            <div className="flex items-center gap-3">
                              <img src={p.imageUrl} alt={p.title} className="w-10 h-10 object-cover flex-shrink-0" />
                              <span className="font-medium truncate max-w-[160px]">{p.title}</span>
                            </div>
                          </td>
                          <td className="px-4 py-2.5 text-muted-foreground text-xs">{p.photographerName}</td>
                          <td className="px-4 py-2.5">
                            <Badge color="border-border text-muted-foreground">{p.license?.replace(/-/g, " ") ?? "—"}</Badge>
                          </td>
                          <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{p.likes.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-right text-xs text-muted-foreground">{p.downloads.toLocaleString()}</td>
                          <td className="px-4 py-2.5 text-center">
                            <button onClick={() => setFeaturedPhotos(prev => {
                              const next = new Set(prev);
                              if (next.has(p.id)) next.delete(p.id); else next.add(p.id);
                              return next;
                            })} className="transition-colors">
                              {isFeatured
                                ? <Star className="w-4 h-4 text-amber-400 fill-amber-400 mx-auto" />
                                : <StarOff className="w-4 h-4 text-border mx-auto hover:text-muted-foreground" />}
                            </button>
                          </td>
                          <td className="px-4 py-2.5">
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
            </div>
          )}

          {/* ── USERS ── */}
          {section === "users" && (
            <div>
              <SectionTitle sub="Manage photographer accounts, roles, and access">Users</SectionTitle>
              <div className="flex items-center gap-3 mb-5">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                  <input value={userSearch} onChange={e => setUserSearch(e.target.value)}
                    placeholder="Search by name or handle…"
                    className="w-full bg-card border border-border pl-9 pr-3 py-2 text-sm focus:outline-none focus:border-foreground/30" />
                </div>
                <span className="text-xs text-muted-foreground">{filteredUsers.length} users</span>
              </div>
              <div className="border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-card/50">
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">User</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Handle</th>
                      <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Photos</th>
                      <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Verified</th>
                      <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Status</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Joined</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredUsers.map(u => (
                      <tr key={u.id} className="border-b border-border hover:bg-card/40 transition-colors">
                        <td className="px-4 py-3 font-medium">{u.name}</td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{u.handle}</td>
                        <td className="px-4 py-3 text-right text-xs text-muted-foreground">{u.photos}</td>
                        <td className="px-4 py-3 text-center">
                          <button onClick={() => toggleVerify(u.id)} title="Toggle verified">
                            {u.verified
                              ? <BadgeCheck className="w-4 h-4 text-blue-400 mx-auto" />
                              : <span className="block w-4 h-4 border border-border mx-auto" />}
                          </button>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <Badge color={u.status === "active"
                            ? "border-green-500/30 text-green-400 bg-green-500/5"
                            : "border-red-500/30 text-red-400 bg-red-500/5"}>
                            {u.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground text-xs">{u.joined}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleSuspend(u.id)}
                            title={u.status === "suspended" ? "Reinstate" : "Suspend"}
                            className="text-muted-foreground hover:text-foreground transition-colors">
                            {u.status === "suspended"
                              ? <UserCheck className="w-3.5 h-3.5" />
                              : <UserX className="w-3.5 h-3.5" />}
                          </button>
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
              <div className="border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-card/50">
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Collection</th>
                      <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Photos</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Description</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {collections.map(c => (
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
                        <td className="px-4 py-3">
                          <Link href={`/collections/${c.id}`}
                            className="text-muted-foreground hover:text-foreground transition-colors">
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
              <SectionTitle sub="Review flagged content and take action">Moderation</SectionTitle>
              {pending.length > 0 && (
                <div className="mb-8">
                  <h3 className="text-xs uppercase tracking-widest text-amber-400 mb-4 flex items-center gap-2">
                    <AlertTriangle className="w-3.5 h-3.5" /> Pending ({pending.length})
                  </h3>
                  <div className="space-y-3">
                    {pending.map(r => (
                      <ReportCard key={r.id} report={r} onResolve={resolveReport} />
                    ))}
                  </div>
                </div>
              )}
              {reports.filter(r => r.status !== "pending").length > 0 && (
                <div className="opacity-60">
                  <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">
                    Reviewed ({reports.filter(r => r.status !== "pending").length})
                  </h3>
                  <div className="space-y-3">
                    {reports.filter(r => r.status !== "pending").map(r => (
                      <ReportCard key={r.id} report={r} onResolve={resolveReport} />
                    ))}
                  </div>
                </div>
              )}
              {reports.length === 0 && (
                <div className="py-24 text-center border border-dashed border-border text-muted-foreground">
                  <Shield className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No reports. The community is well-behaved!</p>
                </div>
              )}
            </div>
          )}

          {/* ── TAGS ── */}
          {section === "tags" && (
            <div>
              <SectionTitle sub="Explore, merge, and manage the taxonomy">Tags</SectionTitle>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 border border-border bg-card p-5">
                  <h3 className="text-sm font-medium mb-4">All Tags ({tags.length})</h3>
                  <div className="flex flex-wrap gap-2 max-h-96 overflow-y-auto">
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
                            <div className="h-1 bg-border">
                              <div className="h-full bg-foreground/40" style={{ width: `${(t.photoCount / max) * 100}%` }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <div className="border border-border bg-card p-5">
                    <h3 className="text-sm font-medium mb-3">Actions</h3>
                    <div className="space-y-2">
                      {[
                        "Merge duplicate tags",
                        "Delete unused tags",
                        "Set trending tags",
                        "Export tag list CSV",
                        "Add tag synonym",
                      ].map(action => (
                        <button key={action}
                          className="w-full text-left text-xs text-muted-foreground hover:text-foreground py-2 border-b border-border last:border-0 flex items-center gap-2 transition-colors">
                          <ChevronRight className="w-3 h-3" /> {action}
                        </button>
                      ))}
                    </div>
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
                <StatCard icon={ArrowUpRight} label="Pending Payouts" value="$368" sub="2 creators" accent="text-amber-400" />
                <StatCard icon={TrendingUp} label="Avg per Creator" value="$82" sub="monthly" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="border border-border bg-card p-5">
                  <h3 className="text-sm font-medium mb-4">Revenue by Type</h3>
                  {[
                    { label: "Commissions", value: 350, color: "bg-purple-500" },
                    { label: "Licensing", value: 180, color: "bg-blue-500" },
                    { label: "Prints", value: 124, color: "bg-green-500" },
                    { label: "Tips", value: 9, color: "bg-amber-500" },
                  ].map(({ label, value, color }) => (
                    <div key={label} className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{label}</span>
                        <span className="text-muted-foreground">${value}</span>
                      </div>
                      <div className="h-1.5 bg-border">
                        <div className={cn("h-full", color)} style={{ width: `${(value / 350) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="border border-border bg-card p-5">
                  <h3 className="text-sm font-medium mb-4">Top Earners</h3>
                  <div className="space-y-3">
                    {[
                      { name: "Lena Fischer", earned: "$475", type: "Commissions + Licensing" },
                      { name: "Aria Chen", earned: "$94", type: "Prints + Tips" },
                      { name: "Marcus Reid", earned: "$60", type: "Licensing" },
                      { name: "Amara Osei", earned: "$34", type: "Prints + Tips" },
                    ].map(e => (
                      <div key={e.name} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                        <div>
                          <p className="text-sm">{e.name}</p>
                          <p className="text-xs text-muted-foreground">{e.type}</p>
                        </div>
                        <span className="text-sm font-medium text-green-400">{e.earned}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="border border-border">
                <div className="px-5 py-3 border-b border-border bg-card/50 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Transaction Log</h3>
                  <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <Download className="w-3 h-3" /> Export CSV
                  </button>
                </div>
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-card/30">
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Photographer</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Description</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Type</th>
                      <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Amount</th>
                      <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Status</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {MOCK_TRANSACTIONS.map(t => (
                      <tr key={t.id} className="border-b border-border hover:bg-card/40 transition-colors">
                        <td className="px-4 py-3 font-medium text-sm">{t.photographer}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{t.desc}</td>
                        <td className="px-4 py-3">
                          <Badge color="border-border text-muted-foreground">{t.type}</Badge>
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-medium">${t.amount.toFixed(2)}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge color={t.status === "paid"
                            ? "border-green-500/30 text-green-400 bg-green-500/5"
                            : "border-amber-500/30 text-amber-400 bg-amber-500/5"}>
                            {t.status}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground">{t.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {section === "settings" && (
            <div>
              <SectionTitle sub="Feature flags, homepage config, and platform settings">Site Settings</SectionTitle>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-border bg-card p-5">
                  <h3 className="text-sm font-medium mb-4">Feature Flags</h3>
                  <Toggle on={flags.demo_mode} onToggle={() => toggleFlag("demo_mode")} label="Demo mode (bypass auth)" />
                  <Toggle on={flags.uploads_open} onToggle={() => toggleFlag("uploads_open")} label="Photo uploads open" />
                  <Toggle on={flags.registration_open} onToggle={() => toggleFlag("registration_open")} label="New registrations" />
                  <Toggle on={flags.collections_public} onToggle={() => toggleFlag("collections_public")} label="Public collections" />
                  <Toggle on={flags.comments_enabled} onToggle={() => toggleFlag("comments_enabled")} label="Comments enabled" />
                  <Toggle on={flags.tips_enabled} onToggle={() => toggleFlag("tips_enabled")} label="Creator tips" />
                  <Toggle on={flags.licensing_enabled} onToggle={() => toggleFlag("licensing_enabled")} label="Photo licensing" />
                  <Toggle on={flags.maintenance_mode} onToggle={() => toggleFlag("maintenance_mode")} label="Maintenance mode" />
                </div>
                <div className="space-y-4">
                  <div className="border border-border bg-card p-5">
                    <h3 className="text-sm font-medium mb-4">Homepage Config</h3>
                    {[
                      { label: "Hero title", value: "The world's most curated photography." },
                      { label: "Hero subtitle", value: "No algorithms. No noise." },
                      { label: "Featured section limit", value: "8 photos" },
                      { label: "Trending section limit", value: "12 photos" },
                      { label: "Collections shown", value: "3 collections" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className="text-xs">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border border-border bg-card p-5">
                    <h3 className="text-sm font-medium mb-3">Announcement Banner</h3>
                    <textarea value={announcementText} onChange={e => setAnnouncementText(e.target.value)}
                      placeholder="Enter announcement text (leave blank to hide)…"
                      rows={3}
                      className="w-full bg-background border border-border p-3 text-sm resize-none focus:outline-none focus:border-foreground/30 text-foreground placeholder:text-muted-foreground" />
                    <button className="mt-2 text-xs px-3 py-1.5 border border-border hover:border-foreground/30 text-muted-foreground hover:text-foreground transition-colors">
                      Save Banner
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ── COMMS ── */}
          {section === "comms" && (
            <div>
              <SectionTitle sub="Email subscribers, newsletters, and platform announcements">Communications</SectionTitle>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="border border-border bg-card p-5">
                  <h3 className="text-sm font-medium mb-1">Compose Announcement</h3>
                  <p className="text-xs text-muted-foreground mb-4">Send an email to all subscribers</p>
                  <input placeholder="Subject line…"
                    className="w-full bg-background border border-border px-3 py-2 text-sm mb-3 focus:outline-none focus:border-foreground/30" />
                  <textarea placeholder="Message body…" rows={5}
                    className="w-full bg-background border border-border p-3 text-sm resize-none focus:outline-none focus:border-foreground/30 mb-3" />
                  <div className="flex items-center gap-3">
                    <button className="flex items-center gap-1.5 px-3 py-2 bg-foreground text-background text-xs hover:opacity-90 transition-opacity">
                      <Send className="w-3 h-3" /> Send to 5 subscribers
                    </button>
                    <button className="text-xs text-muted-foreground hover:text-foreground px-3 py-2 border border-border transition-colors">
                      Preview
                    </button>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="border border-border bg-card p-5">
                    <h3 className="text-sm font-medium mb-3">Email Stats</h3>
                    {[
                      { label: "Total subscribers", value: "5" },
                      { label: "Last email sent", value: "May 1, 2026" },
                      { label: "Open rate", value: "74%" },
                      { label: "Click rate", value: "38%" },
                      { label: "Unsubscribes", value: "0" },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex items-center justify-between py-2.5 border-b border-border last:border-0">
                        <span className="text-xs text-muted-foreground">{label}</span>
                        <span className="text-xs font-medium">{value}</span>
                      </div>
                    ))}
                  </div>
                  <div className="border border-border bg-card p-5">
                    <h3 className="text-sm font-medium mb-3">Quick Templates</h3>
                    {["Weekly curations digest", "New feature announcement", "Creator spotlight", "Platform update"].map(t => (
                      <button key={t}
                        className="w-full text-left text-xs text-muted-foreground hover:text-foreground py-2.5 border-b border-border last:border-0 flex items-center gap-2 transition-colors">
                        <Mail className="w-3 h-3" /> {t}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div className="border border-border">
                <div className="px-5 py-3 border-b border-border bg-card/50 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Subscribers ({MOCK_SUBSCRIBERS.length})</h3>
                  <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <Download className="w-3 h-3" /> Export
                  </button>
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
                <StatCard icon={Cpu} label="API Uptime" value="99.9%" sub="last 30 days" accent="text-green-400" />
                <StatCard icon={Database} label="DB Queries" value="1,204" sub="today" />
                <StatCard icon={HardDrive} label="Storage Used" value="2.1 GB" sub="of 10 GB" />
                <StatCard icon={Zap} label="Avg Response" value="38ms" sub="p95" accent="text-green-400" />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="border border-border bg-card p-5">
                  <h3 className="text-sm font-medium mb-4">Service Health</h3>
                  <HealthRow label="API Server (port 8080)" status="ok" detail="200 OK — 38ms" />
                  <HealthRow label="Photo Site (port 5000)" status="ok" detail="200 OK — Vite" />
                  <HealthRow label="PostgreSQL" status="ok" detail="Connected" />
                  <HealthRow label="Image CDN (Unsplash)" status="ok" detail="200 OK" />
                  <HealthRow label="Email Service" status="warn" detail="Not configured" />
                  <HealthRow label="Payment Gateway" status="warn" detail="Demo mode" />
                </div>
                <div className="border border-border bg-card p-5">
                  <h3 className="text-sm font-medium mb-4">Storage Breakdown</h3>
                  {[
                    { label: "Photo metadata (DB)", value: 0.2, max: 10, color: "bg-blue-500" },
                    { label: "Collection data", value: 0.1, max: 10, color: "bg-purple-500" },
                    { label: "User data", value: 0.05, max: 10, color: "bg-green-500" },
                    { label: "Logs & audit trail", value: 1.75, max: 10, color: "bg-amber-500" },
                  ].map(({ label, value, max, color }) => (
                    <div key={label} className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{label}</span>
                        <span className="text-muted-foreground">{value} GB</span>
                      </div>
                      <div className="h-1.5 bg-border">
                        <div className={cn("h-full", color)} style={{ width: `${(value / max) * 100}%` }} />
                      </div>
                    </div>
                  ))}
                  <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs">
                    <span className="text-muted-foreground">Total used</span>
                    <span>2.1 / 10 GB</span>
                  </div>
                </div>
              </div>
              <div className="border border-border">
                <div className="px-5 py-3 border-b border-border bg-card/50 flex items-center justify-between">
                  <h3 className="text-sm font-medium">Audit Log</h3>
                  <button className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1.5">
                    <RefreshCw className="w-3 h-3" /> Refresh
                  </button>
                </div>
                <div className="divide-y divide-border">
                  {MOCK_AUDIT.map(e => (
                    <div key={e.id} className="px-5 py-3 flex items-center gap-4 text-sm hover:bg-card/40">
                      <span className="text-xs text-muted-foreground w-24 flex-shrink-0">{e.time}</span>
                      <span className="text-xs font-medium text-muted-foreground w-24 flex-shrink-0 truncate">{e.actor}</span>
                      <span className="text-xs flex-1">{e.action}</span>
                      <span className="text-xs text-muted-foreground">{e.target}</span>
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
  report: typeof MOCK_REPORTS[0];
  onResolve: (id: number, status: "resolved" | "dismissed") => void;
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
