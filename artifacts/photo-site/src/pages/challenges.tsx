import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { Layout } from "@/components/layout";
import { useAuth } from "@/contexts/auth-context";
import { useListPhotos } from "@workspace/api-client-react";
import { cn } from "@/lib/utils";
import {
  Trophy, Clock, Users, Heart, ChevronRight, Plus, X, Camera,
  Award, Star, Sparkles, ArrowLeft, Check,
} from "lucide-react";

interface Challenge {
  id: number;
  title: string;
  description: string | null;
  theme: string;
  prize: string | null;
  rules: string | null;
  deadline: string | null;
  createdAt: string;
  entryCount?: number;
}

interface ChallengeEntry {
  challengeId: number;
  photoId: number;
  submitterName: string;
  photoTitle: string | null;
  photoImageUrl: string | null;
  votes: number;
  createdAt: string;
}

function timeLeft(deadline: string | null): string {
  if (!deadline) return "Ongoing";
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return "Ended";
  const days = Math.floor(diff / 86400000);
  const hrs = Math.floor((diff % 86400000) / 3600000);
  if (days > 0) return `${days}d ${hrs}h left`;
  return `${hrs}h left`;
}

function ChallengeCard({ challenge, onClick }: { challenge: Challenge; onClick: () => void }) {
  const status = !challenge.deadline
    ? "ongoing"
    : new Date(challenge.deadline) > new Date() ? "active" : "ended";

  return (
    <button onClick={onClick}
      className="group border border-border bg-card hover:border-foreground/40 transition-all text-left w-full overflow-hidden">
      <div className="h-32 bg-gradient-to-br from-muted to-muted/30 relative flex items-center justify-center overflow-hidden">
        <Trophy className="w-12 h-12 text-muted-foreground/20" />
        <div className="absolute inset-0 bg-gradient-to-t from-card/80 to-transparent" />
        <div className="absolute top-3 right-3">
          <span className={cn("text-[10px] px-2 py-0.5 font-medium uppercase tracking-wider border",
            status === "active" ? "border-green-500/30 text-green-400 bg-green-500/10"
            : status === "ended" ? "border-border text-muted-foreground"
            : "border-amber-500/30 text-amber-400 bg-amber-500/10"
          )}>
            {status === "active" ? "Active" : status === "ended" ? "Ended" : "Ongoing"}
          </span>
        </div>
        <div className="absolute bottom-3 left-4">
          <span className="text-[10px] text-muted-foreground font-mono uppercase tracking-widest">{challenge.theme}</span>
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div>
          <h3 className="font-serif text-lg leading-tight mb-1 group-hover:text-foreground transition-colors">{challenge.title}</h3>
          {challenge.description && (
            <p className="text-xs text-muted-foreground line-clamp-2">{challenge.description}</p>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5"><Users className="w-3 h-3" />{challenge.entryCount ?? 0} entries</span>
          <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" />{timeLeft(challenge.deadline)}</span>
        </div>
        {challenge.prize && (
          <div className="flex items-center gap-1.5 text-xs text-amber-400">
            <Award className="w-3 h-3" />
            <span>Prize: {challenge.prize}</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-xs text-muted-foreground group-hover:text-foreground transition-colors">
          View challenge <ChevronRight className="w-3 h-3" />
        </div>
      </div>
    </button>
  );
}

function ChallengeDetail({ id, onBack }: { id: number; onBack: () => void }) {
  const { user } = useAuth();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [entries, setEntries] = useState<ChallengeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEnterForm, setShowEnterForm] = useState(false);
  const [selectedPhotoId, setSelectedPhotoId] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [votedIds, setVotedIds] = useState<Set<number>>(new Set());
  const [msg, setMsg] = useState<string | null>(null);

  const displayName = (() => {
    try { return JSON.parse(localStorage.getItem("affuaa_settings") ?? "{}").displayName ?? ""; }
    catch { return ""; }
  })();

  const { data: myPhotos } = useListPhotos({ limit: 50 });
  const myPhotoList = (myPhotos?.photos ?? []).filter(p => p.photographerName === displayName);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/challenges/${id}`)
      .then(r => r.json())
      .then((d: { challenge: Challenge; entries: ChallengeEntry[] }) => {
        setChallenge(d.challenge);
        setEntries(d.entries ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function submitEntry() {
    if (!selectedPhotoId) return;
    const photo = myPhotoList.find(p => p.id === selectedPhotoId);
    setSubmitting(true);
    try {
      const res = await fetch(`/api/challenges/${id}/enter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          photoId: selectedPhotoId,
          photoTitle: photo?.title,
          photoImageUrl: photo?.imageUrl,
        }),
      });
      if (res.ok) {
        setMsg("Entry submitted! Your photo is now in the running.");
        setShowEnterForm(false);
        const d = await fetch(`/api/challenges/${id}`).then(r => r.json()) as { challenge: Challenge; entries: ChallengeEntry[] };
        setEntries(d.entries ?? []);
      } else {
        setMsg("Failed to submit. Please try again.");
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function vote(entry: ChallengeEntry) {
    const key = entry.photoId;
    if (votedIds.has(key)) return;
    setVotedIds(prev => new Set([...prev, key]));
    setEntries(prev => prev.map(e => e.photoId === key ? { ...e, votes: (e.votes ?? 0) + 1 } : e));
    await fetch(`/api/challenges/${id}/entries/${key}/vote`, { method: "POST" });
  }

  const sortedEntries = [...entries].sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0));

  if (loading) return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to challenges
      </button>
      <div className="h-48 bg-muted animate-pulse" />
    </div>
  );

  if (!challenge) return (
    <div className="text-center py-16">
      <p className="text-muted-foreground">Challenge not found.</p>
      <button onClick={onBack} className="mt-4 text-sm text-muted-foreground hover:text-foreground">← Back</button>
    </div>
  );

  const isActive = !challenge.deadline || new Date(challenge.deadline) > new Date();

  return (
    <div className="space-y-8">
      <button onClick={onBack} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> All challenges
      </button>

      <div className="border border-border bg-card p-8">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex-1 min-w-0">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest">{challenge.theme}</span>
            <h1 className="font-serif text-3xl mt-1 mb-2">{challenge.title}</h1>
            {challenge.description && <p className="text-muted-foreground text-sm">{challenge.description}</p>}
          </div>
          <div className="space-y-2 text-right flex-shrink-0">
            <div className="text-sm font-medium">{timeLeft(challenge.deadline)}</div>
            <div className="text-xs text-muted-foreground">{entries.length} entries</div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-4">
          {challenge.prize && (
            <div className="flex items-center gap-2 border border-amber-500/20 bg-amber-500/5 px-4 py-2">
              <Award className="w-4 h-4 text-amber-400" />
              <span className="text-sm text-amber-400 font-medium">Prize: {challenge.prize}</span>
            </div>
          )}
          {challenge.rules && (
            <div className="text-xs text-muted-foreground max-w-lg border-l border-border pl-4">{challenge.rules}</div>
          )}
        </div>

        {isActive && user && (
          <div className="mt-6">
            {!showEnterForm ? (
              <button onClick={() => setShowEnterForm(true)}
                className="flex items-center gap-2 px-5 py-2.5 bg-foreground text-background text-sm hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" /> Enter This Challenge
              </button>
            ) : (
              <div className="border border-border p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium">Select a photo to enter</h3>
                  <button onClick={() => setShowEnterForm(false)}><X className="w-4 h-4 text-muted-foreground" /></button>
                </div>
                {myPhotoList.length === 0 ? (
                  <p className="text-xs text-muted-foreground">You have no published photos. <Link href="/upload" className="underline">Upload one first.</Link></p>
                ) : (
                  <>
                    <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                      {myPhotoList.slice(0, 15).map(p => (
                        <button key={p.id} onClick={() => setSelectedPhotoId(p.id)}
                          className={cn("aspect-square overflow-hidden relative border-2 transition-colors",
                            selectedPhotoId === p.id ? "border-foreground" : "border-transparent")}>
                          <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                          {selectedPhotoId === p.id && (
                            <div className="absolute inset-0 bg-foreground/30 flex items-center justify-center">
                              <Check className="w-5 h-5 text-white" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                    <button onClick={() => void submitEntry()} disabled={!selectedPhotoId || submitting}
                      className="px-5 py-2 bg-foreground text-background text-sm hover:opacity-90 disabled:opacity-40 transition-opacity">
                      {submitting ? "Submitting…" : "Submit Entry"}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        )}
        {msg && <p className="mt-3 text-sm text-green-400">{msg}</p>}
      </div>

      {/* Entries */}
      <div>
        <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-4 flex items-center gap-2">
          <Trophy className="w-3.5 h-3.5" /> Entries — Ranked by Votes
        </h2>
        {sortedEntries.length === 0 ? (
          <div className="border border-border bg-card p-12 text-center">
            <Camera className="w-10 h-10 text-muted-foreground/20 mx-auto mb-4" />
            <p className="text-sm text-muted-foreground">No entries yet — be the first to submit!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {sortedEntries.map((entry, i) => (
              <div key={`${entry.challengeId}-${entry.photoId}`} className="group relative overflow-hidden border border-border bg-card">
                {i < 3 && (
                  <div className={cn("absolute top-2 left-2 z-10 w-6 h-6 flex items-center justify-center text-[10px] font-bold",
                    i === 0 ? "bg-amber-400 text-black" : i === 1 ? "bg-zinc-300 text-black" : "bg-amber-700 text-white")}>
                    {i + 1}
                  </div>
                )}
                {entry.photoImageUrl ? (
                  <img src={entry.photoImageUrl} alt={entry.photoTitle ?? ""} className="w-full aspect-square object-cover" />
                ) : (
                  <div className="w-full aspect-square bg-muted flex items-center justify-center">
                    <Camera className="w-8 h-8 text-muted-foreground/30" />
                  </div>
                )}
                <div className="p-3 space-y-2">
                  <p className="text-xs font-medium truncate">{entry.photoTitle ?? "Untitled"}</p>
                  <p className="text-[10px] text-muted-foreground">by {entry.submitterName}</p>
                  <button
                    onClick={() => void vote(entry)}
                    disabled={votedIds.has(entry.photoId)}
                    className={cn("flex items-center gap-1.5 text-xs px-3 py-1 border transition-colors w-full justify-center",
                      votedIds.has(entry.photoId)
                        ? "border-foreground text-foreground bg-foreground/5 cursor-default"
                        : "border-border text-muted-foreground hover:border-foreground hover:text-foreground"
                    )}>
                    <Heart className={cn("w-3 h-3", votedIds.has(entry.photoId) && "fill-current")} />
                    {entry.votes ?? 0}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function Challenges() {
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<number | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    fetch("/api/challenges")
      .then(r => r.json())
      .then((d: { challenges: Challenge[] }) => setChallenges(d.challenges ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (selected !== null) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-12 max-w-5xl">
          <ChallengeDetail id={selected} onBack={() => setSelected(null)} />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-5xl">
        <div className="mb-10">
          <div className="flex items-center gap-3 mb-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            <h1 className="font-serif text-4xl">Photo Challenges</h1>
          </div>
          <p className="text-muted-foreground">Compete on themed challenges, vote for your favourites, and win recognition.</p>
        </div>

        {/* Active banner */}
        <div className="border border-amber-500/20 bg-amber-500/5 p-6 mb-8 flex items-center gap-5">
          <Sparkles className="w-8 h-8 text-amber-400 flex-shrink-0" />
          <div className="flex-1">
            <h2 className="text-sm font-medium mb-1">Community Spotlight</h2>
            <p className="text-xs text-muted-foreground">Every week a new theme is set. Submit your best photo, collect votes, and be featured on the homepage.</p>
          </div>
          {!user && (
            <Link href="/signin" className="flex-shrink-0 px-4 py-2 border border-border text-sm hover:border-foreground/50 transition-colors">
              Sign in to enter
            </Link>
          )}
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array(6).fill(0).map((_, i) => (
              <div key={i} className="border border-border bg-card animate-pulse">
                <div className="h-32 bg-muted" />
                <div className="p-5 space-y-2">
                  <div className="h-5 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-full" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : challenges.length === 0 ? (
          <div className="border border-border bg-card p-16 text-center">
            <Trophy className="w-12 h-12 text-muted-foreground/20 mx-auto mb-4" />
            <h3 className="font-serif text-xl mb-2">No challenges yet</h3>
            <p className="text-muted-foreground text-sm">The first challenge is coming soon. Stay tuned!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {challenges.map(c => (
              <ChallengeCard key={c.id} challenge={c} onClick={() => setSelected(c.id)} />
            ))}
          </div>
        )}

        {/* How it works */}
        <div className="mt-12 border-t border-border pt-10">
          <h2 className="text-xs uppercase tracking-widest text-muted-foreground mb-6">How it works</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {[
              { icon: Camera, title: "Submit", desc: "Pick one of your published photos that fits the weekly theme." },
              { icon: Heart, title: "Vote", desc: "Browse entries and vote for the shots you find most compelling." },
              { icon: Star, title: "Win", desc: "Top-voted photos earn a featured slot on the Affuaa homepage." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="space-y-3">
                <div className="w-10 h-10 border border-border flex items-center justify-center">
                  <Icon className="w-5 h-5 text-muted-foreground" />
                </div>
                <h3 className="text-sm font-medium">{title}</h3>
                <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
}
