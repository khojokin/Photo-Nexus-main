import { useState } from "react";
import { Link } from "wouter";
import { Eye, EyeOff, ArrowRight, Check } from "lucide-react";

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" aria-hidden>
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-4 h-4 flex-shrink-0" fill="currentColor" aria-hidden>
      <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.36.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.53 3.99zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
    </svg>
  );
}

const PERKS = [
  "Upload and showcase your photography",
  "Create and share curated collections",
  "Monetise your work with prints, licenses and tips",
  "Connect with photographers worldwide",
];

export function SignUp() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [socialLoading, setSocialLoading] = useState<"google" | "apple" | null>(null);

  function handleSocial(provider: "google" | "apple") {
    setSocialLoading(provider);
    window.location.href = "/api/login";
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setEmailLoading(true);
    window.location.href = "/api/login";
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-4xl rounded-none overflow-hidden flex shadow-2xl border border-white/[0.06] sign-in-fade-up">

        {/* Left — cinematic image panel */}
        <div
          className="hidden md:flex flex-col justify-between w-[45%] relative p-8 sign-in-slide-left"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/30 to-black/85" />
          <div className="relative z-10">
            <Link href="/">
              <span className="font-['Playfair_Display'] text-white text-2xl font-semibold tracking-tight cursor-pointer hover:opacity-80 transition-opacity">
                Affuaa.
              </span>
            </Link>
          </div>
          <div className="relative z-10 space-y-5">
            <div className="w-8 h-0.5 bg-white/40 mb-3" />
            <h2 className="font-['Playfair_Display'] text-white text-3xl font-semibold leading-snug">
              Join a world<br />of curated light.
            </h2>
            <ul className="space-y-2.5 mt-4">
              {PERKS.map((perk) => (
                <li key={perk} className="flex items-start gap-2.5 text-white/60 text-[13px] leading-snug">
                  <Check className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-white/40" />
                  {perk}
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right — auth panel */}
        <div className="flex-1 bg-[#111111] flex flex-col justify-center px-6 sm:px-10 py-10 sign-in-slide-right sign-in-delay-1">

          {/* Mobile logo */}
          <div className="md:hidden mb-8">
            <Link href="/">
              <span className="font-['Playfair_Display'] text-white text-2xl font-semibold tracking-tight cursor-pointer">
                Affuaa.
              </span>
            </Link>
          </div>

          <div className="w-full max-w-sm mx-auto">
            <h1 className="font-['Playfair_Display'] text-2xl text-white mb-1 sign-in-fade-up sign-in-delay-1">Create account</h1>
            <p className="text-xs text-white/50 mb-8">Free to join. No credit card required.</p>

            {/* Social buttons */}
            <div className="space-y-2.5 sign-in-fade-up sign-in-delay-2">
              <button
                type="button"
                onClick={() => handleSocial("google")}
                disabled={socialLoading !== null || emailLoading}
                className="w-full h-11 border border-white/15 bg-white/5 hover:bg-white/10 text-white text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-3 group"
              >
                {socialLoading === "google" ? (
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <GoogleIcon />
                )}
                <span>Sign up with Google</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
              </button>

              <button
                type="button"
                onClick={() => handleSocial("apple")}
                disabled={socialLoading !== null || emailLoading}
                className="w-full h-11 border border-white/15 bg-white/5 hover:bg-white/10 text-white text-sm transition-all disabled:opacity-50 flex items-center justify-center gap-3 group"
              >
                {socialLoading === "apple" ? (
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                ) : (
                  <AppleIcon />
                )}
                <span>Sign up with Apple</span>
                <ArrowRight className="w-3.5 h-3.5 ml-auto opacity-0 group-hover:opacity-50 transition-opacity" />
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 my-6 sign-in-fade-up sign-in-delay-2">
              <div className="flex-1 h-px bg-white/10" />
              <span className="text-[11px] text-white/30 uppercase tracking-widest">or</span>
              <div className="flex-1 h-px bg-white/10" />
            </div>

            {/* Registration form */}
            <form onSubmit={handleSubmit} className="space-y-3 sign-in-fade-up sign-in-delay-2">
              <div>
                <label className="block text-[11px] text-white/40 uppercase tracking-widest mb-1.5">Username</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="your.handle"
                  autoComplete="username"
                  className="w-full h-11 bg-white/5 border border-white/12 text-white text-sm px-4 focus:outline-none focus:border-white/30 placeholder:text-white/25 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] text-white/40 uppercase tracking-widest mb-1.5">Email address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className="w-full h-11 bg-white/5 border border-white/12 text-white text-sm px-4 focus:outline-none focus:border-white/30 placeholder:text-white/25 transition-colors"
                />
              </div>

              <div>
                <label className="block text-[11px] text-white/40 uppercase tracking-widest mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    autoComplete="new-password"
                    className="w-full h-11 bg-white/5 border border-white/12 text-white text-sm px-4 pr-11 focus:outline-none focus:border-white/30 placeholder:text-white/25 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={emailLoading || socialLoading !== null}
                className="w-full h-11 bg-white text-black text-sm font-medium hover:bg-white/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 mt-1"
              >
                {emailLoading ? (
                  <span className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                ) : (
                  <>
                    Create account
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <p className="text-xs text-white/45 mt-6 text-center">
              Already have an account?{" "}
              <Link href="/signin" className="text-white/75 hover:text-white underline underline-offset-2 transition-colors">
                Sign in
              </Link>
            </p>

            <p className="text-[10px] text-white/25 mt-5 text-center leading-relaxed">
              By creating an account you agree to our{" "}
              <Link href="/terms" className="underline hover:text-white/45 transition-colors">Terms</Link>
              {" "}and{" "}
              <Link href="/privacy" className="underline hover:text-white/45 transition-colors">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
