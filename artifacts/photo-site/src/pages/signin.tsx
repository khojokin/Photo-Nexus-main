import { useState } from "react";
import { Link } from "wouter";
import { Apple } from "lucide-react";
import { useSignIn, useClerk } from "@clerk/clerk-react";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4" aria-hidden="true">
      <path fill="#EA4335" d="M12 10.2v3.96h5.52c-.24 1.28-.96 2.36-2.04 3.08l3.3 2.56c1.92-1.76 3.02-4.36 3.02-7.46 0-.72-.06-1.4-.18-2.06H12z" />
      <path fill="#34A853" d="M12 22c2.74 0 5.04-.9 6.72-2.44l-3.3-2.56c-.9.6-2.06.96-3.42.96-2.64 0-4.88-1.78-5.68-4.16l-3.4 2.62C4.58 19.72 8.04 22 12 22z" />
      <path fill="#4A90E2" d="M6.32 13.8c-.2-.6-.32-1.24-.32-1.9s.12-1.3.32-1.9L2.92 7.38A9.8 9.8 0 0 0 2 11.9c0 1.58.38 3.06 1.06 4.34l3.26-2.44z" />
      <path fill="#FBBC05" d="M12 5.84c1.5 0 2.84.52 3.9 1.54l2.92-2.92C17.02 2.78 14.72 1.8 12 1.8c-3.96 0-7.42 2.28-9.08 5.58l3.4 2.62c.8-2.38 3.04-4.16 5.68-4.16z" />
    </svg>
  );
}

export function SignIn() {
  const { isLoaded, signIn } = useSignIn();
  const { setActive } = useClerk();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAppleLoading, setIsAppleLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  function getErrorMessage(err: unknown): string {
    const maybe = err as { errors?: Array<{ longMessage?: string; message?: string }> };
    if (Array.isArray(maybe?.errors) && maybe.errors.length > 0) {
      return maybe.errors[0]?.longMessage ?? maybe.errors[0]?.message ?? "Sign in failed";
    }
    return "Sign in failed";
  }

  async function onSignIn(e: React.FormEvent) {
    e.preventDefault();
    if (!isLoaded) return;
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await signIn.create({
        identifier: identifier.trim(),
        password,
      });

      if (result.status === "complete" && result.createdSessionId) {
        await setActive({ session: result.createdSessionId });
        window.location.href = "/";
        return;
      }

      setError("Sign in is not complete yet. Please try again.");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  async function signInWithApple() {
    if (!isLoaded) return;
    setError(null);
    setIsAppleLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_apple",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setIsAppleLoading(false);
    }
  }

  async function signInWithGoogle() {
    if (!isLoaded) return;
    setError(null);
    setIsGoogleLoading(true);
    try {
      await signIn.authenticateWithRedirect({
        strategy: "oauth_google",
        redirectUrl: "/sso-callback",
        redirectUrlComplete: "/",
      });
    } catch (err) {
      setError(getErrorMessage(err));
      setIsGoogleLoading(false);
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
            <p className="text-xs text-white/60 mb-4">Access your profile, collections, and premium tools.</p>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => void signInWithGoogle()}
                disabled={!isLoaded || isGoogleLoading || isAppleLoading || isSubmitting}
                className="h-10 border border-white/25 text-white text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <GoogleIcon />
                {isGoogleLoading ? "Google..." : "Google"}
              </button>

              <button
                type="button"
                onClick={() => void signInWithApple()}
                disabled={!isLoaded || isAppleLoading || isGoogleLoading || isSubmitting}
                className="h-10 border border-white/25 text-white text-sm font-medium hover:bg-white/10 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Apple className="w-4 h-4" />
                {isAppleLoading ? "Apple..." : "Apple"}
              </button>
            </div>

            <div className="flex items-center gap-2 my-3 text-white/40">
              <div className="h-px bg-white/15 flex-1" />
              <span className="text-[10px] uppercase tracking-widest">or</span>
              <div className="h-px bg-white/15 flex-1" />
            </div>

            <form onSubmit={(e) => void onSignIn(e)} className="space-y-3">
              <input
                type="text"
                placeholder="Email or username"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                className="h-10 w-full bg-transparent border border-white/20 px-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-white/50"
              />

              <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="h-10 w-full bg-transparent border border-white/20 px-3 text-sm text-white placeholder:text-white/35 focus:outline-none focus:border-white/50"
              />

              {error && <p className="text-xs text-red-300">{error}</p>}

              <button
                type="submit"
                disabled={!isLoaded || isSubmitting || isAppleLoading || isGoogleLoading}
                className="w-full h-10 bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {isSubmitting ? "Signing in..." : "Sign in"}
              </button>
            </form>

            <p className="text-xs text-white/60 mt-4 text-center">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-white hover:underline underline-offset-2">Sign up</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
