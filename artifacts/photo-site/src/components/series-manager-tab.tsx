import { useState, useEffect } from "react";
import { Link } from "wouter";
import type { Photo } from "@workspace/api-client-react";
import {
  BookOpen, Plus, Trash2, ArrowUp, ArrowDown,
  ChevronDown, ChevronUp, X, Film, ImageIcon, Loader2, Star,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface Series {
  id: number;
  name: string;
  description: string | null;
  photographerName: string;
  coverImageUrl: string | null;
  createdAt: string;
  photoCount?: number;
}

interface SeriesPhoto {
  id: number;
  title: string;
  imageUrl: string;
  seriesPosition?: number | null;
  photographerName: string;
}

interface Props {
  photographerName: string;
  myPhotos: Photo[];
}

export function SeriesManagerTab({ photographerName, myPhotos }: Props) {
  const [series, setSeries] = useState<Series[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [seriesPhotosMap, setSeriesPhotosMap] = useState<Record<number, SeriesPhoto[]>>({});
  const [showAddPicker, setShowAddPicker] = useState(false);
  const [saving, setSaving] = useState<Record<number, boolean>>({});
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", description: "", coverImageUrl: "" });
  const [creating, setCreating] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [settingCover, setSettingCover] = useState<Record<number, boolean>>({});

  useEffect(() => {
    setLoading(true);
    fetch("/api/series")
      .then((r) => r.json())
      .then((d: { series: Series[] }) => {
        const mine = (d.series ?? []).filter(
          (s) => s.photographerName.toLowerCase() === photographerName.toLowerCase()
        );
        setSeries(mine);
      })
      .catch(() => setSeries([]))
      .finally(() => setLoading(false));
  }, [photographerName]);

  async function loadSeriesPhotos(seriesId: number) {
    try {
      const res = await fetch(`/api/series/${seriesId}`);
      if (res.ok) {
        const d = await res.json() as { photos: SeriesPhoto[] };
        setSeriesPhotosMap((prev) => ({ ...prev, [seriesId]: d.photos ?? [] }));
      }
    } catch { /* ignore */ }
  }

  function toggleExpand(seriesId: number) {
    if (expandedId === seriesId) {
      setExpandedId(null);
      setShowAddPicker(false);
    } else {
      setExpandedId(seriesId);
      setShowAddPicker(false);
      if (!seriesPhotosMap[seriesId]) void loadSeriesPhotos(seriesId);
    }
  }

  async function createSeries() {
    if (!createForm.name.trim()) return;
    setCreating(true);
    try {
      const res = await fetch("/api/series", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: createForm.name,
          description: createForm.description || null,
          photographerName,
          coverImageUrl: createForm.coverImageUrl || null,
        }),
      });
      if (res.ok || res.status === 201) {
        const newS = await res.json() as Series;
        setSeries((prev) => [{ ...newS, photoCount: 0 }, ...prev]);
        setShowCreate(false);
        setCreateForm({ name: "", description: "", coverImageUrl: "" });
      }
    } finally {
      setCreating(false);
    }
  }

  async function deleteSeries(seriesId: number) {
    if (!window.confirm("Delete this series? The photos will stay, but they'll be removed from the series.")) return;
    setDeletingId(seriesId);
    try {
      await fetch(`/api/series/${seriesId}`, { method: "DELETE" });
      setSeries((prev) => prev.filter((s) => s.id !== seriesId));
      if (expandedId === seriesId) { setExpandedId(null); setShowAddPicker(false); }
    } finally {
      setDeletingId(null);
    }
  }

  async function removeFromSeries(seriesId: number, photoId: number) {
    setSaving((prev) => ({ ...prev, [photoId]: true }));
    try {
      await fetch(`/api/series/${seriesId}/photos/${photoId}`, { method: "DELETE" });
      setSeriesPhotosMap((prev) => ({
        ...prev,
        [seriesId]: (prev[seriesId] ?? []).filter((p) => p.id !== photoId),
      }));
      setSeries((prev) =>
        prev.map((s) => s.id === seriesId ? { ...s, photoCount: Math.max(0, (s.photoCount ?? 1) - 1) } : s)
      );
    } finally {
      setSaving((prev) => ({ ...prev, [photoId]: false }));
    }
  }

  async function assignToSeries(seriesId: number, photo: Photo) {
    const existing = seriesPhotosMap[seriesId] ?? [];
    if (existing.some((p) => p.id === photo.id)) return;
    const position = existing.length + 1;
    setSaving((prev) => ({ ...prev, [photo.id]: true }));
    try {
      const res = await fetch(`/api/series/${seriesId}/photos/${photo.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position }),
      });
      if (res.ok) {
        setSeriesPhotosMap((prev) => ({
          ...prev,
          [seriesId]: [...existing, { id: photo.id, title: photo.title, imageUrl: photo.imageUrl, photographerName: photo.photographerName, seriesPosition: position }],
        }));
        setSeries((prev) =>
          prev.map((s) => s.id === seriesId ? { ...s, photoCount: (s.photoCount ?? 0) + 1 } : s)
        );
      }
    } finally {
      setSaving((prev) => ({ ...prev, [photo.id]: false }));
    }
  }

  async function movePhoto(seriesId: number, photoId: number, direction: "up" | "down") {
    const photos = [...(seriesPhotosMap[seriesId] ?? [])];
    const idx = photos.findIndex((p) => p.id === photoId);
    if (idx === -1) return;
    const newIdx = direction === "up" ? idx - 1 : idx + 1;
    if (newIdx < 0 || newIdx >= photos.length) return;

    [photos[idx], photos[newIdx]] = [photos[newIdx], photos[idx]];
    const reordered = photos.map((p, i) => ({ ...p, seriesPosition: i + 1 }));
    setSeriesPhotosMap((prev) => ({ ...prev, [seriesId]: reordered }));

    setSaving((prev) => ({ ...prev, [photoId]: true }));
    try {
      await Promise.all([
        fetch(`/api/series/${seriesId}/photos/${photos[idx].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position: idx + 1 }),
        }),
        fetch(`/api/series/${seriesId}/photos/${photos[newIdx].id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ position: newIdx + 1 }),
        }),
      ]);
    } finally {
      setSaving((prev) => ({ ...prev, [photoId]: false }));
    }
  }

  async function setCover(seriesId: number, imageUrl: string) {
    setSettingCover((prev) => ({ ...prev, [seriesId]: true }));
    try {
      const res = await fetch(`/api/series/${seriesId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ coverImageUrl: imageUrl }),
      });
      if (res.ok) {
        setSeries((prev) =>
          prev.map((s) => s.id === seriesId ? { ...s, coverImageUrl: imageUrl } : s)
        );
      }
    } finally {
      setSettingCover((prev) => ({ ...prev, [seriesId]: false }));
    }
  }

  const expandedPhotos = expandedId !== null ? (seriesPhotosMap[expandedId] ?? null) : null;
  const assignedIds = new Set((expandedPhotos ?? []).map((p) => p.id));
  const availableToAdd = myPhotos.filter((p) => !assignedIds.has(p.id));

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {series.length === 0 ? "No series yet" : `${series.length} series`}
          </span>
        </div>
        <button
          onClick={() => setShowCreate((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background text-xs font-medium hover:opacity-90 transition-opacity"
        >
          <Plus className="w-3.5 h-3.5" /> New Series
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="border border-border bg-card p-5 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-serif text-lg">Create Series</h3>
            <button onClick={() => setShowCreate(false)} className="text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Name *</label>
                <input
                  value={createForm.name}
                  onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))}
                  onKeyDown={(e) => { if (e.key === "Enter") void createSeries(); }}
                  placeholder="Through the Seasons"
                  className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                  autoFocus
                />
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Cover Image URL</label>
                <input
                  value={createForm.coverImageUrl}
                  onChange={(e) => setCreateForm((f) => ({ ...f, coverImageUrl: e.target.value }))}
                  placeholder="https://…"
                  className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-muted-foreground block mb-1.5">Description</label>
              <textarea
                value={createForm.description}
                onChange={(e) => setCreateForm((f) => ({ ...f, description: e.target.value }))}
                rows={2}
                className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground resize-none transition-colors"
              />
            </div>
            <button
              onClick={() => void createSeries()}
              disabled={creating || !createForm.name.trim()}
              className="px-5 py-2 bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-50 transition-opacity"
            >
              {creating ? <Loader2 className="w-4 h-4 animate-spin inline mr-2" /> : null}
              {creating ? "Creating…" : "Create Series"}
            </button>
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="space-y-3">
          {Array(2).fill(0).map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && series.length === 0 && (
        <div className="py-16 text-center border border-dashed border-border text-muted-foreground">
          <BookOpen className="w-8 h-8 mx-auto mb-3 opacity-20" />
          <p className="text-sm">Create your first series to group related photos into a narrative.</p>
        </div>
      )}

      {/* Series list */}
      {!loading && series.map((s) => {
        const isExpanded = expandedId === s.id;
        const photos = seriesPhotosMap[s.id];
        const isDeleting = deletingId === s.id;

        return (
          <div key={s.id} className="border border-border bg-card mb-3 overflow-hidden">
            {/* Series header row */}
            <div className="flex items-center gap-3 p-4">
              {/* Cover thumbnail */}
              <div className="w-14 h-10 flex-shrink-0 overflow-hidden bg-muted/40 border border-border/40">
                {s.coverImageUrl ? (
                  <img src={s.coverImageUrl} alt={s.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-muted-foreground/30" />
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-serif text-base truncate">{s.name}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {s.photoCount ?? 0} photo{(s.photoCount ?? 0) !== 1 ? "s" : ""}
                  {s.description && <span className="ml-2 text-muted-foreground/60">· {s.description.slice(0, 40)}{s.description.length > 40 ? "…" : ""}</span>}
                </p>
              </div>

              <div className="flex items-center gap-1 flex-shrink-0">
                <Link
                  href={`/series/${s.id}`}
                  className="px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/50 hover:border-border transition-colors"
                  title="View series"
                >
                  <Film className="w-3.5 h-3.5" />
                </Link>
                <button
                  onClick={() => void deleteSeries(s.id)}
                  disabled={isDeleting}
                  className="px-2.5 py-1.5 text-xs text-muted-foreground hover:text-red-400 border border-border/50 hover:border-red-400/50 transition-colors disabled:opacity-40"
                  title="Delete series"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => toggleExpand(s.id)}
                  className="px-2.5 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/50 hover:border-border transition-colors"
                >
                  {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-border/40 bg-muted/5">
                {/* Ordered photos */}
                {photos === undefined ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                  </div>
                ) : photos.length === 0 ? (
                  <div className="py-8 text-center text-sm text-muted-foreground">
                    <ImageIcon className="w-6 h-6 mx-auto mb-2 opacity-20" />
                    No photos yet. Add some below.
                  </div>
                ) : (
                  <div className="divide-y divide-border/30">
                    {photos.map((photo, idx) => {
                      const isSaving = !!saving[photo.id];
                      const isCover = photo.imageUrl === s.coverImageUrl;
                      const isSettingThisCover = !!settingCover[s.id];
                      return (
                        <div key={photo.id} className="flex items-center gap-3 px-4 py-2.5">
                          {/* Position number */}
                          <span className="w-6 text-center text-xs text-muted-foreground font-mono flex-shrink-0">
                            {idx + 1}
                          </span>

                          {/* Thumbnail — click to set as cover */}
                          <button
                            onClick={() => !isCover && void setCover(s.id, photo.imageUrl)}
                            disabled={isCover || isSettingThisCover}
                            title={isCover ? "Current cover photo" : "Set as series cover"}
                            className={cn(
                              "relative w-12 h-9 overflow-hidden flex-shrink-0 bg-muted/40 group",
                              !isCover && "cursor-pointer hover:ring-2 hover:ring-foreground/60 transition-all",
                              isCover && "ring-2 ring-amber-400/80"
                            )}
                          >
                            <img src={photo.imageUrl} alt={photo.title} className="w-full h-full object-cover" />
                            {/* Current cover star badge */}
                            {isCover && (
                              <div className="absolute top-0.5 right-0.5 bg-amber-400 rounded-full p-0.5">
                                <Star className="w-2 h-2 text-black fill-black" />
                              </div>
                            )}
                            {/* Hover overlay for non-cover photos */}
                            {!isCover && (
                              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                                {isSettingThisCover ? (
                                  <Loader2 className="w-3 h-3 text-white animate-spin opacity-0 group-hover:opacity-100 transition-opacity" />
                                ) : (
                                  <Star className="w-3 h-3 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </div>
                            )}
                          </button>

                          {/* Title */}
                          <Link
                            href={`/photos/${photo.id}`}
                            className="flex-1 min-w-0 text-sm hover:underline underline-offset-2 truncate transition-colors"
                          >
                            {photo.title}
                          </Link>

                          {/* Reorder + remove */}
                          <div className="flex items-center gap-0.5 flex-shrink-0">
                            <button
                              onClick={() => void movePhoto(s.id, photo.id, "up")}
                              disabled={idx === 0 || isSaving}
                              title="Move up"
                              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20"
                            >
                              <ArrowUp className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => void movePhoto(s.id, photo.id, "down")}
                              disabled={idx === photos.length - 1 || isSaving}
                              title="Move down"
                              className="p-1.5 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-20"
                            >
                              <ArrowDown className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => void removeFromSeries(s.id, photo.id)}
                              disabled={isSaving}
                              title="Remove from series"
                              className="p-1.5 text-muted-foreground hover:text-red-400 transition-colors disabled:opacity-40 ml-1"
                            >
                              {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <X className="w-3.5 h-3.5" />}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Cover hint */}
                {photos && photos.length > 0 && (
                  <div className="px-4 pt-2 pb-1">
                    <p className="text-xs text-muted-foreground/50 flex items-center gap-1">
                      <Star className="w-3 h-3 flex-shrink-0" />
                      Click a thumbnail to set it as the series cover image
                    </p>
                  </div>
                )}

                {/* Add photos button + picker */}
                <div className="border-t border-border/30 px-4 py-3">
                  <button
                    onClick={() => setShowAddPicker((v) => !v)}
                    className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    {showAddPicker ? "Hide photo picker" : `Add photos ${availableToAdd.length > 0 ? `(${availableToAdd.length} available)` : ""}`}
                  </button>

                  {showAddPicker && (
                    <div className="mt-3">
                      {availableToAdd.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-3 text-center">
                          All your photos are already in this series.
                        </p>
                      ) : (
                        <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-1.5">
                          {availableToAdd.map((photo) => {
                            const isSaving = !!saving[photo.id];
                            return (
                              <button
                                key={photo.id}
                                onClick={() => void assignToSeries(s.id, photo)}
                                disabled={isSaving}
                                title={photo.title}
                                className={cn(
                                  "relative aspect-square overflow-hidden border-2 transition-all group",
                                  "border-transparent hover:border-foreground",
                                  isSaving && "opacity-50 cursor-wait"
                                )}
                              >
                                <img
                                  src={photo.imageUrl}
                                  alt={photo.title}
                                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                />
                                {isSaving && (
                                  <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                                    <Loader2 className="w-3 h-3 animate-spin text-white" />
                                  </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Plus className="w-4 h-4 text-white drop-shadow" />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
