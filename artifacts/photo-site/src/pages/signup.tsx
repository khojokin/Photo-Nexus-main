import { useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";

export function SignUp() {
  const { login, isAuthenticated } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      window.location.href = "/";
    } else {
      login();
    }
  }, [isAuthenticated, login]);

  return null;
}
