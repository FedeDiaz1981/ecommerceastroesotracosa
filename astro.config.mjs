import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import tailwindcss from "@tailwindcss/vite";
import { fileURLToPath } from "node:url";

const srcPath = fileURLToPath(new URL("./src", import.meta.url));

export default defineConfig({
  output: "static",
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        "@": srcPath,
        "next/link": fileURLToPath(new URL("./src/shims/next-link.tsx", import.meta.url)),
        "next/image": fileURLToPath(new URL("./src/shims/next-image.tsx", import.meta.url)),
        "next/navigation": fileURLToPath(new URL("./src/shims/next-navigation.ts", import.meta.url)),
      },
    },
  },
});
