import { useState } from "react";
import { Link } from "wouter";
import {
  Crown, Download, BarChart3, Star, Zap, Shield,
  CheckCircle2, Loader2, AlertCircle, ArrowRight,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/auth-context";
import { useSubscription } from "@/hooks/use-subscription";
import { type PremiumFeature, PREMIUM_FEATURES } from "@/hooks/use-premium-gate";

const ICON_MAP: Record<string, React.ElementType> = {
  download: Download,
  "bar-chart": BarChart3,
  star: Star,
  zap: Zap,
  shield: Shield,
};

const ALL_PERKS = [
  "Advanced analytics dashboard",
  "HD downloads on every photo",
  "Featured nomination on uploads",
  "Priority discovery in Explore",
  "Creator badge on your profile",
  "Early access to new features",
];

interface PremiumGateModalProps {
  open: boolean;
  onClose: () => void;
  feature: PremiumFeature;
}

export function PremiumGateModal({ open, onClose, feature }: PremiumGateModalProps) {
  const { user, authFetch } = useAuth();
  const { refresh } = useSubscription();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const meta = PREMIUM_FEATURES[feature];
  const FeatureIcon = ICON_MAP[meta.icon] ?? Crown;

  const startCheckout = async () => {
    if (!user) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await authFetch("/api/subscription/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data?.url) {
        void refresh();
        window.location.href = data.url;
      } else if (!res.ok) {
        if (res.status === 500 && data?.error?.match(/STRIPE|Missing/)) {
          setError("Payments aren't fully configured yet. Please try again soon.");
        } else {
          setError(data?.error ?? "Something went wrong. Please try again.");
        }
      }
    } catch {
      setError("Network error — please check your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent
        className="p-0 gap-0 max-w-md rounded-none border-border bg-card overflow-hidden"
        aria-describedby="premium-gate-desc"
      >
        {/* ── Header ────────────────────────────────────────────────── */}
        <div className="relative border-b border-border px-7 pt-7 pb-6">
          {/* grain */}
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.03]"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E\")",
              backgroundSize: "180px 180px",
            }}
          />

          <div className="relative">
            <div className="flex items-center gap-2 mb-4">
              <span className="inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase text-amber-400 font-medium">
                <Crown className="w-3 h-3" />
                Premium feature
              </span>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-10 h-10 border border-border flex items-center justify-center text-amber-400">
                <FeatureIcon className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="font-serif text-2xl leading-tight mb-1">
                  {meta.title}
                </DialogTitle>
                <DialogDescription id="premium-gate-desc" className="text-sm text-muted-foreground leading-relaxed">
                  {meta.description}
                </DialogDescription>
              </div>
            </div>
          </div>
        </div>

        {/* ── Price + perks ─────────────────────────────────────────── */}
        <div className="px-7 py-5 border-b border-border">
          <div className="flex items-baseline gap-1.5 mb-4">
            <span className="font-serif text-3xl">$6.99</span>
            <span className="text-xs text-muted-foreground">/ month</span>
            <span className="ml-2 text-[10px] text-muted-foreground/60">· cancel anytime</span>
          </div>

          <div className="space-y-2">
            {ALL_PERKS.map((perk) => (
              <div key={perk} className="flex items-center gap-2.5 text-xs">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                <span className="text-muted-foreground">{perk}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── CTAs ──────────────────────────────────────────────────── */}
        <div className="px-7 py-6 space-y-3">
          {error && (
            <div className="flex items-start gap-2 border border-amber-500/30 bg-amber-500/5 px-3 py-2.5 text-amber-400 text-xs">
              <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {!user && (
            <>
              <Button asChild className="w-full rounded-none bg-amber-500 hover:bg-amber-400 text-black font-medium" onClick={onClose}>
                <Link href="/signup">
                  <Crown className="w-4 h-4 mr-2" />
                  Create account to get started
                </Link>
              </Button>
              <Button asChild variant="ghost" className="w-full rounded-none text-xs" onClick={onClose}>
                <Link href="/signin">Already have an account? Sign in</Link>
              </Button>
            </>
          )}

          {user && (
            <>
              <Button
                className="w-full rounded-none bg-amber-500 hover:bg-amber-400 text-black font-medium"
                onClick={() => void startCheckout()}
                disabled={isLoading}
              >
                {isLoading
                  ? <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  : <Crown className="w-4 h-4 mr-2" />}
                Get Premium · $6.99/mo
              </Button>

              <Button asChild variant="outline" className="w-full rounded-none text-xs" onClick={onClose}>
                <Link href="/premium">
                  See everything included
                  <ArrowRight className="w-3 h-3 ml-1.5" />
                </Link>
              </Button>
            </>
          )}

          <button
            onClick={onClose}
            className="w-full text-center text-xs text-muted-foreground/50 hover:text-muted-foreground transition-colors pt-1"
          >
            Maybe later
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
