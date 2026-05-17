import { useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { useListPhotos } from "@workspace/api-client-react";
import type { Photo } from "@workspace/api-client-react";
import { Input } from "@/components/ui/input";
import {
  Search, X, Plus, Trash2, Download, ExternalLink, Shuffle,
  Save, FolderOpen, Edit2, Check, BookOpen, Share2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SavedBoard {
  id: string;
  name: string;
  photos: Photo[];
  createdAt: number;
}

const STORAGE_KEY = "affuaa_moodboards";

function loadBoards(): SavedBoard[] {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as SavedBoard[]; }
  catch { return []; }
}

function saveBoards(boards: SavedBoard[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(boards));
}

export function Moodboard() {
  const [board, setBoard] = useState<Photo[]>([]);
  const [boardName, setBoardName] = useState("Untitled Board");
  const [editingName, setEditingName] = useState(false);
  const [tempName, setTempName] = useState("Untitled Board");
  const [savedBoards, setSavedBoards] = useState<SavedBoard[]>(loadBoards);
  const [showBoards, setShowBoards] = useState(false);
  const [savedMsg, setSavedMsg] = useState("");
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");
  const [shareMsg, setShareMsg] = useState("");

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
    a.download = `${boardName.toLowerCase().replace(/\s+/g, "-")}.txt`;
    a.click();
  }

  function saveBoard() {
    if (board.length === 0) return;
    const existing = savedBoards.find(b => b.name === boardName);
    let updated: SavedBoard[];
    if (existing) {
      updated = savedBoards.map(b => b.name === boardName ? { ...b, photos: board } : b);
    } else {
      const newBoard: SavedBoard = {
        id: Date.now().toString(),
        name: boardName,
        photos: board,
        createdAt: Date.now(),
      };
      updated = [newBoard, ...savedBoards];
    }
    setSavedBoards(updated);
    saveBoards(updated);
    setSavedMsg("Saved!");
    setTimeout(() => setSavedMsg(""), 2000);
  }

  function loadBoard(b: SavedBoard) {
    setBoard(b.photos);
    setBoardName(b.name);
    setShowBoards(false);
  }

  function deleteBoard(id: string) {
    const updated = savedBoards.filter(b => b.id !== id);
    setSavedBoards(updated);
    saveBoards(updated);
  }

  function newBoard() {
    setBoard([]);
    setBoardName("Untitled Board");
    setShowBoards(false);
  }

  function commitName() {
    setBoardName(tempName || "Untitled Board");
    setEditingName(false);
  }

  async function shareBoard() {
    const url = `${window.location.origin}/moodboard`;
    await navigator.clipboard.writeText(url).catch(() => {});
    setShareMsg("Link copied!");
    setTimeout(() => setShareMsg(""), 2000);
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div className="flex-1 min-w-0">
            {editingName ? (
              <div className="flex items-center gap-2">
                <input
                  value={tempName}
                  onChange={e => setTempName(e.target.value)}
                  onKeyDown={e => { if (e.key === "Enter") commitName(); if (e.key === "Escape") setEditingName(false); }}
                  className="text-4xl font-serif bg-transparent border-b border-foreground focus:outline-none pb-1 min-w-[200px]"
                  autoFocus
                />
                <button onClick={commitName} className="text-muted-foreground hover:text-foreground transition-colors">
                  <Check className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-4xl font-serif">{boardName}</h1>
                <button onClick={() => { setTempName(boardName); setEditingName(true); }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-foreground transition-all">
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}
            <p className="text-muted-foreground text-sm mt-1">Collect photos into a named inspiration board</p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {/* Board manager */}
            <div className="relative">
              <button onClick={() => setShowBoards(v => !v)}
                className="flex items-center gap-2 px-3 py-2 border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors">
                <FolderOpen className="w-3.5 h-3.5" />
                My Boards
                {savedBoards.length > 0 && (
                  <span className="text-[10px] bg-foreground text-background px-1.5 py-0.5 rounded-full">{savedBoards.length}</span>
                )}
              </button>

              {showBoards && (
                <div className="absolute right-0 top-full mt-1 w-64 bg-background border border-border shadow-lg z-20">
                  <div className="p-2 border-b border-border">
                    <button onClick={newBoard}
                      className="w-full text-left px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted/30 transition-colors flex items-center gap-2">
                      <Plus className="w-3.5 h-3.5" /> New Board
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-border">
                    {savedBoards.length === 0 ? (
                      <p className="p-4 text-xs text-muted-foreground text-center">No saved boards yet</p>
                    ) : (
                      savedBoards.map(b => (
                        <div key={b.id} className="flex items-center gap-2 px-3 py-2.5 hover:bg-muted/30 transition-colors group">
                          <button onClick={() => loadBoard(b)} className="flex-1 text-left">
                            <p className="text-xs font-medium truncate">{b.name}</p>
                            <p className="text-[10px] text-muted-foreground">{b.photos.length} photos</p>
                          </button>
                          <button onClick={() => deleteBoard(b.id)}
                            className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-all">
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <button onClick={shuffle} disabled={photos.length === 0}
              className="flex items-center gap-2 px-3 py-2 border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors disabled:opacity-40">
              <Shuffle className="w-3.5 h-3.5" /> Surprise
            </button>

            {board.length > 0 && (
              <>
                <button onClick={saveBoard}
                  className="flex items-center gap-2 px-3 py-2 border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Save className="w-3.5 h-3.5" />
                  {savedMsg || "Save Board"}
                </button>
                <button onClick={() => void shareBoard()}
                  className="flex items-center gap-2 px-3 py-2 border border-border text-sm text-muted-foreground hover:text-foreground transition-colors">
                  <Share2 className="w-3.5 h-3.5" />
                  {shareMsg || "Share"}
                </button>
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

        {/* Saved boards quick access */}
        {savedBoards.length > 0 && (
          <div className="mb-6">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" /> Saved Boards
            </p>
            <div className="flex gap-2 flex-wrap">
              {savedBoards.map(b => (
                <button key={b.id} onClick={() => loadBoard(b)}
                  className={cn("flex items-center gap-1.5 px-3 py-1.5 border text-xs transition-colors",
                    boardName === b.name && board.length > 0
                      ? "border-foreground text-foreground bg-foreground/5"
                      : "border-border text-muted-foreground hover:border-foreground/50 hover:text-foreground"
                  )}>
                  <BookOpen className="w-3 h-3" />
                  {b.name}
                  <span className="text-muted-foreground">({b.photos.length})</span>
                </button>
              ))}
            </div>
          </div>
        )}

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
