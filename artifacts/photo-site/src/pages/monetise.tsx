import { useState } from "react";
import { Layout } from "@/components/layout";
import {
  DollarSign, Printer, MessageSquare, Coffee, FileText, CreditCard,
  TrendingUp, Download, Heart, Eye, Check, ChevronRight, Star,
  AlertCircle, Plus, X, ExternalLink, Zap, Shield, Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
    id: "free",
    label: "Free (CC0)",
    price: "Free",
    desc: "Anyone can use your photos with no restrictions or attribution required.",
    features: ["No revenue", "Maximum reach", "Public domain"],
    color: "border-border",
  },
  {
    id: "editorial",
    label: "Editorial",
    price: "From $25",
    desc: "Permitted for news, education, and editorial use. Commercial use requires upgrading.",
    features: ["News & editorial use", "Attribution required", "No commercial ads"],
    color: "border-border",
  },
  {
    id: "commercial",
    label: "Commercial",
    price: "From $120",
    desc: "Full commercial rights for advertising, products, and branded content.",
    features: ["All commercial uses", "Exclusive license option", "You set the price"],
    color: "border-foreground/60",
    highlighted: true,
  },
];

function StatCard({ label, value, sub, icon: Icon, accent }: { label: string; value: string; sub?: string; icon: React.ElementType; accent?: boolean }) {
  return (
    <div className={cn("border p-5 space-y-3", accent ? "border-foreground/30 bg-foreground/5" : "border-border bg-card")}>
      <div className="flex items-center justify-between">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">{label}</p>
        <Icon className={cn("w-4 h-4", accent ? "text-foreground" : "text-muted-foreground")} />
      </div>
      <p className={cn("text-3xl font-serif", accent ? "text-foreground" : "")}>{value}</p>
      {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
    </div>
  );
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
        checked ? "bg-foreground" : "bg-muted"
      )}
    >
      <span className={cn("inline-block h-3.5 w-3.5 rounded-full bg-background shadow transition-transform duration-200", checked ? "translate-x-4" : "translate-x-0.5")} />
    </button>
  );
}

