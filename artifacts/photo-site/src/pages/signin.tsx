import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Eye, EyeOff } from "lucide-react";
import { useSignIn } from "@clerk/clerk-react";

function getClerkErrorMessage(error: unknown): string {
  if (typeof error === "object" && error !== null && "errors" in error) {
    const errors = (error as { errors?: Array<{ message?: string }> }).errors;
    if (Array.isArray(errors) && errors[0]?.message) return errors[0].message;
  }
  return "Unable to sign in right now. Please try again.";
}

const HERO_IMAGES = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1200&q=90",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=1200&q=90",
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=90",
];

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] flex-shrink-0" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-[15px] h-[15px] flex-shrink-0" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.36.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 3.99zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

function ClerkSignInPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [imgIndex, setImgIndex] = useState(0);
  const [imgLoaded, setImgLoaded] = useState(false);
  const { signIn, setActive, isLoaded } = useSignIn();
  const [, navigate] = useLocation();

  useEffect(() => {
    const t = setInterval(() => {
      setImgLoaded(false);
      setTimeout(() => setImgIndex(i => (i + 1) % HERO_IMAGES.length), 600);
    }, 7000);
    return () => clearInterval(t);
  }, []);

  const postSignInPath = (() => {
    try {
      const candidate = new URL(window.location.href).searchParams.get("redirect") ?? "/settings";
      if (!candidate.startsWith("/") || candidate.startsWith("//")) return "/settings";
      return candidate;
    } catch { return "/settings"; }
  })();

  async function doLogin() {
    if (!isLoaded || !signIn || !setActive) return;
    try {
      const attempt = await signIn.create({ identifier: email, password });
      if (attempt.status === "complete" && attempt.createdSessionId) {
        await setActive({ session: attempt.createdSessionId });
        navigate(postSignInPath);
      }
    } catch (error) {
      setAuthError(getClerkErrorMessage(error));
    }
  }

  async function handleSocial(provider: "google" | "apple") {
    setAuthError(null);
    setSocialLoading(provider);
    if (!isLoaded || !signIn) return;
    try {
      await signIn.authenticateWithRedirect({
        strategy: provider === "google" ? "oauth_google" : "oauth_apple",
        redirectUrl: `${window.location.origin}/sso-callback`,
        redirectUrlComplete: `${window.location.origin}${postSignInPath}`,
      });
    } catch (error) {
      setAuthError(getClerkErrorMessage(error));
      setSocialLoading(null);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setEmailLoading(true);
    try { await doLogin(); }
    finally { setEmailLoading(false); }
  }

  return (
    <div className="flex min-h-screen bg-[#070707]">
      {/* ── Left: cinematic hero ── */}
      <div className="relative hidden lg:flex lg:w-[55%] xl:w-[60%] overflow-hidden">
        <img
          key={HERO_IMAGES[imgIndex]}
          src={HERO_IMAGES[imgIndex]}
          alt=""
          onLoad={() => setImgLoaded(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
        />
        {/* layered gradients for depth */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-black/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30" />

        {/* grain texture */}
        <div
          className="absolute inset-0 opacity-[0.18] pointer-events-none"
          style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='1'/%3E%3C/svg%3E\")", backgroundSize: "128px 128px" }}
        />

        {/* content */}
        <div className="relative z-10 flex flex-col justify-between p-10 xl:p-14 w-full">
          <Link href="/">
            <span className="font-['Playfair_Display'] text-white text-2xl font-semibold tracking-tight cursor-pointer hover:opacity-75 transition-opacity">
              Affuaa.
            </span>
          </Link>

          <div className="space-y-6 max-w-sm">
            <div className="flex items-center gap-3">
              <div className="w-6 h-px bg-white/40" />
              <span className="text-[10px] text-white/40 uppercase tracking-[0.2em]">Gallery · Since 2024</span>
            </div>
            <h2 className="font-['Playfair_Display'] text-white text-4xl xl:text-5xl font-semibold leading-[1.15]">
              Welcome back<br />
              <em className="not-italic text-white/60">to the craft.</em>
            </h2>
            <p className="text-white/45 text-[13px] leading-relaxed">
              Gallery-quality photography, curated for those<br />who care about the image.
            </p>
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

      {/* ── Right: form panel ── */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-10 lg:px-14 xl:px-20 py-12 relative">
        {/* mobile logo */}
        <div className="lg:hidden mb-10">
          <Link href="/">
            <span className="font-['Playfair_Display'] text-white text-2xl font-semibold tracking-tight cursor-pointer">
              Affuaa.
            </span>
          </Link>
        </div>

        <div className="w-full max-w-[360px] mx-auto lg:mx-0">
          {/* heading */}
          <div className="mb-10">
            <p className="text-[10px] text-white/25 uppercase tracking-[0.2em] mb-3">Sign in</p>
            <h1 className="font-['Playfair_Display'] text-white text-3xl font-semibold leading-tight">
              Good to see<br />you again.
            </h1>
          </div>

          {authError && (
            <div className="mb-6 px-4 py-3 border border-red-500/20 bg-red-500/5">
              <p className="text-xs text-red-300/90">{authError}</p>
            </div>
          )}

          {/* social */}
          <div className="space-y-2.5 mb-8">
            <button
              type="button"
              onClick={() => void handleSocial("google")}
              disabled={socialLoading !== null || emailLoading}
              className="w-full h-11 border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-white/80 hover:text-white text-[13px] transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2.5"
            >
              {socialLoading === "google"
                ? <span className="w-3.5 h-3.5 border border-white/20 border-t-white/70 rounded-full animate-spin" />
                : <GoogleIcon />}
              Continue with Google
            </button>
            <button
              type="button"
              onClick={() => void handleSocial("apple")}
              disabled={socialLoading !== null || emailLoading}
              className="w-full h-11 border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] text-white/80 hover:text-white text-[13px] transition-all duration-200 disabled:opacity-40 flex items-center justify-center gap-2.5"
            >
              {socialLoading === "apple"
                ? <span className="w-3.5 h-3.5 border border-white/20 border-t-white/70 rounded-full animate-spin" />
                : <AppleIcon />}
              Continue with Apple
            </button>
          </div>

          {/* divider */}
          <div className="flex items-center gap-4 mb-8">
            <div className="flex-1 h-px bg-white/8" />
            <span className="text-[10px] text-white/20 uppercase tracking-[0.2em]">or</span>
            <div className="flex-1 h-px bg-white/8" />
          </div>

          {/* form */}
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div className="space-y-1">
              <label className="block text-[10px] text-white/30 uppercase tracking-[0.15em]">Email</label>
              <input
                type="text"
                value={email}
                onChange={(e) => { setEmail(e.target.value); if (authError) setAuthError(null); }}
                placeholder="you@example.com"
                autoComplete="email"
                className="w-full h-11 bg-transparent border-b border-white/12 focus:border-white/35 text-white text-sm px-0 pb-2 outline-none placeholder:text-white/20 transition-colors duration-200"
              />
            </div>

            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <label className="block text-[10px] text-white/30 uppercase tracking-[0.15em]">Password</label>
                <button type="button" className="text-[10px] text-white/25 hover:text-white/50 transition-colors">
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); if (authError) setAuthError(null); }}
                  placeholder="••••••••"
                  autoComplete="current-password"
                  className="w-full h-11 bg-transparent border-b border-white/12 focus:border-white/35 text-white text-sm px-0 pb-2 pr-8 outline-none placeholder:text-white/20 transition-colors duration-200"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-0 top-3 text-white/20 hover:text-white/50 transition-colors"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={emailLoading || socialLoading !== null}
                className="w-full h-11 bg-white text-black text-[13px] font-medium hover:bg-white/90 active:bg-white/80 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {emailLoading
                  ? <span className="w-3.5 h-3.5 border border-black/20 border-t-black/70 rounded-full animate-spin" />
                  : "Sign in"}
              </button>
            </div>
          </form>

          <div className="mt-10 pt-8 border-t border-white/6 flex items-center justify-between">
            <p className="text-[11px] text-white/30">
              No account?{" "}
              <Link href="/signup" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">
                Create one
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

export function SignIn() {
  return <ClerkSignInPage />;
}
