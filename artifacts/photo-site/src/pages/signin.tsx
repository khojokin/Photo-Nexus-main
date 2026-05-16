import { useEffect } from "react";
import { useLocation } from "wouter";

export function SignIn() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/");
  }, [setLocation]);
  return null;
}
