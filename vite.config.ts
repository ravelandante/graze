import { fileURLToPath, URL } from "node:url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

// @ts-expect-error process is a nodejs global
const host = process.env.TAURI_DEV_HOST;

const resolveSrc = (p: string) => fileURLToPath(new URL(p, import.meta.url));

export default defineConfig(async () => ({
  plugins: [react(), tailwindcss()],

  resolve: {
    alias: {
      "@components": resolveSrc("./src/components"),
      "@store": resolveSrc("./src/store"),
      "@lib": resolveSrc("./src/lib"),
      "@hooks": resolveSrc("./src/hooks"),
      "@types": resolveSrc("./src/types"),
    },
  },

  clearScreen: false,
  server: {
    port: 1420,
    strictPort: true,
    host: host || false,
    hmr: host
      ? {
          protocol: "ws",
          host,
          port: 1421,
        }
      : undefined,
    watch: {
      ignored: ["**/src-tauri/**"],
    },
  },
}));
