import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/auth-context";

export interface SubscriptionState {
  status: string;
  isPremium: boolean;
  currentPeriodEnd: string | null;
  hasBilling: boolean;
}

const FREE_STATE: SubscriptionState = {
  status: "free",
  isPremium: false,
  currentPeriodEnd: null,
  hasBilling: false,
};

export function useSubscription() {
  const { user, isAdmin, authFetch } = useAuth();
  const [state, setState] = useState<SubscriptionState>(FREE_STATE);
  const [isLoading, setIsLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (isAdmin) {
      setState({
        status: "active",
        isPremium: true,
        currentPeriodEnd: null,
        hasBilling: false,
      });
      setIsLoading(false);
      return;
    }

    if (!user) {
      setState(FREE_STATE);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await authFetch("/api/subscription/status");
      if (!res.ok) {
        setState(FREE_STATE);
        return;
      }
      const data = (await res.json()) as SubscriptionState;
      setState({
        status: data.status ?? "free",
        isPremium: Boolean(data.isPremium),
        currentPeriodEnd: data.currentPeriodEnd ?? null,
        hasBilling: Boolean(data.hasBilling),
      });
    } catch {
      setState(FREE_STATE);
    } finally {
      setIsLoading(false);
    }
  }, [authFetch, isAdmin, user]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { ...state, isLoading, refresh };
}
