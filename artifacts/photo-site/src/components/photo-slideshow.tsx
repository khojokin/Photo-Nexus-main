import { useState, useEffect } from "react";

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=80",
  "https://images.unsplash.com/photo-1501854140801-50d01698950b?w=1200&q=80",
  "https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=1200&q=80",
  "https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?w=1200&q=80",
  "https://images.unsplash.com/photo-1490750967868-88df5691cc09?w=1200&q=80",
];

interface Photo {
  imageUrl: string;
  title: string;
  photographerName: string;
}

export function PhotoSlideshow() {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/stats/trending", { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setPhotos(data.slice(0, 6));
        } else {
          setPhotos(FALLBACK_IMAGES.map((url, i) => ({
            imageUrl: url,
            title: `Photo ${i + 1}`,
            photographerName: "Luminary",
          })));
        }
        setLoaded(true);
      })
      .catch(() => {
        setPhotos(FALLBACK_IMAGES.map((url, i) => ({
          imageUrl: url,
          title: `Photo ${i + 1}`,
          photographerName: "Luminary",
        })));
        setLoaded(true);
      });
  }, []);

  useEffect(() => {
    if (!loaded || photos.length < 2) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % photos.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [loaded, photos.length]);

  const activePhoto = photos[current];

  return (
    <div className="relative w-full h-full overflow-hidden bg-black">
      {photos.map((photo, index) => (
        <div
          key={index}
          className="absolute inset-0 transition-opacity duration-1000"
          style={{ opacity: index === current ? 1 : 0 }}
        >
          <img
            src={photo.imageUrl}
            alt={photo.title}
            className="w-full h-full object-cover"
          />
        </div>
      ))}

      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-black/30" />

      <div className="absolute top-8 left-8">
        <span className="font-serif text-white text-2xl font-bold tracking-tight">Luminary.</span>
      </div>

      {activePhoto && (
        <div className="absolute bottom-10 left-8 right-8">
          <p className="text-white font-serif text-xl mb-1">{activePhoto.title}</p>
          <p className="text-white/60 text-sm">{activePhoto.photographerName}</p>
        </div>
      )}

      <div className="absolute bottom-6 right-8 flex gap-1.5">
        {photos.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className="transition-all duration-300"
            style={{
              width: index === current ? 20 : 6,
              height: 6,
              borderRadius: 3,
              background: index === current ? "white" : "rgba(255,255,255,0.4)",
            }}
          />
        ))}
      </div>
    </div>
  );
}
