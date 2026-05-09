import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Bell, Heart, MessageSquare, UserPlus, CheckCheck, Inbox } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/auth-context";

interface Notification {
  id: number;
  type: string;
  photoId: number | null;
  photoTitle: string;
  actorName: string;
  commentBody: string | null;
  isRead: boolean;
  createdAt: string;
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
      <div className="w-10 h-10 rounded-full bg-red-500/10 flex items-center justify-center flex-shrink-0">
        <Heart className="w-4 h-4 text-red-500 fill-red-500" />
      </div>
    );
  if (type === "follow")
    return (
      <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center flex-shrink-0">
        <UserPlus className="w-4 h-4 text-blue-400" />
      </div>
    );
  return (
    <div className="w-10 h-10 rounded-full bg-violet-500/10 flex items-center justify-center flex-shrink-0">
      <MessageSquare className="w-4 h-4 text-violet-400" />
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
  const [activeFilter, setActiveFilter] = useState<"all" | "unread" | "likes" | "comments" | "follows">("all");

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await authFetch("/api/notifications");
      if (res.status === 401) {
        if (isAuthenticated) {
          setIsDemoMode(true);
          setNotifications(DEMO_NOTIFICATIONS);
          setUnreadCount(DEMO_NOTIFICATIONS.filter(n => !n.isRead).length);
        }
        setLoading(false);
        return;
      }
      if (res.ok) {
        const data = await res.json() as { notifications: Notification[]; unreadCount: number };
        const fromApi = data.notifications ?? [];
        if (fromApi.length === 0 && isAuthenticated) {
          setIsDemoMode(true);
          setNotifications(DEMO_NOTIFICATIONS);
          setUnreadCount(DEMO_NOTIFICATIONS.filter(n => !n.isRead).length);
        } else {
          setNotifications(fromApi);
          setUnreadCount(data.unreadCount ?? 0);
        }
      }
    } catch {
      if (isAuthenticated) {
        setIsDemoMode(true);
        setNotifications(DEMO_NOTIFICATIONS);
        setUnreadCount(DEMO_NOTIFICATIONS.filter(n => !n.isRead).length);
      }
    } finally {
      setLoading(false);
    }
  }, [authFetch, isAuthenticated]);

  useEffect(() => {
    void fetchNotifications();
  }, [fetchNotifications]);

  async function markAllRead() {
    setMarkingAll(true);
    try {
      if (!isDemoMode) {
        await authFetch("/api/notifications/read-all", { method: "PATCH" });
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } finally {
      setMarkingAll(false);
    }
  }

  async function markOneRead(id: number) {
    if (!isDemoMode) {
      await authFetch(`/api/notifications/${id}/read`, { method: "PATCH" });
    }
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    setUnreadCount((prev) => Math.max(0, prev - 1));
  }

  if (!isAuthenticated && !loading) {
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
            <p className="text-sm text-muted-foreground mb-6">You'll be notified when someone likes or comments on your photos.</p>
            <Link href="/signin" className="bg-foreground text-background px-6 py-3 text-sm font-medium hover:opacity-90 transition-opacity">
              Sign In
            </Link>
          </div>
        </div>
      </Layout>
    );
  }

  const filtered = notifications.filter((n) => {
    if (activeFilter === "unread") return !n.isRead;
    if (activeFilter === "likes") return n.type === "like";
    if (activeFilter === "comments") return n.type === "comment";
    if (activeFilter === "follows") return n.type === "follow";
    return true;
  });

  const filters: { id: typeof activeFilter; label: string; count?: number }[] = [
    { id: "all", label: "All", count: notifications.length },
    { id: "unread", label: "Unread", count: unreadCount || undefined },
    { id: "likes", label: "Likes", count: notifications.filter((n) => n.type === "like").length || undefined },
    { id: "comments", label: "Comments", count: notifications.filter((n) => n.type === "comment").length || undefined },
    { id: "follows", label: "Follows", count: notifications.filter((n) => n.type === "follow").length || undefined },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-3xl">
        <div className="flex items-start justify-between mb-10">
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

        <div className="flex items-center gap-1 border-b border-border mb-8 overflow-x-auto">
          {filters.map((f) => (
            <button
              key={f.id}
              onClick={() => setActiveFilter(f.id)}
              className={cn(
                "flex items-center gap-1.5 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 transition-colors -mb-px",
                activeFilter === f.id
                  ? "border-foreground text-foreground font-medium"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              )}
            >
              {f.label}
              {f.count !== undefined && f.count > 0 && (
                <span className={cn("text-xs px-1.5 py-0.5 rounded-full", activeFilter === f.id ? "bg-foreground text-background" : "bg-muted text-muted-foreground")}>
                  {f.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="flex gap-4 p-5 border border-border">
                <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border">
            <Inbox className="w-10 h-10 mx-auto mb-4 opacity-20" />
            <p className="font-serif text-xl mb-1">
              {activeFilter === "all" ? "No notifications yet" : `No ${activeFilter} notifications`}
            </p>
            <p className="text-sm text-muted-foreground">
              {activeFilter === "all"
                ? "When someone likes or comments on your photos, they'll appear here."
                : "Try switching to a different filter."}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((n) => (
              <div
                key={n.id}
                className={cn(
                  "flex items-start gap-4 p-5 border transition-colors",
                  !n.isRead
                    ? "border-border bg-muted/20"
                    : "border-border/50 hover:bg-muted/10"
                )}
              >
                <NotifIcon type={n.type} />

                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-snug mb-1">{notifText(n)}</p>
                  {n.type === "comment" && n.commentBody && (
                    <p className="text-xs text-muted-foreground italic line-clamp-2 mb-1">"{n.commentBody}"</p>
                  )}
                  <p className="text-xs text-muted-foreground/60">
                    {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                  </p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  {n.photoId && (
                    <Link
                      href={`/photos/${n.photoId}`}
                      onClick={() => { if (!n.isRead) void markOneRead(n.id); }}
                      className="text-xs text-muted-foreground hover:text-foreground transition-colors border border-border/50 px-2.5 py-1 hover:border-foreground"
                    >
                      View photo
                    </Link>
                  )}
                  {!n.isRead && (
                    <button
                      onClick={() => void markOneRead(n.id)}
                      className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 hover:bg-blue-300 transition-colors"
                      title="Mark as read"
                    />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
