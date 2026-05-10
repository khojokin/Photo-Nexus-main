import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/contexts/auth-context";

export function SignUp() {
  const [, navigate] = useLocation();
  const { refetch } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSignUp() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo-login", {
        method: "POST",
        credentials: "include",
      });
      if (res.ok) {
        await refetch();
        navigate("/");
      } else {
        setError("Sign up failed. Please try again.");
        setLoading(false);
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  }

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
            <p className="text-xs text-white/60 mb-6">Set up your profile to start publishing your work.</p>

            {error && (
              <p className="text-xs text-red-300 mb-4">{error}</p>
            )}

            <button
              type="button"
              onClick={() => void handleSignUp()}
              disabled={loading}
              className="w-full h-11 bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                  Creating account…
                </>
              ) : (
                "Create account"
              )}
            </button>

            <p className="text-xs text-white/60 mt-4 text-center">
              Already have an account?{" "}
              <Link href="/signin" className="text-white hover:underline underline-offset-2">Sign in</Link>
            </p>

            <p className="text-[10px] text-white/30 mt-4 text-center leading-relaxed">
              By creating an account, you agree to our{" "}
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
