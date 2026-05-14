import { useEffect, useState, useRef, useCallback } from "react";
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
  Settings, Mail, Server, Star, StarOff, Check, X, EyeOff,
  ExternalLink, AlertTriangle, TrendingUp, Download, Heart, Eye,
  BarChart3, Activity, Zap, Database, HardDrive,
  Bell, Send, UserCheck, UserX, BadgeCheck, RefreshCw, ToggleLeft, ToggleRight,
  Plus, CreditCard, ArrowUpRight, Wifi, WifiOff, ChevronRight,
  Globe, Monitor, Smartphone, Tablet, Search, Filter,
  Calendar, Clock, ChevronDown, Edit3, Trash2, Copy, ExternalLink as LinkIcon,
  Layers, GitBranch, Package, AlertCircle, Menu, MessageSquare, KeyRound, Lock, Crown,
} from "lucide-react";

type Section =
  | "dashboard" | "analytics" | "photos" | "users" | "collections"
  | "moderation" | "tags" | "monetisation" | "locks" | "livechat" | "settings" | "integrations" | "comms" | "system"
  | "verifications" | "subscriptions" | "pages";

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

interface SystemMetrics {
  databaseSizeBytes: number;
  limitBytes: number | null;
  breakdown: {
    photos: number;
    collections: number;
    users: number;
    logs: number;
  };
  sampledAt: string;
  source: string;
}

type IntegrationProvider = "stripe" | "openai" | "clerk" | "supabase";

interface IntegrationRecord {
  provider: IntegrationProvider;
  isConnected: boolean;
  maskedConfig: Record<string, string>;
  lastTestStatus: string | null;
  lastTestedAt: string | null;
  updatedAt: string;
}

function ensureArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

function formatGiB(bytes: number): string {
  return `${(bytes / (1024 ** 3)).toFixed(2)} GB`;
}

const NAV: { id: Section; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "photos", label: "Photos", icon: Image, badge: "33" },
  { id: "users", label: "Users", icon: Users, badge: "8" },
  { id: "collections", label: "Collections", icon: FolderOpen },
  { id: "moderation", label: "Moderation", icon: Shield },
  { id: "tags", label: "Tags", icon: Tag },
  { id: "verifications", label: "Verifications", icon: BadgeCheck },
  { id: "subscriptions", label: "Subscriptions", icon: CreditCard },
  { id: "locks", label: "Locks", icon: Lock },
  { id: "livechat", label: "Live Chat", icon: MessageSquare },
  { id: "pages", label: "Hide Pages", icon: EyeOff },
  { id: "settings", label: "Site Settings", icon: Settings },
  { id: "integrations", label: "Integrations", icon: KeyRound },
  { id: "comms", label: "Communications", icon: Mail },
  { id: "system", label: "System", icon: Server },
];

interface AdminUserRow {
  id: string;
  email: string | null;
  firstName: string | null;
  lastName: string | null;
  subscriptionStatus: string | null;
  createdAt: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  handle: string;
  role: string;
  photos: number;
  verified: boolean;
  joined: string;
  status: "active" | "suspended";
  earnings: string;
  subscriptionStatus: string | null;
}

const REDIRECT_RULES: Array<{ id: number; from: string; to: string; status: number; hits: number }> = [];
const DEPLOY_HISTORY: Array<{ id: number; version: string; actor: string; status: string; time: string; notes: string }> = [];
const SYSTEM_ERRORS: Array<{ id: number; level: string; msg: string; time: string; count: number }> = [];

const BANNED_WORDS = ["spam", "click here", "free money", "buy followers", "discount code"];
const FEATURED_TAG = { tag: "golden hour", since: "May 6, 2026" };

// ─── Confirm Dialog ───────────────────────────────────────────────────────────
interface ConfirmAction {
  title: string;
  desc: string;
  onConfirm: () => void;
  dangerous?: boolean;
  confirmLabel?: string;
}

