import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, Plus, X } from "lucide-react";

interface Series {
  id: number;
  name: string;
  description: string | null;
  photographerName: string;
  coverImageUrl: string | null;
  createdAt: string;
}

export function SeriesList() {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ name: "", description: "", photographerName: "", coverImageUrl: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/series")
      .then((r) => r.json())
      .then((d: { series: Series[] }) => setSeries(d.series ?? []))
      .catch(() => setSeries([]))
      .finally(() => setLoading(false));
  }, []);

  const settings = (() => { try { return JSON.parse(localStorage.getItem("affuaa_settings") ?? "{}") as { displayName?: string }; } catch { return {}; } })();
  const hasDisplayName = !!settings.displayName;

  async function createSeries() {
    if (!form.name || !form.photographerName) return;
    setCreating(true);
    try {
      const res = await fetch("/api/series", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify(form),
      });
      if (res.ok || res.status === 201) {
        const data = await res.json() as Series;
        setSeries((prev) => [data, ...prev]);
        setShowCreate(false);
        setForm({ name: "", description: "", photographerName: "", coverImageUrl: "" });
      }
    } finally { setCreating(false); }
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="flex items-start justify-between mb-10">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6 text-muted-foreground" />
            <div>
              <h1 className="text-4xl font-serif">Photo Series</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Curated multi-part photographic stories</p>
            </div>
          </div>
          {hasDisplayName && (
            <button onClick={() => { setShowCreate(true); setForm((f) => ({ ...f, photographerName: settings.displayName ?? "" })); }}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity">
              <Plus className="w-4 h-4" /> New Series
            </button>
          )}
        </div>

        {showCreate && (
          <div className="border border-border bg-card p-6 mb-8">
            <div className="flex justify-between mb-5">
              <h2 className="font-serif text-xl">Create Series</h2>
              <button onClick={() => setShowCreate(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Series Name *</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="Through the Seasons" className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Your Name *</label>
                  <input value={form.photographerName} onChange={(e) => setForm((f) => ({ ...f, photographerName: e.target.value }))}
                    placeholder="Photographer name" className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground" />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2} className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground resize-none" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Cover Image URL</label>
                <input value={form.coverImageUrl} onChange={(e) => setForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
                  placeholder="https://…" className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground" />
              </div>
              <button onClick={() => void createSeries()} disabled={creating || !form.name || !form.photographerName}
                className="px-6 py-2 bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50">
                {creating ? "Creating…" : "Create Series"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="h-52" />)}
          </div>
        ) : series.length === 0 ? (
          <div className="py-24 text-center text-muted-foreground border border-dashed border-border">
            <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No series yet. Create the first one!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {series.map((s) => (
              <Link key={s.id} href={`/series/${s.id}`} className="group block border border-border bg-card hover:bg-muted/20 transition-colors overflow-hidden">
                {s.coverImageUrl ? (
                  <div className="h-40 overflow-hidden">
                    <img src={s.coverImageUrl} alt={s.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                ) : (
                  <div className="h-40 bg-muted/40 flex items-center justify-center">
                    <BookOpen className="w-10 h-10 text-muted-foreground/30" />
                  </div>
                )}
                <div className="p-5">
                  <h3 className="font-serif text-xl mb-1">{s.name}</h3>
                  <p className="text-sm text-muted-foreground">{s.photographerName}</p>
                  {s.description && <p className="text-xs text-muted-foreground/70 mt-2 line-clamp-2">{s.description}</p>}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}
