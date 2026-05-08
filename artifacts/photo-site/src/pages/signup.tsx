import { useEffect } from "react";
import { PhotoSlideshow } from "@/components/photo-slideshow";

export function SignUp() {
  useEffect(() => {
    const base = import.meta.env.BASE_URL.replace(/\/+$/, "") || "/";
    window.location.href = `/login?returnTo=${encodeURIComponent(base)}`;
  }, []);

  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <PhotoSlideshow />
      </div>
      <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px]" />
      <div className="relative z-20 text-white text-center">
        <p className="text-lg">Redirecting to login…</p>
      </div>
    </div>
  );
}
