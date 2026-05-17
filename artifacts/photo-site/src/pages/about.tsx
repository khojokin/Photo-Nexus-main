import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Camera, Eye, Heart, Users } from "lucide-react";

export function About() {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 max-w-4xl">

        {/* Hero */}
        <div className="mb-20 border-b border-border pb-16">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">About</p>
          <h1 className="font-serif text-5xl sm:text-6xl leading-tight mb-8">
            Photography<br />worth looking at.
          </h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-2xl">
            Affuaa is a curated platform built for photographers who take the craft seriously —
            darkroom-inspired in its aesthetic, editorial in its spirit, uncompromising in the quality of what it shows.
          </p>
        </div>

        {/* Mission */}
        <div className="grid md:grid-cols-2 gap-16 mb-20">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Our Mission</p>
            <h2 className="font-serif text-3xl mb-5">Respect the craft.</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              The internet is flooded with images. Most of them are noise. Affuaa exists to cut through that —
              to give serious photography a home that treats it with the same care the photographer put into making it.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We believe that a great photograph deserves more than an algorithm. It deserves a viewer who
              came looking for something worth their time. That is what we are building.
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Our Approach</p>
            <h2 className="font-serif text-3xl mb-5">Curation over quantity.</h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Every photo on Affuaa is reviewed. We are not a hosting service. We are a gallery —
              and galleries have standards. Ours are high.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              We curate for light, for composition, for the moment, for the feeling. If a photo stops you
              mid-scroll, it belongs here.
            </p>
          </div>
        </div>

        {/* Values */}
        <div className="mb-20">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-10">What we stand for</p>
          <div className="grid sm:grid-cols-2 gap-6">
            {[
              {
                icon: Camera,
                title: "Photographers First",
                body: "Affuaa is built around the people behind the lens. Photographers set their own terms, retain all rights to their work, and get credit that is impossible to miss.",
              },
              {
                icon: Eye,
                title: "Gallery-Quality Presentation",
                body: "Dark backgrounds, generous whitespace, high-resolution display. Your work is shown the way it was meant to be seen — not crushed into a grid of thumbnails.",
              },
              {
                icon: Heart,
                title: "Community, Not Competition",
                body: "The best photography communities are generous ones. We foster discovery, conversation, and mutual respect among photographers at every level.",
              },
              {
                icon: Users,
                title: "Open to Everyone",
                body: "Whether you shoot film or digital, landscape or portrait, phone or medium format — if your work is thoughtful and well-crafted, there is a place for it here.",
              },
            ].map(({ icon: Icon, title, body }) => (
              <div key={title} className="border border-border p-6 space-y-3">
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4 text-muted-foreground" />
                  <h3 className="font-medium text-sm">{title}</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Story */}
        <div className="border-t border-border pt-16 mb-20">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-6">The Story</p>
          <div className="max-w-2xl space-y-5 text-muted-foreground leading-relaxed">
            <p>
              Affuaa started as a question: why does so much serious photography end up buried under
              sponsored posts and engagement-chasing content? Where do you go when you want to see work
              that someone spent weeks or months making?
            </p>
            <p>
              We built the platform we were looking for. A place with a genuine sense of aesthetic,
              where the design gets out of the way and the photography takes over. A darkroom for the digital age.
            </p>
            <p>
              The name Affuaa is a nod to the Arabic word for pardon or grace — the quality we hope
              every photographer on this platform brings to their subjects, and that we bring to the craft itself.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="border border-border p-10 text-center">
          <h2 className="font-serif text-3xl mb-3">Ready to share your work?</h2>
          <p className="text-muted-foreground text-sm mb-8 max-w-md mx-auto">
            Join a community of photographers who take the craft seriously. Upload your first photo and see where it takes you.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <Link
              href="/signup"
              className="px-8 py-3 bg-foreground text-background text-sm font-medium hover:opacity-90 transition-opacity"
            >
              Create an Account
            </Link>
            <Link
              href="/photos"
              className="px-8 py-3 border border-border text-sm text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
            >
              Explore the Gallery
            </Link>
          </div>
        </div>

      </div>
    </Layout>
  );
}
