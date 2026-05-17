import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useAuth } from "@/contexts/auth-context";
import { cn } from "@/lib/utils";
import {
  Package, Download, DollarSign, Plus, X, Camera, Image, Lock,
  ChevronRight, Star, Shield, ArrowLeft, Check,
} from "lucide-react";

interface Pack {
  id: number;
  name: string;
  description: string | null;
  price: string;
  createdByName: string;
  photoIds: number[];
  coverImageUrl: string | null;
  isPublished: boolean;
  totalDownloads: number;
  createdAt: string;
}

interface PackPhoto {
  id: number;
  title: string;
  image_url: string;
  photographer_name: string;
  likes: number;
}

function PackCard({ pack, onClick }: { pack: Pack; onClick: () => void }) {
  const photoCount = pack.photoIds?.length ?? 0;
  return (
    <button onClick={onClick}
      className="group border border-border bg-card hover:border-foreground/40 transition-all text-left w-full overflow-hidden">
      <div className="h-40 bg-muted relative overflow-hidden flex items-center justify-center">
        {pack.coverImageUrl ? (
          <img src={pack.coverImageUrl} alt={pack.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
        ) : (
          <Package className="w-12 h-12 text-muted-foreground/20" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <span className="text-white text-xs">{photoCount} photos</span>
          <span className="text-white font-bold text-lg">${parseFloat(pack.price).toFixed(2)}</span>
        </div>
        <div className="absolute top-3 right-3">
          <span className="text-[10px] px-2 py-0.5 border border-green-500/30 text-green-400 bg-green-500/10 font-medium">
            Pack
          </span>
        </div>
      </div>
      <div className="p-4 space-y-2">
        <h3 className="font-medium text-sm group-hover:text-foreground transition-colors">{pack.name}</h3>
        {pack.description && <p className="text-xs text-muted-foreground line-clamp-2">{pack.description}</p>}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>by {pack.createdByName}</span>
          <span className="flex items-center gap-1"><Download className="w-3 h-3" />{pack.totalDownloads}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors pt-1">
          View pack <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </button>
  );
}

function PackDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const { user } = useAuth();
  const [pack, setPack] = useState<Pack | null>(null);
  const [photos, setPhotos] = useState<PackPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [purchased, setPurchased] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/packs/${id}`)
      .then(r => r.json())
      .then((d: { pack: Pack; photos: PackPhoto[] }) => {
        setPack(d.pack);
        setPhotos(d.photos ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function handlePurchase() {
    if (!user) { window.location.href = "/signin"; return; }
    setPurchasing(true);
    setError(null);
    try {
      const res = await fetch(`/api/packs/${id}/purchase`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({}),
      });
      if (res.ok) {
        setPurchased(true);
      } else {
        setError("Purchase failed — please try again.");
      }
    } catch {
      setError("Network error.");
    } finally {
      setPurchasing(false);
    }
  }

  if (loading) return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground">
        <ArrowLeft className="w-4 h-4" /> Back to packs
      </button>
      <div className="h-64 bg-muted animate-pulse" />
    </div>
  );

  if (!pack) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Pack not found.</p>
      <button onClick={onBack} className="mt-4 text-sm text-muted-foreground hover:text-foreground">← Back</button>
    </div>
  );

  return (
    <div className="space-y-8">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> All packs
      </button>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">Download Pack</p>
            <h1 className="font-serif text-3xl mb-2">{pack.name}</h1>
            <p className="text-sm text-muted-foreground">by {pack.createdByName}</p>
            {pack.description && <p className="text-sm text-muted-foreground mt-3">{pack.description}</p>}
          </div>

          {/* Photo previews */}
          <div>
            <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-3">{photos.length} Photos Included</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {photos.map((photo, i) => (
                <div key={photo.id} className="relative aspect-square overflow-hidden bg-muted">
                  {i < 4 || purchased ? (
                    <img src={photo.image_url} alt={photo.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-muted">
                      <Lock className="w-6 h-6 text-muted-foreground/30" />
                    </div>
                  )}
                  {i === 3 && !purchased && photos.length > 4 && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">+{photos.length - 4} more</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Purchase card */}
        <div className="space-y-4">
          <div className="border border-border bg-card p-6 space-y-5 sticky top-4">
            <div>
              <p className="text-3xl font-serif">${parseFloat(pack.price).toFixed(2)}</p>
              <p className="text-xs text-muted-foreground mt-1">One-time purchase · High-res files</p>
            </div>
            <div className="space-y-2 text-xs text-muted-foreground">
              {[
                `${photos.length} high-resolution photos`,
                "Commercial license included",
                "Instant download after purchase",
                "Regulated by Stripe",
              ].map(f => (
                <div key={f} className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-400 flex-shrink-0" />
                  <span>{f}</span>
                </div>
              ))}
            </div>

            {purchased ? (
              <div className="space-y-3">
                <div className="border border-green-500/30 bg-green-500/10 p-3 text-center">
                  <Check className="w-5 h-5 text-green-400 mx-auto mb-1" />
                  <p className="text-sm text-green-400 font-medium">Purchased!</p>
                  <p className="text-xs text-muted-foreground mt-1">All photos are now unlocked above.</p>
                </div>
              </div>
            ) : (
              <>
                {error && <p className="text-xs text-red-400">{error}</p>}
                <button onClick={() => void handlePurchase()} disabled={purchasing}
                  className="w-full py-3 bg-foreground text-background text-sm hover:opacity-90 disabled:opacity-40 transition-opacity flex items-center justify-center gap-2">
                  <DollarSign className="w-4 h-4" />
                  {purchasing ? "Processing…" : `Buy for $${parseFloat(pack.price).toFixed(2)}`}
                </button>
                <div className="flex items-center gap-1.5 justify-center text-[10px] text-muted-foreground/60">
                  <Shield className="w-3 h-3" />
                  Secured & regulated by Stripe
                </div>
              </>
            )}
            <div className="text-xs text-muted-foreground text-center">
              <Download className="w-3 h-3 inline mr-1" />
              {pack.totalDownloads} downloads
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function CreatePackModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("9.99");
  const [photoIdsStr, setPhotoIdsStr] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const photoIds = photoIdsStr.split(",").map(s => parseInt(s.trim())).filter(n => !isNaN(n));
    if (!name || photoIds.length === 0) { setError("Name and at least one photo ID required."); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/packs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ name, description, price: parseFloat(price), photoIds }),
      });
      if (res.ok) { onCreated(); onClose(); }
      else { setError("Failed to create pack."); }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="bg-background border border-border p-6 w-full max-w-md space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-medium">Create Download Pack</h2>
          <button onClick={onClose}><X className="w-4 h-4 text-muted-foreground" /></button>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Pack Name *</label>
            <input value={name} onChange={e => setName(e.target.value)} placeholder="Golden Hour Collection"
              className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} placeholder="Curated pack of…"
              className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground resize-none" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Price (USD) *</label>
            <input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)}
              className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground" />
          </div>
          <div>
            <label className="text-xs text-muted-foreground uppercase tracking-wider block mb-1">Photo IDs (comma-separated) *</label>
            <input value={photoIdsStr} onChange={e => setPhotoIdsStr(e.target.value)} placeholder="1, 2, 3, 4"
              className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground" />
          </div>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <button onClick={() => void submit()} disabled={submitting}
          className="w-full py-2.5 bg-foreground text-background text-sm hover:opacity-90 disabled:opacity-40 transition-opacity">
          {submitting ? "Creating…" : "Create Pack"}
        </button>
      </div>
    </div>
  );
}

export function Packs() {
  const { user } = useAuth();
  const [packs, setPacks] = useState<Pack[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  function loadPacks() {
    setLoading(true);
    fetch("/api/packs")
      .then(r => r.json())
      .then((d: { packs: Pack[] }) => setPacks(d.packs ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }

  useEffect(() => { loadPacks(); }, []);

  if (selected !== null) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <PackDetail id={selected} onBack={() => setSelected(null)} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      {showCreate && <CreatePackModal onClose={() => setShowCreate(false)} onCreated={loadPacks} />}
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-10 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <Package className="w-6 h-6 text-muted-foreground" />
              <h1 className="font-serif text-4xl">Download Packs</h1>
            </div>
            <p className="text-muted-foreground">Purchase curated bundles of high-resolution photos at a single price.</p>
          </div>
          {user && (
            <button onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 border border-border text-sm hover:border-foreground/50 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Create Pack
            </button>
          )}
        </div>

        {/* Benefits */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          {[
            { icon: Package, title: "Bundled value", desc: "Multiple curated photos at a discounted bundle price." },
            { icon: Shield, title: "Stripe secured", desc: "All payments processed and regulated by Stripe." },
            { icon: Download, title: "Instant access", desc: "High-resolution files available immediately after purchase." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="border border-border bg-card p-4 text-center space-y-2">
              <Icon className="w-5 h-5 text-muted-foreground mx-auto" />
              <p className="text-xs font-medium">{title}</p>
              <p className="text-[10px] text-muted-foreground leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="border border-border bg-card animate-pulse">
                <div className="h-40 bg-muted" />
                <div className="p-4 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                </div>
              </div>
            ))}
          </div>
        ) : packs.length === 0 ? (
          <div className="border border-border bg-card p-16 text-center">
            <Package className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="font-serif text-xl mb-2">No packs yet</h3>
            <p className="text-muted-foreground text-sm mb-6">Be the first to create a curated download pack.</p>
            {user && (
              <button onClick={() => setShowCreate(true)}
                className="px-5 py-2.5 bg-foreground text-background text-sm hover:opacity-90 transition-opacity">
                Create the first pack
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {packs.map(p => (
              <PackCard key={p.id} pack={p} onClick={() => setSelected(p.id)} />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
