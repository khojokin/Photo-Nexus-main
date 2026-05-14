import { useEffect } from "react";
import { useLocation } from "wouter";

export function SsoCallback() {
  const [, navigate] = useLocation();

  useEffect(() => {
    navigate("/");
  }, [navigate]);

  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0a0a0a" }}>
      <span className="w-5 h-5 border border-white/20 border-t-white/70 rounded-full animate-spin" />
    </div>
  );
}
