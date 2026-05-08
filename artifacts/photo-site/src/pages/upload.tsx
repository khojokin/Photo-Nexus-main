import { useState, useCallback, useRef, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Layout } from "@/components/layout";
import {
  Upload as UploadIcon, ImagePlus, X, Check, Loader2, ArrowLeft,
  Trash2, ChevronDown, ChevronUp, Camera, Aperture, Clock, Zap, Ruler,
  CloudUpload, AlertCircle, ExternalLink, CheckCircle2, RefreshCw,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/auth-context";

// ─── Constants ────────────────────────────────────────────────────────────────

const TAG_SUGGESTIONS = [
  "nature", "architecture", "portrait", "street", "minimal",
  "travel", "urban", "landscape", "abstract", "black & white",
  "wildlife", "aerial", "macro", "documentary", "fine art",
];

const LICENSE_OPTIONS = [
  { value: "cc0", label: "CC0 — Public Domain", desc: "No rights reserved. Anyone can use freely." },
  { value: "cc-by", label: "CC BY 4.0", desc: "Credit required. Commercial use allowed." },
  { value: "cc-by-sa", label: "CC BY-SA 4.0", desc: "Credit + same license required." },
  { value: "editorial", label: "Editorial Only", desc: "News/education use only, not commercial." },
  { value: "all-rights-reserved", label: "All Rights Reserved", desc: "No reuse without explicit permission." },
];

// ─── Types ────────────────────────────────────────────────────────────────────

type UploadStatus = "queued" | "uploading" | "ready" | "publishing" | "done" | "error";

interface QueueItem {
  id: string;
  file: File;
  previewUrl: string;
  status: UploadStatus;
  progress: number;
  imageUrl: string;
  errorMsg: string;
  title: string;
  description: string;
  photographerName: string;
  tags: string[];
  tagInput: string;
  camera: string;
  lens: string;
  aperture: string;
  shutterSpeed: string;
  iso: string;
  focalLength: string;
  license: string;
  publishStatus: "published" | "draft";
  isFeatured: boolean;
  contentWarning: boolean;
  exifOpen: boolean;
  photoId?: number;
}

let _idCounter = 1;
function newId() { return String(_idCounter++); }

function loadDefaultName(): string {
  try {
    const raw = localStorage.getItem("affuaa_settings");
    if (raw) return (JSON.parse(raw) as { displayName?: string })?.displayName ?? "";
  } catch { /* ignore */ }
  return "";
}

function formatBytes(b: number) {
  if (b < 1024) return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
  return `${(b / 1024 / 1024).toFixed(1)} MB`;
}

function makeItem(file: File, defaultName: string): QueueItem {
  return {
    id: newId(),
    file,
    previewUrl: URL.createObjectURL(file),
    status: "queued",
    progress: 0,
    imageUrl: "",
    errorMsg: "",
    title: file.name.replace(/\.[^.]+$/, "").replace(/[-_]/g, " "),
    description: "",
    photographerName: defaultName,
    tags: [],
    tagInput: "",
    camera: "", lens: "", aperture: "", shutterSpeed: "", iso: "", focalLength: "",
    license: "cc0",
    publishStatus: "published",
    isFeatured: false,
    contentWarning: false,
    exifOpen: false,
  };
}

// ─── XHR upload helper ────────────────────────────────────────────────────────

function xhrUpload(
  file: File,
  onProgress: (pct: number) => void
): Promise<string> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.upload.addEventListener("progress", (e) => {
      if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
    });
    xhr.addEventListener("load", () => {
      if (xhr.status === 200) {
        try {
          const data = JSON.parse(xhr.responseText) as { url: string };
          resolve(data.url);
        } catch {
          reject(new Error("Invalid server response"));
        }
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    });
    xhr.addEventListener("error", () => reject(new Error("Network error")));
    xhr.addEventListener("abort", () => reject(new Error("Upload aborted")));
    xhr.open("POST", "/api/upload");
    const fd = new FormData();
    fd.append("file", file);
    xhr.send(fd);
  });
}

// ─── Main component ───────────────────────────────────────────────────────────

