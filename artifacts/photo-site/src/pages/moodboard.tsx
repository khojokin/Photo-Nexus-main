import { useState, useCallback } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useListPhotos } from "@workspace/api-client-react";
import type { Photo } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import { Search, X, Plus, Trash2, Download, ExternalLink, Shuffle } from "lucide-react";
import { cn } from "@/lib/utils";

export function Moodboard() {
  const [board, setBoard] = useState<Photo[]>([]);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const { data, isLoading } = useListPhotos({ search: query || undefined, limit: 24 });
  const photos = data?.photos ?? [];

  const debounceRef = { current: null as ReturnType<typeof setTimeout> | null };
  function handleSearch(val: string) {
    setSearch(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => setQuery(val), 300);
  }

  const addToBoard = useCallback((photo: Photo) => {
    setBoard((prev) => prev.some((p) => p.id === photo.id) ? prev : [...prev, photo]);
  }, []);

  const removeFromBoard = useCallback((id: number) => {
    setBoard((prev) => prev.filter((p) => p.id !== id));
  }, []);

  function shuffle() {
    if (photos.length === 0) return;
    const picked: Photo[] = [];
    const pool = [...photos];
    for (let i = 0; i < Math.min(6, pool.length); i++) {
      const idx = Math.floor(Math.random() * pool.length);
      picked.push(pool.splice(idx, 1)[0]);
    }
    setBoard(picked);
  }

  function exportBoard() {
    const urls = board.map((p) => `${window.location.origin}${p.imageUrl}`).join("\n");
    const blob = new Blob([urls], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "moodboard.txt";
    a.click();
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="flex items-start justify-between mb-8">
          <div>
            <h1 className="text-4xl font-serif mb-1">Mood Board</h1>
            <p className="text-muted-foreground text-sm">Collect photos into a personal inspiration board</p>
          </div>
          <div className="flex gap-2">
            <button onClick={shuffle} disabled={photos.length === 0}
              className="flex items-center gap-2 px-3 py-2 border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors disabled:opacity-40">
              <Shuffle className="w-3.5 h-3.5" /> Surprise
            </button>
            {board.length > 0 && (
              <>
                <button onClick={exportBoard}
                  className="flex items-center gap-2 px-3 py-2 border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Download className="w-3.5 h-3.5" /> Export URLs
                </button>
                <button onClick={() => setBoard([])}
                  className="flex items-center gap-2 px-3 py-2 border border-destructive/30 text-sm text-destructive/70 hover:text-destructive hover:border-destructive transition-colors">
                  <Trash2 className="w-3.5 h-3.5" /> Clear
                </button>
              </>
            )}
          </div>
        </div>

        {board.length > 0 && (
          <div className="mb-10">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">{board.length} Photos on Board</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {board.map((photo) => (
                <div key={photo.id} className="group relative aspect-square overflow-hidden bg-muted">
                  <img src={photo.imageUrl} alt={photo.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                    <Link href={`/photos/${photo.id}`}
                      className="p-1.5 bg-white/20 hover:bg-white/40 transition-colors text-white">
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Link>
                    <button onClick={() => removeFromBoard(photo.id)}
                      className="p-1.5 bg-white/20 hover:bg-destructive/80 transition-colors text-white">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="border-t border-border pt-8">
          <div className="relative mb-6 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search photos to add…" value={search}
              onChange={(e) => handleSearch(e.target.value)}
              className="pl-10 pr-8 bg-transparent border-muted rounded-none" />
            {search && (
              <button onClick={() => { setSearch(""); setQuery(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {isLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {Array(12).fill(0).map((_, i) => (
                <div key={i} className="aspect-square bg-muted animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {photos.map((photo) => {
                const onBoard = board.some((p) => p.id === photo.id);
                return (
                  <div key={photo.id} className="group relative aspect-square overflow-hidden bg-muted cursor-pointer"
                    onClick={() => addToBoard(photo)}>
                    <img src={photo.imageUrl} alt={photo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    <div className={cn(
                      "absolute inset-0 transition-opacity flex items-center justify-center",
                      onBoard ? "bg-foreground/30 opacity-100" : "bg-black/50 opacity-0 group-hover:opacity-100"
                    )}>
                      {onBoard
                        ? <div className="w-5 h-5 rounded-full bg-white flex items-center justify-center"><span className="text-black text-xs font-bold">✓</span></div>
                        : <Plus className="w-5 h-5 text-white" />}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
