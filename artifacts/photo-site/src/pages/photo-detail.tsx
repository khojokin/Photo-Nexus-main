import { useState, useRef, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { PhotoCard } from "@/components/photo-card";
import { SimilarPhotos } from "@/components/similar-photos";
import {
  useGetPhoto, useLikePhoto, useDownloadPhoto,
  getGetPhotoQueryKey,
  useListCollections, getListCollectionsQueryKey,
  useListPhotos, getListPhotosQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  Heart, Download, Calendar, Maximize2, Share2, Check,
  MessageSquare, Trash2, Send, BookmarkPlus, ChevronDown, Plus, FolderOpen,
  Camera, Aperture, Clock, Zap, Ruler, Shield, Eye, Flag, Code, X,
  DollarSign, Coffee, Maximize, Minimize, Keyboard, Printer,
  BookOpen, ChevronLeft, ChevronRight, Crown, Lock,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { toast } from "sonner";
import { useSubscription } from "@/hooks/use-subscription";
import { usePremiumGate } from "@/hooks/use-premium-gate";
import { PremiumGateModal } from "@/components/premium-gate-modal";
import { AdInterstitialModal } from "@/components/ad-interstitial-modal";

const DOWNLOAD_SIZES = [
  { label: "Small", suffix: "800px", quality: "web-small" },
  { label: "Medium", suffix: "1600px", quality: "web" },
  { label: "Large", suffix: "2400px", quality: "hd" },
  { label: "Original", suffix: "Full res", quality: "original" },
] as const;

function DownloadSizeSelector({
  photo,
  onDownload,
  isPending,
  isPremium,
  isAdmin,
  adsEnabled,
}: {
  photo: { isPremiumOnly?: boolean; width: number; height: number };
  onDownload: () => void;
  isPending: boolean;
  isPremium: boolean;
  isAdmin: boolean;
  adsEnabled: boolean;
}) {
  const [selectedSize, setSelectedSize] = useState<number>(3);
  const [showSizes, setShowSizes] = useState(false);
  const extPhoto = photo as typeof photo & { isPremiumOnly?: boolean };
  const locked = extPhoto.isPremiumOnly && !isPremium && !isAdmin;

  const sizeLabel = DOWNLOAD_SIZES[selectedSize]?.label ?? "Original";
  const needsPremium = selectedSize >= 2 && !isPremium && !isAdmin;

  function handleClick() {
    if (needsPremium) {
      toast.info("HD downloads require Premium. Downloading web size instead.");
      return;
    }
    onDownload();
    setShowSizes(false);
  }

  return (
    <div className="relative">
      <div className="flex">
        <button
          onClick={handleClick}
          disabled={isPending || locked}
          className={cn(
            "flex-1 h-12 flex items-center justify-center gap-2 text-sm border transition-all disabled:opacity-50",
            locked
              ? "border-border/50 text-muted-foreground cursor-not-allowed"
              : needsPremium
              ? "border-amber-500/40 text-amber-400 hover:bg-amber-500/5"
              : "border-border text-foreground hover:bg-accent"
          )}
        >
          {locked ? (
            <><Lock className="w-4 h-4" /> Premium Only</>
          ) : needsPremium ? (
            <><Crown className="w-4 h-4" /> {sizeLabel} (Premium)</>
          ) : (
            <><Download className="w-4 h-4" /> Download {sizeLabel}</>
          )}
        </button>
        <button
          onClick={() => setShowSizes((s) => !s)}
          className="border border-l-0 border-border px-3 h-12 text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          title="Choose size"
        >
          <ChevronDown className={cn("w-4 h-4 transition-transform", showSizes && "rotate-180")} />
        </button>
      </div>
      {showSizes && (
        <div className="absolute top-full left-0 right-0 z-10 bg-background border border-t-0 border-border shadow-xl">
          {DOWNLOAD_SIZES.map((size, i) => {
            const isHD = i >= 2;
            const requiresPremium = isHD && !isPremium && !isAdmin;
            return (
              <button
                key={size.quality}
                onClick={() => { setSelectedSize(i); setShowSizes(false); if (!requiresPremium) onDownload(); }}
                className={cn(
                  "w-full flex items-center justify-between px-4 py-2.5 text-sm transition-colors",
                  selectedSize === i ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                )}
              >
                <span className="flex items-center gap-2">
                  {requiresPremium && <Crown className="w-3.5 h-3.5 text-amber-400" />}
                  {size.label}
                </span>
                <span className="text-xs opacity-60">{size.suffix}</span>
              </button>
            );
          })}
          <div className="border-t border-border/40 px-4 py-2">
            <p className="text-xs text-muted-foreground">
              {photo.width} × {photo.height} original
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

const REACTION_EMOJIS = ["❤️", "🔥", "✨", "😮", "🎉"];

function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    function onScroll() {
      const el = document.documentElement;
      const scrollable = el.scrollHeight - el.clientHeight;
      const scrolled = el.scrollTop || document.body.scrollTop;
      setProgress(scrollable > 0 ? Math.min(100, (scrolled / scrollable) * 100) : 0);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return (
    <div className="fixed top-0 left-0 right-0 z-[100] h-0.5 bg-transparent pointer-events-none">
      <div
        className="h-full bg-foreground/60 transition-all duration-100"
        style={{ width: `${progress}%` }}
      />
    </div>
  );
}

function ReactionsPanel({ photoId }: { photoId: number }) {
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [mine, setMine] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/photos/${photoId}/reactions`)
      .then((r) => r.json())
      .then((d: { reactions: { emoji: string; count: number }[] }) => {
        const map: Record<string, number> = {};
        d.reactions.forEach((r) => { map[r.emoji] = r.count; });
        setCounts(map);
      })
      .catch(() => {});
  }, [photoId]);

  async function toggle(emoji: string) {
    const next = mine === emoji ? null : emoji;
    setMine(next);
    setCounts((prev) => {
      const updated = { ...prev };
      if (mine) updated[mine] = Math.max(0, (updated[mine] ?? 0) - 1);
      if (next) updated[next] = (updated[next] ?? 0) + 1;
      return updated;
    });
    await fetch(`/api/photos/${photoId}/reactions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji: next ?? mine, remove: next === null }),
    }).catch(() => {});
  }

  return (
    <div className="mt-4 flex items-center gap-2 flex-wrap">
      {REACTION_EMOJIS.map((emoji) => (
        <button
          key={emoji}
          onClick={() => void toggle(emoji)}
          className={cn(
            "flex items-center gap-1 px-2.5 py-1 text-sm border transition-colors",
            mine === emoji ? "border-foreground/60 bg-muted" : "border-border/40 hover:border-border hover:bg-muted/40"
          )}
        >
          <span>{emoji}</span>
          {(counts[emoji] ?? 0) > 0 && <span className="text-xs text-muted-foreground">{counts[emoji]}</span>}
        </button>
      ))}
    </div>
  );
}

function EmbedButton({ photoId }: { photoId: number }) {
  const [showEmbed, setShowEmbed] = useState(false);
  const embedCode = `<iframe src="${window.location.origin}/embed/${photoId}" width="600" height="400" frameborder="0" allowfullscreen></iframe>`;

  return (
    <div className="relative">
      <button
        onClick={() => setShowEmbed((v) => !v)}
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
      >
        <Code className="w-3.5 h-3.5" /> Embed
      </button>
      {showEmbed && (
        <div className="absolute bottom-7 left-0 z-10 w-72 border border-border bg-card p-3 shadow-lg">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium">Embed code</p>
            <button onClick={() => setShowEmbed(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <textarea
            readOnly
            value={embedCode}
            className="w-full text-xs font-mono bg-muted/30 border border-border/40 p-2 resize-none h-20 focus:outline-none"
            onFocus={(e) => e.target.select()}
          />
          <button
            onClick={() => { void navigator.clipboard.writeText(embedCode); setShowEmbed(false); }}
            className="mt-2 w-full py-1.5 text-xs border border-border/50 hover:bg-muted transition-colors"
          >
            Copy
          </button>
        </div>
      )}
    </div>
  );
}

const LICENSE_LABELS: Record<string, { label: string; url?: string }> = {
  "cc0": { label: "CC0 — Public Domain", url: "https://creativecommons.org/publicdomain/zero/1.0/" },
  "cc-by": { label: "CC BY 4.0", url: "https://creativecommons.org/licenses/by/4.0/" },
  "cc-by-sa": { label: "CC BY-SA 4.0", url: "https://creativecommons.org/licenses/by-sa/4.0/" },
  "editorial": { label: "Editorial Only" },
  "all-rights-reserved": { label: "All Rights Reserved" },
};

interface Comment {
  id: number;
  photoId: number;
  authorId: string | null;
  authorName: string;
  body: string;
  createdAt: string;
}

function useComments(
  photoId: number,
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!photoId) return;
    setIsLoading(true);
    authFetch(`/api/photos/${photoId}/comments`)
      .then((r) => r.json())
      .then((data) => setComments((data as { comments: Comment[] }).comments ?? []))
      .catch(() => setError("Failed to load comments"))
      .finally(() => setIsLoading(false));
  }, [photoId, authFetch]);

  async function postComment(body: string): Promise<boolean> {
    const res = await authFetch(`/api/photos/${photoId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
    });
    if (res.ok || res.status === 201) {
      const comment: Comment = await res.json() as Comment;
      setComments((prev) => [comment, ...prev]);
      return true;
    }
    return false;
  }

  async function deleteComment(commentId: number): Promise<void> {
    const res = await authFetch(`/api/photos/${photoId}/comments/${commentId}`, {
      method: "DELETE",
    });
    if (res.status === 204 || res.ok) {
      setComments((prev) => prev.filter((c) => c.id !== commentId));
    }
  }

  return { comments, isLoading, error, postComment, deleteComment };
}

function CommentsSection({ photoId }: { photoId: number }) {
  const { authFetch } = useAuth();
  const { comments, isLoading, error, postComment, deleteComment } = useComments(photoId, authFetch);
  const [draft, setDraft] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const ok = await postComment(draft.trim());
      if (ok) {
        setDraft("");
        toast.success("Comment posted!");
      } else {
        setSubmitError("Failed to post comment. Please try again.");
      }
    } catch {
      setSubmitError("Network error.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(commentId: number) {
    setDeletingId(commentId);
    try { await deleteComment(commentId); }
    finally { setDeletingId(null); }
  }

  return (
    <div className="border-t border-border py-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="flex items-center gap-3 mb-10">
          <MessageSquare className="w-5 h-5 text-muted-foreground" />
          <h2 className="text-2xl font-serif">
            {isLoading ? "Comments" : `${comments.length} Comment${comments.length !== 1 ? "s" : ""}`}
          </h2>
        </div>

        <div className="mb-10">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium flex-shrink-0 mt-1">
                <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
              <div className="flex-1">
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="Share your thoughts on this photograph…"
                  rows={3}
                  maxLength={1000}
                  className="w-full bg-transparent border border-border px-4 py-3 text-sm focus:outline-none focus:border-foreground transition-colors resize-none placeholder:text-muted-foreground/50"
                />
                {submitError && <p className="text-xs text-destructive mt-1">{submitError}</p>}
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-muted-foreground">{draft.length}/1000</span>
                  <Button type="submit" disabled={submitting || !draft.trim()} className="rounded-none h-9 px-5 text-xs gap-2">
                    <Send className="w-3.5 h-3.5" />
                    {submitting ? "Posting…" : "Post Comment"}
                  </Button>
                </div>
              </div>
            </div>
          </form>
        </div>

        {isLoading ? (
          <div className="space-y-6">
            {Array(3).fill(0).map((_, i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-3 w-32" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : comments.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground border border-dashed border-border/50">
            <MessageSquare className="w-8 h-8 mx-auto mb-3 opacity-30" />
            <p className="text-sm">No comments yet. Be the first to share your thoughts.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3 group">
                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">
                  {comment.authorName.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <span className="text-sm font-medium">{comment.authorName}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(comment.createdAt), "MMM d, yyyy")}</span>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap break-words">{comment.body}</p>
                </div>
                <button
                  onClick={() => void handleDelete(comment.id)}
                  disabled={deletingId === comment.id}
                  className="flex-shrink-0 p-1.5 text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 self-start mt-0.5 disabled:opacity-30"
                  aria-label="Delete comment"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SaveToCollectionButton({ photoId }: { photoId: number }) {
  const { authFetch } = useAuth();
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState<number | null>(null);
  const [saved, setSaved] = useState<Set<number>>(new Set());
  const [newName, setNewName] = useState("");
  const [creating, setCreating] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { data: collections } = useListCollections({
    query: { enabled: open, queryKey: getListCollectionsQueryKey() },
  });

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
        setShowNew(false);
        setNewName("");
      }
    }
    if (open) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  async function addToCollection(collectionId: number) {
    setSaving(collectionId);
    try {
      const res = await authFetch(`/api/collections/${collectionId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      if (res.ok || res.status === 201) {
        setSaved((prev) => new Set([...prev, collectionId]));
      }
    } finally {
      setSaving(null);
    }
  }

  async function createAndSave() {
    if (!newName.trim()) return;
    setCreating(true);
    try {
      const res = await authFetch("/api/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim() }),
      });
      if (res.ok || res.status === 201) {
        const col = await res.json() as { id: number };
        await addToCollection(col.id);
        setNewName("");
        setShowNew(false);
      }
    } finally {
      setCreating(false);
    }
  }

  const collectionList = Array.isArray(collections) ? collections : [];

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <Button
        onClick={() => setOpen((o) => !o)}
        variant="outline"
        className="w-full rounded-none h-11 border border-border text-muted-foreground hover:text-foreground hover:bg-accent transition-all gap-2"
      >
        <BookmarkPlus className="w-4 h-4" />
        Save to Collection
        <ChevronDown className={cn("w-3.5 h-3.5 ml-auto transition-transform", open && "rotate-180")} />
      </Button>

      {open && (
        <div className="absolute bottom-full mb-1 left-0 right-0 bg-card border border-border shadow-xl z-50">
          {collectionList.length === 0 && !showNew ? (
            <div className="px-4 py-3 text-sm text-muted-foreground">No collections yet.</div>
          ) : (
            <div className="max-h-48 overflow-y-auto">
              {collectionList.map((col) => (
                <button
                  key={col.id}
                  onClick={() => void addToCollection(col.id)}
                  disabled={saving === col.id}
                  className="flex items-center justify-between w-full px-4 py-2.5 text-sm hover:bg-muted/50 transition-colors text-left gap-2"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <FolderOpen className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    <span className="truncate">{col.name}</span>
                    <span className="text-xs text-muted-foreground flex-shrink-0">{col.photoCount}</span>
                  </div>
                  {saved.has(col.id) ? (
                    <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  ) : saving === col.id ? (
                    <span className="w-3.5 h-3.5 rounded-full border-2 border-muted border-t-foreground animate-spin flex-shrink-0" />
                  ) : null}
                </button>
              ))}
            </div>
          )}

          {showNew ? (
            <div className="border-t border-border p-3 flex gap-2">
              <input
                autoFocus
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") void createAndSave(); if (e.key === "Escape") { setShowNew(false); setNewName(""); } }}
                placeholder="Collection name…"
                className="flex-1 bg-transparent border border-border px-3 py-1.5 text-sm focus:outline-none focus:border-foreground transition-colors"
              />
              <button
                onClick={() => void createAndSave()}
                disabled={creating || !newName.trim()}
                className="px-3 py-1.5 bg-foreground text-background text-xs font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {creating ? "…" : "Create"}
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowNew(true)}
              className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors border-t border-border/50"
            >
              <Plus className="w-3.5 h-3.5" />
              New collection
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ExifPanel({ photo }: { photo: { camera?: string | null; lens?: string | null; aperture?: string | null; shutterSpeed?: string | null; iso?: number | null; focalLength?: string | null } }) {
  const rows = [
    { icon: Camera, label: "Camera", value: photo.camera },
    { icon: Ruler, label: "Lens", value: photo.lens },
    { icon: Aperture, label: "Aperture", value: photo.aperture },
    { icon: Clock, label: "Shutter", value: photo.shutterSpeed },
    { icon: Zap, label: "ISO", value: photo.iso ? String(photo.iso) : null },
    { icon: Ruler, label: "Focal Length", value: photo.focalLength },
  ].filter((r) => r.value);

  if (rows.length === 0) return null;

  return (
    <div className="border border-border bg-card p-6 mt-4">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Camera & EXIF</h3>
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {rows.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex items-start gap-2">
            <Icon className="w-3.5 h-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className="text-sm font-medium truncate">{value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function TipSection({ photographerName }: { photographerName: string }) {
  const [tipped, setTipped] = useState<string | null>(null);
  const [showCustom, setShowCustom] = useState(false);
  const [customAmount, setCustomAmount] = useState("");
  const presets = ["$3", "$5", "$10", "$25"];

  function handleTip(amount: string) {
    setTipped(amount);
    setTimeout(() => setTipped(null), 3000);
    setShowCustom(false);
  }

  return (
    <div className="p-6 border border-border bg-card mt-4">
      <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Support this Photographer</h3>
      {tipped ? (
        <div className="flex items-center gap-2 py-3 text-sm text-green-400">
          <Check className="w-4 h-4" />
          <span>Thanks for tipping {tipped}! ☕</span>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">Buy {photographerName.split(" ")[0]} a coffee to support their work.</p>
          <div className="flex gap-2 flex-wrap">
            {presets.map((p) => (
              <button
                key={p}
                onClick={() => handleTip(p)}
                className="flex items-center gap-1.5 px-3 py-2 border border-border text-sm hover:bg-muted hover:border-foreground/50 transition-colors"
              >
                <Coffee className="w-3.5 h-3.5 text-muted-foreground" />
                {p}
              </button>
            ))}
            <button
              onClick={() => setShowCustom(true)}
              className="px-3 py-2 border border-dashed border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors"
            >
              Custom
            </button>
          </div>
          {showCustom && (
            <div className="flex items-center gap-2">
              <span className="text-muted-foreground text-sm">$</span>
              <input
                type="number"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                placeholder="0"
                className="w-20 bg-transparent border border-border px-2 py-1.5 text-sm focus:outline-none focus:border-foreground transition-colors"
                autoFocus
              />
              <button
                onClick={() => customAmount && handleTip(`$${customAmount}`)}
                className="px-3 py-1.5 bg-foreground text-background text-sm hover:opacity-90 transition-opacity disabled:opacity-40"
                disabled={!customAmount}
              >
                Send
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

interface SeriesPhoto {
  id: number;
  title: string;
  imageUrl: string;
  seriesPosition: number | null;
}

interface SeriesInfo {
  id: number;
  name: string;
  photographerName: string;
}

function SeriesPanel({ seriesId, currentPhotoId }: { seriesId: number; currentPhotoId: number }) {
  const [series, setSeries] = useState<SeriesInfo | null>(null);
  const [photos, setPhotos] = useState<SeriesPhoto[]>([]);

  useEffect(() => {
    fetch(`/api/series/${seriesId}`)
      .then((r) => r.json())
      .then((d: { series: SeriesInfo; photos: SeriesPhoto[] }) => {
        setSeries(d.series);
        setPhotos(d.photos ?? []);
      })
      .catch(() => {});
  }, [seriesId]);

  if (!series || photos.length === 0) return null;

  const currentIdx = photos.findIndex((p) => p.id === currentPhotoId);
  const position = currentIdx === -1 ? null : currentIdx + 1;
  const prevPhoto = currentIdx > 0 ? photos[currentIdx - 1] : null;
  const nextPhoto = currentIdx >= 0 && currentIdx < photos.length - 1 ? photos[currentIdx + 1] : null;

  return (
    <div className="bg-muted/5 border-b border-border/40">
      <div className="container mx-auto px-4 py-3 max-w-6xl">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
            <span className="text-xs text-muted-foreground">Part of</span>
            <Link
              href={`/series/${series.id}`}
              className="text-xs font-medium hover:underline underline-offset-2 transition-colors"
            >
              {series.name}
            </Link>
            {position !== null && (
              <>
                <span className="text-muted-foreground/40 text-xs">·</span>
                <span className="text-xs text-muted-foreground font-mono">
                  Photo {position} of {photos.length}
                </span>
              </>
            )}
          </div>

          <div className="flex items-center gap-1">
            {prevPhoto ? (
              <Link
                href={`/photos/${prevPhoto.id}`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/50 hover:border-border transition-colors"
                title={prevPhoto.title}
              >
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground/30 border border-border/20 cursor-not-allowed">
                <ChevronLeft className="w-3.5 h-3.5" /> Prev
              </span>
            )}
            <Link
              href={`/series/${series.id}`}
              className="px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/50 hover:border-border transition-colors"
            >
              View Series
            </Link>
            {nextPhoto ? (
              <Link
                href={`/photos/${nextPhoto.id}`}
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/50 hover:border-border transition-colors"
                title={nextPhoto.title}
              >
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <span className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-muted-foreground/30 border border-border/20 cursor-not-allowed">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorPalette({ imageUrl }: { imageUrl: string }) {
  const [colors, setColors] = useState<string[]>([]);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = 80;
        canvas.height = 80;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, 80, 80);
        const data = ctx.getImageData(0, 0, 80, 80).data;
        const buckets: Record<string, { r: number; g: number; b: number; count: number }> = {};
        for (let i = 0; i < data.length; i += 16) {
          const r = Math.round(data[i] / 32) * 32;
          const g = Math.round(data[i + 1] / 32) * 32;
          const b = Math.round(data[i + 2] / 32) * 32;
          const key = `${r},${g},${b}`;
          if (!buckets[key]) buckets[key] = { r, g, b, count: 0 };
          buckets[key].count++;
        }
        const sorted = Object.values(buckets)
          .sort((a, b) => b.count - a.count)
          .slice(0, 5)
          .filter((c) => !(c.r > 240 && c.g > 240 && c.b > 240) && !(c.r < 15 && c.g < 15 && c.b < 15));
        const hex = sorted.slice(0, 5).map((c) => {
          const toHex = (n: number) => n.toString(16).padStart(2, "0");
          return `#${toHex(c.r)}${toHex(c.g)}${toHex(c.b)}`;
        });
        setColors(hex);
      } catch { /* tainted canvas — CORS */ }
    };
    img.src = imageUrl;
  }, [imageUrl]);

  if (colors.length === 0) return null;

  return (
    <div className="p-6 border border-border bg-card mt-4">
      <h3 className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Colour Palette</h3>
      <div className="flex gap-2">
        {colors.map((c) => (
          <button
            key={c}
            title={c}
            onClick={() => void navigator.clipboard.writeText(c).catch(() => {})}
            className="group flex flex-col items-center gap-1.5"
          >
            <div className="w-10 h-10 border border-border/30 transition-transform group-hover:scale-110" style={{ backgroundColor: c }} />
            <span className="text-[10px] text-muted-foreground font-mono opacity-0 group-hover:opacity-100 transition-opacity">{c}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function RelatedCollections({ photoId }: { photoId: number }) {
  const [cols, setCols] = useState<Array<{ id: number; name: string; description?: string | null; coverImageUrl?: string | null; photoCount: number }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/collections/for-photo/${photoId}`)
      .then((r) => r.json())
      .then((d: { collections?: typeof cols }) => setCols(d.collections ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [photoId]);

  if (!loading && cols.length === 0) return null;

  return (
    <div className="border-t border-border/30 pt-8 mt-8">
      <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-4">Part of</h3>
      {loading ? (
        <div className="flex gap-3">
          {Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-14 w-40" />)}
        </div>
      ) : (
        <div className="flex flex-wrap gap-3">
          {cols.map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.id}`}
              className="flex items-center gap-3 border border-border/50 hover:border-foreground/40 px-3 py-2 transition-colors group"
            >
              {col.coverImageUrl && (
                <img src={col.coverImageUrl} alt={col.name} className="w-10 h-10 object-cover flex-shrink-0" />
              )}
              <div>
                <p className="text-sm font-medium group-hover:text-muted-foreground transition-colors">{col.name}</p>
                <p className="text-xs text-muted-foreground">{col.photoCount} photos</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MoreByPhotographer({ photographerName, excludeId }: { photographerName: string; excludeId: number }) {
  const [photos, setPhotos] = useState<Array<{ id: number; title: string; imageUrl: string; photographerName: string; likes: number; downloads: number; tags: string[]; views: number; width: number; height: number; aspectRatio: string; license: string; status: string; isFeatured: boolean; description?: string | null; camera?: string | null; lens?: string | null; aperture?: string | null; shutterSpeed?: string | null; iso?: number | null; focalLength?: string | null; createdAt: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/photos/by-photographer/${encodeURIComponent(photographerName)}?limit=6&excludeId=${excludeId}`)
      .then((r) => r.json())
      .then((d: { photos: typeof photos }) => setPhotos(d.photos ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [photographerName, excludeId]);

  if (!loading && photos.length === 0) return null;

  return (
    <div className="border-t border-border bg-background py-16">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Camera className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-2xl font-serif">More by {photographerName}</h2>
            </div>
            <p className="text-sm text-muted-foreground">Other work from this photographer</p>
          </div>
          <Link href={`/profile/${encodeURIComponent(photographerName)}`} className="text-sm border-b border-primary pb-1 hover:text-muted-foreground transition-colors">
            View full portfolio &rarr;
          </Link>
        </div>
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array(6).fill(0).map((_, i) => <Skeleton key={i} className="w-full h-[160px]" />)}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {photos.map((p) => (
              <Link key={p.id} href={`/photos/${p.id}`} className="group relative overflow-hidden block aspect-square">
                <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-end p-2 opacity-0 group-hover:opacity-100">
                  <p className="text-white text-xs font-medium line-clamp-1">{p.title}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export function PhotoDetail() {
  const { id } = useParams<{ id: string }>();
  const photoId = parseInt(id, 10);
  const queryClient = useQueryClient();
  const [copied, setCopied] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const { isAdmin } = useAuth();
  const { isPremium } = useSubscription();
  const { gate, isOpen: gateOpen, closeGate, activeFeature } = usePremiumGate();
  const [adsEnabled, setAdsEnabled] = useState(false);
  const [adOpen, setAdOpen] = useState(false);
  const pendingDownloadRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    fetch("/api/settings")
      .then(r => r.ok ? r.json() as Promise<{ adsEnabled: boolean }> : null)
      .then(data => { if (data != null) setAdsEnabled(data.adsEnabled); })
      .catch(() => {});
  }, []);

  const { data: photo, isLoading } = useGetPhoto(photoId, {
    query: { enabled: !!photoId, queryKey: getGetPhotoQueryKey(photoId) }
  });

  const { data: relatedResponse } = useListPhotos(
    { tag: photo?.tags?.[0] ?? undefined, limit: 5 },
    { query: { enabled: !!photo?.tags?.length, queryKey: getListPhotosQueryKey({ tag: photo?.tags?.[0] ?? undefined, limit: 5 }) } }
  );

  const relatedPhotos = relatedResponse?.photos.filter((p) => p.id !== photoId).slice(0, 4) ?? [];

  const likeMutation = useLikePhoto();
  const downloadMutation = useDownloadPhoto();

  const handleLike = () => {
    if (!photo) return;
    likeMutation.mutate({ id: photo.id }, {
      onSuccess: () => {
        void queryClient.invalidateQueries({ queryKey: getGetPhotoQueryKey(photo.id) });
        toast.success("Photo liked!");
      },
      onError: () => toast.error("Couldn't like photo"),
    });
  };

  const handleDownload = () => {
    if (!photo) return;
    const extPhoto = photo as typeof photo & { isPremiumOnly?: boolean };

    if (extPhoto.isPremiumOnly && !isPremium && !isAdmin) {
      gate("download", () => { /* premium gate handles this */ });
      return;
    }

    const doDownload = () => {
      downloadMutation.mutate({ id: photo.id }, {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: getGetPhotoQueryKey(photo.id) });
          // Download with attribution filename
          const slug = photo.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
          const ext = photo.imageUrl.split("?")[0].split(".").pop()?.toLowerCase() || "jpg";
          const filename = `${slug}-by-${photo.photographerName.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-affuaa.${ext}`;
          fetch(photo.imageUrl)
            .then(r => r.blob())
            .then(blob => {
              const a = document.createElement("a");
              a.href = URL.createObjectURL(blob);
              a.download = filename;
              a.click();
              URL.revokeObjectURL(a.href);
            })
            .catch(() => window.open(photo.imageUrl, "_blank"));
          toast.success("Download started!");
        },
        onError: () => toast.error("Couldn't download photo"),
      });
    };

    if (adsEnabled && !isPremium && !isAdmin) {
      pendingDownloadRef.current = doDownload;
      setAdOpen(true);
      return;
    }

    if (!isPremium && !isAdmin && !extPhoto.isPremiumOnly) {
      gate("download", doDownload);
      return;
    }

    doDownload();
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Link copied to clipboard!");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't copy link");
    }
  };

  const handleShareTwitter = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out "${photo?.title}" on Affuaa`);
    window.open(`https://x.com/intent/tweet?text=${text}&url=${url}`, "_blank");
  };

  const handleShareWhatsApp = () => {
    const url = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out "${photo?.title}" on Affuaa: `);
    window.open(`https://wa.me/?text=${text}${url}`, "_blank");
  };

  useEffect(() => {
    if (photo) {
      const prev = document.title;
      document.title = `${photo.title} by ${photo.photographerName} · Affuaa`;
      try {
        const RECENT_KEY = "affuaa_recently_viewed";
        const item = { id: photo.id, title: photo.title, imageUrl: photo.imageUrl, photographerName: photo.photographerName };
        const prev2: Array<{ id: number; title: string; imageUrl: string; photographerName: string }> = JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
        const next2 = [item, ...prev2.filter((p) => p.id !== item.id)].slice(0, 12);
        localStorage.setItem(RECENT_KEY, JSON.stringify(next2));
      } catch {}
      return () => { document.title = prev; };
    }
  }, [photo]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "f" || e.key === "F") setFocusMode((v) => !v);
      if (e.key === "l" || e.key === "L") { if (photo) handleLike(); }
      if (e.key === "Escape") { setFocusMode(false); setShowShortcuts(false); }
      if (e.key === "?") setShowShortcuts((v) => !v);
      if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
        const direction = e.key === "ArrowLeft" ? "prev" : "next";
        fetch(`/api/photos/adjacent?id=${photoId}&direction=${direction}`)
          .then((r) => r.ok ? r.json() as Promise<{ id: number } | null> : null)
          .then((adj) => { if (adj?.id) window.location.href = `/photos/${adj.id}`; })
          .catch(() => {});
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photo, photoId]);

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <Skeleton className="w-full h-[70vh]" />
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-12">
            <div className="lg:col-span-2">
              <Skeleton className="h-10 w-2/3 mb-4" />
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-4 w-5/6" />
            </div>
            <div><Skeleton className="h-32 w-full" /></div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!photo) {
    return (
      <Layout>
        <div className="py-32 text-center text-muted-foreground">
          <p className="font-serif text-xl">Photograph not found.</p>
          <Link href="/photos" className="text-sm mt-4 block underline">Return to gallery</Link>
        </div>
      </Layout>
    );
  }

  const licenseInfo = LICENSE_LABELS[photo.license] ?? { label: photo.license };

  return (
    <Layout>
      <ReadingProgressBar />
      <PremiumGateModal open={gateOpen} onClose={closeGate} feature={activeFeature} />
      <AdInterstitialModal
        open={adOpen}
        onClose={() => setAdOpen(false)}
        onAdComplete={() => { pendingDownloadRef.current?.(); pendingDownloadRef.current = null; }}
      />
      {focusMode && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setFocusMode(false)}
        >
          <img
            src={photo.imageUrl}
            alt={photo.title}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          <button
            onClick={() => setFocusMode(false)}
            className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
          <p className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white/30 text-xs tracking-wide">
            Press ESC or click outside to exit
          </p>
        </div>
      )}

      {showShortcuts && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowShortcuts(false)}>
          <div className="bg-card border border-border p-6 w-72 space-y-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-serif text-lg flex items-center gap-2"><Keyboard className="w-4 h-4 text-muted-foreground" /> Shortcuts</h3>
              <button onClick={() => setShowShortcuts(false)} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-2 text-sm">
              {[["F", "Focus / immersive mode"], ["L", "Like this photo"], ["← →", "Prev / next photo"], ["?", "Show shortcuts"], ["ESC", "Exit / close"]].map(([k, d]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-muted-foreground">{d}</span>
                  <kbd className="px-2 py-0.5 border border-border bg-muted text-xs font-mono">{k}</kbd>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {photo.seriesId && (
        <SeriesPanel seriesId={photo.seriesId} currentPhotoId={photo.id} />
      )}

      <div className="bg-black border-b border-border min-h-[70vh] flex items-center justify-center p-4 md:p-12 relative">
        <button
          className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/70 text-white/60 hover:text-white p-2 transition-all opacity-0 hover:opacity-100 focus:opacity-100 group-hover:opacity-100"
          title="Previous photo (←)"
          onClick={() => {
            fetch(`/api/photos/adjacent?id=${photoId}&direction=prev`)
              .then((r) => r.ok ? r.json() as Promise<{ id: number } | null> : null)
              .then((adj) => { if (adj?.id) window.location.href = `/photos/${adj.id}`; })
              .catch(() => {});
          }}
          style={{ opacity: 0.6 }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>
        <div className="relative max-w-6xl w-full group image-glow">
          <img src={photo.imageUrl} alt={photo.title} className="w-full h-auto max-h-[80vh] object-contain mx-auto shadow-2xl" />
          <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
            <Button variant="secondary" size="icon" className="bg-black/50 hover:bg-black/80 text-white border-0 backdrop-blur-md rounded-none" onClick={() => setFocusMode(true)} title="Focus mode (F)">
              <Maximize className="h-4 w-4" />
            </Button>
            <Button variant="secondary" size="icon" className="bg-black/50 hover:bg-black/80 text-white border-0 backdrop-blur-md rounded-none" onClick={() => window.open(photo.imageUrl, '_blank')}>
              <Maximize2 className="h-4 w-4" />
            </Button>
          </div>
          {photo.status === "draft" && (
            <div className="absolute top-4 left-4 bg-amber-500/90 text-black text-xs font-semibold px-3 py-1">DRAFT</div>
          )}
        </div>
        <button
          className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-black/40 hover:bg-black/70 text-white/60 hover:text-white p-2 transition-all"
          title="Next photo (→)"
          onClick={() => {
            fetch(`/api/photos/adjacent?id=${photoId}&direction=next`)
              .then((r) => r.ok ? r.json() as Promise<{ id: number } | null> : null)
              .then((adj) => { if (adj?.id) window.location.href = `/photos/${adj.id}`; })
              .catch(() => {});
          }}
          style={{ opacity: 0.6 }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "1")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "0.6")}
        >
          <ChevronRight className="w-6 h-6" />
        </button>
      </div>

      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-16">
          <div className="lg:col-span-2 space-y-8">
            <div>
              <h1 className="text-4xl md:text-5xl font-serif mb-6 leading-tight">{photo.title}</h1>
              {photo.description && (
                <p className="text-lg text-muted-foreground font-light leading-relaxed">{photo.description}</p>
              )}
            </div>
            <div className="flex flex-wrap gap-2 pt-4">
              {photo.tags.map(tag => (
                <Link key={tag} href={`/tags/${tag}`} className="px-4 py-1.5 bg-muted/30 text-sm text-muted-foreground hover:bg-muted hover:text-foreground transition-colors border border-border/50">
                  {tag}
                </Link>
              ))}
            </div>

            {/* License badge */}
            <div className="flex items-center gap-2 pt-2">
              <Shield className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
              {licenseInfo.url ? (
                <a href={licenseInfo.url} target="_blank" rel="noopener noreferrer" className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2">
                  {licenseInfo.label}
                </a>
              ) : (
                <span className="text-xs text-muted-foreground">{licenseInfo.label}</span>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-8 border border-border bg-card">
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground mb-6">The Photographer</h3>
              <div className="flex items-center gap-4 mb-6">
                {photo.photographerAvatarUrl ? (
                  <img src={photo.photographerAvatarUrl} alt={photo.photographerName} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-muted-foreground font-serif">
                    {photo.photographerName.charAt(0)}
                  </div>
                )}
                <div>
                  <Link href={`/profile/${encodeURIComponent(photo.photographerName)}`} className="font-serif text-xl hover:underline underline-offset-2 transition-colors">
                    {photo.photographerName}
                  </Link>
                </div>
              </div>

              <div className="h-px w-full bg-border my-6" />

              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground flex items-center gap-2"><Calendar className="w-4 h-4" /> Published</span>
                  <span>{format(new Date(photo.createdAt), "MMMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">Dimensions</span>
                  <span>{photo.width} × {photo.height}</span>
                </div>
              </div>

              <div className="mt-6 flex flex-col gap-3">
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {photo.views.toLocaleString()} views</span>
                  <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> {photo.likes} likes</span>
                  <span className="flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> {photo.downloads} downloads</span>
                </div>
                {photo.likes > 0 && (
                  <p className="text-xs text-muted-foreground/70 italic">
                    {photo.likes === 1
                      ? "1 photographer loves this image."
                      : `${photo.likes} photographers love this image.`}
                  </p>
                )}
              </div>

              <div className="mt-4 space-y-3">
                <Button onClick={handleLike} disabled={likeMutation.isPending} className={cn("rounded-none h-12 border w-full transition-all", photo.likes > 0 ? "bg-white text-black hover:bg-white/90" : "bg-transparent text-foreground border-border hover:bg-accent")}>
                  <Heart className={cn("w-4 h-4 mr-2", photo.likes > 0 && "fill-black")} />
                  Like
                </Button>
                <DownloadSizeSelector
                  photo={photo}
                  onDownload={handleDownload}
                  isPending={downloadMutation.isPending}
                  isPremium={isPremium}
                  isAdmin={isAdmin}
                  adsEnabled={adsEnabled}
                />
              </div>
              {!isPremium && !isAdmin && (() => {
                const extPhoto = photo as typeof photo & { isPremiumOnly?: boolean };
                if (extPhoto.isPremiumOnly) return <p className="text-xs text-muted-foreground mt-2">This photo is exclusive to Premium members.</p>;
                if (adsEnabled) return <p className="text-xs text-muted-foreground mt-2">Watch a short ad to download. <a href="/premium" className="underline">Go ad-free with Premium.</a></p>;
                return <p className="text-xs text-muted-foreground mt-2">HD downloads are available on Premium.</p>;
              })()}

              <div className="mt-3 space-y-2">
                <SaveToCollectionButton photoId={photoId} />
                <div className="flex gap-2">
                  <Button
                    onClick={() => void handleShare()}
                    variant="outline"
                    className={cn("flex-1 rounded-none h-11 border transition-all", copied ? "border-green-500/50 text-green-400 bg-green-500/10" : "border-border text-muted-foreground hover:text-foreground hover:bg-accent")}
                  >
                    {copied ? <><Check className="w-4 h-4 mr-2" />Copied!</> : <><Share2 className="w-4 h-4 mr-2" />Share</>}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShareTwitter}
                    className="rounded-none h-11 px-3 border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                    title="Share on X / Twitter"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.735-8.835L2 2.25h6.926l4.265 5.64 5.053-5.64Zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleShareWhatsApp}
                    className="rounded-none h-11 px-3 border-border text-muted-foreground hover:text-foreground hover:bg-accent"
                    title="Share on WhatsApp"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                  </Button>
                </div>
              </div>

              <ReactionsPanel photoId={photoId} />

              <div className="mt-4 pt-4 border-t border-border/40 flex items-center justify-between flex-wrap gap-2">
                <EmbedButton photoId={photoId} />
                <button
                  onClick={() => setShowShortcuts(true)}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  title="Keyboard shortcuts"
                >
                  <Keyboard className="w-3.5 h-3.5" /> Shortcuts
                </button>
                <button
                  onClick={() => {
                    if (!photo) return;
                    const win = window.open("", "_blank");
                    if (!win) return;
                    win.document.write(`<!DOCTYPE html><html><head><title>${photo.title}</title><style>body{margin:0;background:#000;display:flex;align-items:center;justify-content:center;min-height:100vh}img{max-width:100%;max-height:100vh;object-fit:contain}@media print{body{background:#fff}}</style></head><body><img src="${photo.imageUrl}" alt="${photo.title}" onload="setTimeout(()=>window.print(),300)" /></body></html>`);
                    win.document.close();
                  }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" /> Print
                </button>
                <button
                  onClick={() => {
                    const reason = prompt("Why are you reporting this photo?");
                    if (!reason) return;
                    fetch(`/api/photos/${photoId}/report`, {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ reason }),
                    }).then(() => alert("Report submitted. Thank you.")).catch(() => {});
                  }}
                  className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-400 transition-colors"
                >
                  <Flag className="w-3.5 h-3.5" /> Report
                </button>
              </div>
            </div>

            <ExifPanel photo={photo} />
            <ColorPalette imageUrl={photo.imageUrl} />
            <RelatedCollections photoId={photoId} />
            <TipSection photographerName={photo.photographerName} />
          </div>
        </div>
      </div>

      <SimilarPhotos
        photoId={photoId}
        photoTags={photo.tags}
        primaryTag={photo.tags[0]}
      />

      <MoreByPhotographer photographerName={photo.photographerName} excludeId={photoId} />

      <CommentsSection photoId={photoId} />
    </Layout>
  );
}