export function Upload() {
  const [, navigate] = useLocation();
  const { authFetch } = useAuth();
  const defaultName = loadDefaultName();
  const [items, setItems] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadingRef = useRef<Set<string>>(new Set());

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      items.forEach((it) => URL.revokeObjectURL(it.previewUrl));
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function updateItem(id: string, patch: Partial<QueueItem>) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  }

  // ── Add files ──────────────────────────────────────────────────────────────
  function addFiles(files: FileList | File[]) {
    const imageFiles = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!imageFiles.length) return;
    const newItems = imageFiles.map((f) => makeItem(f, defaultName));
    setItems((prev) => [...prev, ...newItems]);
    // Auto-start upload for each
    newItems.forEach((item) => void startUpload(item));
  }

  // ── XHR upload ─────────────────────────────────────────────────────────────
  async function startUpload(item: QueueItem) {
    if (uploadingRef.current.has(item.id)) return;
    uploadingRef.current.add(item.id);
    updateItem(item.id, { status: "uploading", progress: 0, errorMsg: "" });
    try {
      const url = await xhrUpload(item.file, (pct) => {
        updateItem(item.id, { progress: pct });
      });
      updateItem(item.id, { status: "ready", imageUrl: url, progress: 100 });
    } catch (err) {
      updateItem(item.id, { status: "error", errorMsg: (err as Error).message });
    } finally {
      uploadingRef.current.delete(item.id);
    }
  }

  function retryUpload(item: QueueItem) {
    void startUpload(item);
  }

  // ── Publish one ────────────────────────────────────────────────────────────
  async function publishItem(id: string) {
    const item = items.find((it) => it.id === id);
    if (!item || item.status !== "ready") return;
    if (!item.title.trim() || !item.photographerName.trim() || item.tags.length === 0) return;

    updateItem(id, { status: "publishing" });

    // Detect image dimensions
    let w = 1920, h = 1280;
    try {
      await new Promise<void>((res) => {
        const img = new Image();
        img.onload = () => { w = img.naturalWidth; h = img.naturalHeight; res(); };
        img.onerror = () => res();
        img.src = item.imageUrl;
      });
    } catch { /* use defaults */ }

    try {
      const r = await authFetch("/api/photos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: item.title.trim(),
          description: item.description.trim() || null,
          imageUrl: item.imageUrl,
          width: w,
          height: h,
          photographerName: item.photographerName.trim(),
          tags: item.tags,
          isFeatured: item.isFeatured,
          camera: item.camera.trim() || null,
          lens: item.lens.trim() || null,
          aperture: item.aperture.trim() || null,
          shutterSpeed: item.shutterSpeed.trim() || null,
          iso: item.iso ? parseInt(item.iso) : null,
          focalLength: item.focalLength.trim() || null,
          license: item.license,
          status: item.publishStatus,
        }),
      });
      if (r.ok || r.status === 201) {
        const data = await r.json() as { id: number };
        updateItem(id, { status: "done", photoId: data.id });
        if (data.id) navigate(`/photos/${data.id}`);
      } else {
        const data = await r.json().catch(() => ({})) as { error?: string };
        updateItem(id, { status: "ready", errorMsg: data.error ?? "Publish failed" });
      }
    } catch {
      updateItem(id, { status: "ready", errorMsg: "Network error" });
    }
  }

  // ── Publish all ready ──────────────────────────────────────────────────────
  async function publishAll() {
    const readyItems = items.filter(
      (it) => it.status === "ready" && it.title.trim() && it.photographerName.trim() && it.tags.length > 0
    );
    for (const item of readyItems) {
      await publishItem(item.id);
    }
  }

  // ── Drag handlers ──────────────────────────────────────────────────────────
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragging(false);
  }, []);
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Derived state ──────────────────────────────────────────────────────────
  const uploading = items.filter((it) => it.status === "uploading").length;
  const ready = items.filter((it) => it.status === "ready").length;
  const done = items.filter((it) => it.status === "done").length;
  const errors = items.filter((it) => it.status === "error").length;
  const canPublishAll = items.some(
    (it) => it.status === "ready" && it.title.trim() && it.photographerName.trim() && it.tags.length > 0
  );

  return (
    <Layout>
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link href="/profile" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex-1">
            <h1 className="font-serif text-3xl">Share Your Work</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Drag photos in, fill in the details, publish to the gallery.
            </p>
          </div>
          {canPublishAll && items.length > 1 && (
            <button
              onClick={() => void publishAll()}
              className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 text-sm font-medium hover:opacity-90 transition-opacity"
            >
              <UploadIcon className="w-4 h-4" />
              Publish All ({ready})
            </button>
          )}
        </div>

        {/* Status bar */}
        {items.length > 0 && (
          <div className="flex items-center gap-5 mb-6 text-xs text-muted-foreground">
            {uploading > 0 && (
              <span className="flex items-center gap-1.5">
                <Loader2 className="w-3 h-3 animate-spin" />
                {uploading} uploading
              </span>
            )}
            {ready > 0 && (
              <span className="flex items-center gap-1.5 text-blue-400">
                <CloudUpload className="w-3 h-3" />
                {ready} ready to publish
              </span>
            )}
            {done > 0 && (
              <span className="flex items-center gap-1.5 text-green-500">
                <CheckCircle2 className="w-3 h-3" />
                {done} published
              </span>
            )}
            {errors > 0 && (
              <span className="flex items-center gap-1.5 text-destructive">
                <AlertCircle className="w-3 h-3" />
                {errors} failed
              </span>
            )}
          </div>
        )}

        {/* Drop zone */}
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed transition-all duration-200 cursor-pointer mb-8 select-none",
            isDragging
              ? "border-foreground bg-muted/40 scale-[1.005]"
              : items.length === 0
              ? "border-border hover:border-foreground/50 hover:bg-muted/20 py-20"
              : "border-border/50 hover:border-border py-8"
          )}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => { if (e.target.files) addFiles(e.target.files); e.target.value = ""; }}
          />
          <div className="flex flex-col items-center justify-center gap-3 pointer-events-none">
            {isDragging ? (
              <>
                <UploadIcon className="w-10 h-10 text-foreground animate-bounce" />
                <p className="text-sm font-medium text-foreground">Drop your photos here</p>
              </>
            ) : (
              <>
                <ImagePlus className={cn("text-muted-foreground/50", items.length === 0 ? "w-12 h-12" : "w-7 h-7")} />
                <div className="text-center">
                  <p className={cn("font-medium", items.length === 0 ? "text-base" : "text-sm")}>
                    {items.length === 0 ? "Drag photos here, or click to browse" : "Add more photos"}
                  </p>
                  {items.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-1">
                      JPEG, PNG, WebP, HEIC · up to 25 MB each · multiple files supported
                    </p>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Queue */}
        {items.length > 0 && (
          <div className="space-y-4">
            {items.map((item) => (
              <QueueCard
                key={item.id}
                item={item}
                onUpdate={(patch) => updateItem(item.id, patch)}
                onRemove={() => {
                  URL.revokeObjectURL(item.previewUrl);
                  setItems((prev) => prev.filter((it) => it.id !== item.id));
                }}
                onPublish={() => void publishItem(item.id)}
                onRetry={() => retryUpload(item)}
              />
            ))}
          </div>
        )}
      </div>
    </Layout>
  );
}

