import { useEffect, useState } from "react";
import { useParams } from "wouter";
import { Heart, Download } from "lucide-react";

interface Photo {
  id: number; title: string; imageUrl: string;
  photographerName: string; likes: number; downloads: number;
}

export function EmbedPhoto() {
  const { id } = useParams<{ id: string }>();
  const [photo, setPhoto] = useState<Photo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/photos/${id}`)
      .then((r) => r.json())
      .then((d: { photo?: Photo } | Photo) => {
        const p = "photo" in d ? d.photo : d;
        setPhoto((p as Photo) ?? null);
      })
      .catch(() => setPhoto(null))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="w-full h-screen bg-black flex items-center justify-center">
      <div className="w-8 h-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
    </div>
  );

  if (!photo) return (
    <div className="w-full h-screen bg-black flex items-center justify-center text-white/40 text-sm">
      Photo not found.
    </div>
  );

  return (
    <div className="w-full h-screen bg-black flex flex-col">
      <div className="flex-1 flex items-center justify-center overflow-hidden">
        <img src={photo.imageUrl} alt={photo.title} className="max-w-full max-h-full object-contain" />
      </div>
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 border-t border-white/10">
        <div>
          <p className="text-white text-sm font-medium">{photo.title}</p>
          <a href={`${window.location.origin}/profile/${encodeURIComponent(photo.photographerName)}`}
            target="_blank" rel="noopener noreferrer"
            className="text-white/40 text-xs hover:text-white/70 transition-colors">{photo.photographerName}</a>
        </div>
        <div className="flex items-center gap-3 text-white/40 text-xs">
          <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{photo.likes}</span>
          <span className="flex items-center gap-1"><Download className="w-3 h-3" />{photo.downloads}</span>
          <a href={`${window.location.origin}/photos/${photo.id}`} target="_blank" rel="noopener noreferrer"
            className="text-white/30 hover:text-white/60 transition-colors font-serif text-xs tracking-wide">Affuaa.</a>
        </div>
      </div>
    </div>
  );
}
