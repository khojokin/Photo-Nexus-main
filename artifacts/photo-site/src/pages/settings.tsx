import { useState, useEffect } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Check, User, Bell, Palette, Shield, ChevronRight, Instagram, Twitter } from "lucide-react";
import { cn } from "@/lib/utils";

const SETTINGS_KEY = "affuaa_settings";

interface Settings {
  displayName: string;
  bio: string;
  location: string;
  website: string;
  instagram: string;
  twitter: string;
  notifyComments: boolean;
  notifyLikes: boolean;
  notifyMessages: boolean;
  compactView: boolean;
  autoplayVideos: boolean;
}

const defaultSettings: Settings = {
  displayName: "",
  bio: "",
  location: "",
  website: "",
  instagram: "",
  twitter: "",
  notifyComments: true,
  notifyLikes: true,
  notifyMessages: true,
  compactView: false,
  autoplayVideos: false,
};

function loadSettings(): Settings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (raw) return { ...defaultSettings, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return defaultSettings;
}

function saveSettings(s: Settings) {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(s));
}

type Section = "profile" | "notifications" | "appearance" | "privacy";

const sections: { id: Section; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "profile", label: "Profile", icon: User, desc: "Your public display name, bio, and social links" },
  { id: "notifications", label: "Notifications", icon: Bell, desc: "What you get notified about" },
  { id: "appearance", label: "Appearance", icon: Palette, desc: "Display and layout preferences" },
  { id: "privacy", label: "Privacy", icon: Shield, desc: "Visibility and data controls" },
];

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200",
        checked ? "bg-foreground" : "bg-muted"
      )}
    >
      <span
        className={cn(
          "inline-block h-3.5 w-3.5 rounded-full bg-background shadow transition-transform duration-200",
          checked ? "translate-x-4" : "translate-x-0.5"
        )}
      />
    </button>
  );
}

