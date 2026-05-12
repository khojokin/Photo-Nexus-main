import { createContext, useContext, useState, useCallback } from "react";

interface UploadProgressContextValue {
  activeUploads: number;
  avgProgress: number;
  setUploadStats: (active: number, avg: number) => void;
}

const UploadProgressContext = createContext<UploadProgressContextValue>({
  activeUploads: 0,
  avgProgress: 0,
  setUploadStats: () => {},
});

export function UploadProgressProvider({ children }: { children: React.ReactNode }) {
  const [stats, setStats] = useState({ active: 0, avg: 0 });

  const setUploadStats = useCallback((active: number, avg: number) => {
    setStats({ active, avg });
  }, []);

  return (
    <UploadProgressContext.Provider
      value={{
        activeUploads: stats.active,
        avgProgress: stats.avg,
        setUploadStats,
      }}
    >
      {children}
    </UploadProgressContext.Provider>
  );
}

export function useUploadProgress() {
  return useContext(UploadProgressContext);
}
