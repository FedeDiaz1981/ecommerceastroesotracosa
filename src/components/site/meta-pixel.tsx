"use client";

import { useEffect, useState } from "react";

export function MetaPixel({ fallbackPixelId = "" }: { fallbackPixelId?: string }) {
  const [pixelId, setPixelId] = useState(fallbackPixelId);

  useEffect(() => {
    let active = true;

    void fetch("/api/meta-pixel.php", { headers: { Accept: "application/json" } })
      .then(async (response) => {
        if (!response.ok) throw new Error("No se pudo obtener la configuracion del pixel.");
        return response.json() as Promise<{ pixelId?: string }>;
      })
      .then((data) => {
        const configuredPixelId = String(data.pixelId ?? "").trim();
        if (active && configuredPixelId) setPixelId(configuredPixelId);
      })
      .catch(() => {
        // Durante el desarrollo estatico se conserva la configuracion de respaldo.
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!pixelId || typeof window === "undefined") return;
    const metaWindow = window as typeof window & { fbq?: (...args: unknown[]) => void; _fbq?: unknown };
    if (!metaWindow.fbq) {
      const fbq = (...args: unknown[]) => { (fbq as typeof fbq & { queue: unknown[][] }).queue.push(args); };
      (fbq as typeof fbq & { queue: unknown[][]; loaded: boolean; version: string }).queue = [];
      (fbq as typeof fbq & { loaded: boolean }).loaded = true;
      (fbq as typeof fbq & { version: string }).version = "2.0";
      metaWindow.fbq = fbq;
      metaWindow._fbq = fbq;
      const script = document.createElement("script");
      script.async = true;
      script.src = "https://connect.facebook.net/en_US/fbevents.js";
      document.head.appendChild(script);
    }
    metaWindow.fbq("init", pixelId);
    metaWindow.fbq("track", "PageView");
  }, [pixelId]);

  return null;
}
