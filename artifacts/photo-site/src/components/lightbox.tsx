import { useState, useEffect, useCallback, useRef } from "react";
import { createPortal } from "react-dom";
import { Link } from "wouter";
import {
  X, ChevronLeft, ChevronRight, Heart, Download, ExternalLink,
} from "lucide-react";
import {
  useLikePhoto, useDownloadPhoto, getGetPhotoQueryKey,
} from "@workspace/api-client-react";
import type { Photo } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

interface LightboxProps {
  photos: Photo[];
  initialIndex: number;
  onClose: () => void;
}

export function Lightbox({ photos, initialIndex, onClose }: LightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [loaded, setLoaded] = useState(false);
  const queryClient = useQueryClient();
  const likeMutation = useLikePhoto();
  const downloadMutation = useDownloadPhoto();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const photo = photos[currentIndex];
  const canPrev = currentIndex > 0;
  const canNext = currentIndex < photos.length - 1;

  const goNext = useCallback(() => {
    if (canNext) { setCurrentIndex((i) => i + 1); setLoaded(false); }
  }, [canNext]);

  const goPrev = useCallback(() => {
    if (canPrev) { setCurrentIndex((i) => i - 1); setLoaded(false); }
  }, [canPrev]);

  // Keyboard navigation
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      else if (e.key === "ArrowRight") goNext();
      else if (e.key === "ArrowLeft") goPrev();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goNext, goPrev]);

  // Lock scroll
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  if (!photo) return null;

  function handleLike(e: React.MouseEvent) {
    e.stopPropagation();
    likeMutation.mutate(
      { id: photo.id },
      { onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetPhotoQueryKey(photo.id) }) }
    );
  }

  function handleDownload(e: React.MouseEvent) {
    e.stopPropagation();
    downloadMutation.mutate(
      { id: photo.id },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getGetPhotoQueryKey(photo.id) });
          window.open(photo.imageUrl, "_blank");
        },
      }
    );
  }

  function handleTouchStart(e: React.TouchEvent) {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
  }

  function handleTouchEnd(e: React.TouchEvent) {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    touchStartX.current = null;
    touchStartY.current = null;
    if (Math.abs(dx) < 40 || Math.abs(dy) > Math.abs(dx) * 0.8) return;
    if (dx < -40) goNext();
    else if (dx > 40) goPrev();
  }

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex flex-col bg-black/96 animate-in fade-in duration-150"
      onClick={onClose}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      role="dialog"
      aria-modal="true"
      aria-label={photo.title}
    >
      {/* Top bar */}
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-4 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="text-xs text-white/30 font-mono tabular-nums">
          {currentIndex + 1} / {photos.length}
        </span>
        <div className="flex items-center gap-2">
          <Link
            href={`/photos/${photo.id}`}
            className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/80 transition-colors px-3 py-1.5 border border-white/10 hover:border-white/25"
          >
            <ExternalLink className="w-3 h-3" />
            Full details
          </Link>
          <button
            onClick={onClose}
            className="p-2 text-white/40 hover:text-white transition-colors hover:bg-white/10"
            aria-label="Close lightbox"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Central image area */}
      <div className="flex-1 relative flex items-center justify-center min-h-0 px-12 sm:px-20">
        {/* Prev */}
        <button
          onClick={(e) => { e.stopPropagation(); goPrev(); }}
          disabled={!canPrev}
          aria-label="Previous photo"
          className={cn(
            "absolute left-1 sm:left-3 z-10 p-2 sm:p-3 transition-all",
            canPrev
              ? "text-white/50 hover:text-white hover:bg-white/10 cursor-pointer"
              : "text-white/10 cursor-not-allowed"
          )}
        >
          <ChevronLeft className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>

        {/* Image */}
        <div
          className="relative flex items-center justify-center w-full h-full"
          onClick={(e) => e.stopPropagation()}
        >
          {!loaded && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 rounded-full border-2 border-white/15 border-t-white/60 animate-spin" />
            </div>
          )}
          <img
            key={photo.id}
            src={photo.imageUrl}
            alt={photo.title}
            onLoad={() => setLoaded(true)}
            className={cn(
              "max-w-full max-h-[72vh] object-contain shadow-2xl transition-opacity duration-300",
              loaded ? "opacity-100" : "opacity-0"
            )}
          />
        </div>

        {/* Next */}
        <button
          onClick={(e) => { e.stopPropagation(); goNext(); }}
          disabled={!canNext}
          aria-label="Next photo"
          className={cn(
            "absolute right-1 sm:right-3 z-10 p-2 sm:p-3 transition-all",
            canNext
              ? "text-white/50 hover:text-white hover:bg-white/10 cursor-pointer"
              : "text-white/10 cursor-not-allowed"
          )}
        >
          <ChevronRight className="w-6 h-6 sm:w-8 sm:h-8" />
        </button>
      </div>

      {/* Dot strip — only when ≤ 24 photos */}
      {photos.length > 1 && photos.length <= 24 && (
        <div
          className="flex items-center justify-center gap-1.5 py-2 flex-shrink-0"
          onClick={(e) => e.stopPropagation()}
        >
          {photos.map((_, i) => (
            <button
              key={i}
              onClick={() => { setCurrentIndex(i); setLoaded(false); }}
              aria-label={`Go to photo ${i + 1}`}
              className={cn(
                "rounded-full transition-all duration-200",
                i === currentIndex
                  ? "w-5 h-1.5 bg-white"
                  : "w-1.5 h-1.5 bg-white/20 hover:bg-white/40"
              )}
            />
          ))}
        </div>
      )}

      {/* Bottom info bar */}
      <div
        className="flex items-center gap-6 px-4 sm:px-8 py-4 border-t border-white/8 flex-shrink-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-1 min-w-0">
          <p className="font-serif text-white text-lg leading-tight truncate">{photo.title}</p>
          <Link
            href={`/profile/${encodeURIComponent(photo.photographerName)}`}
            className="text-sm text-white/40 hover:text-white/70 transition-colors"
            onClick={(e) => e.stopPropagation()}
          >
            {photo.photographerName}
          </Link>
        </div>

        {/* Tags strip */}
        {photo.tags.length > 0 && (
          <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
            {photo.tags.slice(0, 4).map((tag) => (
              <Link
                key={tag}
                href={`/tags/${tag}`}
                onClick={(e) => { e.stopPropagation(); onClose(); }}
                className="text-xs text-white/30 hover:text-white/60 border border-white/10 hover:border-white/25 px-2 py-0.5 transition-colors"
              >
                {tag}
              </Link>
            ))}
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={handleLike}
            disabled={likeMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all disabled:opacity-40 min-w-[4rem] justify-center"
          >
            <Heart className={cn("w-4 h-4 flex-shrink-0", photo.likes > 0 && "fill-white text-white")} />
            {photo.likes}
          </button>
          <button
            onClick={handleDownload}
            disabled={downloadMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all disabled:opacity-40 min-w-[4rem] justify-center"
          >
            <Download className="w-4 h-4 flex-shrink-0" />
            {photo.downloads}
          </button>
        </div>
      </div>

      {/* Keyboard hint */}
      <p className="text-center text-white/15 text-[10px] pb-2 flex-shrink-0 tracking-wider select-none">
        ← → navigate · ESC close
      </p>
    </div>,
    document.body
  );
}
