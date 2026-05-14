import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useAuth } from "@/contexts/auth-context";

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=90",
  "https://images.unsplash.com/photo-1447684808650-354ae64db5b8?w=1200&q=90",
  "https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=1200&q=90",
];

const PERKS = [
  "Upload & showcase your photography",
  "Build curated, shareable collections",
  "Monetise with prints, licenses & tips",
  "Connect with photographers worldwide",
];

function SignUpPage() {
  const { login } = useAuth();
  const [imgIndex, setImgIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);

  useEffect(() => {
    const t = setInterval(() => {
      setImgLoaded(false);
      setTimeout(() => setImgIndex(i => (i + 1) % HERO_IMAGES.length), 600);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="flex min-h-screen bg-[#070707]">
      <div className="relative hidden lg:flex lg:w-[55%] xl:w-[60%] overflow-hidden">
        <img
          key={HERO_IMAGES[imgIndex]}
          src={HERO_IMAGES[imgIndex]}
          alt=""
          onLoad={() => setImgLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/65 via-black/25 to-black/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />
        <div
          className="absolute inset-0 opacity-[0.18] pointer-events-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")", backgroundSize: "128px 128px" }}
        />
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          <Link href="/">
            <span className="font-['Playfair_Display'] text-white text-2xl font-semibold tracking-tight cursor-pointer hover:opacity-75 transition-opacity">
              Affuaa.
            </span>
          </Link>
          <div className="space-y-8 max-w-sm">
            <div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-6 h-px bg-white/40" />
                <span className="text-[10px] text-white/40 uppercase tracking-[0.2em]">Free to join</span>
              </div>
              <h2 className="font-['Playfair_Display'] text-white text-4xl xl:text-5xl font-semibold leading-[1.15] mb-5">
                Join a world<br />
                <em className="not-italic text-white/60">of curated light.</em>
              </h2>
            </div>
            <ul className="space-y-3">
              {PERKS.map((perk, i) => (
                <li key={perk} className="flex items-start gap-3 text-white/50 text-[13px] leading-snug">
                  <span className="text-white/20 text-[10px] font-medium mt-0.5 tabular-nums">0{i + 1}</span>
                  {perk}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex items-center gap-2">
            {HERO_IMAGES.map((_, i) => (
              <button
                key={i}
                onClick={() => { setImgLoaded(false); setImgIndex(i); }}
                className={`h-px transition-all duration-300 ${i === imgIndex ? "w-8 bg-white/70" : "w-3 bg-white/25 hover:bg-white/40"}`}
                aria-label={`Image ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-14 xl:px-20 py-12">
        <div className="lg:hidden mb-10">
          <Link href="/">
            <span className="font-['Playfair_Display'] text-white text-2xl font-semibold tracking-tight cursor-pointer">
              Affuaa.
            </span>
          </Link>
        </div>

        <div className="w-full max-w-[360px] mx-auto lg:mx-0">
          <div className="mb-10">
            <p className="text-[10px] text-white/25 uppercase tracking-[0.2em] mb-3">Create account</p>
            <h1 className="font-['Playfair_Display'] text-white text-3xl font-semibold leading-tight">
              Start your<br />journey here.
            </h1>
          </div>

          <p className="text-white/50 text-sm mb-8 leading-relaxed">
            Create your account to join the community, upload your photography, and build your portfolio.
          </p>

          <button
            type="button"
            onClick={login}
            className="w-full h-11 bg-white text-black text-[13px] font-medium hover:bg-white/90 active:bg-white/80 transition-colors flex items-center justify-center"
          >
            Create account
          </button>

          <div className="mt-10 pt-8 border-t border-white/6 flex items-center justify-between">
            <p className="text-[11px] text-white/30">
              Have an account?{" "}
              <Link href="/signin" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">
                Sign in
              </Link>
            </p>
            <p className="text-[10px] text-white/15">
              <Link href="/terms" className="hover:text-white/30 transition-colors">Terms</Link>
              {" · "}
              <Link href="/privacy" className="hover:text-white/30 transition-colors">Privacy</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function SignUp() {
  return <SignUpPage />;
}
