import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/auth-context";
import { ThemeProvider } from "@/components/layout";
import { TasteProfileProvider } from "@/contexts/taste-profile-context";
import NotFound from "@/pages/not-found";

import { Home } from "@/pages/home";
import { Explore } from "@/pages/explore";
import { PhotoDetail } from "@/pages/photo-detail";
import { Collections } from "@/pages/collections";
import { CollectionDetail } from "@/pages/collection-detail";
import { SignIn } from "@/pages/signin";
import { SignUp } from "@/pages/signup";
import { Upload } from "@/pages/upload";
import { Profile } from "@/pages/profile";
import { TagPage } from "@/pages/tag-page";
import { Settings } from "@/pages/settings";
import { Dashboard } from "@/pages/dashboard";
import { Messages } from "@/pages/messages";
import { Notifications } from "@/pages/notifications";
import { Leaderboard } from "@/pages/leaderboard";
import { Activity } from "@/pages/activity";
import { Challenges } from "@/pages/challenges";
import { ChallengeDetail } from "@/pages/challenge-detail";
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

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000,
    },
  },
});

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
      <Route path="/upload" component={Upload} />
      <Route path="/profile/:name" component={Profile} />
      <Route path="/profile" component={Profile} />
      <Route path="/settings" component={Settings} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/messages" component={Messages} />
      <Route path="/notifications" component={Notifications} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/activity" component={Activity} />
      <Route path="/challenges" component={Challenges} />
      <Route path="/challenges/:id" component={ChallengeDetail} />
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
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <ThemeProvider>
            <TasteProfileProvider>
              <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
                <Router />
              </WouterRouter>
            </TasteProfileProvider>
          </ThemeProvider>
        </AuthProvider>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
