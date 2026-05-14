import { useState, useCallback } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useSubscription } from "@/hooks/use-subscription";

export type PremiumFeature =
  | "download"
  | "analytics"
  | "featured_nomination"
  | "priority_discovery"
  | "creator_badge";

export interface PremiumFeatureMeta {
  title: string;
  description: string;
  icon: string;
}

export const PREMIUM_FEATURES: Record<PremiumFeature, PremiumFeatureMeta> = {
  download: {
    title: "HD Downloads",
    description: "Download full-resolution files for any photo on the platform.",
    icon: "download",
  },
  analytics: {
    title: "Advanced Analytics",
    description: "Deep insights into views, downloads, and audience reach across your portfolio.",
    icon: "bar-chart",
  },
  featured_nomination: {
    title: "Featured Nomination",
    description: "Nominate your uploads for editorial curation on the Affuaa homepage.",
    icon: "star",
  },
  priority_discovery: {
    title: "Priority Discovery",
    description: "Your work surfaces first in Explore, tags, and recommendation feeds.",
    icon: "zap",
  },
  creator_badge: {
    title: "Creator Badge",
    description: "A distinct premium badge on your profile that signals craft and commitment.",
    icon: "shield",
  },
};

export function usePremiumGate() {
  const { isAdmin } = useAuth();
  const { isPremium } = useSubscription();
  const [open, setOpen] = useState(false);
  const [activeFeature, setActiveFeature] = useState<PremiumFeature>("download");

  const gate = useCallback(
    (feature: PremiumFeature, action?: () => void) => {
      if (isPremium || isAdmin) {
        action?.();
        return;
      }
      setActiveFeature(feature);
      setOpen(true);
    },
    [isPremium, isAdmin],
  );

  const closeGate = useCallback(() => setOpen(false), []);

  return { gate, isOpen: open, closeGate, activeFeature };
}
