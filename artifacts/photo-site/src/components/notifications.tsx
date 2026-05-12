import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "wouter";
import { Bell } from "lucide-react";
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
}

export function NotificationBell() {
  const { authFetch, user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);
  const esRef = useRef<EventSource | null>(null);

  const fetchAuthNotifications = useCallback(async (): Promise<number> => {
    try {
      const res = await authFetch("/api/notifications");
      if (res.ok) {
        const data = await res.json() as { notifications: Notification[]; unreadCount: number };
        return data.unreadCount ?? 0;
      }
    } catch { /* swallow */ }
    return 0;
  }, [authFetch]);

  const fetchFollowAlerts = useCallback(async (): Promise<number> => {
    const name = getDisplayName();
    if (!name) return 0;
    try {
      const res = await fetch(`/api/notifications/follow-alerts?name=${encodeURIComponent(name)}`);
      if (res.ok) {
        const data = await res.json() as { unreadCount: number };
        return data.unreadCount ?? 0;
      }
    } catch { /* swallow */ }
    return 0;
  }, []);

  const refreshCount = useCallback(async () => {
    const [authCount, alertCount] = await Promise.all([
      fetchAuthNotifications(),
      fetchFollowAlerts(),
    ]);
    setUnreadCount(authCount + alertCount);
  }, [fetchAuthNotifications, fetchFollowAlerts]);

  useEffect(() => {
    void refreshCount();

    if (!user) {
      const interval = setInterval(() => void refreshCount(), 30_000);
      return () => clearInterval(interval);
    }

    const es = new EventSource("/api/notifications/stream", { withCredentials: true });
    esRef.current = es;

    es.onmessage = async (e) => {
      try {
        const data = JSON.parse(e.data) as { unreadCount: number };
        const alertCount = await fetchFollowAlerts();
        setUnreadCount(data.unreadCount + alertCount);
      } catch { /* ignore malformed events */ }
    };

    es.onerror = () => {
      es.close();
      esRef.current = null;
      const interval = setInterval(() => void refreshCount(), 30_000);
      return () => clearInterval(interval);
    };

    return () => {
      es.close();
      esRef.current = null;
    };
  }, [user, refreshCount, fetchFollowAlerts]);

  return (
    <Link
      href="/notifications"
      className="relative p-1.5 text-muted-foreground hover:text-foreground transition-colors"
      aria-label="Open notifications"
    >
      <Bell className="w-5 h-5" />
      {unreadCount > 0 && (
        <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center px-1 leading-none">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}
