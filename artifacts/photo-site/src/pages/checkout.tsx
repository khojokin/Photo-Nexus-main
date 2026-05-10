import { useState } from "react";
import { Link } from "wouter";
import { Crown, Loader2, CheckCircle2 } from "lucide-react";
import { Layout } from "@/components/layout";
import { useAuth } from "@/contexts/auth-context";
import { useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";

const MONTHLY_PRICE = 6.99;

export function CheckoutPage() {
  const { user, authFetch } = useAuth();
  const { isPremium } = useSubscription();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function startCheckout() {
    if (!user || isPremium) return;
    setIsSubmitting(true);
    try {
      const res = await authFetch("/api/subscription/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string };
      if (data?.url) {
        window.location.href = data.url;
      }
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Layout>
      <div className="min-h-screen px-4 py-12 sm:px-6 lg:px-8 bg-background text-foreground">
        <div className="mx-auto max-w-4xl">
          <h1 className="text-4xl font-serif mb-2">Checkout</h1>
          <p className="text-sm text-muted-foreground mb-8">Choose your plan and continue to secure payment.</p>

          <div className="border border-border bg-card p-6 sm:p-8">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  <h2 className="text-2xl font-serif">Premium</h2>
                </div>
                <p className="text-sm text-muted-foreground">Unlock analytics, HD downloads, and featured nomination tools.</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-serif">${MONTHLY_PRICE.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">per month</p>
              </div>
            </div>

            <div className="mt-6 border border-border/60 p-4">
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" />Advanced dashboard analytics</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" />HD downloads on photo pages</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" />Featured nomination on uploads</li>
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              {!user && (
                <Button asChild className="rounded-none">
                  <Link href="/signin">Sign in to continue</Link>
                </Button>
              )}

              {user && !isPremium && (
                <Button onClick={() => void startCheckout()} disabled={isSubmitting} className="rounded-none">
                  {isSubmitting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Continue to payment
                </Button>
              )}

              {user && isPremium && (
                <Button asChild variant="outline" className="rounded-none">
                  <Link href="/premium">You already have Premium</Link>
                </Button>
              )}

              <Button asChild variant="ghost" className="rounded-none">
                <Link href="/premium">Back</Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
