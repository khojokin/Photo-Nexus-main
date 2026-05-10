import { useState } from "react";
import { Link, useLocation } from "wouter";

export function SignIn() {
  const [, navigate] = useLocation();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignIn() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        window.location.href = "/";
      } else {
        setError("Sign in failed. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-2xl overflow-hidden flex shadow-2xl border border-white/[0.06] sign-in-fade-up">
        <div
          className="hidden md:flex flex-col justify-between w-1/2 relative p-8 sign-in-slide-left"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=900&q=80')",
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
              Welcome back
              <br />
              to the craft.
            </h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              Sign in to explore gallery-quality photography curated for those who care about the image.
            </p>
          </div>
        </div>

        <div className="flex-1 bg-[#111111] flex flex-col justify-center px-8 py-8 sign-in-slide-right sign-in-delay-1">
          <div className="md:hidden mb-5">
            <Link href="/">
              <span className="font-['Playfair_Display'] text-white text-2xl font-semibold tracking-tight cursor-pointer">
                Affuaa.
              </span>
            </Link>
          </div>

          <div className="w-full max-w-sm mx-auto border border-white/10 bg-black/20 p-5 sign-in-fade-up sign-in-delay-2">
            <h1 className="font-['Playfair_Display'] text-2xl text-white mb-1">Sign in</h1>
            <p className="text-xs text-white/60 mb-6">Access your profile, collections, and premium tools.</p>

            {error && (
              <p className="text-xs text-red-300 mb-4">{error}</p>
            )}

            <button
              type="button"
              onClick={() => void handleSignIn()}
              disabled={loading}
              className="w-full h-11 bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </button>

            <p className="text-xs text-white/60 mt-4 text-center">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-white hover:underline underline-offset-2">Sign up</Link>
            </p>

            <p className="text-[10px] text-white/30 mt-4 text-center leading-relaxed">
              By signing in, you agree to our{" "}
              <Link href="/terms" className="underline hover:text-white/50 transition-colors">Terms of Service</Link>{" "}
              and{" "}
              <Link href="/privacy" className="underline hover:text-white/50 transition-colors">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
