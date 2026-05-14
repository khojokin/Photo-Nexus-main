import { useEffect, useRef, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

interface AdInterstitialModalProps {
  open: boolean;
  onClose: () => void;
  onAdComplete: () => void;
}

const AD_DURATION = 5;

export function AdInterstitialModal({ open, onClose, onAdComplete }: AdInterstitialModalProps) {
  const [secondsLeft, setSecondsLeft] = useState(AD_DURATION);
  const [completed, setCompleted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!open) {
      setSecondsLeft(AD_DURATION);
      setCompleted(false);
      return;
    }

    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(intervalRef.current!);
          setCompleted(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [open]);

  function handleDownload() {
    onAdComplete();
    onClose();
  }

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) onClose(); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-none border-border gap-0">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/30">
          <span className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Sponsored</span>
          {completed ? (
            <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          ) : (
            <span className="text-xs text-muted-foreground">Skip in {secondsLeft}s</span>
          )}
        </div>

        <div className="relative w-full bg-muted" style={{ aspectRatio: "16/7" }}>
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-8 text-center">
            <div className="w-12 h-12 rounded-full bg-foreground/5 border border-border flex items-center justify-center">
              <span className="text-lg font-serif italic">A</span>
            </div>
            <p className="text-sm font-medium">Affuaa Premium</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Unlimited HD downloads, no ads, and exclusive access to premium-only photos.
            </p>
            <a
              href="/premium"
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs underline underline-offset-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              Upgrade now →
            </a>
          </div>

          {!completed && (
            <div className="absolute inset-x-0 bottom-0 h-0.5 bg-border">
              <div
                className="h-full bg-foreground/40 transition-none"
                style={{ width: `${((AD_DURATION - secondsLeft) / AD_DURATION) * 100}%`, transition: "width 1s linear" }}
              />
            </div>
          )}
        </div>

        <div className="px-4 py-4 flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground">
            {completed
              ? "Ad complete — your download is ready."
              : `Your download will be ready in ${secondsLeft} second${secondsLeft !== 1 ? "s" : ""}.`}
          </p>
          <Button
            onClick={handleDownload}
            disabled={!completed}
            className="rounded-none h-9 px-4 text-sm gap-2 shrink-0"
          >
            <Download className="w-4 h-4" />
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
