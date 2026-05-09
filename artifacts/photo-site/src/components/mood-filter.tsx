import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

interface Mood {
  id: string;
  label: string;
  description: string;
  tags: string[];
}

const MOOD_ICONS: Record<string, string> = {
  moody: "🌑",
  serene: "🌊",
  vibrant: "🎨",
  epic: "🏔️",
  intimate: "👁️",
  golden: "🌅",
  monochrome: "⬛",
  wild: "🦋",
};

interface MoodFilterProps {
  activeMood: string | null;
  onMoodChange: (mood: string | null) => void;
}

export function MoodFilter({ activeMood, onMoodChange }: MoodFilterProps) {
  const [moods, setMoods] = useState<Mood[]>([]);

  useEffect(() => {
    fetch("/api/recommendations/moods")
      .then((r) => r.json())
      .then((d: { moods: Mood[] }) => setMoods(d.moods ?? []))
      .catch(() => {});
  }, []);

  if (moods.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">Mood</span>
        {activeMood && (
          <button
            onClick={() => onMoodChange(null)}
            className="text-xs text-muted-foreground hover:text-foreground border-b border-transparent hover:border-muted transition-colors ml-2"
          >
            Clear
          </button>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {moods.map((mood) => (
          <button
            key={mood.id}
            onClick={() => onMoodChange(activeMood === mood.id ? null : mood.id)}
            title={mood.description}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 text-xs border transition-all",
              activeMood === mood.id
                ? "border-foreground bg-foreground text-background"
                : "border-border/50 text-muted-foreground hover:border-foreground/50 hover:text-foreground"
            )}
          >
            <span className="text-sm leading-none">{MOOD_ICONS[mood.id] ?? "✦"}</span>
            {mood.label}
          </button>
        ))}
      </div>
    </div>
  );
}
