import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Bell, Heart, MessageSquare, UserPlus, CheckCheck, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";

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

interface Notification {
  id: number;
  type: string;
  photoId: number | null;
  photoTitle: string;
  actorName: string;
  commentBody: string | null;
  isRead: boolean;
  createdAt: string;
  _source?: "auth" | "follow-alert";
}

const DEMO_NOTIFICATIONS: Notification[] = [
  { id: 1, type: "like", photoId: 1, photoTitle: "Into the Mist", actorName: "@silentframe", commentBody: null, isRead: false, createdAt: new Date(Date.now() - 5 * 60 * 1000).toISOString() },
  { id: 2, type: "comment", photoId: 3, photoTitle: "Urban Geometry", actorName: "Marcus Reid", commentBody: "The light in this shot is extraordinary. What lens did you use?", isRead: false, createdAt: new Date(Date.now() - 22 * 60 * 1000).toISOString() },
  { id: 3, type: "follow", photoId: null, photoTitle: "", actorName: "Aria Chen", commentBody: null, isRead: false, createdAt: new Date(Date.now() - 1.5 * 3600 * 1000).toISOString() },
  { id: 4, type: "like", photoId: 7, photoTitle: "Golden Shore", actorName: "@nomad.lens", commentBody: null, isRead: true, createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString() },
  { id: 5, type: "comment", photoId: 7, photoTitle: "Golden Shore", actorName: "Lena Fischer", commentBody: "Stunning composition — the rule of thirds at its finest.", isRead: true, createdAt: new Date(Date.now() - 5 * 3600 * 1000).toISOString() },
  { id: 6, type: "like", photoId: 2, photoTitle: "Soft Light Study", actorName: "@coldpixel", commentBody: null, isRead: true, createdAt: new Date(Date.now() - 8 * 3600 * 1000).toISOString() },
  { id: 7, type: "follow", photoId: null, photoTitle: "", actorName: "@urban.eyes", commentBody: null, isRead: true, createdAt: new Date(Date.now() - 12 * 3600 * 1000).toISOString() },
  { id: 8, type: "like", photoId: 5, photoTitle: "Rain on Glass", actorName: "Hiroshi Nakamura", commentBody: null, isRead: true, createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString() },
  { id: 9, type: "comment", photoId: 1, photoTitle: "Into the Mist", actorName: "Sofia Petrov", commentBody: "This makes me want to pick up a camera again. Absolutely cinematic.", isRead: true, createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString() },
  { id: 10, type: "like", photoId: 3, photoTitle: "Urban Geometry", actorName: "@vista.works", commentBody: null, isRead: true, createdAt: new Date(Date.now() - 48 * 3600 * 1000).toISOString() },
];

function NotifIcon({ type }: { type: string }) {
  if (type === "like")
    return (
      <div className="w-8 h-8 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" />
      </div>
    );
  if (type === "follow")
    return (
      <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
        <UserPlus className="w-3.5 h-3.5 text-blue-400" />
      </div>
    );
  return (
    <div className="w-8 h-8 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0 mt-0.5">
      <MessageSquare className="w-3.5 h-3.5 text-violet-400" />
    </div>
  );
}

function notifText(n: Notification) {
  if (n.type === "like") return <><span className="font-medium">{n.actorName}</span> liked <span className="text-muted-foreground">"{n.photoTitle}"</span></>;
  if (n.type === "follow") return <><span className="font-medium">{n.actorName}</span> started following you</>;
  return <><span className="font-medium">{n.actorName}</span> commented on <span className="text-muted-foreground">"{n.photoTitle}"</span></>;
}

