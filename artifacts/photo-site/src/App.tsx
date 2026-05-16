import React, { useEffect } from "react";
import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/components/layout";
import { TasteProfileProvider } from "@/contexts/taste-profile-context";
import { UploadProgressProvider } from "@/contexts/upload-progress-context";
import NotFound from "@/pages/not-found";

import { Home } from "@/pages/home";
import { Explore } from "@/pages/explore";
import { PhotoDetail } from "@/pages/photo-detail";
import { Collections } from "@/pages/collections";
import { CollectionDetail } from "@/pages/collection-detail";
import { SignIn } from "@/pages/signin";
import { SignUp } from "@/pages/signup";
import { SsoCallback } from "@/pages/sso-callback";
import { Upload } from "@/pages/upload";
import { Profile } from "@/pages/profile";
import { TagPage } from "@/pages/tag-page";
import { Settings } from "@/pages/settings";
import { Dashboard } from "@/pages/dashboard";
import { Messages } from "@/pages/messages";
import { Notifications } from "@/pages/notifications";
import { Leaderboard } from "@/pages/leaderboard";
import { Activity } from "@/pages/activity";
import { PhotoOfTheDay } from "@/pages/photo-of-the-day";
import { Moodboard } from "@/pages/moodboard";
import { SeriesList } from "@/pages/series";
import { SeriesDetail } from "@/pages/series-detail";
import { Admin } from "@/pages/admin";
import { EmbedPhoto } from "@/pages/embed";
import { Monetise } from "@/pages/monetise";
import { Discover } from "@/pages/discover";
import PremiumPage from "@/pages/premium";
import { CheckoutPage } from "@/pages/checkout";
import { Terms } from "@/pages/terms";
import { Privacy } from "@/pages/privacy";
import { Illustrations } from "@/pages/illustrations";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

const SETTINGS_KEY = "affuaa_settings";

function AppInit() {
  useEffect(() => {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (!raw) {
        localStorage.setItem(SETTINGS_KEY, JSON.stringify({ displayName: "Alex Morgan" }));
      } else {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        if (!parsed["displayName"]) {
          parsed["displayName"] = "Alex Morgan";
          localStorage.setItem(SETTINGS_KEY, JSON.stringify(parsed));
        }
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement;
      const inInput = target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable;
      if (e.key === "/" && !inInput) {
        e.preventDefault();
        const searchBtn = document.querySelector<HTMLElement>("[aria-label='Open search']");
        if (searchBtn) searchBtn.click();
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  return null;
}

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background">
          <div className="text-center max-w-md px-4">
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Error</p>
            <h1 className="text-2xl font-serif mb-4">Something went wrong</h1>
            <p className="text-muted-foreground text-sm mb-8">
              {this.state.error?.message ?? "An unexpected error occurred."}
            </p>
            <button
              onClick={() => {
                this.setState({ hasError: false });
                window.location.href = "/";
              }}
              className="px-8 py-2.5 bg-foreground text-background text-sm hover:opacity-80 transition-opacity"
            >
              Return Home
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/photos" component={Explore} />
      <Route path="/photos/:id" component={PhotoDetail} />
      <Route path="/collections" component={Collections} />
      <Route path="/collections/:id" component={CollectionDetail} />
      <Route path="/tags/:tag" component={TagPage} />
      <Route path="/signin" component={SignIn} />
      <Route path="/signup" component={SignUp} />
      <Route path="/sso-callback" component={SsoCallback} />
      <Route path="/upload" component={Upload} />
      <Route path="/profile/:name" component={Profile} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/messages" component={Messages} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/activity" component={Activity} />
      <Route path="/photo-of-the-day" component={PhotoOfTheDay} />
      <Route path="/moodboard" component={Moodboard} />
      <Route path="/series" component={SeriesList} />
      <Route path="/series/:id" component={SeriesDetail} />
      <Route path="/admin" component={Admin} />
      <Route path="/embed/:id" component={EmbedPhoto} />
      <Route path="/monetise" component={Monetise} />
      <Route path="/premium" component={PremiumPage} />
      <Route path="/checkout" component={CheckoutPage} />
      <Route path="/discover" component={Discover} />
      <Route path="/terms" component={Terms} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/illustrations" component={Illustrations} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <AuthProvider>
            <ThemeProvider>
              <TasteProfileProvider>
                <UploadProgressProvider>
                  <AppInit />
                  <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                    <Router />
                  </WouterRouter>
                </UploadProgressProvider>
              </TasteProfileProvider>
            </ThemeProvider>
          </AuthProvider>
          <Toaster />
          <Sonner position="bottom-right" richColors closeButton />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
