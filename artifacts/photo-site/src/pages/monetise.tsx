import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import {
  DollarSign, Printer, MessageSquare, Coffee, FileText, CreditCard,
  TrendingUp, Download, Heart, Eye, Check, ChevronRight, Star,
  AlertCircle, Plus, X, ExternalLink, Zap, Shield, Info, Lock,
  Users, BarChart3, ArrowRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

type Tab = "overview" | "prints" | "commissions" | "tips" | "licensing" | "payouts";

const TABS: { id: Tab; label: string; icon: React.ElementType }[] = [
  { id: "overview", label: "Overview", icon: TrendingUp },
  { id: "prints", label: "Prints", icon: Printer },
  { id: "commissions", label: "Commissions", icon: MessageSquare },
  { id: "tips", label: "Tips", icon: Coffee },
  { id: "licensing", label: "Licensing", icon: FileText },
  { id: "payouts", label: "Payouts", icon: CreditCard },
];

const MOCK_TRANSACTIONS = [
  { id: 1, type: "print", desc: "A3 Print — Mountain at Dusk", amount: 28.00, date: "May 8, 2026" },
  { id: 2, type: "tip", desc: "Tip from @silentframe", amount: 5.00, date: "May 7, 2026" },
  { id: 3, type: "license", desc: "Commercial license — Fog Series", amount: 120.00, date: "May 6, 2026" },
  { id: 4, type: "print", desc: "A4 Print — Blue Hour Bridge", amount: 18.00, date: "May 5, 2026" },
  { id: 5, type: "commission", desc: "Commission — Corporate portraits", amount: 350.00, date: "May 3, 2026" },
  { id: 6, type: "tip", desc: "Tip from @nomad.lens", amount: 3.00, date: "May 2, 2026" },
];

const MOCK_STATS = { totalEarned: 524.00, thisMonth: 189.50, prints: 46.00, licenses: 120.00, commissions: 350.00, tips: 8.00 };

const PRINT_SIZES = [
  { id: "a5", label: "A5", dims: "148 × 210 mm", enabled: true, price: "12" },
  { id: "a4", label: "A4", dims: "210 × 297 mm", enabled: true, price: "18" },
  { id: "a3", label: "A3", dims: "297 × 420 mm", enabled: true, price: "28" },
  { id: "a2", label: "A2", dims: "420 × 594 mm", enabled: false, price: "45" },
  { id: "a1", label: "A1", dims: "594 × 841 mm", enabled: false, price: "70" },
  { id: "sq30", label: "Square 30cm", dims: "300 × 300 mm", enabled: true, price: "22" },
];

const COMMISSION_REQUESTS = [
  { id: 1, from: "@silentframe", subject: "Wedding shoot — June 14th", budget: "$800", date: "May 8", status: "pending" },
  { id: 2, from: "@urban.eyes", subject: "Architecture portfolio, 3 locations", budget: "$600", date: "May 6", status: "pending" },
  { id: 3, from: "@papercut.studio", subject: "Brand campaign imagery", budget: "$1,200", date: "May 3", status: "accepted" },
  { id: 4, from: "@nomad.lens", subject: "Travel editorial, 5 days", budget: "$2,500", date: "Apr 28", status: "declined" },
];

const LICENSE_TIERS = [
  {
    id: "free", label: "Free (CC0)", price: "Free",
    desc: "Anyone can use your photos with no restrictions or attribution required.",
    features: ["No revenue", "Maximum reach", "Public domain"],
    color: "border-border",
  },
  {
    id: "editorial", label: "Editorial", price: "From $25",
    desc: "Permitted for news, education, and editorial use. Commercial use requires upgrading.",
    features: ["News & editorial use", "Attribution required", "No commercial ads"],
    color: "border-border",
  },
  {
    id: "commercial", label: "Commercial", price: "From $120",
    desc: "Full commercial rights for advertising, products, and branded content.",
    features: ["All commercial uses", "Exclusive license option", "You set the price"],
    color: "border-foreground/60",
    highlighted: true,
  },
];

function StatCard({ label, value, sub, icon: Icon, accent }: {
  label: string; value: string; sub?: string; icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className={cn("border p-5 space-y-3", accent ? "border-foreground/30 bg-foreground/5" : "border-border bg-card")}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <Icon className="w-4 h-4 text-muted-foreground" />
      </div>
      <p className="text-3xl font-serif">{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

// ─── Qualification Gate ───────────────────────────────────────────────────────
const FOLLOWER_THRESHOLD = 1000;
const VIEWS_THRESHOLD = 10000;

function ProgressBar({ value, max, label }: { value: number; max: number; label: string }) {
  const pct = Math.min((value / max) * 100, 100);
  const done = value >= max;
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className={cn(done ? "text-green-400" : "text-muted-foreground")}>{label}</span>
        <span className={cn("font-medium", done ? "text-green-400" : "text-foreground")}>
          {value.toLocaleString()} / {max.toLocaleString()}
        </span>
      </div>
      <div className="h-1.5 bg-border overflow-hidden">
        <div
          className={cn("h-full transition-all duration-700", done ? "bg-green-400" : "bg-foreground/50")}
          style={{ width: `${pct}%` }}
        />
      </div>
      {done && (
        <p className="text-xs text-green-400 flex items-center gap-1"><Check className="w-3 h-3" /> Requirement met</p>
      )}
    </div>
  );
}

function QualificationGate({ followers, views }: { followers: number; views: number }) {
  const followersLeft = Math.max(0, FOLLOWER_THRESHOLD - followers);
  const viewsLeft = Math.max(0, VIEWS_THRESHOLD - views);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 max-w-2xl">
        <div className="text-center mb-12">
          <div className="w-16 h-16 border border-border flex items-center justify-center mx-auto mb-6">
            <Lock className="w-7 h-7 text-muted-foreground" />
          </div>
          <h1 className="font-serif text-4xl mb-4">Monetise Your Work</h1>
          <p className="text-muted-foreground leading-relaxed">
            Monetisation is available to established photographers who have built a meaningful presence on Affuaa.
            Keep creating, keep sharing — you're on your way.
          </p>
        </div>

        <div className="border border-border bg-card p-8 mb-8 space-y-6">
          <div className="flex items-center gap-2 mb-2">
            <BarChart3 className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm uppercase tracking-widest text-muted-foreground">Your Progress</h2>
          </div>
          <ProgressBar value={followers} max={FOLLOWER_THRESHOLD} label="Followers" />
          <ProgressBar value={views} max={VIEWS_THRESHOLD} label="Total photo views" />
        </div>

        {/* What you unlock */}
        <div className="border border-border p-6 mb-8">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-5">What you unlock</h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: Printer, label: "Print on Demand", desc: "Sell physical prints of your work" },
              { icon: FileText, label: "Licensing", desc: "Set prices for commercial use" },
              { icon: MessageSquare, label: "Commissions", desc: "Accept custom photography requests" },
              { icon: Coffee, label: "Tips & Support", desc: "Let fans support you directly" },
              { icon: CreditCard, label: "Payouts", desc: "Withdraw earnings monthly" },
              { icon: TrendingUp, label: "Revenue Dashboard", desc: "Track all your earnings" },
            ].map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 border border-border/50 bg-muted/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Icon className="w-3.5 h-3.5 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips to grow */}
        <div className="space-y-3 mb-8">
          <h3 className="text-sm uppercase tracking-widest text-muted-foreground">How to reach the threshold</h3>
          {[
            { tip: "Upload consistently — aim for 2–3 quality photos per week" },
            { tip: "Engage with other photographers: comment, follow, participate in challenges" },
            { tip: "Use relevant tags so your photos appear in searches" },
            { tip: "Share your profile link on social media and photography forums" },
            { tip: "Submit to weekly photo challenges to gain visibility" },
          ].map(({ tip }) => (
            <div key={tip} className="flex items-start gap-2 text-sm text-muted-foreground">
              <ArrowRight className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
              {tip}
            </div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link href="/upload" className="flex-1 text-center py-3 bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity">
            Upload Photos
          </Link>
          <Link href="/challenges" className="flex-1 text-center py-3 border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
            Join Challenges
          </Link>
        </div>

        {(followersLeft > 0 || viewsLeft > 0) && (
          <p className="text-xs text-muted-foreground text-center mt-4">
            {followersLeft > 0 && `${followersLeft.toLocaleString()} more followers`}
            {followersLeft > 0 && viewsLeft > 0 && " and "}
            {viewsLeft > 0 && `${viewsLeft.toLocaleString()} more views`}
            {" needed to unlock monetisation."}
          </p>
        )}
      </div>
    </Layout>
  );
}

// ─── Main Monetise Page ───────────────────────────────────────────────────────
export function Monetise() {
  const { user, isAdmin } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [printSizes, setPrintSizes] = useState(PRINT_SIZES);
  const [commissions, setCommissions] = useState(COMMISSION_REQUESTS);
  const [commOpen, setCommOpen] = useState(false);
  const [commRate, setCommRate] = useState("20");
  const [tipEnabled, setTipEnabled] = useState(true);
  const [licenseSelected, setLicenseSelected] = useState("commercial");
  const [tipCustom, setTipCustom] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("bank");

  // Qualification check
  const [followers, setFollowers] = useState<number>(0);
  const [views, setViews] = useState<number>(0);
  const [qualLoading, setQualLoading] = useState(true);

  const displayName = (() => {
    try { return JSON.parse(localStorage.getItem("affuaa_settings") ?? "{}").displayName ?? ""; }
    catch { return ""; }
  })();

  useEffect(() => {
    if (!user || isAdmin) { setQualLoading(false); return; }
    let done = 0;
    function check() { if (++done === 2) setQualLoading(false); }

    fetch(`/api/photographers/${encodeURIComponent(displayName)}/follow-stats`)
      .then(r => r.json())
      .then((d: { followerCount: number }) => setFollowers(d.followerCount ?? 0))
      .catch(() => {})
      .finally(check);

    fetch(`/api/photos?limit=200`)
      .then(r => r.json())
      .then((d: { photos: Array<{ photographerName: string; views?: number }> }) => {
        setViews((d.photos ?? []).filter(p => p.photographerName === displayName).reduce((s, p) => s + (p.views ?? 0), 0));
      })
      .catch(() => {})
      .finally(check);
  }, [user, displayName, isAdmin]);

  const isQualified = isAdmin || (followers >= FOLLOWER_THRESHOLD && views >= VIEWS_THRESHOLD);

  if (!qualLoading && !isQualified) {
    return <QualificationGate followers={followers} views={views} />;
  }

  if (qualLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-6 h-6 rounded-full border-2 border-muted border-t-foreground animate-spin" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <h1 className="font-serif text-4xl">Monetise</h1>
            {isAdmin && (
              <span className="text-xs px-2 py-0.5 border border-amber-500/30 text-amber-400 bg-amber-500/10">Admin Access</span>
            )}
          </div>
          <p className="text-muted-foreground">Turn your craft into income. Manage prints, commissions, licensing, and payouts.</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 border-b border-border mb-10 overflow-x-auto">
          {TABS.map(t => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={cn(
                  "flex items-center gap-2 px-4 py-2.5 text-sm whitespace-nowrap border-b-2 -mb-px transition-colors",
                  tab === t.id
                    ? "border-foreground text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>

        {/* ── Overview ── */}
        {tab === "overview" && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <StatCard label="Total Earned" value={`$${MOCK_STATS.totalEarned.toFixed(2)}`} icon={DollarSign} accent />
              <StatCard label="This Month" value={`$${MOCK_STATS.thisMonth.toFixed(2)}`} icon={TrendingUp} />
              <StatCard label="Pending Payout" value="$94.50" icon={CreditCard} />
              <StatCard label="Print Sales" value={`$${MOCK_STATS.prints.toFixed(2)}`} icon={Printer} sub="3 orders" />
              <StatCard label="License Revenue" value={`$${MOCK_STATS.licenses.toFixed(2)}`} icon={FileText} sub="1 license" />
              <StatCard label="Tips Received" value={`$${MOCK_STATS.tips.toFixed(2)}`} icon={Coffee} sub="2 supporters" />
            </div>

            <div className="border border-border bg-card">
              <div className="px-5 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-sm font-medium">Recent Transactions</h2>
                <button className="text-xs text-muted-foreground hover:text-foreground">View all</button>
              </div>
              <div className="divide-y divide-border">
                {MOCK_TRANSACTIONS.map(tx => (
                  <div key={tx.id} className="px-5 py-3 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-sm truncate">{tx.desc}</p>
                      <p className="text-xs text-muted-foreground">{tx.date} · {tx.type}</p>
                    </div>
                    <span className="text-sm font-medium text-green-400 flex-shrink-0">+${tx.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-border/40 bg-muted/20 p-5 flex items-start gap-3">
              <Info className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium mb-1">Next payout: May 15, 2026</p>
                <p className="text-xs text-muted-foreground">Affuaa processes payouts on the 15th of each month. Minimum payout threshold is $20.00. Earnings below this roll over to the next cycle.</p>
              </div>
            </div>
          </div>
        )}

        {/* ── Prints ── */}
        {tab === "prints" && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">Enable print sizes for your photos. Buyers can order physical prints through our print-on-demand partner. You earn 30% of each sale.</p>
            <div className="divide-y divide-border border border-border">
              {printSizes.map(size => (
                <div key={size.id} className="flex items-center justify-between px-5 py-4">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 border border-border bg-card flex items-center justify-center text-xs font-medium">{size.label}</div>
                    <div>
                      <p className="text-sm">{size.label}</p>
                      <p className="text-xs text-muted-foreground">{size.dims}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground text-sm">$</span>
                      <input
                        type="number"
                        value={size.price}
                        onChange={e => setPrintSizes(prev => prev.map(s => s.id === size.id ? { ...s, price: e.target.value } : s))}
                        className="w-16 bg-transparent border border-border px-2 py-1 text-sm text-right focus:outline-none focus:border-foreground"
                      />
                    </div>
                    <button
                      onClick={() => setPrintSizes(prev => prev.map(s => s.id === size.id ? { ...s, enabled: !s.enabled } : s))}
                      className={cn(
                        "text-xs px-3 py-1.5 border transition-colors",
                        size.enabled ? "border-green-500/40 text-green-400 bg-green-500/10" : "border-border text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {size.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button className="px-5 py-2.5 bg-foreground text-background text-sm hover:opacity-90 transition-opacity">Save Print Settings</button>
          </div>
        )}

        {/* ── Commissions ── */}
        {tab === "commissions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-serif">Commission Requests</h2>
                <p className="text-sm text-muted-foreground mt-1">{commissions.filter(c => c.status === "pending").length} pending request{commissions.filter(c => c.status === "pending").length !== 1 ? "s" : ""}</p>
              </div>
              <button
                onClick={() => setCommOpen(o => !o)}
                className={cn("flex items-center gap-1.5 text-xs px-3 py-2 border transition-colors",
                  commOpen ? "border-green-500/40 text-green-400" : "border-border text-muted-foreground hover:text-foreground")}
              >
                {commOpen ? <Check className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />}
                {commOpen ? "Accepting commissions" : "Commissions closed"}
              </button>
            </div>
            <div className="space-y-3">
              {commissions.map(req => (
                <div key={req.id} className="border border-border p-5">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <p className="font-medium text-sm">{req.subject}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{req.from} · {req.date} · Budget: {req.budget}</p>
                    </div>
                    <span className={cn("text-xs px-2 py-0.5 border flex-shrink-0",
                      req.status === "pending" ? "border-amber-500/30 text-amber-400" :
                      req.status === "accepted" ? "border-green-500/30 text-green-400" : "border-border text-muted-foreground")}>
                      {req.status}
                    </span>
                  </div>
                  {req.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCommissions(prev => prev.map(c => c.id === req.id ? { ...c, status: "accepted" } : c))}
                        className="px-3 py-1.5 text-xs border border-green-500/30 text-green-400 hover:bg-green-500/10 transition-colors">
                        Accept
                      </button>
                      <button
                        onClick={() => setCommissions(prev => prev.map(c => c.id === req.id ? { ...c, status: "declined" } : c))}
                        className="px-3 py-1.5 text-xs border border-border text-muted-foreground hover:text-foreground transition-colors">
                        Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Tips ── */}
        {tab === "tips" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-serif">Tips & Support</h2>
                <p className="text-sm text-muted-foreground mt-1">Allow visitors to send you a tip as appreciation for your work.</p>
              </div>
              <button
                onClick={() => setTipEnabled(v => !v)}
                className={cn("text-xs px-3 py-2 border transition-colors",
                  tipEnabled ? "border-green-500/40 text-green-400 bg-green-500/10" : "border-border text-muted-foreground hover:text-foreground")}>
                {tipEnabled ? "Tips enabled" : "Tips disabled"}
              </button>
            </div>
            <div className="border border-border bg-card p-6">
              <h3 className="text-sm font-medium mb-4">Preset Amounts</h3>
              <div className="flex gap-3 flex-wrap mb-4">
                {["$3", "$5", "$10", "$25"].map(a => (
                  <div key={a} className="px-4 py-2 border border-border text-sm">{a}</div>
                ))}
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground text-sm">Custom: $</span>
                  <input
                    type="number"
                    value={tipCustom}
                    onChange={e => setTipCustom(e.target.value)}
                    placeholder="amount"
                    className="w-20 bg-transparent border border-border px-2 py-1.5 text-sm focus:outline-none focus:border-foreground"
                  />
                </div>
              </div>
              <button className="px-4 py-2 bg-foreground text-background text-sm hover:opacity-90 transition-opacity">Save Tip Settings</button>
            </div>
            <div className="border border-border bg-card divide-y divide-border">
              <div className="px-5 py-4"><h3 className="text-sm font-medium">Recent Tips</h3></div>
              {MOCK_TRANSACTIONS.filter(t => t.type === "tip").map(t => (
                <div key={t.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm">{t.desc}</p>
                    <p className="text-xs text-muted-foreground">{t.date}</p>
                  </div>
                  <span className="text-sm font-medium text-green-400">+${t.amount.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Licensing ── */}
        {tab === "licensing" && (
          <div className="space-y-6">
            <p className="text-sm text-muted-foreground">Choose how your photos can be used. You can set different licenses per photo from the photo detail page.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {LICENSE_TIERS.map(tier => (
                <div
                  key={tier.id}
                  onClick={() => setLicenseSelected(tier.id)}
                  className={cn(
                    "border p-5 cursor-pointer transition-colors",
                    licenseSelected === tier.id ? "border-foreground/60 bg-foreground/5" : "border-border hover:border-border/80"
                  )}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-medium text-sm">{tier.label}</h3>
                    {licenseSelected === tier.id && <Check className="w-4 h-4 text-green-400" />}
                  </div>
                  <p className="text-lg font-serif mb-3">{tier.price}</p>
                  <p className="text-xs text-muted-foreground mb-4 leading-relaxed">{tier.desc}</p>
                  <ul className="space-y-1.5">
                    {tier.features.map(f => (
                      <li key={f} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Check className="w-3 h-3" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <button className="px-5 py-2.5 bg-foreground text-background text-sm hover:opacity-90 transition-opacity">Apply Default License</button>
          </div>
        )}

        {/* ── Payouts ── */}
        {tab === "payouts" && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <StatCard label="Available Balance" value="$94.50" icon={DollarSign} accent />
              <StatCard label="Lifetime Paid Out" value="$429.50" icon={CreditCard} />
            </div>
            <div className="border border-border bg-card p-6">
              <h3 className="text-sm font-medium mb-5">Payout Method</h3>
              <div className="flex gap-3 mb-5">
                {["bank", "paypal", "stripe"].map(m => (
                  <button
                    key={m}
                    onClick={() => setPayoutMethod(m)}
                    className={cn("px-4 py-2 text-sm border transition-colors capitalize",
                      payoutMethod === m ? "border-foreground text-foreground" : "border-border text-muted-foreground hover:text-foreground")}
                  >
                    {m === "bank" ? "Bank Transfer" : m === "paypal" ? "PayPal" : "Stripe"}
                  </button>
                ))}
              </div>
              <div className="space-y-3">
                <input type="text" placeholder={payoutMethod === "paypal" ? "PayPal email address" : payoutMethod === "stripe" ? "Stripe account ID" : "Account holder name"}
                  className="w-full bg-transparent border border-border px-4 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors" />
                {payoutMethod === "bank" && (
                  <>
                    <input type="text" placeholder="IBAN / Account number" className="w-full bg-transparent border border-border px-4 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors" />
                    <input type="text" placeholder="Sort code / Routing number" className="w-full bg-transparent border border-border px-4 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors" />
                  </>
                )}
              </div>
              <div className="flex items-center gap-3 mt-5">
                <button className="px-5 py-2.5 bg-foreground text-background text-sm hover:opacity-90 transition-opacity">Save Payout Details</button>
                <button className="px-5 py-2.5 border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">Request Payout ($94.50)</button>
              </div>
            </div>
            <div className="border border-border">
              <div className="px-5 py-4 border-b border-border"><h3 className="text-sm font-medium">Payout History</h3></div>
              <div className="divide-y divide-border">
                {[
                  { date: "Apr 15, 2026", amount: 189.50, method: "Bank Transfer", status: "paid" },
                  { date: "Mar 15, 2026", amount: 140.00, method: "Bank Transfer", status: "paid" },
                  { date: "Feb 15, 2026", amount: 100.00, method: "PayPal", status: "paid" },
                ].map((p, i) => (
                  <div key={i} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm">{p.date} · {p.method}</p>
                      <p className="text-xs text-green-400">{p.status}</p>
                    </div>
                    <span className="text-sm font-medium">-${p.amount.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
