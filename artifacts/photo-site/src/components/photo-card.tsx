import { useState, useRef, useEffect } from "react";
import { Link } from "wouter";
import { Heart, Download, Share2, BookmarkPlus, Check, Plus, Loader2, Lock } from "lucide-react";
import type { Photo } from "@workspace/api-client-react";
import { useLikePhoto, useDownloadPhoto, useListCollections, getGetPhotoQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useTasteProfile } from "@/contexts/taste-profile-context";
import { useSubscription } from "@/hooks/use-subscription";
import { toast } from "sonner";

interface CollectionItem {
  id: number;
  name: string;
}

function AddToCollection({ photoId }: { photoId: number }) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState<number | null>(null);
  const [added, setAdded] = useState<Set<number>>(new Set());
  const ref = useRef<HTMLDivElement>(null);
  const { data } = useListCollections();

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  async function addToCol(col: CollectionItem) {
    setAdding(col.id);
    try {
      const res = await fetch(`/api/collections/${col.id}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ photoId }),
      });
      if (res.ok || res.status === 201 || res.status === 409) {
        setAdded((prev) => new Set([...prev, col.id]));
        toast.success(`Added to "${col.name}"`);
      } else {
        toast.error("Couldn't add to collection");
      }
    } catch {
      toast.error("Couldn't add to collection");
    } finally {
      setAdding(null);
      setTimeout(() => setOpen(false), 600);
    }
  }

  const cols: CollectionItem[] = (data as { collections?: CollectionItem[] } | undefined)?.collections ?? [];

  return (
    <div ref={ref} className="relative">
      <Button
        size="icon"
        variant="secondary"
        className="rounded-full h-9 w-9 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen((v) => !v); }}
        title="Add to collection"
      >
        <BookmarkPlus className="h-4 w-4" />
      </Button>

      {open && (
        <div className="absolute bottom-11 right-0 w-52 bg-background border border-border shadow-2xl z-50 overflow-hidden">
          <div className="px-3 py-2 border-b border-border/40">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">Save to collection</p>
          </div>
          <div className="max-h-44 overflow-y-auto">
            {cols.length === 0 ? (
              <p className="px-4 py-3 text-xs text-muted-foreground">No collections yet</p>
            ) : (
              cols.map((col) => {
                const isAdded = added.has(col.id);
                const isAdding = adding === col.id;
                return (
                  <button
                    key={col.id}
                    onClick={(e) => { e.preventDefault(); e.stopPropagation(); void addToCol(col); }}
                    disabled={isAdded || isAdding}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-xs text-left hover:bg-muted transition-colors disabled:opacity-60"
                  >
                    {isAdding ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-muted-foreground flex-shrink-0" />
                    ) : isAdded ? (
                      <Check className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <Plus className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="truncate">{col.name}</span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

interface PhotoCardProps {
  photo: Photo;
  className?: string;
  priority?: boolean;
  onOpen?: (photo: Photo) => void;
}

export function PhotoCard({ photo, className, priority = false, onOpen }: PhotoCardProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [optimisticLiked, setOptimisticLiked] = useState(false);
  const queryClient = useQueryClient();
  const likeMutation = useLikePhoto();
  const downloadMutation = useDownloadPhoto();
  const { recordInteraction } = useTasteProfile();
  const { isPremium, isLoading: subLoading } = useSubscription();

  const extPhoto = photo as typeof photo & { isPremiumOnly?: boolean };
  const isLocked = extPhoto.isPremiumOnly && !subLoading && !isPremium;

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setOptimisticLiked(true);
    likeMutation.mutate(
      { id: photo.id },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: getGetPhotoQueryKey(photo.id) });
          void queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
          if (photo.tags && photo.tags.length > 0) recordInteraction(photo.tags);
          toast.success("Photo liked!");
        },
        onError: () => {
          setOptimisticLiked(false);
          toast.error("Couldn't like photo");
        },
      },
    );
  };

  const handleDownload = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    downloadMutation.mutate(
      { id: photo.id },
      {
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: getGetPhotoQueryKey(photo.id) });
          void queryClient.invalidateQueries({ queryKey: ["/api/photos"] });
          window.open(photo.imageUrl, "_blank");
          toast.success("Download started!");
        },
        onError: () => toast.error("Couldn't download photo"),
      },
    );
  };

  const handleShare = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const url = `${window.location.origin}/photos/${photo.id}`;
    navigator.clipboard
      .writeText(url)
      .then(() => toast.success("Link copied!"))
      .catch(() => toast.error("Couldn't copy link"));
  };

  const isLiked = optimisticLiked;

  return (
    <div
      className={cn("group relative block overflow-hidden bg-muted", className)}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Link
        href={isLocked ? "/premium" : `/photos/${photo.id}`}
        data-testid={`link-photo-${photo.id}`}
        onClick={(e) => {
          if (onOpen && !isLocked) {
            e.preventDefault();
            onOpen(photo);
          }
        }}
      >
        <img
          src={photo.imageUrl}
          alt={photo.title}
          loading={priority ? "eager" : "lazy"}
          className={cn(
            "w-full h-auto object-cover transition-transform duration-700 ease-out",
            isHovered ? "scale-105" : "scale-100",
            isLocked && "blur-sm scale-105",
          )}
          style={{ aspectRatio: `${photo.width}/${photo.height}` }}
        />

        {/* Premium lock overlay */}
        {isLocked && (
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/50 z-10">
            <div className="w-10 h-10 rounded-full bg-white/10 border border-white/20 flex items-center justify-center mb-2 backdrop-blur-sm">
              <Lock className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] uppercase tracking-widest text-white/70 font-medium">Premium</span>
          </div>
        )}

        <div
          className={cn(
            "absolute inset-0 bg-gradient-to-t from-black/80 via-black/15 to-transparent opacity-0 transition-opacity duration-500 flex flex-col justify-end p-4",
            isHovered && "opacity-100",
          )}
        >
          {/* Tags strip */}
          {photo.tags && photo.tags.length > 0 && (
            <div className="flex gap-1.5 mb-3 flex-wrap">
              {photo.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="px-2 py-0.5 text-[10px] bg-white/10 text-white/70 backdrop-blur-sm">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <div className="flex items-end justify-between gap-2">
            <div className="min-w-0 flex-1">
              <h3 className="text-white font-medium text-base line-clamp-1">{photo.title}</h3>
              <p className="text-white/65 text-sm">{photo.photographerName}</p>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full h-9 w-9 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
                onClick={handleShare}
                title="Copy link"
              >
                <Share2 className="h-4 w-4" />
              </Button>

              <AddToCollection photoId={photo.id} />

              <Button
                size="icon"
                variant="secondary"
                className={cn(
                  "rounded-full h-9 w-9 border-0 backdrop-blur-sm transition-colors",
                  isLiked
                    ? "bg-rose-500/80 hover:bg-rose-500/90 text-white"
                    : "bg-white/10 hover:bg-white/20 text-white",
                )}
                onClick={handleLike}
                disabled={likeMutation.isPending || isLiked}
                data-testid={`button-like-${photo.id}`}
                title="Like"
              >
                <Heart className={cn("h-4 w-4", isLiked && "fill-white")} />
              </Button>

              <Button
                size="icon"
                variant="secondary"
                className="rounded-full h-9 w-9 bg-white/10 hover:bg-white/20 text-white border-0 backdrop-blur-sm"
                onClick={handleDownload}
                disabled={downloadMutation.isPending}
                data-testid={`button-download-${photo.id}`}
                title="Download"
              >
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-3 mt-2.5">
            <span className="text-[11px] text-white/40 flex items-center gap-1">
              <Heart className="w-3 h-3" /> {photo.likes.toLocaleString()}
            </span>
            <span className="text-[11px] text-white/40 flex items-center gap-1">
              <Download className="w-3 h-3" /> {photo.downloads.toLocaleString()}
            </span>
            {photo.views > 0 && (
              <span className="text-[11px] text-white/40 flex items-center gap-1">
                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                {photo.views.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </Link>
    </div>
  );
}
