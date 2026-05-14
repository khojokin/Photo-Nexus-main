import { useEffect } from "react";

export function SsoCallback() {
  useEffect(() => {
    window.location.href = "/";
  }, []);

  return null;
}
