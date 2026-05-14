import { useMemo, useState } from "react";
import { Link } from "wouter";
import { Crown, CheckCircle2, Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout";

export default function PremiumPage() {
  const { user, authFetch } = useAuth();
  const { isPremium, status, isLoading, hasBilling, refresh } = useSubscription();
  const [isPortalLoading, setIsPortalLoading] = useState(false);

  const headline = useMemo(() => {
    if (isLoading) return "Checking your plan";
    return isPremium ? "Premium is active" : "Upgrade to Premium";
  }, [isLoading, isPremium]);

  const openPortal = async () => {
    setIsPortalLoading(true);
    try {
      const res = await authFetch("/api/subscription/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string };
      if (data?.url) {
        window.location.href = data.url;
      }
    } finally {
      setIsPortalLoading(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen px-4 py-10 sm:px-6 lg:px-8 bg-background text-foreground">
        <div className="mx-auto max-w-4xl">
          <div className="border border-border bg-card p-8 sm:p-10">
          <div className="flex items-center gap-3 mb-4">
            <Crown className="w-6 h-6 text-amber-500" />
            <h1 className="text-3xl font-serif">{headline}</h1>
          </div>
          <p className="text-muted-foreground max-w-2xl">
            Unlock pro tools for creators: advanced analytics, premium downloads, and featured nomination access.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="border border-border p-5">
              <h2 className="text-lg font-medium mb-2">Included with Premium</h2>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" />Advanced dashboard analytics</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" />HD downloads on photo pages</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" />Featured nomination on uploads</li>
              </ul>
            </div>
            <div className="border border-border p-5">
              <h2 className="text-lg font-medium mb-2">Plan status</h2>
              <p className="text-sm text-muted-foreground">Current status: <span className="text-foreground">{status}</span></p>
              {!user && (
                <p className="text-sm text-muted-foreground mt-3">
                  Sign in to manage your subscription.
                </p>
              )}
            </div>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            {!isPremium && user && (
              <Button asChild className="rounded-none">
                <Link href="/checkout">Choose Premium ($6.99)</Link>
              </Button>
            )}

            {isPremium && hasBilling && (
              <Button variant="outline" onClick={() => void openPortal()} disabled={isPortalLoading} className="rounded-none">
                {isPortalLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                Manage Billing
              </Button>
            )}

            <Button variant="ghost" className="rounded-none" onClick={() => void refresh()}>
              Refresh Status
            </Button>

            {!user && (
              <Button asChild variant="outline" className="rounded-none">
                <Link href="/signin">Go to Sign In</Link>
              </Button>
            )}
          </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
