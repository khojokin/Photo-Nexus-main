import { Link } from "wouter";
import { SignIn as ClerkSignIn } from "@clerk/clerk-react";
import { PhotoSlideshow } from "@/components/photo-slideshow";

export function SignIn() {
  return (
    <div className="relative min-h-screen flex items-center justify-center p-4">
      <div className="absolute inset-0 z-0">
        <PhotoSlideshow />
      </div>

      <div className="absolute inset-0 z-10 bg-black/40 backdrop-blur-[2px]" />

      <div className="relative z-20 w-full max-w-md bg-background/95 backdrop-blur-md border border-border/60 shadow-2xl p-6">
        <div className="mb-5 text-center">
          <Link href="/" className="font-serif text-2xl font-bold tracking-tight">
            Affuaa.
          </Link>
          <p className="mt-2 text-muted-foreground text-sm">Welcome back.</p>
        </div>

        <ClerkSignIn
          path="/signin"
          routing="path"
          signUpUrl="/signup"
          forceRedirectUrl="/"
          appearance={{
            elements: {
              card: "shadow-none border-0 bg-transparent p-0",
              header: "hidden",
              footer: "hidden",
            },
          }}
        />
      </div>
    </div>
  );
}
