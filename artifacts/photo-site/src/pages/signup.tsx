import { useEffect } from "react";
import { Link } from "wouter";

export function SignUp() {
  useEffect(() => {
    window.location.href = "/api/login";
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-2xl overflow-hidden flex shadow-2xl border border-white/[0.06]">
        <div
          className="hidden md:flex flex-col justify-between w-1/2 relative p-8"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />
          <div className="relative z-10">
            <Link href="/">
              <span className="font-['Playfair_Display'] text-white text-2xl font-semibold tracking-tight cursor-pointer">
                Affuaa.
              </span>
            </Link>
          </div>
          <div className="relative z-10 space-y-3">
            <h2 className="font-['Playfair_Display'] text-white text-3xl font-semibold leading-tight">
              Join a world
              <br />
              of curated light.
            </h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              Create your account and start discovering extraordinary photography.
            </p>
          </div>
        </div>

        <div className="flex-1 bg-[#111111] flex flex-col justify-center px-8 py-8">
          <div className="md:hidden mb-5">
            <Link href="/">
              <span className="font-['Playfair_Display'] text-white text-2xl font-semibold tracking-tight cursor-pointer">
                Affuaa.
              </span>
            </Link>
          </div>

          <div className="w-full max-w-sm mx-auto border border-white/10 bg-black/20 p-5">
            <h1 className="font-['Playfair_Display'] text-2xl text-white mb-1">Create account</h1>
            <p className="text-xs text-white/60 mb-4">Redirecting you to sign up…</p>
            <div className="flex items-center justify-center py-4">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