function OverviewTab() {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total Earned" value={`$${MOCK_STATS.totalEarned.toFixed(2)}`} sub="All time" icon={DollarSign} accent />
        <StatCard label="This Month" value={`$${MOCK_STATS.thisMonth.toFixed(2)}`} sub="May 2026" icon={TrendingUp} />
        <StatCard label="Commissions" value={`$${MOCK_STATS.commissions.toFixed(2)}`} sub="2 completed" icon={MessageSquare} />
        <StatCard label="Licenses Sold" value={`$${MOCK_STATS.licenses.toFixed(2)}`} sub="3 deals" icon={FileText} />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Print Sales" value={`$${MOCK_STATS.prints.toFixed(2)}`} sub="4 prints" icon={Printer} />
        <StatCard label="Tips Received" value={`$${MOCK_STATS.tips.toFixed(2)}`} sub="2 tips" icon={Coffee} />
        <StatCard label="Pending Payout" value="$189.50" sub="Next: June 1st" icon={CreditCard} />
      </div>

      <div>
        <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Recent Transactions</h3>
        <div className="border border-border divide-y divide-border">
          {MOCK_TRANSACTIONS.map((tx) => {
            const typeColors: Record<string, string> = {
              print: "text-blue-400", tip: "text-yellow-400",
              license: "text-purple-400", commission: "text-green-400",
            };
            return (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <span className={cn("text-xs uppercase tracking-wide font-medium w-20 shrink-0", typeColors[tx.type] ?? "text-muted-foreground")}>
                    {tx.type}
                  </span>
                  <p className="text-sm text-muted-foreground">{tx.desc}</p>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <p className="text-xs text-muted-foreground">{tx.date}</p>
                  <p className="text-sm font-medium text-green-400">+${tx.amount.toFixed(2)}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="border border-border/50 bg-muted/10 px-5 py-4 flex items-start gap-3">
        <Info className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Earnings shown are illustrative. Connect a payment provider in Payouts to activate real transactions. Affuaa takes a 10% platform fee on all sales.
        </p>
      </div>
    </div>
  );
}

function PrintsTab() {
  const [sizes, setSizes] = useState(PRINT_SIZES.map((s) => ({ ...s })));
  const [printEnabled, setPrintEnabled] = useState(true);
  const [saved, setSaved] = useState(false);

  function save() {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Print Sales</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Allow visitors to order professional prints of your photos</p>
        </div>
        <Toggle checked={printEnabled} onChange={setPrintEnabled} />
      </div>

      {printEnabled && (
        <>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Available Sizes & Pricing</p>
            <div className="border border-border divide-y divide-border">
              {sizes.map((size, i) => (
                <div key={size.id} className="flex items-center gap-4 px-4 py-3">
                  <Toggle
                    checked={size.enabled}
                    onChange={(v) => setSizes((prev) => prev.map((s, j) => j === i ? { ...s, enabled: v } : s))}
                  />
                  <div className="w-12 font-medium text-sm">{size.label}</div>
                  <div className="text-xs text-muted-foreground flex-1">{size.dims}</div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-muted-foreground text-sm">$</span>
                    <input
                      type="number"
                      value={size.price}
                      onChange={(e) => setSizes((prev) => prev.map((s, j) => j === i ? { ...s, price: e.target.value } : s))}
                      disabled={!size.enabled}
                      className="w-20 bg-transparent border border-border px-2 py-1 text-sm text-right focus:outline-none focus:border-foreground transition-colors disabled:opacity-30"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border border-border/50 bg-muted/10 px-5 py-4 flex items-start gap-3">
            <Printer className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              Prints are fulfilled by our print-on-demand partner. Orders ship within 5–7 business days. You earn your price minus production cost and platform fee.
            </p>
          </div>

          <button
            onClick={save}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-colors",
              saved ? "bg-green-500/10 text-green-400 border border-green-500/30" : "bg-foreground text-background hover:opacity-90"
            )}
          >
            {saved ? <><Check className="w-4 h-4" /> Saved</> : "Save Print Settings"}
          </button>
        </>
      )}
    </div>
  );
}

function CommissionsTab() {
  const [requests, setRequests] = useState(COMMISSION_REQUESTS.map((r) => ({ ...r })));
  const [commissionsEnabled, setCommissionsEnabled] = useState(true);
  const [rate, setRate] = useState("150");
  const [bio, setBio] = useState("Available for portrait, landscape, and editorial work. Min. 4hrs.");

  function updateStatus(id: number, status: string) {
    setRequests((prev) => prev.map((r) => r.id === id ? { ...r, status } : r));
  }

  const statusStyle: Record<string, string> = {
    pending: "text-yellow-400 border-yellow-400/30 bg-yellow-400/5",
    accepted: "text-green-400 border-green-500/30 bg-green-500/5",
    declined: "text-muted-foreground border-border",
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Accept Commission Requests</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Let clients reach you for paid photography projects</p>
        </div>
        <Toggle checked={commissionsEnabled} onChange={setCommissionsEnabled} />
      </div>

      {commissionsEnabled && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Day Rate (USD)</label>
              <div className="flex items-center gap-1.5">
                <span className="text-muted-foreground text-sm">$</span>
                <input
                  type="number"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="flex-1 bg-transparent border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground">Services Bio</label>
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                rows={2}
                className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
              />
            </div>
          </div>

          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Incoming Requests</h3>
            <div className="space-y-3">
              {requests.map((r) => (
                <div key={r.id} className="border border-border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{r.subject}</p>
                      <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>{r.from}</span>
                        <span>·</span>
                        <span>Budget: {r.budget}</span>
                        <span>·</span>
                        <span>{r.date}</span>
                      </div>
                    </div>
                    <span className={cn("text-xs px-2 py-0.5 border shrink-0", statusStyle[r.status])}>
                      {r.status}
                    </span>
                  </div>
                  {r.status === "pending" && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => updateStatus(r.id, "accepted")}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-foreground text-background hover:opacity-90 transition-opacity"
                      >
                        <Check className="w-3 h-3" /> Accept
                      </button>
                      <button
                        onClick={() => updateStatus(r.id, "declined")}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs border border-border text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors"
                      >
                        <X className="w-3 h-3" /> Decline
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function TipsTab() {
  const [tipsEnabled, setTipsEnabled] = useState(true);
  const [presets, setPresets] = useState(["3", "5", "10", "25"]);
  const [thankYou, setThankYou] = useState("Thanks for supporting my work — it really means a lot. ☕");
  const [saved, setSaved] = useState(false);

  function save() { setSaved(true); setTimeout(() => setSaved(false), 2000); }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-medium">Tip Jar</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Let visitors support you with one-click tips</p>
        </div>
        <Toggle checked={tipsEnabled} onChange={setTipsEnabled} />
      </div>

      {tipsEnabled && (
        <>
          <div className="space-y-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Preset Tip Amounts (USD)</p>
            <div className="flex gap-3 flex-wrap">
              {presets.map((p, i) => (
                <div key={i} className="flex items-center gap-1.5 border border-border px-3 py-2">
                  <span className="text-muted-foreground text-sm">$</span>
                  <input
                    type="number"
                    value={p}
                    onChange={(e) => setPresets((prev) => prev.map((v, j) => j === i ? e.target.value : v))}
                    className="w-12 bg-transparent text-sm focus:outline-none text-center"
                  />
                </div>
              ))}
              <button
                onClick={() => setPresets((prev) => [...prev, "15"])}
                className="flex items-center gap-1 px-3 py-2 border border-dashed border-border text-muted-foreground text-sm hover:border-foreground/50 hover:text-foreground transition-colors"
              >
                <Plus className="w-3.5 h-3.5" /> Add
              </button>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Thank You Message</label>
            <textarea
              value={thankYou}
              onChange={(e) => setThankYou(e.target.value)}
              rows={3}
              maxLength={200}
              className="w-full bg-transparent border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
            />
            <p className="text-xs text-muted-foreground text-right">{thankYou.length}/200</p>
          </div>

          <div className="border border-border p-4 space-y-3">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Preview</p>
            <p className="text-sm font-medium">Support this photographer</p>
            <div className="flex gap-2 flex-wrap">
              {presets.map((p, i) => (
                <button key={i} className="px-4 py-2 border border-border text-sm hover:bg-muted transition-colors">
                  ☕ ${p}
                </button>
              ))}
              <button className="px-4 py-2 border border-border text-sm hover:bg-muted transition-colors text-muted-foreground">
                Custom
              </button>
            </div>
          </div>

          <button
            onClick={save}
            className={cn(
              "flex items-center gap-2 px-6 py-2.5 text-sm font-medium transition-colors",
              saved ? "bg-green-500/10 text-green-400 border border-green-500/30" : "bg-foreground text-background hover:opacity-90"
            )}
          >
            {saved ? <><Check className="w-4 h-4" /> Saved</> : "Save Tip Settings"}
          </button>
        </>
      )}
    </div>
  );
}

function LicensingTab() {
  const [selected, setSelected] = useState("editorial");

  return (
    <div className="space-y-8">
      <div>
        <h3 className="font-medium">Default License Tier</h3>
        <p className="text-xs text-muted-foreground mt-0.5">Sets the default license applied to newly uploaded photos. You can override per photo.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {LICENSE_TIERS.map((tier) => (
          <button
            key={tier.id}
            onClick={() => setSelected(tier.id)}
            className={cn(
              "border p-5 text-left space-y-3 transition-all",
              selected === tier.id ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/40"
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-medium text-sm">{tier.label}</p>
                <p className="text-sm text-muted-foreground font-mono mt-0.5">{tier.price}</p>
              </div>
              <div className={cn("w-4 h-4 rounded-full border-2 shrink-0 mt-0.5 flex items-center justify-center", selected === tier.id ? "border-foreground bg-foreground" : "border-border")}>
                {selected === tier.id && <div className="w-1.5 h-1.5 rounded-full bg-background" />}
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{tier.desc}</p>
            <ul className="space-y-1.5">
              {tier.features.map((f) => (
                <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Check className="w-3 h-3 text-foreground/50 shrink-0" />
                  {f}
                </li>
              ))}
            </ul>
          </button>
        ))}
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Licensing Features</p>
        <div className="border border-border divide-y divide-border">
          {[
            { label: "Exclusive license option", desc: "Offer a buyer sole rights to an image for a premium", icon: Star },
            { label: "Watermark on preview", desc: "Show a subtle watermark on unlicensed photo previews", icon: Shield },
            { label: "License certificate", desc: "Auto-generate a PDF certificate for each license sale", icon: FileText },
          ].map(({ label, desc, icon: Icon }) => (
            <div key={label} className="flex items-center gap-4 px-4 py-3">
              <Icon className="w-4 h-4 text-muted-foreground shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
              <span className="text-xs text-muted-foreground border border-dashed border-border px-2 py-0.5">Coming soon</span>
            </div>
          ))}
        </div>
      </div>

      <button className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity">
        Save Licensing Preferences
      </button>
    </div>
  );
}

function PayoutsTab() {
  const [method, setMethod] = useState<"paypal" | "bank" | null>(null);
  const [email, setEmail] = useState("");

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-4">
        <div className="border border-border p-5 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Available Balance</p>
          <p className="text-3xl font-serif">$189.50</p>
          <p className="text-xs text-muted-foreground">Next payout: June 1, 2026</p>
        </div>
        <div className="border border-border p-5 space-y-1">
          <p className="text-xs text-muted-foreground uppercase tracking-widest">Lifetime Paid Out</p>
          <p className="text-3xl font-serif">$334.50</p>
          <p className="text-xs text-muted-foreground">3 payouts completed</p>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Payout Method</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { id: "paypal" as const, label: "PayPal", desc: "Instant to PayPal email" },
            { id: "bank" as const, label: "Bank Transfer", desc: "3–5 business days" },
          ].map((m) => (
            <button
              key={m.id}
              onClick={() => setMethod(m.id)}
              className={cn(
                "border p-4 text-left transition-all",
                method === m.id ? "border-foreground bg-foreground/5" : "border-border hover:border-foreground/40"
              )}
            >
              <p className="font-medium text-sm">{m.label}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{m.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {method && (
        <div className="space-y-3">
          <p className="text-xs uppercase tracking-widest text-muted-foreground">
            {method === "paypal" ? "PayPal Email" : "Bank Details"}
          </p>
          <input
            type={method === "paypal" ? "email" : "text"}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={method === "paypal" ? "your@paypal.com" : "Account number / IBAN"}
            className="w-full bg-transparent border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors"
          />
          <button className="flex items-center gap-2 px-6 py-2.5 text-sm font-medium bg-foreground text-background hover:opacity-90 transition-opacity">
            Connect Payout Method
          </button>
        </div>
      )}

      <div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Payout History</p>
        <div className="border border-border divide-y divide-border">
          {[
            { date: "May 1, 2026", amount: "$210.00", status: "paid" },
            { date: "Apr 1, 2026", amount: "$85.00", status: "paid" },
            { date: "Mar 1, 2026", amount: "$39.50", status: "paid" },
          ].map((p) => (
            <div key={p.date} className="flex items-center justify-between px-4 py-3 text-sm">
              <span className="text-muted-foreground">{p.date}</span>
              <span className="font-medium">{p.amount}</span>
              <span className="flex items-center gap-1.5 text-xs text-green-400">
                <Check className="w-3 h-3" /> {p.status}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="border border-border/50 bg-muted/10 px-5 py-4 flex items-start gap-3">
        <AlertCircle className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
        <p className="text-xs text-muted-foreground leading-relaxed">
          Minimum payout threshold is $20. Payouts are processed automatically on the 1st of each month. A 10% platform fee is deducted from earnings before payout.
        </p>
      </div>
    </div>
  );
}

export function Monetise() {
  const [tab, setTab] = useState<Tab>("overview");

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="mb-10 flex items-start justify-between gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <DollarSign className="w-6 h-6 text-muted-foreground" />
              <h1 className="text-4xl font-serif">Monetise</h1>
            </div>
            <p className="text-muted-foreground text-sm">
              Turn your craft into income — prints, commissions, tips, and licensing all in one place.
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Zap className="w-3.5 h-3.5 text-yellow-400" />
            <span className="text-xs text-muted-foreground">Connect a payment provider to activate earnings</span>
            <button className="flex items-center gap-1.5 text-xs border border-border px-3 py-1.5 text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors">
              Connect <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[200px_1fr] gap-8">
          <nav className="space-y-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={cn(
                  "w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors",
                  tab === id
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="flex-1">{label}</span>
                {tab === id && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
              </button>
            ))}
          </nav>

          <div className="border border-border bg-card p-6 min-h-[400px]">
            {tab === "overview" && <OverviewTab />}
            {tab === "prints" && <PrintsTab />}
            {tab === "commissions" && <CommissionsTab />}
            {tab === "tips" && <TipsTab />}
            {tab === "licensing" && <LicensingTab />}
            {tab === "payouts" && <PayoutsTab />}
          </div>
        </div>
      </div>
    </Layout>
  );
}