function ConfirmDialog({ action, onCancel }: { action: ConfirmAction; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-[300]">
      <div className="w-80 border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start gap-3 mb-4">
          {action.dangerous
            ? <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
            : <Shield className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />}
          <div>
            <p className="font-medium text-sm">{action.title}</p>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{action.desc}</p>
          </div>
        </div>
        <p className="text-xs text-muted-foreground border border-border/50 bg-muted/20 px-3 py-2 mb-5">
          This action is logged in the audit trail.
        </p>
        <div className="flex gap-2">
          <button
            onClick={() => { action.onConfirm(); onCancel(); }}
            className={cn(
              "flex-1 py-2.5 text-sm font-medium transition-colors",
              action.dangerous
                ? "border border-red-500/40 text-red-400 hover:bg-red-500/10"
                : "bg-foreground text-background hover:opacity-90"
            )}
          >
            {action.confirmLabel ?? "Confirm"}
          </button>
          <button
            onClick={onCancel}
            className="flex-1 py-2.5 text-sm border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

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
  const { user, isAdmin, isLoading } = useAuth();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  const [confirm, setConfirm] = useState<ConfirmAction | null>(null);
  const [section, setSection] = useState<Section>("dashboard");
  const [reports, setReports] = useState<RealReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(true);
  const [users, setUsers] = useState<AdminUser[]>([]);
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
  const [seedCounts, setSeedCounts] = useState<{ photos: number; collections: number; hasData: boolean } | null>(null);
  const [seedLoading, setSeedLoading] = useState(false);
  const [seedMsg, setSeedMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [systemMetrics, setSystemMetrics] = useState<SystemMetrics | null>(null);
  const [systemMetricsLoading, setSystemMetricsLoading] = useState(true);
  const [integrations, setIntegrations] = useState<IntegrationRecord[]>([]);
  const [integrationsLoading, setIntegrationsLoading] = useState(true);
  const [stripeKey, setStripeKey] = useState("");
  const [openAiKey, setOpenAiKey] = useState("");
  const [clerkPublishableKey, setClerkPublishableKey] = useState("");
  const [clerkSecretKey, setClerkSecretKey] = useState("");
  const [supabaseUrl, setSupabaseUrl] = useState("");
  const [supabaseAnonKey, setSupabaseAnonKey] = useState("");
  const [supabaseServiceRoleKey, setSupabaseServiceRoleKey] = useState("");
  const [integrationMessage, setIntegrationMessage] = useState<string | null>(null);
  const [savingProvider, setSavingProvider] = useState<IntegrationProvider | null>(null);
  const [testingProvider, setTestingProvider] = useState<IntegrationProvider | null>(null);
  const [editingPhotoId, setEditingPhotoId] = useState<number | null>(null);
  const [spotlightIdx, setSpotlightIdx] = useState(0);
  const [featuredThisMonth, setFeaturedThisMonth] = useState<number | null>(() => {
    try { const v = localStorage.getItem("affuaa_featured_spotlight"); return v ? parseInt(v, 10) : null; } catch { return null; }
  });
  const [spotlightMsg, setSpotlightMsg] = useState<string | null>(null);

  // ── Hidden Pages ───────────────────────────────────────────────────────────
  const HIDDEN_PAGES_KEY = "affuaa_hidden_pages";
  const HIDEABLE_PAGES = [
    { path: "/", label: "Home", desc: "Landing page and hero" },
    { path: "/photos", label: "Explore", desc: "Photo grid with search and filters" },
    { path: "/collections", label: "Collections", desc: "Curated photo collections" },
    { path: "/discover", label: "Today's Edit", desc: "Daily curated selection" },
    { path: "/premium", label: "Premium", desc: "Premium subscription page" },
    { path: "/leaderboard", label: "Leaderboard", desc: "Top photographers by stats" },
    { path: "/upload", label: "Upload", desc: "Photo upload page" },
    { path: "/moodboard", label: "Mood Board", desc: "Personal mood board tool" },
    { path: "/series", label: "Series", desc: "Photo series collections" },
    { path: "/photo-of-the-day", label: "Photo of the Day", desc: "Daily featured photo" },
    { path: "/monetise", label: "Monetise", desc: "Creator monetisation hub" },
  ];
  const [hiddenPages, setHiddenPagesState] = useState<string[]>(() => {
    try { return JSON.parse(localStorage.getItem(HIDDEN_PAGES_KEY) ?? "[]") as string[]; }
    catch { return []; }
  });
  function toggleHiddenPage(path: string) {
    setHiddenPagesState(prev => {
      const next = prev.includes(path) ? prev.filter(p => p !== path) : [...prev, path];
      localStorage.setItem(HIDDEN_PAGES_KEY, JSON.stringify(next));
      return next;
    });
  }

  const [rateLimit, setRateLimit] = useState(120);
  const [seoSettings, setSeoSettings] = useState({ title: "Affuaa — Gallery-quality photography", desc: "Discover extraordinary images carefully selected for those who care about the craft.", ogImage: "" });
  const [socialLinks, setSocialLinks] = useState({ instagram: "@affuaa", twitter: "@affuaa_photos", facebook: "", pinterest: "affuaa" });

  // ── Maintenance Mode ────────────────────────────────────────────────────────
  const MAINTENANCE_KEY = "affuaa_maintenance";
  interface MaintenanceConfig { enabled: boolean; message: string; returnTime: string; }
  const [maintenance, setMaintenanceState] = useState<MaintenanceConfig>(() => {
    try { return JSON.parse(localStorage.getItem(MAINTENANCE_KEY) ?? "null") as MaintenanceConfig ?? { enabled: false, message: "", returnTime: "" }; }
    catch { return { enabled: false, message: "", returnTime: "" }; }
  });
  function saveMaintenance(next: MaintenanceConfig) {
    setMaintenanceState(next);
    localStorage.setItem(MAINTENANCE_KEY, JSON.stringify(next));
    window.dispatchEvent(new CustomEvent("affuaa-maintenance-changed", { detail: next }));
  }

  // ── Payouts ────────────────────────────────────────────────────────────────
  interface Payout {
    id: number; payoutId: string; photographerName: string; email: string | null;
    type: string; description: string; amount: string; status: string;
    paymentMethod: string; paypalEmail: string | null; bankName: string | null;
    bankAccountHolder: string | null; bankAccountLast4: string | null; bankRoutingLast4: string | null;
    notes: string | null; adminNotes: string | null; requestedAt: string; processedAt: string | null;
  }
  const [payouts, setPayouts] = useState<Payout[]>([]);
  const [payoutsLoading, setPayoutsLoading] = useState(true);
  const [newPayout, setNewPayout] = useState({ photographerName: "", email: "", type: "commission", description: "", amount: "" });
  const [addingPayout, setAddingPayout] = useState(false);
  const [payoutNoteId, setPayoutNoteId] = useState<number | null>(null);
  const [payoutNote, setPayoutNote] = useState("");

  useEffect(() => {
    fetch("/api/payouts").then(r => r.json())
      .then((d: { payouts: Payout[] }) => setPayouts(d.payouts ?? []))
      .catch(() => {})
      .finally(() => setPayoutsLoading(false));
  }, []);

  async function patchPayout(id: number, body: object) {
    const updated = await fetch(`/api/payouts/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json() as Promise<Payout>);
    setPayouts(prev => prev.map(p => p.id === id ? updated : p));
  }

  async function createPayout() {
    if (!newPayout.photographerName || !newPayout.description || !newPayout.amount) return;
    setAddingPayout(true);
    try {
      const p = await fetch("/api/payouts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...newPayout, amount: parseFloat(newPayout.amount) }) }).then(r => r.json() as Promise<Payout>);
      setPayouts(prev => [p, ...prev]);
      setNewPayout({ photographerName: "", email: "", type: "commission", description: "", amount: "" });
    } catch { /* ignore */ } finally { setAddingPayout(false); }
  }

  // ── Verification Requests ─────────────────────────────────────────────────
  interface VerificationRequest {
    id: number; userId: string; photographerName: string; email: string | null;
    portfolioUrl: string | null; instagramUrl: string | null; website: string | null;
    bio: string | null; photoCount: number | null; followerCount: number | null;
    reason: string | null; status: string; adminNotes: string | null;
    reviewedBy: string | null; submittedAt: string; reviewedAt: string | null;
  }
  const [verifications, setVerifications] = useState<VerificationRequest[]>([]);
  const [verificationsLoading, setVerificationsLoading] = useState(true);
  const [verificationNoteId, setVerificationNoteId] = useState<number | null>(null);
  const [verificationNote, setVerificationNote] = useState("");

  useEffect(() => {
    if (section === "verifications") {
      setVerificationsLoading(true);
      fetch("/api/verification-requests", { credentials: "include" })
        .then(r => r.json())
        .then((d: { requests: VerificationRequest[] }) => setVerifications(d.requests ?? []))
        .catch(() => {})
        .finally(() => setVerificationsLoading(false));
    }
  }, [section]);

  async function reviewVerification(id: number, status: "approved" | "rejected", adminNotes?: string) {
    const updated = await fetch(`/api/verification-requests/${id}`, {
      method: "PATCH", credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, adminNotes }),
    }).then(r => r.json() as Promise<{ request: VerificationRequest }>);
    setVerifications(prev => prev.map(v => v.id === id ? updated.request : v));
    setVerificationNoteId(null);
    setVerificationNote("");
  }

  // ── Subscriptions ─────────────────────────────────────────────────────────
  interface SubUser { id: string; email: string | null; firstName: string | null; lastName: string | null; subscriptionStatus: string; stripeSubscriptionId: string | null; subscriptionCurrentPeriodEnd: string | null; createdAt: string; }
  const [subUsers, setSubUsers] = useState<SubUser[]>([]);
  const [subUsersLoading, setSubUsersLoading] = useState(true);

  useEffect(() => {
    if (section === "subscriptions") {
      setSubUsersLoading(true);
      fetch("/api/admin/subscriptions", { credentials: "include" })
        .then(r => r.json())
        .then((d: { users: SubUser[] }) => setSubUsers(d.users ?? []))
        .catch(() => {})
        .finally(() => setSubUsersLoading(false));
    }
  }, [section]);

  // ── Locks ────────────────────────────────────────────────────────────────
  interface Lock {
    id: number; lockType: string; targetId: string; targetLabel: string;
    reason: string | null; lockedBy: string; isActive: boolean; lockedAt: string; unlockedAt: string | null;
  }
  const [locks, setLocks] = useState<Lock[]>([]);
  const [locksLoading, setLocksLoading] = useState(true);
  const [newLock, setNewLock] = useState({ lockType: "user", targetId: "", targetLabel: "", reason: "" });
  const [addingLock, setAddingLock] = useState(false);

  useEffect(() => {
    fetch("/api/locks").then(r => r.json())
      .then((d: { locks: Lock[] }) => setLocks(d.locks ?? []))
      .catch(() => {})
      .finally(() => setLocksLoading(false));
  }, []);

  async function createLock() {
    if (!newLock.targetId || !newLock.reason) return;
    setAddingLock(true);
    try {
      const body = { ...newLock, targetLabel: newLock.targetLabel || newLock.targetId, lockedBy: "admin" };
      const l = await fetch("/api/locks", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json() as Promise<Lock>);
      setLocks(prev => [l, ...prev]);
      setNewLock({ lockType: "user", targetId: "", targetLabel: "", reason: "" });
    } catch { /* ignore */ } finally { setAddingLock(false); }
  }

  async function toggleLock(id: number, isActive: boolean) {
    const updated = await fetch(`/api/locks/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isActive }) }).then(r => r.json() as Promise<Lock>);
    setLocks(prev => prev.map(l => l.id === id ? updated : l));
  }

  async function deleteLock(id: number) {
    await fetch(`/api/locks/${id}`, { method: "DELETE" });
    setLocks(prev => prev.filter(l => l.id !== id));
  }

  // ── PIN Config ─────────────────────────────────────────────────────────────
  const PIN_STORE = "affuaa_admin_pin_v2";
  const OWNER_UNLOCK_SESSION_KEY = "affuaa_admin_owner_unlock_v1";
  const [currentPin, setCurrentPin] = useState(() => localStorage.getItem(PIN_STORE) ?? "");
  const [pinForm, setPinForm] = useState({ current: "", next: "", confirm: "" });
  const [pinMsg, setPinMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [ownerUnlockPin, setOwnerUnlockPin] = useState("");
  const [ownerUnlockError, setOwnerUnlockError] = useState<string | null>(null);
  const [loadingTimedOut, setLoadingTimedOut] = useState(false);
  const [ownerUnlocked, setOwnerUnlocked] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem(OWNER_UNLOCK_SESSION_KEY) === "1";
    } catch {
      return false;
    }
  });

  function unlockWithOwnerPin() {
    const storedPin = currentPin.trim();
    if (!storedPin) {
      setOwnerUnlockError("Owner PIN is not set on this device yet.");
      return;
    }
    if (ownerUnlockPin.trim() !== storedPin) {
      setOwnerUnlockError("Incorrect owner PIN.");
      return;
    }
    try {
      sessionStorage.setItem(OWNER_UNLOCK_SESSION_KEY, "1");
    } catch {
      // Ignore storage failures.
    }
    setOwnerUnlocked(true);
    setOwnerUnlockError(null);
  }

  function changePin() {
    const stored = localStorage.getItem(PIN_STORE) ?? "";
    if (stored && pinForm.current !== stored) { setPinMsg({ ok: false, text: "Current PIN is incorrect." }); return; }
    if (pinForm.next.length < 4) { setPinMsg({ ok: false, text: "PIN must be at least 4 characters." }); return; }
    if (pinForm.next !== pinForm.confirm) { setPinMsg({ ok: false, text: "New PINs do not match." }); return; }
    localStorage.setItem(PIN_STORE, pinForm.next);
    setCurrentPin(pinForm.next);
    setPinForm({ current: "", next: "", confirm: "" });
    setPinMsg({ ok: true, text: "PIN updated successfully." });
    setTimeout(() => setPinMsg(null), 3000);
  }

  // ── Live Chat (admin side) ──────────────────────────────────────────────────
  interface ChatSession { sessionId: string; customerName: string; lastMessage: string; lastAt: string; unread: number; messageCount: number; }
  interface ChatMsg { id: number; sessionId: string; senderName: string; senderRole: string; message: string; read: boolean; createdAt: string; }
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [chatSessionsLoading, setChatSessionsLoading] = useState(true);
  const [activeChatSession, setActiveChatSession] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMsg[]>([]);
  const [chatReply, setChatReply] = useState("");
  const [chatSending, setChatSending] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  const fetchChatSessions = useCallback(async () => {
    try {
      const d = await fetch("/api/support-chat/sessions").then(r => r.json()) as { sessions: ChatSession[] };
      setChatSessions(d.sessions ?? []);
    } catch { /* ignore */ } finally { setChatSessionsLoading(false); }
  }, []);

  const fetchChatMessages = useCallback(async (sid: string) => {
    try {
      const d = await fetch(`/api/support-chat/${sid}`).then(r => r.json()) as { messages: ChatMsg[] };
      setChatMessages(d.messages ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    if (section === "livechat") {
      void fetchChatSessions();
      const iv = setInterval(() => { void fetchChatSessions(); }, 5000);
      return () => clearInterval(iv);
    }
  }, [section, fetchChatSessions]);

  useEffect(() => {
    if (activeChatSession) {
      void fetchChatMessages(activeChatSession);
      const iv = setInterval(() => { void fetchChatMessages(activeChatSession); }, 3000);
      return () => clearInterval(iv);
    }
  }, [activeChatSession, fetchChatMessages]);

  useEffect(() => { chatBottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);

  async function sendChatReply() {
    if (!chatReply.trim() || !activeChatSession || chatSending) return;
    setChatSending(true);
    const text = chatReply.trim();
    setChatReply("");
    try {
      await fetch("/api/support-chat", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ sessionId: activeChatSession, senderName: "Affuaa Support", senderRole: "support", message: text }) });
      await fetchChatMessages(activeChatSession);
      await fetchChatSessions();
    } catch { /* ignore */ } finally { setChatSending(false); }
  }
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

  const photos = ensureArray<Photo>((photosData as { photos?: Photo[] } | undefined)?.photos ?? photosData);
  const collections = ensureArray<Collection>(collectionsData);
  const tags = ensureArray<string>((tagsData as { tags?: string[] } | undefined)?.tags ?? tagsData);
  const trending = ensureArray<Photo>((trendingData as { photos?: Photo[] } | undefined)?.photos ?? trendingData);

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
    fetch("/api/admin/subscriptions", { credentials: "include" })
      .then(r => r.json())
      .then((d: { users?: AdminUserRow[] }) => {
        const liveUsers = ensureArray<AdminUserRow>(d.users).map((u) => {
          const email = u.email ?? "";
          const inferredName = [u.firstName, u.lastName].filter(Boolean).join(" ").trim();
          const name = inferredName || email || u.id;
          const username = email ? email.split("@")[0] : u.id;
          return {
            id: u.id,
            email,
            name,
            handle: `@${username}`,
            role: u.subscriptionStatus === "active" ? "premium" : "photographer",
            photos: 0,
            verified: false,
            joined: new Date(u.createdAt).toLocaleDateString("en-GB", { month: "short", year: "numeric" }),
            status: "active" as const,
            earnings: "$0",
            subscriptionStatus: u.subscriptionStatus,
          };
        });
        setUsers(liveUsers);
      })
      .catch(() => setUsers([]));
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

  useEffect(() => {
    fetch("/api/admin/system-metrics", { credentials: "include" })
      .then(r => r.json())
      .then((d: SystemMetrics) => setSystemMetrics(d))
      .catch(() => setSystemMetrics(null))
      .finally(() => setSystemMetricsLoading(false));
  }, []);

  async function loadIntegrations() {
    setIntegrationsLoading(true);
    try {
      const data = await fetch("/api/admin/integrations", { credentials: "include" }).then(r => r.json()) as { integrations?: IntegrationRecord[] };
      setIntegrations(ensureArray<IntegrationRecord>(data.integrations));
    } catch {
      setIntegrations([]);
    } finally {
      setIntegrationsLoading(false);
    }
  }

  useEffect(() => {
    void loadIntegrations();
  }, []);

  async function saveIntegration(provider: IntegrationProvider, config: Record<string, string>) {
    const trimmedConfig = Object.fromEntries(Object.entries(config).filter(([, value]) => value.trim()));
    if (Object.keys(trimmedConfig).length === 0) return;
    setSavingProvider(provider);
    setIntegrationMessage(null);
    try {
      const response = await fetch("/api/admin/integrations", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ provider, config: trimmedConfig }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.error ?? "Failed to save integration");
      const providerName = provider === "stripe"
        ? "Stripe"
        : provider === "openai"
          ? "OpenAI"
          : provider === "clerk"
            ? "Clerk"
            : "Supabase";
      setIntegrationMessage(`${providerName} credentials saved.`);
      await loadIntegrations();
      if (provider === "stripe") setStripeKey("");
      if (provider === "openai") setOpenAiKey("");
      if (provider === "clerk") {
        setClerkPublishableKey("");
        setClerkSecretKey("");
      }
      if (provider === "supabase") {
        setSupabaseUrl("");
        setSupabaseAnonKey("");
        setSupabaseServiceRoleKey("");
      }
    } catch (error) {
      setIntegrationMessage(String(error));
    } finally {
      setSavingProvider(null);
    }
  }

  async function testIntegration(provider: IntegrationProvider) {
    setTestingProvider(provider);
    setIntegrationMessage(null);
    try {
      const response = await fetch("/api/admin/integrations/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ provider }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload?.message ?? payload?.error ?? "Connection test failed");
      setIntegrationMessage(payload?.message ?? "Connection successful");
      await loadIntegrations();
    } catch (error) {
      setIntegrationMessage(String(error));
    } finally {
      setTestingProvider(null);
    }
  }

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

  async function fetchSeedStatus() {
    try {
      const r = await fetch("/api/admin/seed/status", { credentials: "include" });
      if (r.ok) setSeedCounts(await r.json() as { photos: number; collections: number; hasData: boolean });
    } catch { /* ignore */ }
  }

  async function runSeed(force: boolean) {
    setSeedLoading(true);
    setSeedMsg(null);
    try {
      const r = await fetch(`/api/admin/seed${force ? "?force=true" : ""}`, {
        method: "POST", credentials: "include",
      });
      const data = await r.json() as { ok?: boolean; error?: string; photos?: number; collections?: number; wiped?: boolean };
      if (r.ok && data.ok) {
        setSeedMsg({ ok: true, text: `${force && data.wiped ? "Reset & seeded" : "Seeded"} ${data.photos} photos across ${data.collections} collections.` });
        void fetchSeedStatus();
      } else {
        setSeedMsg({ ok: false, text: data.error ?? "Seed failed." });
      }
    } catch {
      setSeedMsg({ ok: false, text: "Network error — seed failed." });
    } finally {
      setSeedLoading(false);
    }
  }

  useEffect(() => {
    void pingApi();
    void fetchSeedStatus();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      setLoadingTimedOut(false);
      return;
    }

    const timeout = window.setTimeout(() => {
      setLoadingTimedOut(true);
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [isLoading]);

  if (isLoading && !loadingTimedOut) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md px-4">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-20 animate-pulse" />
          <p className="font-serif text-2xl mb-2">Checking admin session</p>
          <p className="text-muted-foreground text-sm mb-2">Your sign-in is being verified in this tab.</p>
          <p className="text-muted-foreground/80 text-xs">If this takes too long, unlock options will appear automatically.</p>
        </div>
      </div>
    );
  }

  if (!user && !isAdmin && !ownerUnlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md px-4">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-serif text-2xl mb-2">Admin Sign In Required</p>
          <p className="text-muted-foreground text-sm mb-2">Maintenance mode is active, but admin access is available after sign in.</p>
          <p className="text-muted-foreground/80 text-xs mb-6">No active session was detected for this domain in this tab.</p>
          <div className="mb-5 p-3 border border-border/60 bg-muted/20">
            <p className="text-xs text-muted-foreground mb-2">Owner fallback: unlock this device with your admin PIN</p>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={ownerUnlockPin}
                onChange={(e) => { setOwnerUnlockPin(e.target.value); if (ownerUnlockError) setOwnerUnlockError(null); }}
                placeholder="Enter owner PIN"
                className="flex-1 bg-background border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
              />
              <button
                onClick={unlockWithOwnerPin}
                className="px-4 py-2 text-sm bg-foreground text-background hover:opacity-90 transition-opacity"
              >
                Unlock
              </button>
            </div>
            {ownerUnlockError && <p className="text-[11px] text-amber-400 mt-2">{ownerUnlockError}</p>}
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link href="/signin?redirect=/admin" className="inline-block px-6 py-2.5 bg-foreground text-background text-sm hover:opacity-90 transition-opacity">Sign in as admin</Link>
            <Link href="/" className="inline-block px-6 py-2.5 border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Go home</Link>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin && !ownerUnlocked) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="text-center max-w-md px-4">
          <Shield className="w-12 h-12 mx-auto mb-4 opacity-20" />
          <p className="font-serif text-2xl mb-2">Access denied</p>
          <p className="text-muted-foreground text-sm mb-6">Your current account does not have admin privileges.</p>
          {user?.email && (
            <p className="text-xs text-muted-foreground/80 mb-4">Signed in as: {user.email}</p>
          )}
          <div className="mb-5 p-3 border border-border/60 bg-muted/20">
            <p className="text-xs text-muted-foreground mb-2">Owner fallback: unlock this device with your admin PIN</p>
            <div className="flex items-center gap-2">
              <input
                type="password"
                value={ownerUnlockPin}
                onChange={(e) => { setOwnerUnlockPin(e.target.value); if (ownerUnlockError) setOwnerUnlockError(null); }}
                placeholder="Enter owner PIN"
                className="flex-1 bg-background border border-border px-3 py-2 text-sm outline-none focus:border-foreground"
              />
              <button
                onClick={unlockWithOwnerPin}
                className="px-4 py-2 text-sm bg-foreground text-background hover:opacity-90 transition-opacity"
              >
                Unlock
              </button>
            </div>
            {ownerUnlockError && <p className="text-[11px] text-amber-400 mt-2">{ownerUnlockError}</p>}
          </div>
          <div className="flex items-center justify-center gap-3">
            <Link href="/signin?redirect=/admin" className="inline-block px-6 py-2.5 bg-foreground text-background text-sm hover:opacity-90 transition-opacity">Sign in as admin</Link>
            <Link href="/" className="inline-block px-6 py-2.5 border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Go home</Link>
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
  const filteredPhotos = photos.filter((p) => {
    const title = String((p as { title?: unknown }).title ?? "").toLowerCase();
    const photographerName = String((p as { photographerName?: unknown }).photographerName ?? "").toLowerCase();
    const query = photoSearch.toLowerCase();
    return title.includes(query) || photographerName.includes(query);
  });
  const selectedList = Array.from(selectedPhotos);
  const dailyUploads = analyticsData?.dailyStats.map(d => d.uploads) ?? [];
  const dailyDownloads = analyticsData?.dailyStats.map(d => d.downloads) ?? [];
  const dailyLikes = analyticsData?.dailyStats.map(d => d.likes) ?? [];
  const photographerStats = analyticsData?.photographerStats ?? [];
  const maxPhotographerScore = photographerStats.reduce((m, p) => Math.max(m, p.total_likes + p.total_downloads), 1);
  const spotlightCandidates = users.filter(u => u.status === "active");
  const spotlightUser = spotlightCandidates.length > 0
    ? spotlightCandidates[spotlightIdx % spotlightCandidates.length]
    : null;
  const auditEntries = reports.slice(0, 6).map((report) => ({
    id: report.id,
    actor: report.reporterName || "User",
    action: `Report ${report.status}`,
    target: `Photo #${report.photoId}`,
    time: new Date(report.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
  }));
  const subscribers = users
    .filter((u) => Boolean(u.email))
    .map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      subscribed: u.joined,
      pref: u.subscriptionStatus === "active" ? "premium" : "standard",
    }));
  const storageUsedBytes = systemMetrics?.databaseSizeBytes ?? 0;
  const storageLimitBytes = systemMetrics?.limitBytes ?? null;
  const storageLimitGiB = storageLimitBytes ? storageLimitBytes / (1024 ** 3) : null;
  const storageUsedGiB = storageUsedBytes / (1024 ** 3);
  const storageBarMaxGiB = storageLimitGiB ?? Math.max(storageUsedGiB, 0.01);
  const storageBreakdown = [
    { label: "Photo metadata", valueBytes: systemMetrics?.breakdown.photos ?? 0, color: "bg-blue-500" },
    { label: "Collection data", valueBytes: systemMetrics?.breakdown.collections ?? 0, color: "bg-purple-500" },
    { label: "User data", valueBytes: systemMetrics?.breakdown.users ?? 0, color: "bg-green-500" },
    { label: "Logs & audit", valueBytes: systemMetrics?.breakdown.logs ?? 0, color: "bg-amber-500" },
  ];
  const stripeIntegration = integrations.find(i => i.provider === "stripe") ?? null;
  const openAiIntegration = integrations.find(i => i.provider === "openai") ?? null;
  const clerkIntegration = integrations.find(i => i.provider === "clerk") ?? null;
  const supabaseIntegration = integrations.find(i => i.provider === "supabase") ?? null;
  const apiHealthStatus = apiPing === null ? "warn" : apiPing === -1 ? "down" : "ok";
  const apiHealthDetail = apiPing === null ? "Not checked yet" : apiPing === -1 ? "Unavailable" : `${apiPing} ms`;
  const photoSiteHealthDetail = typeof window !== "undefined" ? window.location.host : "Current host";
  const paymentGatewayDetail = stripeIntegration?.isConnected ? "Stripe connected" : "Stripe not connected";
  const authGatewayDetail = clerkIntegration?.isConnected ? "Clerk connected" : "Clerk not connected";
  const databaseDetail = systemMetrics ? `Live DB size ${formatGiB(storageUsedBytes)}` : "No live DB metrics";

  const SidebarContent = (
    <>
      <div className="px-5 py-5 border-b border-border flex items-center justify-between">
        <div>
          <Link href="/" className="text-lg font-serif tracking-tight">Affuaa.</Link>
          <p className="text-xs text-muted-foreground mt-0.5">Admin Panel</p>
        </div>
        <button className="lg:hidden p-1 text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMobileSidebarOpen(false)}>
          <X className="w-4 h-4" />
        </button>
      </div>
      <nav className="flex-1 py-3 overflow-y-auto">
        {NAV.map(item => {
          const Icon = item.icon;
          const active = section === item.id;
          const badgeVal = item.id === "moderation" ? pending.length : undefined;
          return (
            <button key={item.id} onClick={() => { setSection(item.id); setMobileSidebarOpen(false); }}
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
      <div className="px-5 py-4 border-t border-border space-y-3">
        <div>
          <p className="text-xs text-muted-foreground">Signed in as</p>
          <p className="text-sm font-medium mt-0.5 truncate">
            {[user?.firstName, user?.lastName].filter(Boolean).join(" ") || user?.email || "Admin"}
          </p>
          <Link href="/" className="text-xs text-muted-foreground hover:text-foreground mt-1 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" /> View site
          </Link>
        </div>
        <Link href="/api/logout"
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground border border-border/50 hover:text-foreground hover:border-foreground/30 transition-colors"
        >
          <Shield className="w-3.5 h-3.5" /> Sign Out
        </Link>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-background flex">
      {confirm && <ConfirmDialog action={confirm} onCancel={() => setConfirm(null)} />}

      {/* Mobile sidebar overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar — desktop always visible, mobile slide-in */}
      <aside className={cn(
        "fixed lg:static inset-y-0 left-0 z-50 w-56 border-r border-border flex flex-col flex-shrink-0 bg-background h-screen overflow-y-auto transition-transform duration-200",
        "lg:translate-x-0",
        mobileSidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      )}>
        {SidebarContent}
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-30 flex items-center gap-3 px-4 py-3 border-b border-border bg-background/95 backdrop-blur">
          <button
            onClick={() => setMobileSidebarOpen(true)}
            className="p-1.5 border border-border text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Open admin menu"
          >
            <Menu className="w-4 h-4" />
          </button>
          <span className="font-serif text-sm">Admin Panel</span>
          <span className="text-xs text-muted-foreground ml-auto capitalize">{section}</span>
        </div>

        <div className="max-w-6xl mx-auto px-4 sm:px-8 py-6 sm:py-10">

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
                    {auditEntries.map(e => (
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

              {/* ── Maintenance Mode ── */}
              <div className={cn(
                "mt-6 border p-5 transition-colors",
                maintenance.enabled ? "border-red-500/40 bg-red-500/5" : "border-border bg-card"
              )}>
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Zap className={cn("w-4 h-4", maintenance.enabled ? "text-red-400" : "text-muted-foreground")} />
                      Maintenance Mode
                      {maintenance.enabled && (
                        <span className="text-[10px] px-1.5 py-0.5 border border-red-500/40 text-red-400 uppercase tracking-widest animate-pulse">Live</span>
                      )}
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      {maintenance.enabled
                        ? "Site is in maintenance mode — all visitors see the splash page. You retain full admin access."
                        : "When enabled, all visitors see a 'We'll be back soon' splash page. Admins bypass it."}
                    </p>
                  </div>
                  <button
                    onClick={() => saveMaintenance({ ...maintenance, enabled: !maintenance.enabled })}
                    className={cn(
                      "flex items-center gap-2 px-4 py-2 text-sm font-medium transition-colors flex-shrink-0",
                      maintenance.enabled
                        ? "bg-green-600 text-white hover:bg-green-700"
                        : "bg-red-600 text-white hover:bg-red-700"
                    )}
                  >
                    {maintenance.enabled
                      ? <><ToggleRight className="w-4 h-4" /> Disable Maintenance</>
                      : <><ToggleLeft className="w-4 h-4" /> Enable Maintenance</>}
                  </button>
                </div>
                <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Custom message (optional)</label>
                    <input
                      value={maintenance.message}
                      onChange={e => saveMaintenance({ ...maintenance, message: e.target.value })}
                      placeholder="We're making things even better…"
                      className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] uppercase tracking-widest text-muted-foreground block mb-1.5">Estimated return time (optional)</label>
                    <input
                      value={maintenance.returnTime}
                      onChange={e => saveMaintenance({ ...maintenance, returnTime: e.target.value })}
                      placeholder="e.g. Back in 2 hours"
                      className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30"
                    />
                  </div>
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
                    <div className="border border-dashed border-border p-4 text-sm text-muted-foreground">
                      Device telemetry is not connected yet.
                    </div>
                  </div>
                </div>
              </div>

              <div className="border border-border bg-card p-5">
                <h3 className="text-sm font-medium mb-4">Traffic Sources</h3>
                <div className="border border-dashed border-border p-6 text-sm text-muted-foreground">
                  Traffic attribution is not connected yet. Add a real analytics provider before showing source numbers.
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
                    <button onClick={() => setConfirm({ title: `Feature ${selectedList.length} photos?`, desc: "These photos will appear in the featured section on the homepage.", onConfirm: () => void bulkFeature(selectedList, true), confirmLabel: "Feature all" })}
                      className="text-xs px-3 py-1.5 border border-amber-500/30 text-amber-400 hover:bg-amber-500/10 transition-colors flex items-center gap-1.5">
                      <Star className="w-3 h-3" /> Feature all
                    </button>
                    <button onClick={() => setConfirm({ title: `Unfeature ${selectedList.length} photos?`, desc: "These photos will be removed from the featured section.", onConfirm: () => void bulkFeature(selectedList, false), confirmLabel: "Unfeature all" })}
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
                            <button onClick={() => setConfirm({ title: isFeatured ? "Unfeature this photo?" : "Feature this photo?", desc: isFeatured ? "This will remove it from the featured section." : "This will add it to the featured section on the homepage.", onConfirm: () => void toggleFeature(p.id) })} disabled={isUpdating}
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
                {spotlightMsg && (
                  <p className="text-xs text-green-400 mb-3 flex items-center gap-1"><Check className="w-3 h-3" />{spotlightMsg}</p>
                )}
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
                    <button onClick={() => {
                      if (!spotlightUser) return;
                      const id = spotlightUser.id;
                      localStorage.setItem("affuaa_featured_spotlight", String(id));
                      setFeaturedThisMonth(id);
                      setSpotlightMsg(`${spotlightUser.name} is now featured this month.`);
                      setTimeout(() => setSpotlightMsg(null), 3000);
                    }} className={cn("text-xs px-3 py-1.5 hover:opacity-90 transition-opacity", featuredThisMonth === spotlightUser?.id ? "bg-green-600 text-white" : "bg-foreground text-background")}>
                      {featuredThisMonth === spotlightUser?.id ? "✓ Featured" : "Feature this month"}
                    </button>
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
                          <button
                            onClick={() => setConfirm({
                              title: u.status === "suspended" ? `Reinstate ${u.name}?` : `Suspend ${u.name}?`,
                              desc: u.status === "suspended"
                                ? "This will restore their access to upload and comment."
                                : "This will prevent them from uploading photos or posting comments.",
                              dangerous: u.status !== "suspended",
                              onConfirm: () => toggleSuspend(u.id),
                              confirmLabel: u.status === "suspended" ? "Reinstate" : "Suspend",
                            })}
                            title={u.status === "suspended" ? "Reinstate" : "Suspend"}
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
          {section === "monetisation" && (() => {
            const totalPaid = payouts.filter(p => p.status === "paid").reduce((s, p) => s + parseFloat(p.amount), 0);
            const totalPending = payouts.filter(p => p.status === "pending").reduce((s, p) => s + parseFloat(p.amount), 0);
            const pendingCount = payouts.filter(p => p.status === "pending").length;
            return (
            <div>
              <SectionTitle sub="Platform revenue, payouts, and creator earnings">Monetisation</SectionTitle>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard icon={DollarSign} label="Total Paid Out" value={`$${totalPaid.toFixed(2)}`} sub="all time" accent="text-green-400" />
                <StatCard icon={CreditCard} label="Total Payouts" value={String(payouts.length)} sub="records" />
                <StatCard icon={ArrowUpRight} label="Pending" value={`$${totalPending.toFixed(2)}`} sub={`${pendingCount} transaction${pendingCount !== 1 ? "s" : ""}`} accent="text-amber-400" />
                <StatCard icon={TrendingUp} label="Avg Payout" value={payouts.length ? `$${(payouts.reduce((s,p) => s + parseFloat(p.amount),0) / payouts.length).toFixed(2)}` : "$0"} sub="per record" />
              </div>

              {/* Add Payout Form */}
              <div className="border border-border bg-card p-5 mb-6">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2"><Plus className="w-4 h-4 text-muted-foreground" /> Record New Payout</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3">
                  <input value={newPayout.photographerName} onChange={e => setNewPayout(p => ({ ...p, photographerName: e.target.value }))}
                    placeholder="Photographer name *" className="bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30" />
                  <input value={newPayout.email} onChange={e => setNewPayout(p => ({ ...p, email: e.target.value }))}
                    placeholder="Email (optional)" className="bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30" />
                  <select value={newPayout.type} onChange={e => setNewPayout(p => ({ ...p, type: e.target.value }))}
                    className="bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30">
                    <option value="commission">Commission</option>
                    <option value="license">License</option>
                    <option value="print">Print sale</option>
                    <option value="tip">Tip</option>
                  </select>
                  <input value={newPayout.description} onChange={e => setNewPayout(p => ({ ...p, description: e.target.value }))}
                    placeholder="Description *" className="bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30 sm:col-span-2" />
                  <input type="number" value={newPayout.amount} onChange={e => setNewPayout(p => ({ ...p, amount: e.target.value }))}
                    placeholder="Amount ($) *" min="0.01" step="0.01" className="bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30" />
                </div>
                <button onClick={() => void createPayout()} disabled={addingPayout || !newPayout.photographerName || !newPayout.description || !newPayout.amount}
                  className="flex items-center gap-1.5 px-4 py-2 bg-foreground text-background text-xs hover:opacity-90 transition-opacity disabled:opacity-40">
                  {addingPayout ? <><span className="w-3 h-3 border border-background/40 border-t-background rounded-full animate-spin inline-block" /> Recording…</> : <><Plus className="w-3 h-3" /> Record Payout</>}
                </button>
              </div>

              {/* Payout Records Table */}
              <div className="mb-6">
                <h3 className="text-sm font-medium mb-4">All Payout Records</h3>
                {payoutsLoading ? (
                  <div className="space-y-2">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                ) : payouts.length === 0 ? (
                  <div className="py-12 text-center border border-dashed border-border text-muted-foreground">
                    <DollarSign className="w-8 h-8 mx-auto mb-3 opacity-30" />
                    <p className="text-sm">No payout records yet. Use the form above to add one.</p>
                  </div>
                ) : (
                  <div className="border border-border overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border bg-card/50">
                          <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">ID</th>
                          <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Photographer</th>
                          <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal hidden sm:table-cell">Description</th>
                          <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal hidden lg:table-cell">Type</th>
                          <th className="text-right px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Amount</th>
                          <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Status</th>
                          <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal hidden md:table-cell">Date</th>
                          <th className="px-4 py-3" />
                        </tr>
                      </thead>
                      <tbody>
                        {payouts.map(p => (
                          <>
                          <tr key={p.id} className="border-b border-border last:border-0 hover:bg-card/40 transition-colors">
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">{p.payoutId}</td>
                            <td className="px-4 py-3">
                              <div>
                                <span className="font-medium text-sm">{p.photographerName}</span>
                                {p.email && <p className="text-xs text-muted-foreground">{p.email}</p>}
                                <p className="text-xs text-muted-foreground capitalize mt-0.5">
                                  {p.paymentMethod?.replace("_", " ")}
                                  {p.paypalEmail && ` · ${p.paypalEmail}`}
                                  {p.bankAccountHolder && ` · ${p.bankAccountHolder}`}
                                  {p.bankName && ` · ${p.bankName}`}
                                  {p.bankAccountLast4 && ` · ****${p.bankAccountLast4}`}
                                  {p.bankRoutingLast4 && ` · routing ****${p.bankRoutingLast4}`}
                                </p>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell max-w-xs truncate">{p.description}</td>
                            <td className="px-4 py-3 hidden lg:table-cell">
                              <Badge color="border-border text-muted-foreground">{p.type}</Badge>
                            </td>
                            <td className="px-4 py-3 text-right font-medium tabular-nums">${parseFloat(p.amount).toFixed(2)}</td>
                            <td className="px-4 py-3 text-center">
                              <Badge color={p.status === "paid" ? "border-green-500/30 text-green-400 bg-green-500/5" : p.status === "approved" ? "border-blue-500/30 text-blue-400 bg-blue-500/5" : p.status === "rejected" ? "border-red-500/30 text-red-400 bg-red-500/5" : "border-amber-500/30 text-amber-400"}>
                                {p.status}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">
                              {new Date(p.requestedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex flex-col gap-1.5">
                                {(p.status === "pending" || p.status === "approved") && (
                                  <div className="flex gap-1.5 flex-wrap">
                                    {p.status === "pending" && (
                                      <button onClick={() => void patchPayout(p.id, { status: "approved" })}
                                        className="flex items-center gap-1 text-xs px-2.5 py-1 border border-blue-500/30 text-blue-400 hover:bg-blue-500/10 transition-colors">
                                        <Check className="w-3 h-3" /> Approve
                                      </button>
                                    )}
                                    {p.status === "approved" && (
                                      <button onClick={() => void patchPayout(p.id, { status: "paid" })}
                                        className="flex items-center gap-1 text-xs px-2.5 py-1 border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors">
                                        <Check className="w-3 h-3" /> Mark Paid
                                      </button>
                                    )}
                                    <button onClick={() => { setPayoutNoteId(p.id); setPayoutNote(p.adminNotes ?? ""); }}
                                      className="flex items-center gap-1 text-xs px-2.5 py-1 border border-border text-muted-foreground hover:text-foreground transition-colors">
                                      <Edit3 className="w-3 h-3" /> Note
                                    </button>
                                    <button onClick={() => void patchPayout(p.id, { status: "rejected" })}
                                      className="flex items-center gap-1 text-xs px-2.5 py-1 border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                                      <X className="w-3 h-3" /> Reject
                                    </button>
                                  </div>
                                )}
                                {p.adminNotes && <p className="text-xs text-muted-foreground italic">Note: {p.adminNotes}</p>}
                                {p.processedAt && (
                                  <span className="text-xs text-muted-foreground">
                                    {new Date(p.processedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                                  </span>
                                )}
                              </div>
                            </td>
                          </tr>
                          {payoutNoteId === p.id && (
                            <tr key={`note-${p.id}`} className="border-b border-border bg-muted/20">
                              <td colSpan={8} className="px-4 py-3">
                                <div className="flex gap-2 items-center">
                                  <input value={payoutNote} onChange={e => setPayoutNote(e.target.value)}
                                    placeholder="Admin note for photographer…"
                                    className="flex-1 bg-background border border-border px-3 py-1.5 text-xs focus:outline-none focus:border-foreground/30" />
                                  <button onClick={() => { void patchPayout(p.id, { adminNotes: payoutNote }); setPayoutNoteId(null); }}
                                    className="px-3 py-1.5 bg-foreground text-background text-xs hover:opacity-90 transition-opacity">Save</button>
                                  <button onClick={() => setPayoutNoteId(null)}
                                    className="px-3 py-1.5 border border-border text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                                </div>
                              </td>
                            </tr>
                          )}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-border bg-card p-5">
                  <h3 className="text-sm font-medium mb-4">Revenue by Type</h3>
                  {(() => {
                    const byType: Record<string, number> = {};
                    payouts.filter(p => p.status === "paid").forEach(p => { byType[p.type] = (byType[p.type] ?? 0) + parseFloat(p.amount); });
                    const colors: Record<string, string> = { commission: "bg-purple-500", license: "bg-blue-500", print: "bg-green-500", tip: "bg-amber-500" };
                    const max = Math.max(...Object.values(byType), 1);
                    return Object.entries(byType).length === 0 ? (
                      <p className="text-xs text-muted-foreground">No paid payouts yet.</p>
                    ) : Object.entries(byType).map(([type, value]) => (
                      <div key={type} className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="capitalize">{type}</span>
                          <span className="text-muted-foreground">${value.toFixed(2)}</span>
                        </div>
                        <MiniBar value={value} max={max} color={colors[type] ?? "bg-foreground"} />
                      </div>
                    ));
                  })()}
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
                      <input placeholder="SUMMER25"
                        className="flex-1 bg-background border border-border px-2 py-1.5 text-xs focus:outline-none"
                        onKeyDown={e => {
                          if (e.key === "Enter") {
                            const input = e.currentTarget;
                            const code = input.value.trim().toUpperCase();
                            if (code) { navigator.clipboard.writeText(code).catch(() => {}); input.value = code + " ✓"; setTimeout(() => { input.value = code; }, 2000); }
                          }
                        }}
                      />
                      <button onClick={e => {
                        const input = (e.currentTarget.previousSibling as HTMLInputElement);
                        const code = (input.value.trim() || "AFF" + Math.random().toString(36).slice(2,8).toUpperCase());
                        input.value = code;
                        navigator.clipboard.writeText(code).catch(() => {});
                      }} className="px-3 py-1.5 bg-foreground text-background text-xs hover:opacity-90 transition-opacity">Generate</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            );
          })()}

          {/* ── VERIFICATIONS ── */}
          {section === "verifications" && (
            <div>
              <SectionTitle sub="Review and approve photographer verified badge requests">Verification Requests</SectionTitle>
              {verificationsLoading ? (
                <div className="space-y-3">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-24" />)}</div>
              ) : verifications.length === 0 ? (
                <div className="py-16 text-center border border-dashed border-border text-muted-foreground">
                  <BadgeCheck className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No verification requests yet.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {verifications.map(v => (
                    <div key={v.id} className="border border-border bg-card p-5">
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-medium truncate">{v.photographerName}</p>
                            <Badge color={
                              v.status === "approved" ? "border-green-500/30 text-green-400 bg-green-500/5" :
                              v.status === "rejected" ? "border-red-500/30 text-red-400 bg-red-500/5" :
                              "border-amber-500/30 text-amber-400 bg-amber-500/5"
                            }>{v.status}</Badge>
                          </div>
                          {v.email && <p className="text-xs text-muted-foreground mb-1">{v.email}</p>}
                          <p className="text-xs text-muted-foreground">
                            Submitted {new Date(v.submittedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                            {v.reviewedAt && ` · Reviewed ${new Date(v.reviewedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`}
                          </p>
                        </div>
                        {v.status === "pending" && (
                          <div className="flex gap-2 flex-shrink-0">
                            <button onClick={() => void reviewVerification(v.id, "approved", verificationNoteId === v.id ? verificationNote : undefined)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors">
                              <Check className="w-3 h-3" /> Approve
                            </button>
                            <button onClick={() => void reviewVerification(v.id, "rejected", verificationNoteId === v.id ? verificationNote : undefined)}
                              className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-red-500/30 text-red-400 hover:bg-red-500/10 transition-colors">
                              <X className="w-3 h-3" /> Reject
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3 text-xs">
                        {v.photoCount != null && <div className="border border-border px-3 py-2"><p className="text-muted-foreground mb-0.5">Photos</p><p className="font-medium">{v.photoCount}</p></div>}
                        {v.followerCount != null && <div className="border border-border px-3 py-2"><p className="text-muted-foreground mb-0.5">Followers</p><p className="font-medium">{v.followerCount}</p></div>}
                        {v.portfolioUrl && <div className="border border-border px-3 py-2 col-span-2"><p className="text-muted-foreground mb-0.5">Portfolio</p><a href={v.portfolioUrl} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate block">{v.portfolioUrl}</a></div>}
                        {v.instagramUrl && <div className="border border-border px-3 py-2"><p className="text-muted-foreground mb-0.5">Instagram</p><p className="truncate">{v.instagramUrl}</p></div>}
                        {v.website && <div className="border border-border px-3 py-2"><p className="text-muted-foreground mb-0.5">Website</p><a href={v.website} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline truncate block">{v.website}</a></div>}
                      </div>

                      {v.reason && (
                        <div className="bg-background border border-border px-4 py-3 mb-3">
                          <p className="text-xs text-muted-foreground mb-1 uppercase tracking-widest">Application Statement</p>
                          <p className="text-sm">{v.reason}</p>
                        </div>
                      )}

                      {v.status === "pending" && (
                        <div className="mt-2">
                          <button onClick={() => { setVerificationNoteId(verificationNoteId === v.id ? null : v.id); setVerificationNote(v.adminNotes ?? ""); }}
                            className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                            <Edit3 className="w-3 h-3" /> {verificationNoteId === v.id ? "Hide note" : "Add admin note"}
                          </button>
                          {verificationNoteId === v.id && (
                            <textarea value={verificationNote} onChange={e => setVerificationNote(e.target.value)}
                              rows={2} placeholder="Internal note (visible only to admins)…"
                              className="mt-2 w-full bg-background border border-border px-3 py-2 text-xs focus:outline-none focus:border-foreground/30 resize-none" />
                          )}
                        </div>
                      )}

                      {v.adminNotes && v.status !== "pending" && (
                        <div className="mt-2 text-xs text-muted-foreground italic border-t border-border pt-2">
                          Admin note: {v.adminNotes}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── SUBSCRIPTIONS ── */}
          {section === "subscriptions" && (
            <div>
              <SectionTitle sub="All user subscription statuses across the platform">Subscriptions</SectionTitle>
              {(() => {
                const premium = subUsers.filter(u => u.subscriptionStatus === "active" || u.subscriptionStatus === "trialing");
                const total = subUsers.length;
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                    <StatCard icon={CreditCard} label="Total Users" value={String(total)} sub="in database" />
                    <StatCard icon={Crown} label="Premium" value={String(premium.length)} sub="active/trialing" accent="text-amber-400" />
                    <StatCard icon={TrendingUp} label="Conversion" value={total ? `${((premium.length / total) * 100).toFixed(1)}%` : "0%"} sub="premium rate" />
                    <StatCard icon={DollarSign} label="Free" value={String(total - premium.length)} sub="on free plan" />
                  </div>
                );
              })()}

              {subUsersLoading ? (
                <div className="space-y-2">{Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
              ) : subUsers.length === 0 ? (
                <div className="py-12 text-center border border-dashed border-border text-muted-foreground">
                  <CreditCard className="w-8 h-8 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No subscription data yet. Configure Stripe to activate subscriptions.</p>
                </div>
              ) : (
                <div className="border border-border overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border bg-card/50">
                        <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">User</th>
                        <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Email</th>
                        <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Status</th>
                        <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Period End</th>
                        <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Joined</th>
                      </tr>
                    </thead>
                    <tbody>
                      {subUsers.map(u => (
                        <tr key={u.id} className="border-b border-border hover:bg-card/40 transition-colors">
                          <td className="px-4 py-3 font-medium">{[u.firstName, u.lastName].filter(Boolean).join(" ") || "—"}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{u.email ?? "—"}</td>
                          <td className="px-4 py-3 text-center">
                            <Badge color={
                              u.subscriptionStatus === "active" ? "border-green-500/30 text-green-400 bg-green-500/5" :
                              u.subscriptionStatus === "trialing" ? "border-blue-500/30 text-blue-400 bg-blue-500/5" :
                              u.subscriptionStatus === "past_due" ? "border-amber-500/30 text-amber-400 bg-amber-500/5" :
                              "border-border text-muted-foreground"
                            }>{u.subscriptionStatus}</Badge>
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {u.subscriptionCurrentPeriodEnd ? new Date(u.subscriptionCurrentPeriodEnd).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "—"}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">
                            {new Date(u.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* ── HIDE PAGES ── */}
          {section === "pages" && (
            <div>
              <SectionTitle sub="Toggle pages on and off — hidden pages show a 'not available' message to visitors. Admins always retain access.">Hide Pages</SectionTitle>

              <div className="border border-amber-500/20 bg-amber-500/5 px-4 py-3 mb-6 flex items-start gap-2 text-amber-400 text-sm">
                <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <span>Changes take effect immediately for all visitors. You (as admin) will always be able to access any page.</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {HIDEABLE_PAGES.map(page => {
                  const isHidden = hiddenPages.includes(page.path);
                  return (
                    <div key={page.path} className={cn(
                      "border p-4 flex items-center justify-between gap-4 transition-colors",
                      isHidden ? "border-red-500/30 bg-red-500/5" : "border-border bg-card"
                    )}>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-medium">{page.label}</p>
                          {isHidden && (
                            <span className="text-[10px] px-1.5 py-0.5 border border-red-500/30 text-red-400 uppercase tracking-widest">Hidden</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{page.desc}</p>
                        <p className="text-[10px] text-muted-foreground/50 font-mono mt-0.5">{page.path}</p>
                      </div>
                      <button
                        onClick={() => toggleHiddenPage(page.path)}
                        className={cn(
                          "flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 text-xs transition-colors border",
                          isHidden
                            ? "border-green-500/30 text-green-400 hover:bg-green-500/10"
                            : "border-red-500/30 text-red-400 hover:bg-red-500/10"
                        )}
                      >
                        {isHidden ? <><Eye className="w-3 h-3" /> Show</> : <><EyeOff className="w-3 h-3" /> Hide</>}
                      </button>
                    </div>
                  );
                })}
              </div>

              {hiddenPages.length > 0 && (
                <div className="mt-6 pt-4 border-t border-border flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{hiddenPages.length} page{hiddenPages.length !== 1 ? "s" : ""} currently hidden</p>
                  <button onClick={() => {
                    setHiddenPagesState([]);
                    localStorage.setItem(HIDDEN_PAGES_KEY, "[]");
                  }} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4">
                    Show all pages
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ── LOCKS ── */}
          {section === "locks" && (
            <div>
              <SectionTitle sub="Lock users, photos, or collections from being accessed or displayed">Locks</SectionTitle>

              {/* Create lock form */}
              <div className="border border-border bg-card p-5 mb-6">
                <h3 className="text-sm font-medium mb-4 flex items-center gap-2"><Lock className="w-4 h-4 text-muted-foreground" /> Create New Lock</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
                  <select value={newLock.lockType} onChange={e => setNewLock(l => ({ ...l, lockType: e.target.value }))}
                    className="bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30">
                    <option value="user">User</option>
                    <option value="photo">Photo</option>
                    <option value="collection">Collection</option>
                    <option value="account">Account</option>
                  </select>
                  <input value={newLock.targetId} onChange={e => setNewLock(l => ({ ...l, targetId: e.target.value }))}
                    placeholder="Target ID / username *" className="bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30" />
                  <input value={newLock.targetLabel} onChange={e => setNewLock(l => ({ ...l, targetLabel: e.target.value }))}
                    placeholder="Display label (optional)" className="bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30" />
                  <input value={newLock.reason} onChange={e => setNewLock(l => ({ ...l, reason: e.target.value }))}
                    placeholder="Reason for lock *" className="bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30" />
                </div>
                <button onClick={() => void createLock()} disabled={addingLock || !newLock.targetId || !newLock.reason}
                  className="flex items-center gap-1.5 px-4 py-2 bg-foreground text-background text-xs hover:opacity-90 transition-opacity disabled:opacity-40">
                  {addingLock ? <><span className="w-3 h-3 border border-background/40 border-t-background rounded-full animate-spin inline-block" /> Creating…</> : <><Lock className="w-3 h-3" /> Create Lock</>}
                </button>
              </div>

              {/* Lock stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <StatCard icon={Lock} label="Total Locks" value={String(locks.length)} sub="all time" />
                <StatCard icon={Shield} label="Active Locks" value={String(locks.filter(l => l.isActive).length)} sub="currently enforced" accent="text-red-400" />
                <StatCard icon={Users} label="User Locks" value={String(locks.filter(l => l.lockType === "user" && l.isActive).length)} sub="locked users" />
                <StatCard icon={Image} label="Content Locks" value={String(locks.filter(l => l.lockType !== "user" && l.isActive).length)} sub="photos / collections" />
              </div>

              {/* Lock list */}
              <div className="border border-border overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-card/50">
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Type</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Target</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal hidden sm:table-cell">Reason</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal hidden md:table-cell">Locked By</th>
                      <th className="text-center px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal">Status</th>
                      <th className="text-left px-4 py-3 text-xs uppercase tracking-widest text-muted-foreground font-normal hidden lg:table-cell">Date</th>
                      <th className="px-4 py-3" />
                    </tr>
                  </thead>
                  <tbody>
                    {locksLoading ? (
                      <tr><td colSpan={7} className="px-4 py-8 text-center text-muted-foreground text-sm">Loading…</td></tr>
                    ) : locks.length === 0 ? (
                      <tr><td colSpan={7} className="px-4 py-12 text-center">
                        <Lock className="w-8 h-8 mx-auto mb-3 opacity-20" />
                        <p className="text-sm text-muted-foreground">No locks created yet.</p>
                      </td></tr>
                    ) : locks.map(l => (
                      <tr key={l.id} className="border-b border-border last:border-0 hover:bg-card/40 transition-colors">
                        <td className="px-4 py-3">
                          <Badge color={l.lockType === "user" ? "border-purple-500/30 text-purple-400" : l.lockType === "photo" ? "border-blue-500/30 text-blue-400" : "border-amber-500/30 text-amber-400"}>
                            {l.lockType}
                          </Badge>
                        </td>
                        <td className="px-4 py-3">
                          <span className="font-medium text-sm">{l.targetLabel || l.targetId}</span>
                          <p className="text-xs text-muted-foreground font-mono">{l.targetId}</p>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden sm:table-cell max-w-xs truncate">{l.reason}</td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden md:table-cell">{l.lockedBy}</td>
                        <td className="px-4 py-3 text-center">
                          <Badge color={l.isActive ? "border-red-500/30 text-red-400 bg-red-500/5" : "border-green-500/30 text-green-400 bg-green-500/5"}>
                            {l.isActive ? "Locked" : "Unlocked"}
                          </Badge>
                        </td>
                        <td className="px-4 py-3 text-xs text-muted-foreground hidden lg:table-cell">
                          {new Date(l.lockedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1.5">
                            <button onClick={() => void toggleLock(l.id, !l.isActive)}
                              className={cn("flex items-center gap-1 text-xs px-2.5 py-1 border transition-colors",
                                l.isActive ? "border-green-500/30 text-green-400 hover:bg-green-500/10" : "border-red-500/30 text-red-400 hover:bg-red-500/10")}>
                              <Lock className="w-3 h-3" /> {l.isActive ? "Unlock" : "Re-lock"}
                            </button>
                            <button onClick={() => void deleteLock(l.id)}
                              className="flex items-center gap-1 text-xs px-2.5 py-1 border border-border text-muted-foreground hover:text-red-400 hover:border-red-500/30 transition-colors">
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── LIVE CHAT ── */}
          {section === "livechat" && (
            <div>
              <SectionTitle sub="Respond to customer messages in real time">Live Chat</SectionTitle>
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[600px]">
                {/* Sessions list */}
                <div className="border border-border bg-card flex flex-col overflow-hidden">
                  <div className="px-4 py-3 border-b border-border bg-card/50 flex items-center justify-between flex-shrink-0">
                    <h3 className="text-sm font-medium">Sessions</h3>
                    <button onClick={() => void fetchChatSessions()} className="text-muted-foreground hover:text-foreground transition-colors">
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto divide-y divide-border">
                    {chatSessionsLoading ? (
                      <div className="p-4 space-y-2">{Array(3).fill(0).map((_, i) => <Skeleton key={i} className="h-12" />)}</div>
                    ) : chatSessions.length === 0 ? (
                      <div className="p-6 text-center">
                        <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                        <p className="text-xs text-muted-foreground">No customer conversations yet.</p>
                      </div>
                    ) : chatSessions.map(s => (
                      <button key={s.sessionId}
                        onClick={() => setActiveChatSession(s.sessionId)}
                        className={cn("w-full text-left p-4 hover:bg-muted/30 transition-colors", activeChatSession === s.sessionId && "bg-muted/40")}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm font-medium truncate">{s.customerName}</span>
                          {s.unread > 0 && (
                            <span className="ml-2 bg-foreground text-background text-[10px] px-1.5 py-0.5 rounded-full flex-shrink-0">{s.unread}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{s.lastMessage}</p>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">{new Date(s.lastAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</p>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Chat area */}
                <div className="lg:col-span-2 border border-border flex flex-col overflow-hidden">
                  {!activeChatSession ? (
                    <div className="flex-1 flex items-center justify-center text-center p-8">
                      <div>
                        <MessageSquare className="w-10 h-10 mx-auto mb-3 opacity-20" />
                        <p className="text-sm text-muted-foreground">Select a conversation to view messages</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="px-4 py-3 border-b border-border bg-card/50 flex-shrink-0">
                        <p className="text-sm font-medium">{chatSessions.find(s => s.sessionId === activeChatSession)?.customerName ?? activeChatSession}</p>
                        <p className="text-xs text-muted-foreground font-mono">{activeChatSession}</p>
                      </div>
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {chatMessages.map(msg => (
                          <div key={msg.id} className={cn("flex", msg.senderRole === "support" ? "justify-end" : "justify-start")}>
                            <div className={cn("max-w-[75%] px-3 py-2 text-sm", msg.senderRole === "support" ? "bg-foreground text-background" : "bg-muted border border-border")}>
                              <p className="text-[10px] font-medium mb-1 opacity-60">{msg.senderRole === "support" ? "You (Support)" : msg.senderName}</p>
                              <p className="leading-relaxed">{msg.message}</p>
                              <p className={cn("text-[10px] mt-1", msg.senderRole === "support" ? "text-background/50 text-right" : "text-muted-foreground")}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                              </p>
                            </div>
                          </div>
                        ))}
                        {chatMessages.length === 0 && (
                          <div className="py-12 text-center text-muted-foreground text-sm">No messages in this session yet.</div>
                        )}
                        <div ref={chatBottomRef} />
                      </div>
                      <div className="border-t border-border p-3 flex items-end gap-2 flex-shrink-0">
                        <textarea value={chatReply} onChange={e => setChatReply(e.target.value)}
                          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); void sendChatReply(); } }}
                          placeholder="Type a reply… (Enter to send)" rows={2}
                          className="flex-1 bg-background border border-border px-3 py-2 text-sm resize-none focus:outline-none focus:border-foreground/30 transition-colors" />
                        <button onClick={() => void sendChatReply()} disabled={!chatReply.trim() || chatSending}
                          className="w-9 h-9 bg-foreground text-background flex items-center justify-center hover:opacity-80 transition-opacity disabled:opacity-30 flex-shrink-0">
                          <Send className="w-4 h-4" />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* ── SETTINGS ── */}
          {section === "settings" && (
            <div>
              <SectionTitle sub="Feature flags, SEO, social media, redirects, and platform config">Site Settings</SectionTitle>

              {/* PIN Config */}
              <div className="border border-border bg-card p-5 mb-6">
                <h3 className="text-sm font-medium mb-1 flex items-center gap-2"><Lock className="w-4 h-4 text-muted-foreground" /> Admin PIN</h3>
                <p className="text-xs text-muted-foreground mb-4">{currentPin ? "A PIN is set. You can change it below." : "No PIN set. Set one to add an extra layer of admin security."}</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3 max-w-lg">
                  {currentPin && (
                    <input type="password" value={pinForm.current} onChange={e => setPinForm(p => ({ ...p, current: e.target.value }))}
                      placeholder="Current PIN" className="bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30" />
                  )}
                  <input type="password" value={pinForm.next} onChange={e => setPinForm(p => ({ ...p, next: e.target.value }))}
                    placeholder="New PIN" className="bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30" />
                  <input type="password" value={pinForm.confirm} onChange={e => setPinForm(p => ({ ...p, confirm: e.target.value }))}
                    placeholder="Confirm PIN" className="bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30"
                    onKeyDown={e => { if (e.key === "Enter") changePin(); }} />
                </div>
                <div className="flex items-center gap-3">
                  <button onClick={changePin}
                    className="flex items-center gap-1.5 px-4 py-2 bg-foreground text-background text-xs hover:opacity-90 transition-opacity">
                    <KeyRound className="w-3.5 h-3.5" /> {currentPin ? "Update PIN" : "Set PIN"}
                  </button>
                  {currentPin && (
                    <button onClick={() => { localStorage.removeItem(PIN_STORE); setCurrentPin(""); setPinMsg({ ok: true, text: "PIN removed." }); setTimeout(() => setPinMsg(null), 3000); }}
                      className="text-xs text-muted-foreground hover:text-red-400 transition-colors">Remove PIN</button>
                  )}
                  {pinMsg && (
                    <span className={cn("text-xs", pinMsg.ok ? "text-green-400" : "text-red-400")}>{pinMsg.text}</span>
                  )}
                </div>
              </div>

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
                      {REDIRECT_RULES.map(r => (
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

          {/* ── INTEGRATIONS ── */}
          {section === "integrations" && (
            <div>
              <SectionTitle sub="Connect external APIs securely and test live status">Integrations</SectionTitle>

              {integrationMessage && (
                <div className="mb-5 border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
                  {integrationMessage}
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium">Stripe</h3>
                    <Badge color={stripeIntegration?.isConnected ? "border-green-500/30 text-green-400" : "border-border text-muted-foreground"}>
                      {stripeIntegration?.isConnected ? "connected" : "not connected"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Used for subscriptions, checkout, and payouts.</p>
                  <input
                    type="password"
                    value={stripeKey}
                    onChange={(e) => setStripeKey(e.target.value)}
                    placeholder="sk_live_..."
                    className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30 mb-3"
                  />
                  <p className="text-xs text-muted-foreground mb-4">Saved key: {stripeIntegration?.maskedConfig.apiKey || "none"}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void saveIntegration("stripe", { apiKey: stripeKey })}
                      disabled={savingProvider === "stripe"}
                      className="px-3 py-2 text-xs bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {savingProvider === "stripe" ? "Saving..." : "Save Key"}
                    </button>
                    <button
                      onClick={() => void testIntegration("stripe")}
                      disabled={testingProvider === "stripe" || integrationsLoading}
                      className="px-3 py-2 text-xs border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      {testingProvider === "stripe" ? "Testing..." : "Test Connection"}
                    </button>
                  </div>
                  {stripeIntegration?.lastTestedAt && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Last test: {stripeIntegration.lastTestStatus ?? "unknown"} at {new Date(stripeIntegration.lastTestedAt).toLocaleString("en-GB")}
                    </p>
                  )}
                </div>

                <div className="border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium">ChatGPT (OpenAI)</h3>
                    <Badge color={openAiIntegration?.isConnected ? "border-green-500/30 text-green-400" : "border-border text-muted-foreground"}>
                      {openAiIntegration?.isConnected ? "connected" : "not connected"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Used for AI-powered features and assistants.</p>
                  <input
                    type="password"
                    value={openAiKey}
                    onChange={(e) => setOpenAiKey(e.target.value)}
                    placeholder="sk-..."
                    className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30 mb-3"
                  />
                  <p className="text-xs text-muted-foreground mb-4">Saved key: {openAiIntegration?.maskedConfig.apiKey || "none"}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void saveIntegration("openai", { apiKey: openAiKey })}
                      disabled={savingProvider === "openai"}
                      className="px-3 py-2 text-xs bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {savingProvider === "openai" ? "Saving..." : "Save Key"}
                    </button>
                    <button
                      onClick={() => void testIntegration("openai")}
                      disabled={testingProvider === "openai" || integrationsLoading}
                      className="px-3 py-2 text-xs border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      {testingProvider === "openai" ? "Testing..." : "Test Connection"}
                    </button>
                  </div>
                  {openAiIntegration?.lastTestedAt && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Last test: {openAiIntegration.lastTestStatus ?? "unknown"} at {new Date(openAiIntegration.lastTestedAt).toLocaleString("en-GB")}
                    </p>
                  )}
                </div>

                <div className="border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium">Clerk</h3>
                    <Badge color={clerkIntegration?.isConnected ? "border-green-500/30 text-green-400" : "border-border text-muted-foreground"}>
                      {clerkIntegration?.isConnected ? "connected" : "not connected"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Used for auth, sign-in, sessions, and user management.</p>
                  <input
                    type="password"
                    value={clerkPublishableKey}
                    onChange={(e) => setClerkPublishableKey(e.target.value)}
                    placeholder="pk_live_..."
                    className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30 mb-3"
                  />
                  <input
                    type="password"
                    value={clerkSecretKey}
                    onChange={(e) => setClerkSecretKey(e.target.value)}
                    placeholder="sk_live_..."
                    className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30 mb-3"
                  />
                  <p className="text-xs text-muted-foreground mb-1">Saved publishable key: {clerkIntegration?.maskedConfig.publishableKey || "none"}</p>
                  <p className="text-xs text-muted-foreground mb-4">Saved secret key: {clerkIntegration?.maskedConfig.secretKey || "none"}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void saveIntegration("clerk", { publishableKey: clerkPublishableKey, secretKey: clerkSecretKey })}
                      disabled={savingProvider === "clerk"}
                      className="px-3 py-2 text-xs bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {savingProvider === "clerk" ? "Saving..." : "Save Credentials"}
                    </button>
                    <button
                      onClick={() => void testIntegration("clerk")}
                      disabled={testingProvider === "clerk" || integrationsLoading}
                      className="px-3 py-2 text-xs border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      {testingProvider === "clerk" ? "Testing..." : "Test Connection"}
                    </button>
                  </div>
                  {clerkIntegration?.lastTestedAt && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Last test: {clerkIntegration.lastTestStatus ?? "unknown"} at {new Date(clerkIntegration.lastTestedAt).toLocaleString("en-GB")}
                    </p>
                  )}
                </div>

                <div className="border border-border bg-card p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium">Supabase</h3>
                    <Badge color={supabaseIntegration?.isConnected ? "border-green-500/30 text-green-400" : "border-border text-muted-foreground"}>
                      {supabaseIntegration?.isConnected ? "connected" : "not connected"}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mb-3">Used for database, auth, storage, and edge features.</p>
                  <input
                    type="url"
                    value={supabaseUrl}
                    onChange={(e) => setSupabaseUrl(e.target.value)}
                    placeholder="https://your-project.supabase.co"
                    className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30 mb-3"
                  />
                  <input
                    type="password"
                    value={supabaseAnonKey}
                    onChange={(e) => setSupabaseAnonKey(e.target.value)}
                    placeholder="anon key"
                    className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30 mb-3"
                  />
                  <input
                    type="password"
                    value={supabaseServiceRoleKey}
                    onChange={(e) => setSupabaseServiceRoleKey(e.target.value)}
                    placeholder="service role key"
                    className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground/30 mb-3"
                  />
                  <p className="text-xs text-muted-foreground mb-1">Saved URL: {supabaseIntegration?.maskedConfig.url || "none"}</p>
                  <p className="text-xs text-muted-foreground mb-1">Saved anon key: {supabaseIntegration?.maskedConfig.anonKey || "none"}</p>
                  <p className="text-xs text-muted-foreground mb-4">Saved service role key: {supabaseIntegration?.maskedConfig.serviceRoleKey || "none"}</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => void saveIntegration("supabase", { url: supabaseUrl, anonKey: supabaseAnonKey, serviceRoleKey: supabaseServiceRoleKey })}
                      disabled={savingProvider === "supabase"}
                      className="px-3 py-2 text-xs bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {savingProvider === "supabase" ? "Saving..." : "Save Credentials"}
                    </button>
                    <button
                      onClick={() => void testIntegration("supabase")}
                      disabled={testingProvider === "supabase" || integrationsLoading}
                      className="px-3 py-2 text-xs border border-border text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
                    >
                      {testingProvider === "supabase" ? "Testing..." : "Test Connection"}
                    </button>
                  </div>
                  {supabaseIntegration?.lastTestedAt && (
                    <p className="text-xs text-muted-foreground mt-3">
                      Last test: {supabaseIntegration.lastTestStatus ?? "unknown"} at {new Date(supabaseIntegration.lastTestedAt).toLocaleString("en-GB")}
                    </p>
                  )}
                </div>
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
                  <p className="text-xs text-muted-foreground mb-4">Send to all {subscribers.length} subscribers</p>
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
                      { label: "Total subscribers", value: subscribers.length.toString() },
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
                  <h3 className="text-sm font-medium">Subscribers ({subscribers.length})</h3>
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
                    {subscribers.map(s => (
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
                <StatCard
                  icon={Database}
                  label="DB Size (Live)"
                  value={systemMetricsLoading ? undefined : formatGiB(storageUsedBytes)}
                  sub={systemMetrics?.source ? `source: ${systemMetrics.source}` : "live from database"}
                />
                <StatCard
                  icon={HardDrive}
                  label="Storage"
                  value={systemMetricsLoading ? undefined : formatGiB(storageUsedBytes)}
                  sub={storageLimitBytes ? `of ${formatGiB(storageLimitBytes)}` : "plan limit unavailable"}
                />
                <StatCard icon={Activity} label="Uptime" value="Live monitor not connected" sub="connect external monitoring for uptime" accent="text-muted-foreground" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                <div className="border border-border bg-card p-5">
                  <h3 className="text-sm font-medium mb-4">Service Health</h3>
                  <HealthRow label="API Server" status={apiHealthStatus} detail={apiHealthDetail} />
                  <HealthRow label="Photo Site" status="ok" detail={photoSiteHealthDetail} />
                  <HealthRow label="PostgreSQL" status={systemMetrics ? "ok" : "warn"} detail={databaseDetail} />
                  <HealthRow label="Auth Provider" status={clerkIntegration?.isConnected ? "ok" : "warn"} detail={authGatewayDetail} />
                  <HealthRow label="Payment Gateway" status={stripeIntegration?.isConnected ? "ok" : "warn"} detail={paymentGatewayDetail} />
                  <HealthRow label="Analytics Pipeline" status={analyticsData ? "ok" : "warn"} detail={analyticsData ? "Live analytics loaded" : "No analytics provider connected"} />
                </div>
                <div className="space-y-4">
                  <div className="border border-border bg-card p-5">
                    <h3 className="text-sm font-medium mb-4">Storage Breakdown</h3>
                    {storageBreakdown.map(({ label, valueBytes, color }) => (
                      <div key={label} className="mb-3">
                        <div className="flex justify-between text-xs mb-1">
                          <span>{label}</span>
                          <span className="text-muted-foreground">{formatGiB(valueBytes)}</span>
                        </div>
                        <MiniBar value={valueBytes / (1024 ** 3)} max={storageBarMaxGiB} color={color} />
                      </div>
                    ))}
                    <div className="mt-3 pt-3 border-t border-border flex justify-between text-xs">
                      <span className="text-muted-foreground">Total</span>
                      <span>
                        {systemMetricsLoading
                          ? "Loading..."
                          : storageLimitBytes
                            ? `${formatGiB(storageUsedBytes)} / ${formatGiB(storageLimitBytes)}`
                            : `${formatGiB(storageUsedBytes)} / limit unavailable`
                        }
                      </span>
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
                  {SYSTEM_ERRORS.map(e => (
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

              <div className="border border-border bg-card p-5 mb-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Database className="w-4 h-4 text-muted-foreground" /> Sample Data
                    </h3>
                    <p className="text-xs text-muted-foreground mt-1">
                      Seed the database with 28 curated photos and 6 collections for demo and development.
                    </p>
                  </div>
                  <button onClick={() => void fetchSeedStatus()} className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-muted/30 border border-border px-4 py-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Photos</p>
                    <p className="text-2xl font-serif">{seedCounts === null ? "—" : seedCounts.photos}</p>
                  </div>
                  <div className="bg-muted/30 border border-border px-4 py-3">
                    <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Collections</p>
                    <p className="text-2xl font-serif">{seedCounts === null ? "—" : seedCounts.collections}</p>
                  </div>
                </div>

                {seedMsg && (
                  <p className={cn("text-xs px-3 py-2 border mb-4", seedMsg.ok
                    ? "border-green-500/30 text-green-400 bg-green-500/5"
                    : "border-red-500/30 text-red-400 bg-red-500/5")}>
                    {seedMsg.text}
                  </p>
                )}

                <div className="flex gap-2">
                  <button
                    disabled={seedLoading || seedCounts?.hasData === true}
                    onClick={() => void runSeed(false)}
                    className="flex items-center gap-2 px-4 py-2 text-xs bg-foreground text-background hover:opacity-90 transition-opacity disabled:opacity-30"
                  >
                    {seedLoading ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Seed Sample Data
                  </button>
                  <button
                    disabled={seedLoading}
                    onClick={() => setConfirm({
                      title: "Reset & Reseed Database",
                      desc: "This will permanently delete all photos, collections, and their relationships, then insert fresh sample data. User accounts and sessions are untouched.",
                      dangerous: true,
                      confirmLabel: "Wipe & Reseed",
                      onConfirm: () => void runSeed(true),
                    })}
                    className="flex items-center gap-2 px-4 py-2 text-xs border border-red-500/40 text-red-400 hover:bg-red-500/10 transition-colors disabled:opacity-30"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Reset &amp; Reseed
                  </button>
                </div>
                {seedCounts?.hasData && !seedMsg && (
                  <p className="text-xs text-muted-foreground mt-2">Database already has data — use Reset &amp; Reseed to start fresh.</p>
                )}
              </div>

              <div className="border border-border">
                <div className="px-5 py-3 border-b border-border bg-card/50">
                  <h3 className="text-sm font-medium flex items-center gap-2"><GitBranch className="w-4 h-4 text-muted-foreground" /> Deploy History</h3>
                </div>
                <div className="divide-y divide-border">
                  {DEPLOY_HISTORY.map(d => (
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
