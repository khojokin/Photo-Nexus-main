import { createContext, useContext, useCallback, useState, useEffect } from "react";

const STORAGE_KEY = "affuaa_taste_tags";
const MAX_TAGS = 30;

interface TasteProfileContext {
  tasteTags: string[];
  recordInteraction: (tags: string[]) => void;
  clearProfile: () => void;
}

const TasteProfileCtx = createContext<TasteProfileContext>({
  tasteTags: [],
  recordInteraction: () => {},
  clearProfile: () => {},
});

export function TasteProfileProvider({ children }: { children: React.ReactNode }) {
  const [tasteTags, setTasteTags] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? (JSON.parse(raw) as string[]) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasteTags));
    } catch {}
  }, [tasteTags]);

  const recordInteraction = useCallback((tags: string[]) => {
    if (!tags.length) return;
    setTasteTags((prev) => {
      const frequency: Record<string, number> = {};
      for (const t of prev) frequency[t] = (frequency[t] ?? 0) + 1;
      for (const t of tags) frequency[t] = (frequency[t] ?? 0) + 2;
      return Object.entries(frequency)
        .sort((a, b) => b[1] - a[1])
        .slice(0, MAX_TAGS)
        .map(([tag]) => tag);
    });
  }, []);

  const clearProfile = useCallback(() => {
    setTasteTags([]);
    try { localStorage.removeItem(STORAGE_KEY); } catch {}
  }, []);

  return (
    <TasteProfileCtx.Provider value={{ tasteTags, recordInteraction, clearProfile }}>
      {children}
    </TasteProfileCtx.Provider>
  );
}

export function useTasteProfile() {
  return useContext(TasteProfileCtx);
}