export function Notifications() {
  const { authFetch, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const displayName = getDisplayName();

  const fetchNotifications = useCallback(async () => {
    const results: Notification[] = [];
    let usedDemo = false;

    // Fetch auth-based notifications
    try {
      const res = await authFetch("/api/notifications");
      if (res.ok) {
        const data = await res.json() as { notifications: Notification[]; unreadCount: number };
        const fromApi = (data.notifications ?? []).map((n) => ({ ...n, _source: "auth" as const }));
        results.push(...fromApi);
      }
    } catch { /* swallow */ }

    // Fetch name-based follow alerts
    if (displayName) {
      try {
        const res = await fetch(`/api/notifications/follow-alerts?name=${encodeURIComponent(displayName)}`);
        if (res.ok) {
          const data = await res.json() as { alerts: Array<{ id: number; actorName: string; isRead: boolean; createdAt: string }> };
          const alerts: Notification[] = (data.alerts ?? []).map((a) => ({
            id: a.id,
            type: "follow",
            photoId: null,
            photoTitle: "",
            actorName: a.actorName,
            commentBody: null,
            isRead: a.isRead,
            createdAt: a.createdAt,
            _source: "follow-alert" as const,
          }));
          results.push(...alerts);
        }
      } catch { /* swallow */ }
    }

    // Sort merged list newest-first
    results.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (results.length === 0 && isAuthenticated) {
      usedDemo = true;
      setIsDemoMode(true);
      setNotifications(DEMO_NOTIFICATIONS);
      setUnreadCount(DEMO_NOTIFICATIONS.filter((n) => !n.isRead).length);
    } else {
      setIsDemoMode(usedDemo);
      setNotifications(results);
      setUnreadCount(results.filter((n) => !n.isRead).length);
    }

    setLoading(false);
  }, [authFetch, isAuthenticated, displayName]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  async function markAllRead() {
    setMarkingAll(true);
    try {
      if (!isDemoMode) {
        // Mark auth notifications read
        await authFetch("/api/notifications/read-all", { method: "PATCH" }).catch(() => {});
        // Mark follow alerts read
        if (displayName) {
          await fetch(`/api/notifications/follow-alerts/read-all?name=${encodeURIComponent(displayName)}`, {
            method: "PATCH",
          }).catch(() => {});
        }
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } finally {
      setMarkingAll(false);
    }
  }

  async function markOneRead(n: Notification) {
    if (!isDemoMode) {
      if (n._source === "follow-alert") {
        await fetch(`/api/notifications/follow-alerts/${n.id}/read`, { method: "PATCH" }).catch(() => {});
      } else {
        await authFetch(`/api/notifications/${n.id}/read`, { method: "PATCH" }).catch(() => {});
      }
    }
    setNotifications((prev) => prev.map((m) => (m.id === n.id && m._source === n._source ? { ...m, isRead: true } : m)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  function notifLink(n: Notification) {
    if (n.type === "follow") return `/profile/${encodeURIComponent(n.actorName)}`;
    if (n.photoId) return `/photos/${n.photoId}`;
    return "/notifications";
  }

  if (!isAuthenticated && !displayName && !loading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-16 max-w-3xl">
          <div className="flex items-start justify-between mb-10">
            <div>
              <h1 className="font-serif text-4xl mb-1">Notifications</h1>
              <p className="text-muted-foreground text-sm">Sign in to see your notifications</p>
            </div>
          </div>
          <div className="text-center py-24 border border-dashed border-border">
            <Bell className="w-10 h-10 mx-auto mb-4 opacity-20" />
            <p className="font-serif text-xl mb-2">Sign in to see notifications</p>
            <p className="text-sm text-muted-foreground mb-6">You'll be notified when someone likes, comments on, or follows your work.</p>
            <Link href="/signin" className="bg-foreground text-background px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity">
              Sign In
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="font-serif text-4xl mb-1">Notifications</h1>
            <p className="text-muted-foreground text-sm">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount !== 1 ? "s" : ""}`
                : "You're all caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button
              onClick={() => void markAllRead()}
              disabled={markingAll}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors border border-border px-3 py-2 disabled:opacity-50"
            >
              <CheckCheck className="w-4 h-4" />
              Mark all read
            </button>
          )}
        </div>

        {isDemoMode && (
          <div className="mb-6 px-4 py-3 border border-border/50 bg-muted/10 text-xs text-muted-foreground flex items-center gap-2">
            <Bell className="w-3.5 h-3.5 flex-shrink-0" />
            Showing demo notifications — these are simulated examples of what you'd see when people engage with your photos.
          </div>
        )}

        {loading ? (
          <div className="space-y-2 border border-border bg-card">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex gap-3 px-4 py-3 border-b border-border/40 last:border-0">
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3.5 w-3/4" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))}
          </div>
        ) : notifications.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border">
            <Inbox className="w-10 h-10 mx-auto mb-4 opacity-20" />
            <p className="font-serif text-xl mb-1">No notifications yet</p>
            <p className="text-sm text-muted-foreground">
              When someone likes, comments, or follows you, they will appear here.
            </p>
          </div>
        ) : (
          <div className="border border-border bg-card">
            {notifications.map((n) => (
              <div
                key={`${n._source ?? "auth"}-${n.id}`}
                className={cn(
                  "relative border-b border-border/40 last:border-0 transition-colors",
                  !n.isRead ? "bg-muted/30" : "hover:bg-muted/20"
                )}
              >
                <Link
                  href={notifLink(n)}
                  onClick={() => { if (!n.isRead) void markOneRead(n); }}
                  className="flex items-start gap-3 px-4 py-3 w-full"
                >
                  <NotifIcon type={n.type} />

                  <div className="flex-1 min-w-0">
                    <p className="text-sm leading-snug">{notifText(n)}</p>
                    {n.type === "comment" && n.commentBody && (
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 italic">"{n.commentBody}"</p>
                    )}
                    <p className="text-xs text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                    </p>
                  </div>

                  {!n.isRead && (
                    <button
                      type="button"
                      onClick={(e) => { e.preventDefault(); e.stopPropagation(); void markOneRead(n); }}
                      className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 mt-2"
                      title="Mark as read"
                    />
                  )}
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