// ─── Queue card ───────────────────────────────────────────────────────────────

interface QueueCardProps {
  item: QueueItem;
  onUpdate: (patch: Partial<QueueItem>) => void;
  onRemove: () => void;
  onPublish: () => void;
  onRetry: () => void;
}

function QueueCard({ item, onUpdate, onRemove, onPublish, onRetry }: QueueCardProps) {
  const canPublish =
    item.status === "ready" &&
    item.title.trim() !== "" &&
    item.photographerName.trim() !== "" &&
    item.tags.length > 0;

  const hasExif = item.camera || item.lens || item.aperture || item.shutterSpeed || item.iso || item.focalLength;

  return (
    <div className={cn(
      "border bg-card transition-colors",
      item.status === "done" ? "border-green-500/30 bg-green-500/5"
        : item.status === "error" ? "border-destructive/30"
        : "border-border"
    )}>
      {/* Card header: thumbnail + meta + status */}
      <div className="flex items-start gap-4 p-4">
        {/* Thumbnail */}
        <div className="w-20 h-20 flex-shrink-0 overflow-hidden bg-muted relative">
          <img
            src={item.previewUrl}
            alt={item.file.name}
            className="w-full h-full object-cover"
          />
          {item.status === "done" && (
            <div className="absolute inset-0 bg-green-500/20 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-green-500" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{item.file.name}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{formatBytes(item.file.size)}</p>

          {/* Progress bar */}
          {item.status === "uploading" && (
            <div className="mt-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Uploading…
                </span>
                <span className="text-xs font-mono text-muted-foreground">{item.progress}%</span>
              </div>
              <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-foreground rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${item.progress}%` }}
                />
              </div>
            </div>
          )}

          {item.status === "queued" && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Waiting…
            </p>
          )}

          {item.status === "ready" && (
            <p className="text-xs text-blue-400 mt-2 flex items-center gap-1">
              <CloudUpload className="w-3 h-3" />
              Uploaded · fill in details below
            </p>
          )}

          {item.status === "publishing" && (
            <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
              <Loader2 className="w-3 h-3 animate-spin" /> Publishing…
            </p>
          )}

          {item.status === "done" && item.photoId && (
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xs text-green-500 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Published
              </span>
              <Link
                href={`/photos/${item.photoId}`}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                View photo <ExternalLink className="w-2.5 h-2.5" />
              </Link>
            </div>
          )}

          {item.status === "error" && (
            <div className="mt-2 flex items-center gap-3">
              <span className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="w-3 h-3" /> {item.errorMsg || "Upload failed"}
              </span>
              <button
                onClick={onRetry}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <RefreshCw className="w-2.5 h-2.5" /> Retry
              </button>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {item.status === "done" && item.photoId && (
            <Link
              href={`/photos/${item.photoId}`}
              className="flex items-center gap-1.5 text-xs border border-green-500/30 text-green-400 px-3 py-1.5 hover:bg-green-500/10 transition-colors"
            >
              <ExternalLink className="w-3 h-3" />
              View
            </Link>
          )}
          {item.status !== "done" && item.status !== "uploading" && item.status !== "publishing" && item.status !== "queued" && (
            <button
              onClick={onRemove}
              className="p-1.5 text-muted-foreground hover:text-destructive transition-colors"
              aria-label="Remove"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Metadata form — only shown when ready or error-after-ready */}
      {(item.status === "ready" || item.status === "publishing") && (
        <div className="border-t border-border px-4 pb-5 pt-4 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Title */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                Title <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={item.title}
                onChange={(e) => onUpdate({ title: e.target.value })}
                placeholder="Mountain at Dusk"
                maxLength={120}
                disabled={item.status === "publishing"}
                className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors disabled:opacity-50"
              />
            </div>

            {/* Photographer */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                Photographer <span className="text-destructive">*</span>
              </label>
              <input
                type="text"
                value={item.photographerName}
                onChange={(e) => onUpdate({ photographerName: e.target.value })}
                placeholder="Your name"
                disabled={item.status === "publishing"}
                className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors disabled:opacity-50"
              />
            </div>

            {/* License */}
            <div className="space-y-1.5">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">License</label>
              <select
                value={item.license}
                onChange={(e) => onUpdate({ license: e.target.value })}
                disabled={item.status === "publishing"}
                className="w-full bg-background border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors appearance-none cursor-pointer disabled:opacity-50"
              >
                {LICENSE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="space-y-2 sm:col-span-2">
              <div className="flex items-baseline justify-between">
                <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                  Tags <span className="text-destructive">*</span>
                </label>
                <span className="text-xs text-muted-foreground/60">{item.tags.length}/12</span>
              </div>
              <div className="border border-border px-3 py-2 min-h-[40px] flex flex-wrap gap-2 items-center focus-within:border-foreground transition-colors">
                {item.tags.map((tag) => (
                  <span key={tag} className="inline-flex items-center gap-1 bg-foreground text-background text-xs px-2 py-0.5">
                    {tag}
                    <button
                      type="button"
                      onClick={() => onUpdate({ tags: item.tags.filter((t) => t !== tag) })}
                      disabled={item.status === "publishing"}
                      className="opacity-60 hover:opacity-100 transition-opacity"
                    >
                      <X className="w-2.5 h-2.5" />
                    </button>
                  </span>
                ))}
                <input
                  type="text"
                  value={item.tagInput}
                  onChange={(e) => onUpdate({ tagInput: e.target.value })}
                  onKeyDown={(e) => {
                    if ((e.key === "Enter" || e.key === ",") && item.tagInput.trim()) {
                      e.preventDefault();
                      const clean = item.tagInput.trim().toLowerCase().replace(/\s+/g, "-");
                      if (clean && !item.tags.includes(clean) && item.tags.length < 12) {
                        onUpdate({ tags: [...item.tags, clean], tagInput: "" });
                      } else {
                        onUpdate({ tagInput: "" });
                      }
                    }
                    if (e.key === "Backspace" && !item.tagInput && item.tags.length > 0) {
                      onUpdate({ tags: item.tags.slice(0, -1) });
                    }
                  }}
                  disabled={item.tags.length >= 12 || item.status === "publishing"}
                  placeholder={item.tags.length === 0 ? "Type and press Enter…" : "Add more…"}
                  className="flex-1 min-w-[100px] bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/40 disabled:opacity-40"
                />
              </div>
              <div className="flex flex-wrap gap-1.5">
                {TAG_SUGGESTIONS.filter((s) => !item.tags.includes(s)).slice(0, 8).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      if (!item.tags.includes(s) && item.tags.length < 12) {
                        onUpdate({ tags: [...item.tags, s] });
                      }
                    }}
                    disabled={item.tags.length >= 12 || item.status === "publishing"}
                    className="text-xs text-muted-foreground border border-border/50 px-2 py-0.5 hover:border-foreground hover:text-foreground transition-colors disabled:opacity-30"
                  >
                    + {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-1.5 sm:col-span-2">
              <label className="text-xs uppercase tracking-widest text-muted-foreground font-medium">
                Description <span className="text-muted-foreground/40 normal-case font-normal ml-1">optional</span>
              </label>
              <textarea
                rows={2}
                value={item.description}
                onChange={(e) => onUpdate({ description: e.target.value })}
                placeholder="A brief note about this photograph…"
                maxLength={600}
                disabled={item.status === "publishing"}
                className="w-full bg-transparent border border-border px-3 py-2 text-sm focus:outline-none focus:border-foreground transition-colors resize-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* EXIF collapsible */}
          <div className="border border-border/50">
            <button
              type="button"
              onClick={() => onUpdate({ exifOpen: !item.exifOpen })}
              className="w-full flex items-center justify-between px-4 py-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <span className="flex items-center gap-2">
                <Camera className="w-3.5 h-3.5" />
                Camera & EXIF
                {hasExif && <span className="text-xs bg-foreground/10 text-foreground/80 px-1.5 py-0.5">filled</span>}
              </span>
              {item.exifOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
            {item.exifOpen && (
              <div className="border-t border-border/40 px-4 py-3 grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { icon: Camera, label: "Camera", key: "camera", placeholder: "Sony A7 IV" },
                  { icon: Ruler, label: "Lens", key: "lens", placeholder: "50mm f/1.4" },
                  { icon: Aperture, label: "Aperture", key: "aperture", placeholder: "f/2.8" },
                  { icon: Clock, label: "Shutter", key: "shutterSpeed", placeholder: "1/500s" },
                  { icon: Zap, label: "ISO", key: "iso", placeholder: "400" },
                  { icon: Ruler, label: "Focal", key: "focalLength", placeholder: "85mm" },
                ].map(({ icon: Icon, label, key, placeholder }) => (
                  <div key={key} className="space-y-1">
                    <label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Icon className="w-3 h-3" />{label}
                    </label>
                    <input
                      type="text"
                      value={typeof item[key as keyof QueueItem] === "string" ? (item[key as keyof QueueItem] as string) : ""}
                      onChange={(e) => onUpdate({ [key]: e.target.value } as Partial<QueueItem>)}
                      placeholder={placeholder}
                      disabled={item.status === "publishing"}
                      className="w-full bg-transparent border border-border/50 px-2 py-1.5 text-xs focus:outline-none focus:border-foreground transition-colors disabled:opacity-50"
                    />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Toggles + publish */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pt-1">
            <div className="flex items-center gap-5 text-xs text-muted-foreground">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.publishStatus === "draft"}
                  onChange={(e) => onUpdate({ publishStatus: e.target.checked ? "draft" : "published" })}
                  disabled={item.status === "publishing"}
                  className="w-3.5 h-3.5 accent-foreground"
                />
                Save as draft
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.isFeatured}
                  onChange={(e) => onUpdate({ isFeatured: e.target.checked })}
                  disabled={item.status === "publishing"}
                  className="w-3.5 h-3.5 accent-foreground"
                />
                Nominate for featured
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={item.contentWarning}
                  onChange={(e) => onUpdate({ contentWarning: e.target.checked })}
                  disabled={item.status === "publishing"}
                  className="w-3.5 h-3.5 accent-foreground"
                />
                Content warning
              </label>
            </div>

            <div className="flex items-center gap-3">
              {item.errorMsg && item.status === "ready" && (
                <p className="text-xs text-destructive">{item.errorMsg}</p>
              )}
              <button
                onClick={onPublish}
                disabled={!canPublish || item.status === "publishing"}
                className={cn(
                  "flex items-center gap-2 px-5 py-2 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed",
                  canPublish
                    ? "bg-foreground text-background hover:opacity-90"
                    : "bg-muted text-muted-foreground border border-border"
                )}
              >
                {item.status === "publishing" ? (
                  <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Publishing…</>
                ) : (
                  <><UploadIcon className="w-3.5 h-3.5" /> {item.publishStatus === "draft" ? "Save Draft" : "Publish"}</>
                )}
              </button>
            </div>
          </div>

          {!canPublish && item.status === "ready" && (
            <p className="text-xs text-muted-foreground/60">
              {[
                !item.title.trim() && "title",
                !item.photographerName.trim() && "photographer name",
                item.tags.length === 0 && "at least one tag",
              ].filter(Boolean).join(", ")} required to publish.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