export function Settings() {
  const [settings, setSettings] = useState<Settings>(loadSettings);
  const [active, setActive] = useState<Section>("profile");
  const [saved, setSaved] = useState(false);

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  useEffect(() => {
    const stored = loadSettings();
    setSettings(stored);
  }, []);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-16 max-w-5xl">
        <div className="mb-12">
          <h1 className="text-4xl font-serif mb-2">Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your Affuaa preferences.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr] gap-8">
          <nav className="space-y-1">
            {sections.map((s) => {
              const Icon = s.icon;
              return (
                <button
                  key={s.id}
                  onClick={() => setActive(s.id)}
                  className={cn(
                    "w-full flex items-center gap-3 px-4 py-3 text-left text-sm transition-colors",
                    active === s.id
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  )}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className="flex-1">{s.label}</span>
                  {active === s.id && <ChevronRight className="w-3.5 h-3.5 opacity-50" />}
                </button>
              );
            })}
          </nav>

          <div className="border border-border bg-card">
            <div className="border-b border-border px-6 py-5">
              <h2 className="font-serif text-xl">
                {sections.find((s) => s.id === active)?.label}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                {sections.find((s) => s.id === active)?.desc}
              </p>
            </div>

            <div className="p-6 space-y-6">
              {active === "profile" && (
                <>
                  <Field label="Display Name" hint="Used in comments, messages, and your public profile URL">
                    <input
                      type="text"
                      value={settings.displayName}
                      onChange={(e) => update("displayName", e.target.value)}
                      placeholder="Your name…"
                      className="w-full bg-transparent border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors"
                    />
                    {settings.displayName && (
                      <p className="text-xs text-muted-foreground mt-1.5">
                        Your portfolio: <span className="font-mono text-foreground/70">/profile/{encodeURIComponent(settings.displayName)}</span>
                      </p>
                    )}
                  </Field>

                  <Field label="Bio" hint="A short description shown on your profile">
                    <textarea
                      rows={3}
                      value={settings.bio}
                      onChange={(e) => update("bio", e.target.value)}
                      placeholder="Photographer based in…"
                      className="w-full bg-transparent border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors resize-none"
                    />
                  </Field>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Location">
                      <input
                        type="text"
                        value={settings.location}
                        onChange={(e) => update("location", e.target.value)}
                        placeholder="Paris, France"
                        className="w-full bg-transparent border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors"
                      />
                    </Field>
                    <Field label="Website">
                      <input
                        type="url"
                        value={settings.website}
                        onChange={(e) => update("website", e.target.value)}
                        placeholder="https://yoursite.com"
                        className="w-full bg-transparent border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors"
                      />
                    </Field>
                  </div>

                  <div className="border-t border-border/40 pt-5">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-4">Social Links</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Instagram">
                        <div className="flex items-center border border-border focus-within:border-foreground transition-colors">
                          <div className="flex items-center gap-2 px-3 py-2.5 border-r border-border text-muted-foreground">
                            <Instagram className="w-4 h-4" />
                            <span className="text-sm">@</span>
                          </div>
                          <input
                            type="text"
                            value={settings.instagram}
                            onChange={(e) => update("instagram", e.target.value.replace(/^@/, ""))}
                            placeholder="username"
                            className="flex-1 bg-transparent px-3 py-2.5 text-sm focus:outline-none placeholder:text-muted-foreground/40"
                          />
                        </div>
                      </Field>
                      <Field label="Twitter / X">
                        <div className="flex items-center border border-border focus-within:border-foreground transition-colors">
                          <div className="flex items-center gap-2 px-3 py-2.5 border-r border-border text-muted-foreground">
                            <Twitter className="w-4 h-4" />
                            <span className="text-sm">@</span>
                          </div>
                          <input
                            type="text"
                            value={settings.twitter}
                            onChange={(e) => update("twitter", e.target.value.replace(/^@/, ""))}
                            placeholder="username"
                            className="flex-1 bg-transparent px-3 py-2.5 text-sm focus:outline-none placeholder:text-muted-foreground/40"
                          />
                        </div>
                      </Field>
                    </div>
                  </div>
                </>
              )}

              {active === "notifications" && (
                <>
                  <ToggleRow
                    label="Comments"
                    desc="When someone comments on your photos"
                    checked={settings.notifyComments}
                    onChange={(v) => update("notifyComments", v)}
                  />
                  <ToggleRow
                    label="Likes"
                    desc="When someone likes one of your photos"
                    checked={settings.notifyLikes}
                    onChange={(v) => update("notifyLikes", v)}
                  />
                  <ToggleRow
                    label="Messages"
                    desc="When you receive a new direct message"
                    checked={settings.notifyMessages}
                    onChange={(v) => update("notifyMessages", v)}
                  />
                </>
              )}

              {active === "appearance" && (
                <>
                  <ToggleRow
                    label="Compact view"
                    desc="Show smaller photo cards in the gallery"
                    checked={settings.compactView}
                    onChange={(v) => update("compactView", v)}
                  />
                  <ToggleRow
                    label="Autoplay videos"
                    desc="Automatically play animated previews"
                    checked={settings.autoplayVideos}
                    onChange={(v) => update("autoplayVideos", v)}
                  />
                  <div className="border border-border/50 bg-muted/20 px-5 py-4 text-sm text-muted-foreground">
                    Affuaa uses a dark, cinema-inspired theme. Light mode coming soon.
                  </div>
                </>
              )}

              {active === "privacy" && (
                <>
                  <div className="space-y-4 text-sm">
                    <div className="border border-border px-5 py-4 space-y-1">
                      <p className="font-medium">Profile visibility</p>
                      <p className="text-muted-foreground">Your uploaded photos are public by default. You can save individual photos as drafts during upload.</p>
                    </div>
                    <div className="border border-border px-5 py-4 space-y-1">
                      <p className="font-medium">Analytics</p>
                      <p className="text-muted-foreground">Anonymous engagement stats (likes, downloads) are always collected to power trending and recommendations.</p>
                    </div>
                    <div className="border border-border px-5 py-4 space-y-1">
                      <p className="font-medium">Messages</p>
                      <p className="text-muted-foreground">Anyone with your display name can send you a message. Manage messages from the Messages page.</p>
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="border-t border-border px-6 py-4 flex items-center justify-between">
              {saved ? (
                <span className="flex items-center gap-2 text-sm text-green-400">
                  <Check className="w-4 h-4" /> Saved
                </span>
              ) : <span />}
              <Button onClick={handleSave} className="rounded-none h-9 px-6 text-sm">
                Save changes
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-medium uppercase tracking-widest text-muted-foreground">{label}</label>
      {hint && <p className="text-xs text-muted-foreground/70 -mt-0.5">{hint}</p>}
      {children}
    </div>
  );
}

function ToggleRow({ label, desc, checked, onChange }: { label: string; desc: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-6 py-3 border-b border-border/40 last:border-0">
      <div>
        <p className="text-sm font-medium">{label}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
      </div>
      <Toggle checked={checked} onChange={onChange} />
    </div>
  );
}
