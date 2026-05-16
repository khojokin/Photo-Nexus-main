import { useEffect } from "react";
import { useLocation } from "wouter";

export function SignUp() {
  const [, setLocation] = useLocation();
  useEffect(() => {
    setLocation("/");
  }, [setLocation]);
  return null;
}
