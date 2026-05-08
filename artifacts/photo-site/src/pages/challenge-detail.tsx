import { useEffect, useState } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { Skeleton } from "@/components/ui/skeleton";
import { Trophy, Clock, ArrowLeft, ImagePlus, Check } from "lucide-react";
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
}

interface EntryPhoto {
  id: number; title: string; imageUrl: string; photographerName: string; likes: number; downloads: number;
}

interface Entry {
  photo: EntryPhoto;
  submitterName: string;
  entryCreatedAt: string;
}

export function ChallengeDetail() {
  const { id } = useParams<{ id: string }>();
  const [challenge, setChallenge] = useState<Challenge | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [photoIdInput, setPhotoIdInput] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    if (!id) return;
    fetch(`/api/challenges/${id}`)
      .then((r) => r.json())
      .then((d: { challenge: Challenge; entries: Entry[] }) => {
        setChallenge(d.challenge);
        setEntries(d.entries ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  async function submitEntry() {
    if (!photoIdInput.trim() || !user || submitting) return;
    const displayName = (JSON.parse(localStorage.getItem("affuaa_settings") ?? "{}") as { displayName?: string }).displayName ?? user.firstName ?? "Photographer";
    setSubmitting(true);
    try {
      const res = await fetch(`/api/challenges/${id}/enter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ photoId: parseInt(photoIdInput, 10), submitterName: displayName }),
      });
      if (res.ok || res.status === 201) { setSubmitted(true); setPhotoIdInput(""); }
    } finally { setSubmitting(false); }
  }

  const isOver = challenge?.deadline ? isPast(new Date(challenge.deadline)) : false;

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <Link href="/challenges" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> All Challenges
        </Link>

        {loading ? (
          <div className="space-y-4">
            <Skeleton className="h-10 w-1/2" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-64 w-full mt-8" />
          </div>
        ) : !challenge ? (
          <div className="py-24 text-center text-muted-foreground">Challenge not found.</div>
        ) : (
          <>
            <div className="mb-12">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                <Trophy className="w-3.5 h-3.5 text-yellow-400" /> {challenge.theme}
              </p>
              <h1 className="text-5xl font-serif mb-4">{challenge.title}</h1>
              {challenge.description && <p className="text-muted-foreground max-w-2xl">{challenge.description}</p>}
              <div className="flex items-center gap-4 mt-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><ImagePlus className="w-4 h-4" />{entries.length} entries</span>
                {challenge.deadline && (
                  <span className={cn("flex items-center gap-1.5", isOver ? "text-muted-foreground/50" : "text-amber-400")}>
                    <Clock className="w-4 h-4" />
                    {isOver ? "Ended" : "Ends"} {format(new Date(challenge.deadline), "MMMM d, yyyy 'at' h:mm a")}
                  </span>
                )}
              </div>
            </div>

            {user && !isOver && (
              <div className="border border-border bg-card p-6 mb-10">
                <h2 className="font-serif text-lg mb-4">Submit Your Entry</h2>
                {submitted ? (
                  <p className="text-green-400 flex items-center gap-2 text-sm"><Check className="w-4 h-4" /> Entry submitted! You can submit another.</p>
                ) : (
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={photoIdInput}
                      onChange={(e) => setPhotoIdInput(e.target.value)}
                      placeholder="Photo ID (from photo URL)"
                      className="flex-1 bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground"
                    />
                    <button onClick={() => void submitEntry()} disabled={submitting || !photoIdInput.trim()}
                      className="px-5 py-2 bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity whitespace-nowrap">
                      {submitting ? "Submitting…" : "Enter Challenge"}
                    </button>
                  </div>
                )}
                <p className="text-xs text-muted-foreground mt-2">Enter the ID from the photo URL: /photos/<strong>123</strong></p>
              </div>
            )}

            <h2 className="text-2xl font-serif mb-6">Gallery</h2>
            {entries.length === 0 ? (
              <div className="py-16 text-center text-muted-foreground border border-dashed border-border">
                <ImagePlus className="w-8 h-8 mx-auto mb-3 opacity-30" />
                <p className="text-sm">No entries yet. Be the first!</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {entries.map((entry, i) => (
                  <Link key={i} href={`/photos/${entry.photo.id}`} className="group block">
                    <div className="aspect-square overflow-hidden bg-muted mb-2">
                      <img src={entry.photo.imageUrl} alt={entry.photo.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                    <p className="text-xs font-medium truncate">{entry.photo.title}</p>
                    <p className="text-xs text-muted-foreground">{entry.submitterName}</p>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  );
}
