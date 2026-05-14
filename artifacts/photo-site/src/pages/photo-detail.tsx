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
  DollarSign, Coffee, Maximize, Minimize, Keyboard,
  BookOpen, ChevronLeft, ChevronRight,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";
import { useSubscription } from "@/hooks/use-subscription";
import { usePremiumGate } from "@/hooks/use-premium-gate";
import { PremiumGateModal } from "@/components/premium-gate-modal";

const REACTION_EMOJIS = ["❤️", "🔥", "✨", "😮", "🎉"];

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
      if (ok) setDraft("");
      else setSubmitError("Failed to post comment. Please try again.");
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
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetPhotoQueryKey(photo.id) })
    });
  };

  const handleDownload = () => {
    if (!photo) return;
    gate("download", () => {
      downloadMutation.mutate({ id: photo.id }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPhotoQueryKey(photo.id) });
          window.open(photo.imageUrl, "_blank");
        }
      });
    });
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: photo?.title, url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch { /* ignore */ }
    }
  };

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "f" || e.key === "F") setFocusMode((v) => !v);
      if (e.key === "l" || e.key === "L") { if (photo) handleLike(); }
      if (e.key === "Escape") { setFocusMode(false); setShowShortcuts(false); }
      if (e.key === "?") setShowShortcuts((v) => !v);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [photo]);

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
      <PremiumGateModal open={gateOpen} onClose={closeGate} feature={activeFeature} />
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
              {[["F", "Focus / immersive mode"], ["L", "Like this photo"], ["?", "Show shortcuts"], ["ESC", "Exit / close"]].map(([k, d]) => (
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

      <div className="bg-black border-b border-border min-h-[70vh] flex items-center justify-center p-4 md:p-12">
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

              <div className="mt-6 flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5"><Eye className="w-3.5 h-3.5" /> {photo.views.toLocaleString()} views</span>
                <span className="flex items-center gap-1.5"><Heart className="w-3.5 h-3.5" /> {photo.likes} likes</span>
                <span className="flex items-center gap-1.5"><Download className="w-3.5 h-3.5" /> {photo.downloads} downloads</span>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button onClick={handleLike} disabled={likeMutation.isPending} className={cn("rounded-none h-12 border transition-all", photo.likes > 0 ? "bg-white text-black hover:bg-white/90" : "bg-transparent text-foreground border-border hover:bg-accent")}>
                  <Heart className={cn("w-4 h-4 mr-2", photo.likes > 0 && "fill-black")} />
                  Like
                </Button>
                <Button onClick={handleDownload} disabled={downloadMutation.isPending} className="rounded-none h-12 bg-transparent text-foreground border border-border hover:bg-accent transition-all">
                  <Download className="w-4 h-4 mr-2" />
                  {isPremium || isAdmin ? "Download" : "Premium Download"}
                </Button>
              </div>
              {!isPremium && !isAdmin && <p className="text-xs text-muted-foreground mt-2">HD downloads are available on Premium.</p>}

              <div className="mt-3 space-y-2">
                <SaveToCollectionButton photoId={photoId} />
                <Button
                  onClick={() => void handleShare()}
                  variant="outline"
                  className={cn("w-full rounded-none h-11 border transition-all", copied ? "border-green-500/50 text-green-400 bg-green-500/10" : "border-border text-muted-foreground hover:text-foreground hover:bg-accent")}
                >
                  {copied ? <><Check className="w-4 h-4 mr-2" />Link copied!</> : <><Share2 className="w-4 h-4 mr-2" />Share</>}
                </Button>
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
            <TipSection photographerName={photo.photographerName} />
          </div>
        </div>
      </div>

      <SimilarPhotos
        photoId={photoId}
        photoTags={photo.tags}
        primaryTag={photo.tags[0]}
      />

      <CommentsSection photoId={photoId} />
    </Layout>
  );
}
