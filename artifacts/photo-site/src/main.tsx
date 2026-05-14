import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import App from "./App";
import "./index.css";

if (window.location.hostname.endsWith("workers.dev")) {
  const canonical = new URL(window.location.href);
  canonical.hostname = "affuaa.com";
  window.location.replace(canonical.toString());
}

const clerkPublishableKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY as string | undefined;

createRoot(document.getElementById("root")!).render(
  clerkPublishableKey ? (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <App />
    </ClerkProvider>
  ) : (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0a0a0a", color: "#fff", fontFamily: "system-ui, sans-serif", padding: "24px" }}>
      <div style={{ maxWidth: "520px", textAlign: "center" }}>
        <h1 style={{ fontSize: "22px", marginBottom: "10px" }}>Authentication Config Missing</h1>
        <p style={{ opacity: 0.8, lineHeight: 1.5 }}>
          Set <strong>VITE_CLERK_PUBLISHABLE_KEY</strong> in your environment to run cloud authentication.
        </p>
      </div>
    </div>
  )
);
