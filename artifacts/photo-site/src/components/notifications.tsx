import { useState, useEffect, useCallback } from "react";
import { Link } from "wouter";
import { Bell } from "lucide-react";
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

export function NotificationBell() {
  const { authFetch } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await authFetch("/api/notifications");
      if (res.ok) {
        const data = await res.json() as { notifications: Notification[]; unreadCount: number };
        setUnreadCount(data.unreadCount ?? 0);
      }
    } catch {
      // swallow silently — user may not be authenticated
    }
  }, [authFetch]);

  useEffect(() => {
    void fetchNotifications();
    const interval = setInterval(() => void fetchNotifications(), 30_000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

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
