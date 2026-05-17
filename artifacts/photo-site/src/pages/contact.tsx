import { useState } from "react";
import { Layout } from "@/components/layout";
import { Mail, MessageSquare, Instagram, Send } from "lucide-react";

type FormState = "idle" | "sending" | "sent" | "error";

export function Contact() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [formState, setFormState] = useState<FormState>("idle");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setFormState("sending");
    await new Promise(r => setTimeout(r, 1000));
    setFormState("sent");
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-20 max-w-4xl">

        {/* Header */}
        <div className="mb-16 border-b border-border pb-12">
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Contact</p>
          <h1 className="font-serif text-5xl sm:text-6xl leading-tight mb-6">Get in touch.</h1>
          <p className="text-muted-foreground text-lg leading-relaxed max-w-xl">
            A question, a submission inquiry, a partnership idea — we read every message and respond to all of them.
          </p>
        </div>

        <div className="grid md:grid-cols-5 gap-16">

          {/* Contact form */}
          <div className="md:col-span-3">
            {formState === "sent" ? (
              <div className="border border-border p-10 text-center space-y-4">
                <Send className="w-8 h-8 text-muted-foreground mx-auto" />
                <h2 className="font-serif text-2xl">Message sent.</h2>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  Thank you for reaching out. We will get back to you within 1–2 business days.
                </p>
                <button
                  onClick={() => {
                    setName(""); setEmail(""); setSubject(""); setMessage("");
                    setFormState("idle");
                  }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-4 mt-2"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={e => void handleSubmit(e)} className="space-y-5">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Name <span className="text-foreground/40">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                      placeholder="Your name"
                      className="w-full bg-transparent border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground/60 placeholder:text-muted-foreground/40 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-1.5">
                      Email <span className="text-foreground/40">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full bg-transparent border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground/60 placeholder:text-muted-foreground/40 transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-1.5">Subject</label>
                  <select
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    className="w-full bg-background border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground/60 text-muted-foreground transition-colors"
                  >
                    <option value="">Choose a topic…</option>
                    <option value="general">General enquiry</option>
                    <option value="submission">Photo submission</option>
                    <option value="partnership">Partnership or collaboration</option>
                    <option value="press">Press enquiry</option>
                    <option value="bug">Report a bug</option>
                    <option value="other">Something else</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs uppercase tracking-wider text-muted-foreground block mb-1.5">
                    Message <span className="text-foreground/40">*</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    required
                    rows={6}
                    placeholder="Tell us what's on your mind…"
                    className="w-full bg-transparent border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground/60 placeholder:text-muted-foreground/40 resize-none transition-colors"
                  />
                </div>

                {formState === "error" && (
                  <p className="text-xs text-red-400">Something went wrong. Please try again or email us directly.</p>
                )}

                <button
                  type="submit"
                  disabled={formState === "sending" || !name.trim() || !email.trim() || !message.trim()}
                  className="flex items-center gap-2 px-8 py-3 bg-foreground text-background text-sm font-medium hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  <Send className="w-3.5 h-3.5" />
                  {formState === "sending" ? "Sending…" : "Send Message"}
                </button>
              </form>
            )}
          </div>

          {/* Sidebar */}
          <div className="md:col-span-2 space-y-8">

            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-5">Direct contact</p>
              <div className="space-y-4">
                <a
                  href="mailto:hello@affuaa.com"
                  className="flex items-start gap-3 group"
                >
                  <Mail className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0 group-hover:text-foreground transition-colors" />
                  <div>
                    <p className="text-sm group-hover:text-foreground transition-colors">hello@affuaa.com</p>
                    <p className="text-xs text-muted-foreground mt-0.5">General &amp; partnerships</p>
                  </div>
                </a>
                <a
                  href="mailto:submit@affuaa.com"
                  className="flex items-start gap-3 group"
                >
                  <MessageSquare className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0 group-hover:text-foreground transition-colors" />
                  <div>
                    <p className="text-sm group-hover:text-foreground transition-colors">submit@affuaa.com</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Photo submissions</p>
                  </div>
                </a>
                <a
                  href="https://instagram.com/affuaa"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-3 group"
                >
                  <Instagram className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0 group-hover:text-foreground transition-colors" />
                  <div>
                    <p className="text-sm group-hover:text-foreground transition-colors">@affuaa</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Instagram DMs welcome</p>
                  </div>
                </a>
              </div>
            </div>

            <div className="border-t border-border pt-8">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Response time</p>
              <p className="text-sm text-muted-foreground leading-relaxed">
                We respond to all messages within <span className="text-foreground">1–2 business days</span>.
                For urgent matters, Instagram DMs tend to be the fastest.
              </p>
            </div>

            <div className="border-t border-border pt-8">
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-4">Based in</p>
              <p className="text-sm text-muted-foreground">Worldwide — our team works remotely across time zones.</p>
            </div>

          </div>
        </div>

      </div>
    </Layout>
  );
}
