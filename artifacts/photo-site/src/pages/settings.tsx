import { useState, useEffect, useRef } from "react";
import { Layout } from "@/components/layout";
import { useTheme } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Check, User, Bell, Palette, Shield, ChevronRight, Instagram, Twitter, Download as DownloadIcon, Camera, LifeBuoy, Mail, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

const SETTINGS_KEY = "affuaa_settings";

interface Settings {
  profileImageDataUrl: string;
  displayName: string;
  bio: string;
  location: string;
  website: string;
  instagram: string;
  twitter: string;
  equipment: string;
  styleTags: string;
  hireMeUrl: string;
  availableForHire: boolean;
  notifyComments: boolean;
  notifyLikes: boolean;
  notifyMessages: boolean;
  notifyFollows: boolean;
  notifyChallenges: boolean;
  compactView: boolean;
  autoplayVideos: boolean;
  accentColor: string;
  publicProfile: boolean;
}

const defaultSettings: Settings = {
  profileImageDataUrl: "",
  displayName: "",
  bio: "",
  location: "",
  website: "",
  instagram: "",
  twitter: "",
  equipment: "",
  styleTags: "",
  hireMeUrl: "",
  availableForHire: false,
  notifyComments: true,
  notifyLikes: true,
  notifyMessages: true,
  notifyFollows: true,
  notifyChallenges: true,
  compactView: false,
  autoplayVideos: false,
  accentColor: "#ffffff",
  publicProfile: true,
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

type Section = "profile" | "notifications" | "appearance" | "privacy" | "support";

const sections: { id: Section; label: string; icon: React.ElementType; desc: string }[] = [
  { id: "profile", label: "Profile", icon: User, desc: "Your public display name, bio, and social links" },
  { id: "notifications", label: "Notifications", icon: Bell, desc: "What you get notified about" },
  { id: "appearance", label: "Appearance", icon: Palette, desc: "Display and layout preferences" },
  { id: "privacy", label: "Privacy", icon: Shield, desc: "Visibility and data controls" },
  { id: "support", label: "Help & Support", icon: LifeBuoy, desc: "Get help, report issues, and contact support" },
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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { theme, setTheme } = useTheme();

  function update<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((s) => ({ ...s, [key]: value }));
    setSaved(false);
  }

  function handleSave() {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  function handleChooseProfileImage() {
    fileInputRef.current?.click();
  }

  function handleProfileImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadError(null);

    if (!file.type.startsWith("image/")) {
      setUploadError("Please select an image file.");
      e.currentTarget.value = "";
      return;
    }

    const maxBytes = 3 * 1024 * 1024;
    if (file.size > maxBytes) {
      setUploadError("Image is too large. Please use a file under 3MB.");
      e.currentTarget.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const result = typeof reader.result === "string" ? reader.result : "";
      if (!result) {
        setUploadError("Could not read image. Please try another file.");
        return;
      }
      update("profileImageDataUrl", result);
    };
    reader.onerror = () => {
      setUploadError("Could not read image. Please try another file.");
    };
    reader.readAsDataURL(file);
    e.currentTarget.value = "";
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
                  <Field label="Profile Picture" hint="Upload a photo to use on your profile">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfileImageChange}
                      className="hidden"
                    />

                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full border border-border overflow-hidden bg-muted/40 flex items-center justify-center">
                        {settings.profileImageDataUrl ? (
                          <img
                            src={settings.profileImageDataUrl}
                            alt="Profile preview"
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" onClick={handleChooseProfileImage}>
                          Upload picture
                        </Button>
                        {settings.profileImageDataUrl && (
                          <Button
                            type="button"
                            variant="ghost"
                            onClick={() => update("profileImageDataUrl", "")}
                          >
                            Remove
                          </Button>
                        )}
                      </div>
                    </div>

                    {uploadError && <p className="text-xs text-red-400 mt-2">{uploadError}</p>}
                  </Field>

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

                  <Field label="Equipment" hint="Cameras, lenses, and gear you use">
                    <div className="flex items-center border border-border focus-within:border-foreground transition-colors px-3 py-2.5 gap-2">
                      <Camera className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                      <input
                        type="text"
                        value={settings.equipment}
                        onChange={(e) => update("equipment", e.target.value)}
                        placeholder="Sony A7IV, 85mm f/1.4…"
                        className="flex-1 bg-transparent text-sm focus:outline-none placeholder:text-muted-foreground/40"
                      />
                    </div>
                  </Field>

                  <Field label="Style Tags" hint="Comma-separated photography styles (shown on your profile)">
                    <input
                      type="text"
                      value={settings.styleTags}
                      onChange={(e) => update("styleTags", e.target.value)}
                      placeholder="landscape, long exposure, minimalism…"
                      className="w-full bg-transparent border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors"
                    />
                    {settings.styleTags && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {settings.styleTags.split(",").map((t) => t.trim()).filter(Boolean).map((t) => (
                          <span key={t} className="px-2 py-0.5 text-xs border border-border/50 text-muted-foreground">{t}</span>
                        ))}
                      </div>
                    )}
                  </Field>

                  <div className="border-t border-border/40 pt-5 space-y-4">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground">Hire Me</p>
                    <ToggleRow
                      label="Available for hire"
                      desc="Show a 'Hire Me' badge on your profile"
                      checked={settings.availableForHire}
                      onChange={(v) => update("availableForHire", v)}
                    />
                    {settings.availableForHire && (
                      <Field label="Contact / Booking URL">
                        <input
                          type="url"
                          value={settings.hireMeUrl}
                          onChange={(e) => update("hireMeUrl", e.target.value)}
                          placeholder="https://calendly.com/yourname"
                          className="w-full bg-transparent border border-border px-3 py-2.5 text-sm focus:outline-none focus:border-foreground transition-colors"
                        />
                      </Field>
                    )}
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
                  <ToggleRow
                    label="Follows"
                    desc="When someone starts following you"
                    checked={settings.notifyFollows}
                    onChange={(v) => update("notifyFollows", v)}
                  />
                  <ToggleRow
                    label="Challenges"
                    desc="New photo challenges and contest results"
                    checked={settings.notifyChallenges}
                    onChange={(v) => update("notifyChallenges", v)}
                  />
                </>
              )}

              {active === "appearance" && (
                <>
                  <Field label="Theme" hint="Choose your viewing mode">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {([
                        { key: "light", label: "Light", desc: "Clean daylight look" },
                        { key: "dark", label: "Dark", desc: "Focused low-light look" },
                        { key: "sepia", label: "Sepia", desc: "Warm editorial look" },
                      ] as const).map((option) => (
                        <button
                          key={option.key}
                          type="button"
                          onClick={() => setTheme(option.key)}
                          className={cn(
                            "border px-3 py-3 text-left transition-colors",
                            theme === option.key
                              ? "border-foreground bg-muted"
                              : "border-border hover:border-foreground/50"
                          )}
                        >
                          <p className="text-sm font-medium">{option.label}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">{option.desc}</p>
                        </button>
                      ))}
                    </div>
                  </Field>
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
                  <Field label="Accent Color" hint="Used for highlights on your profile page">
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={settings.accentColor}
                        onChange={(e) => update("accentColor", e.target.value)}
                        className="w-10 h-10 border border-border cursor-pointer bg-transparent"
                      />
                      <span className="font-mono text-sm text-muted-foreground">{settings.accentColor.toUpperCase()}</span>
                    </div>
                  </Field>
                </>
              )}

              {active === "privacy" && (
                <>
                  <ToggleRow
                    label="Public profile"
                    desc="Allow anyone to view your profile and portfolio"
                    checked={settings.publicProfile}
                    onChange={(v) => update("publicProfile", v)}
                  />
                  <div className="space-y-4 text-sm">
                    <div className="border border-border px-5 py-4 space-y-1">
                      <p className="font-medium">Profile visibility</p>
                      <p className="text-muted-foreground">Your uploaded photos are public by default. You can save individual photos as drafts during upload.</p>
                    </div>
                    <div className="border border-border px-5 py-4 space-y-1">
                      <p className="font-medium">Analytics</p>
                      <p className="text-muted-foreground">Anonymous engagement stats (likes, downloads, views) are always collected to power trending and recommendations.</p>
                    </div>
                    <div className="border border-border px-5 py-4 space-y-1">
                      <p className="font-medium">Messages</p>
                      <p className="text-muted-foreground">Anyone with your display name can send you a message. Manage messages from the Messages page.</p>
                    </div>
                  </div>
                  <div className="border-t border-border/40 pt-5">
                    <p className="text-xs font-medium uppercase tracking-widest text-muted-foreground mb-3">Data</p>
                    <button
                      onClick={() => {
                        const data = JSON.stringify({ settings }, null, 2);
                        const blob = new Blob([data], { type: "application/json" });
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url; a.download = "affuaa-data.json"; a.click();
                        URL.revokeObjectURL(url);
                      }}
                      className="flex items-center gap-2 px-4 py-2.5 border border-border/50 text-sm text-muted-foreground hover:text-foreground hover:border-foreground/50 transition-colors"
                    >
                      <DownloadIcon className="w-4 h-4" />
                      Export my data
                    </button>
                  </div>
                </>
              )}

              {active === "support" && (
                <>
                  <div className="space-y-4 text-sm">
                    <div className="border border-border px-5 py-4 space-y-2">
                      <p className="font-medium">Need help quickly?</p>
                      <p className="text-muted-foreground">Visit Notifications for account activity, message alerts, and recent updates.</p>
                      <a
                        href="/notifications"
                        className="inline-flex items-center gap-2 text-sm text-foreground hover:opacity-80 transition-opacity"
                      >
                        Open Notifications
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>

                    <div className="border border-border px-5 py-4 space-y-2">
                      <p className="font-medium">Contact Support</p>
                      <p className="text-muted-foreground">For account, billing, or upload issues, email us and we will respond as soon as possible.</p>
                      <a
                        href="mailto:support@affuaa.com?subject=Affuaa%20Support%20Request"
                        className="inline-flex items-center gap-2 text-sm text-foreground hover:opacity-80 transition-opacity"
                      >
                        <Mail className="w-4 h-4" />
                        support@affuaa.com
                      </a>
                    </div>

                    <div className="border border-border px-5 py-4 space-y-1">
                      <p className="font-medium">Report a bug</p>
                      <p className="text-muted-foreground">Please include your browser, device, and what action caused the issue.</p>
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
