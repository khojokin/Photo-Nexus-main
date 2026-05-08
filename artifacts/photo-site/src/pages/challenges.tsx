import { useEffect, useState } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Clock, ImagePlus, ChevronRight, Plus, X } from "lucide-react";
import { format, isPast } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

interface Challenge {
  id: number;
  title: string;
  description: string | null;
  theme: string;
  deadline: string | null;
  createdAt: string;
  entryCount: number;
}

export function Challenges() {
  const { user } = useAuth();
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", theme: "", deadline: "" });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetch("/api/challenges")
      .then((r) => r.json())
      .then((d: { challenges: Challenge[] }) => setChallenges(d.challenges ?? []))
      .catch(() => setChallenges([]))
      .finally(() => setLoading(false));
  }, []);

  async function createChallenge() {
    if (!form.title || !form.theme) return;
    setCreating(true);
    try {
      const res = await fetch("/api/challenges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });
      if (res.ok || res.status === 201) {
        const data = await res.json() as Challenge;
        setChallenges((prev) => [data, ...prev]);
        setShowCreate(false);
        setForm({ title: "", description: "", theme: "", deadline: "" });
      }
    } finally {
      setCreating(false);
    }
  }

  const active = challenges.filter((c) => !c.deadline || !isPast(new Date(c.deadline)));
  const past = challenges.filter((c) => c.deadline && isPast(new Date(c.deadline)));

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-4xl">
        <div className="flex items-start justify-between mb-10">
          <div className="flex items-center gap-3">
            <Trophy className="w-6 h-6 text-yellow-400" />
            <div>
              <h1 className="text-4xl font-serif">Challenges</h1>
              <p className="text-muted-foreground text-sm mt-0.5">Themed photo contests for the community</p>
            </div>
          </div>
          {user && (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              New Challenge
            </button>
          )}
        </div>

        {showCreate && (
          <div className="border border-border bg-card p-6 mb-8">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-serif text-xl">Create Challenge</h2>
              <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Title *</label>
                  <input value={form.title} onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    placeholder="Golden Hour" className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground" />
                </div>
                <div>
                  <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Theme *</label>
                  <input value={form.theme} onChange={(e) => setForm((f) => ({ ...f, theme: e.target.value }))}
                    placeholder="Light & Shadow" className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground" />
                </div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  rows={2} placeholder="Capture the magic of golden hour..." className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground resize-none" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Deadline (optional)</label>
                <input type="datetime-local" value={form.deadline} onChange={(e) => setForm((f) => ({ ...f, deadline: e.target.value }))}
                  className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground" />
              </div>
              <button onClick={() => void createChallenge()} disabled={creating || !form.title || !form.theme}
                className="px-6 py-2 bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity">
                {creating ? "Creating…" : "Create Challenge"}
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array(4).fill(0).map((_, i) => <Skeleton key={i} className="h-40" />)}
          </div>
        ) : (
          <>
            {active.length > 0 && (
              <div className="mb-12">
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Active</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {active.map((c) => <ChallengeCard key={c.id} challenge={c} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Past</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {past.map((c) => <ChallengeCard key={c.id} challenge={c} past />)}
                </div>
              </div>
            )}
            {challenges.length === 0 && (
              <div className="py-24 text-center text-muted-foreground border border-dashed border-border">
                <Trophy className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No challenges yet. Be the first to create one!</p>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}

function ChallengeCard({ challenge, past }: { challenge: Challenge; past?: boolean }) {
  return (
    <Link href={`/challenges/${challenge.id}`}
      className={cn("block border bg-card p-6 hover:bg-muted/20 transition-colors", past ? "border-border/50 opacity-70" : "border-border")}>
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="min-w-0">
          <p className="text-xs text-muted-foreground uppercase tracking-widest mb-1">{challenge.theme}</p>
          <h3 className="font-serif text-xl leading-tight">{challenge.title}</h3>
        </div>
        <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-1" />
      </div>
      {challenge.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{challenge.description}</p>}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span className="flex items-center gap-1.5"><ImagePlus className="w-3 h-3" />{challenge.entryCount} entries</span>
        {challenge.deadline && (
          <span className={cn("flex items-center gap-1.5", past ? "text-muted-foreground/50" : "text-amber-400")}>
            <Clock className="w-3 h-3" />
            {past ? "Ended" : "Ends"} {format(new Date(challenge.deadline), "MMM d, yyyy")}
          </span>
        )}
      </div>
    </Link>
  );
}
