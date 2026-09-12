"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { ViewerSession } from "@/domain/viewer";

type ViewerContextValue = {
  viewer: ViewerSession | null;
  setViewer: (viewer: ViewerSession | null) => void;
};

const ViewerContext = createContext<ViewerContextValue | null>(null);
const VIEWER_STORAGE_KEY = "pintofruta_viewer_v1";

export function ViewerProvider({
  initialViewer,
  children,
}: {
  initialViewer: ViewerSession | null;
  children: ReactNode;
}) {
  const [viewer, setViewerState] = useState<ViewerSession | null>(initialViewer);

  useEffect(() => {
    const raw = window.localStorage.getItem(VIEWER_STORAGE_KEY);
    if (!raw) {
      return;
    }

    try {
      const storedViewer = JSON.parse(raw) as ViewerSession;
      if (storedViewer?.authenticated) {
        setViewerState(storedViewer);
      }
    } catch {
      window.localStorage.removeItem(VIEWER_STORAGE_KEY);
    }
  }, []);

  const setViewer = useCallback((nextViewer: ViewerSession | null) => {
    setViewerState(nextViewer);
    if (nextViewer) {
      window.localStorage.setItem(VIEWER_STORAGE_KEY, JSON.stringify(nextViewer));
    } else {
      window.localStorage.removeItem(VIEWER_STORAGE_KEY);
    }
  }, []);

  const value = useMemo<ViewerContextValue>(
    () => ({
      viewer,
      setViewer,
    }),
    [setViewer, viewer],
  );

  return <ViewerContext.Provider value={value}>{children}</ViewerContext.Provider>;
}

export function useViewer() {
  const context = useContext(ViewerContext);

  if (!context) {
    throw new Error("useViewer debe usarse dentro de ViewerProvider");
  }

  return context.viewer;
}

export function useViewerActions() {
  const context = useContext(ViewerContext);

  if (!context) {
    throw new Error("useViewerActions debe usarse dentro de ViewerProvider");
  }

  return {
    setViewer: context.setViewer,
  };
}

