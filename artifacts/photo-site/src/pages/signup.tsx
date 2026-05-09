import { Link } from "wouter";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

export function SignUp() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-4">
      <div className="w-full max-w-5xl rounded-2xl overflow-hidden flex shadow-2xl border border-white/[0.06]">

        {/* Left panel — image + welcome text */}
        <div
          className="hidden md:flex flex-col justify-between w-1/2 relative p-10"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=900&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          {/* Darkening overlay */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/80" />

          {/* Logo */}
          <div className="relative z-10">
            <Link href="/">
              <span className="font-['Playfair_Display'] text-white text-2xl font-semibold tracking-tight cursor-pointer">
                Affuaa.
              </span>
            </Link>
          </div>

          {/* Welcome text */}
          <div className="relative z-10 space-y-3">
            <h2 className="font-['Playfair_Display'] text-white text-4xl font-semibold leading-tight">
              Join a world<br />of curated light.
            </h2>
            <p className="text-white/60 text-sm leading-relaxed max-w-xs">
              Create your account and start discovering extraordinary photography — no algorithms, just craft.
            </p>
          </div>
        </div>

        {/* Right panel — form */}
        <div className="flex-1 bg-[#111111] flex flex-col justify-center px-10 py-12">

          {/* Mobile logo */}
          <div className="md:hidden mb-8">
            <Link href="/">
              <span className="font-['Playfair_Display'] text-white text-2xl font-semibold tracking-tight cursor-pointer">
                Affuaa.
              </span>
            </Link>
          </div>

          <div className="w-full max-w-sm mx-auto space-y-8">
            <div className="space-y-1">
              <h1 className="text-white text-2xl font-semibold tracking-tight">Create account</h1>
              <p className="text-white/40 text-sm">
                Already have one?{" "}
                <Link href="/signin">
                  <span className="text-white/70 hover:text-white underline underline-offset-2 transition-colors cursor-pointer">
                    Sign in
                  </span>
                </Link>
              </p>
            </div>

            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="flex gap-3">
                <div className="flex-1 space-y-1.5">
                  <label className="text-white/50 text-xs uppercase tracking-widest font-medium">
                    First name
                  </label>
                  <input
                    type="text"
                    autoComplete="given-name"
                    placeholder="Jane"
                    className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all"
                  />
                </div>
                <div className="flex-1 space-y-1.5">
                  <label className="text-white/50 text-xs uppercase tracking-widest font-medium">
                    Last name
                  </label>
                  <input
                    type="text"
                    autoComplete="family-name"
                    placeholder="Doe"
                    className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-white/50 text-xs uppercase tracking-widest font-medium">
                  Email
                </label>
                <input
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-4 py-3 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-white/50 text-xs uppercase tracking-widest font-medium">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-4 py-3 pr-10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-white/50 text-xs uppercase tracking-widest font-medium">
                  Confirm password
                </label>
                <div className="relative">
                  <input
                    type={showConfirm ? "text" : "password"}
                    autoComplete="new-password"
                    placeholder="••••••••"
                    className="w-full bg-white/[0.05] border border-white/[0.10] rounded-lg px-4 py-3 pr-10 text-white text-sm placeholder:text-white/20 focus:outline-none focus:border-white/30 focus:bg-white/[0.07] transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-white text-black font-medium text-sm rounded-lg py-3 hover:bg-white/90 active:bg-white/80 transition-colors mt-2"
              >
                Create account
              </button>

              <p className="text-white/25 text-xs text-center leading-relaxed">
                By creating an account you agree to our{" "}
                <a href="#" className="underline underline-offset-2 hover:text-white/50 transition-colors">Terms</a>{" "}
                and{" "}
                <a href="#" className="underline underline-offset-2 hover:text-white/50 transition-colors">Privacy Policy</a>.
              </p>
            </form>

            <div className="relative flex items-center gap-4">
              <div className="flex-1 h-px bg-white/[0.07]" />
              <span className="text-white/25 text-xs">or</span>
              <div className="flex-1 h-px bg-white/[0.07]" />
            </div>

            <button
              type="button"
              className="w-full flex items-center justify-center gap-3 border border-white/[0.10] rounded-lg py-3 text-white/60 text-sm hover:bg-white/[0.05] hover:text-white/80 transition-all"
              onClick={() => {
                const base = import.meta.env.BASE_URL.replace(/\/+$/, "") || "/";
                window.location.href = `/api/login?returnTo=${encodeURIComponent(base)}`;
              }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="shrink-0">
                <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2z" fill="currentColor" opacity=".15"/>
                <path d="M15.5 8.5h-7M12 8.5v7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              Continue with Replit
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
