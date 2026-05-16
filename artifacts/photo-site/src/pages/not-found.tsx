import { useEffect, useState } from "react";
import { Link } from "wouter";
import { ArrowRight, Camera } from "lucide-react";

interface RandomPhoto {
  id: number;
  imageUrl: string;
  title: string;
  photographerName: string;
}

export default function NotFound() {
  const [photo, setPhoto] = useState<RandomPhoto | null>(null);

  useEffect(() => {
    fetch("/api/photos/random")
      .then((r) => r.ok ? r.json() as Promise<RandomPhoto> : Promise.reject())
      .then(setPhoto)
      .catch(() => {});
  }, []);

  return (
    <div className="min-h-screen bg-[#080808] flex">
      {photo && (
        <div className="hidden lg:block w-1/2 xl:w-2/3 relative overflow-hidden">
          <img
            src={photo.imageUrl}
            alt={photo.title}
            className="absolute inset-0 w-full h-full object-cover opacity-70"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#080808]/20 to-[#080808]" />
          <div className="absolute bottom-10 left-10">
            <p className="text-white/40 text-xs uppercase tracking-widest mb-1">
              {photo.photographerName}
            </p>
            <p className="text-white/60 text-sm font-serif">{photo.title}</p>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 relative">
        <div className="max-w-sm w-full">
          <div className="flex items-center gap-3 mb-12">
            <Camera className="w-5 h-5 text-white/30" />
            <span className="text-white/30 text-sm font-serif tracking-tight">Affuaa.</span>
          </div>

          <div className="mb-10">
            <p className="text-[10px] text-white/20 uppercase tracking-[0.3em] mb-4">404</p>
            <h1 className="font-serif text-white text-4xl xl:text-5xl leading-tight mb-4">
              This frame<br />
              <em className="not-italic text-white/40">is empty.</em>
            </h1>
            <p className="text-white/35 text-sm leading-relaxed">
              The photograph you were looking for doesn't exist, has been moved,
              or was never here at all.
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <Link
              href="/photos"
              className="flex items-center justify-between w-full px-5 py-3.5 bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors"
            >
              Explore the gallery
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/"
              className="flex items-center justify-center w-full px-5 py-3.5 border border-white/10 text-white/50 text-sm hover:text-white/70 hover:border-white/20 transition-colors"
            >
              Return home
            </Link>
          </div>

          <div className="mt-16 pt-8 border-t border-white/5">
            <div className="flex gap-4">
              <Link href="/collections" className="text-[11px] text-white/20 hover:text-white/40 transition-colors">
                Collections
              </Link>
              <Link href="/series" className="text-[11px] text-white/20 hover:text-white/40 transition-colors">
                Series
              </Link>
              <Link href="/photo-of-the-day" className="text-[11px] text-white/20 hover:text-white/40 transition-colors">
                Photo of the Day
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
