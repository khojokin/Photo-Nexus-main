import { useState, useEffect, Fragment } from "react";
import { Link, useLocation } from "wouter";
import {
  Crown,
  CheckCircle2,
  Loader2,
  AlertCircle,
  Sparkles,
  BarChart3,
  Download,
  Star,
  Zap,
  Shield,
} from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { useSubscription } from "@/hooks/use-subscription";
import { Button } from "@/components/ui/button";
import { Layout } from "@/components/layout";
import { format } from "date-fns";

const MONTHLY_PRICE = 6.99;

const FEATURES = [
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Deep insights into views, downloads, and audience reach across your portfolio.",
  },
  {
    icon: Download,
    title: "HD Downloads",
    description: "Full-resolution downloads on every photo page, unlocked for you and your followers.",
  },
  {
    icon: Star,
    title: "Featured Nomination",
    description: "Every upload is eligible for editorial curation on the Affuaa homepage.",
  },
  {
    icon: Zap,
    title: "Priority Discovery",
    description: "Your work surfaces first in Explore, tags, and recommendation feeds.",
  },
  {
    icon: Shield,
    title: "Creator Badge",
    description: "A distinct premium badge on your profile that signals craft and commitment.",
  },
  {
    icon: Sparkles,
    title: "Early Access",
    description: "First access to new platform features before they go public.",
  },
];

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; color: string }> = {
    active: { label: "Active", color: "text-emerald-400 border-emerald-500/40 bg-emerald-500/10" },
    trialing: { label: "Trial", color: "text-sky-400 border-sky-500/40 bg-sky-500/10" },
    past_due: { label: "Past due", color: "text-amber-400 border-amber-500/40 bg-amber-500/10" },
    canceled: { label: "Canceled", color: "text-red-400 border-red-500/40 bg-red-500/10" },
    free: { label: "Free", color: "text-zinc-400 border-zinc-600 bg-zinc-800/40" },
  };
  const s = map[status] ?? map.free;
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 text-xs font-medium border ${s.color}`}>
      {s.label}
    </span>
  );
}

export default function PremiumPage() {
  const [, navigate] = useLocation();
  const { user, authFetch } = useAuth();
  const { isPremium, status, isLoading, hasBilling, currentPeriodEnd, refresh } = useSubscription();

  const [isCheckoutLoading, setIsCheckoutLoading] = useState(false);
  const [isPortalLoading, setIsPortalLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState<string | null>(null);
  const [banner, setBanner] = useState<"success" | "cancel" | null>(null);

  // Pick up ?checkout=success|cancel from Stripe redirect
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const state = params.get("checkout");
    if (state === "success") {
      setBanner("success");
      void refresh();
      window.history.replaceState({}, "", "/premium");
    } else if (state === "cancel") {
      setBanner("cancel");
      window.history.replaceState({}, "", "/premium");
    }
  }, [refresh]);

  const startCheckout = async () => {
    if (!user || isPremium) return;
    setIsCheckoutLoading(true);
    setCheckoutError(null);
    try {
      const res = await authFetch("/api/subscription/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data?.url) {
        window.location.href = data.url;
      } else if (!res.ok) {
        if (res.status === 500 && data?.error?.match(/STRIPE|Missing/)) {
          setCheckoutError("Payments are not yet fully configured. Please try again soon.");
        } else {
          setCheckoutError(data?.error ?? "Something went wrong. Please try again.");
        }
      }
    } catch {
      setCheckoutError("Network error — please check your connection and try again.");
    } finally {
      setIsCheckoutLoading(false);
    }
  };

  const openPortal = async () => {
    setIsPortalLoading(true);
    try {
      const res = await authFetch("/api/subscription/portal", { method: "POST" });
      const data = (await res.json()) as { url?: string };
      if (data?.url) window.location.href = data.url;
    } finally {
      setIsPortalLoading(false);
    }
  };

  return (
    <Layout>
      {/* ── Page wrapper ─────────────────────────────────────────────────── */}
      <div className="min-h-screen bg-background text-foreground">

        {/* ── Hero ─────────────────────────────────────────────────────────── */}
        <div className="relative overflow-hidden border-b border-border">
          {/* grain */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03] mix-blend-overlay"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
              backgroundSize: "200px 200px",
            }}
          />

          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8 sm:py-24">
            <div className="flex items-center gap-2 mb-6">
              <Crown className="w-5 h-5 text-amber-400" />
              <span className="text-xs tracking-[0.2em] uppercase text-muted-foreground font-medium">
                Affuaa Premium
              </span>
            </div>

            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl leading-[1.05] max-w-2xl">
              Tools for photographers who mean it.
            </h1>

            <p className="mt-6 text-muted-foreground text-lg max-w-xl leading-relaxed">
              One plan. Everything you need to get discovered, grow an audience, and earn from your craft.
            </p>
          </div>
        </div>

        {/* ── Banners ───────────────────────────────────────────────────────── */}
        {banner === "success" && (
          <div className="border-b border-emerald-500/30 bg-emerald-500/5 px-4 py-4">
            <div className="mx-auto max-w-6xl flex items-center gap-3 text-emerald-400 text-sm">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              <span>Payment successful — Premium is now active on your account.</span>
              <button
                onClick={() => setBanner(null)}
                className="ml-auto text-xs text-emerald-400/60 hover:text-emerald-400 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}
        {banner === "cancel" && (
          <div className="border-b border-zinc-700 bg-zinc-900/50 px-4 py-4">
            <div className="mx-auto max-w-6xl flex items-center gap-3 text-zinc-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Checkout was cancelled. No charge was made.</span>
              <button
                onClick={() => setBanner(null)}
                className="ml-auto text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                Dismiss
              </button>
            </div>
          </div>
        )}

        {/* ── Body ─────────────────────────────────────────────────────────── */}
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-[1fr_380px] gap-10 items-start">

            {/* ── Feature list ───────────────────────────────────────────── */}
            <div>
              <h2 className="text-sm tracking-[0.15em] uppercase text-muted-foreground mb-8 font-medium">
                What's included
              </h2>
              <div className="grid sm:grid-cols-2 gap-px border border-border bg-border">
                {FEATURES.map(({ icon: Icon, title, description }) => (
                  <div key={title} className="bg-background p-6">
                    <div className="flex items-center gap-3 mb-2">
                      <Icon className="w-4 h-4 text-amber-400 flex-shrink-0" />
                      <h3 className="text-sm font-medium">{title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
                  </div>
                ))}
              </div>

              {/* comparison footer */}
              <div className="mt-8 grid grid-cols-2 gap-px border border-border bg-border text-xs">
                <div className="bg-background px-5 py-3 text-muted-foreground font-medium">Free</div>
                <div className="bg-background px-5 py-3 text-amber-400 font-medium flex items-center gap-1.5">
                  <Crown className="w-3 h-3" /> Premium
                </div>
                {[
                  ["Browse photos", "Browse photos"],
                  ["Standard downloads", "HD downloads"],
                  ["Basic profile", "Creator badge + priority discovery"],
                  ["—", "Featured nomination on uploads"],
                  ["—", "Advanced analytics dashboard"],
                  ["—", "Early access to new features"],
                ].map(([free, premium], i) => (
                  <Fragment key={i}>
                    <div className="bg-background px-5 py-3 text-muted-foreground border-t border-border">
                      {free}
                    </div>
                    <div className="bg-background px-5 py-3 text-foreground border-t border-border">
                      {free === "—" ? (
                        <span className="text-amber-400">{premium}</span>
                      ) : (
                        premium
                      )}
                    </div>
                  </Fragment>
                ))}
              </div>
            </div>

            {/* ── Pricing card ───────────────────────────────────────────── */}
            <div className="lg:sticky lg:top-6">
              <div className="border border-border bg-card">
                {/* card header */}
                <div className="px-7 pt-7 pb-6 border-b border-border">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Crown className="w-4 h-4 text-amber-400" />
                      <span className="text-sm font-medium">Premium Plan</span>
                    </div>
                    {!isLoading && <StatusBadge status={status} />}
                    {isLoading && (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground" />
                    )}
                  </div>

                  {!isPremium ? (
                    <>
                      <div className="flex items-baseline gap-1.5">
                        <span className="font-serif text-5xl">${MONTHLY_PRICE.toFixed(2)}</span>
                        <span className="text-sm text-muted-foreground">/ month</span>
                      </div>
                      <p className="mt-1.5 text-xs text-muted-foreground">
                        Cancel anytime. No long-term commitment.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="text-sm text-muted-foreground mt-1">
                        Your premium access is active.
                      </p>
                      {currentPeriodEnd && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Renews {format(new Date(currentPeriodEnd), "MMM d, yyyy")}
                        </p>
                      )}
                    </>
                  )}
                </div>

                {/* perks summary */}
                <div className="px-7 py-5 border-b border-border space-y-2.5">
                  {[
                    "Advanced analytics dashboard",
                    "HD downloads on every photo",
                    "Featured nomination on uploads",
                    "Priority discovery in Explore",
                    "Creator badge on your profile",
                    "Early access to new features",
                  ].map((perk) => (
                    <div key={perk} className="flex items-center gap-2.5 text-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                      <span className="text-muted-foreground">{perk}</span>
                    </div>
                  ))}
                </div>

                {/* CTA area */}
                <div className="px-7 py-6 space-y-3">
                  {/* Error */}
                  {checkoutError && (
                    <div className="flex items-start gap-2 border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-amber-400 text-xs">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>{checkoutError}</span>
                    </div>
                  )}

                  {/* Not logged in */}
                  {!user && !isLoading && (
                    <>
                      <Button asChild className="w-full rounded-none">
                        <Link href="/signup">Create account to get started</Link>
                      </Button>
                      <Button asChild variant="ghost" className="w-full rounded-none text-xs">
                        <Link href="/signin">Already have an account? Sign in</Link>
                      </Button>
                    </>
                  )}

                  {/* Logged in, not premium */}
                  {user && !isPremium && !isLoading && (
                    <Button
                      onClick={() => void startCheckout()}
                      disabled={isCheckoutLoading}
                      className="w-full rounded-none bg-amber-500 hover:bg-amber-400 text-black font-medium"
                    >
                      {isCheckoutLoading ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Crown className="w-4 h-4 mr-2" />
                      )}
                      Get Premium · ${MONTHLY_PRICE.toFixed(2)}/mo
                    </Button>
                  )}

                  {/* Already premium */}
                  {user && isPremium && !isLoading && (
                    <div className="flex items-center gap-2 text-sm text-emerald-400 py-1">
                      <CheckCircle2 className="w-4 h-4" />
                      You have Premium
                    </div>
                  )}

                  {/* Manage billing */}
                  {isPremium && hasBilling && (
                    <Button
                      variant="outline"
                      className="w-full rounded-none"
                      onClick={() => void openPortal()}
                      disabled={isPortalLoading}
                    >
                      {isPortalLoading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                      Manage Billing
                    </Button>
                  )}

                  {/* Loading skeleton */}
                  {isLoading && (
                    <div className="h-10 bg-muted/40 animate-pulse w-full" />
                  )}

                  <p className="text-xs text-muted-foreground/60 text-center pt-1">
                    Secured by Stripe · Cancel any time
                  </p>
                </div>
              </div>

              {/* Admin note */}
              {user && (
                <button
                  onClick={() => void refresh()}
                  className="mt-3 text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors w-full text-center"
                >
                  Refresh subscription status
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
