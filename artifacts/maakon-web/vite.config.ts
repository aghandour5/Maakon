import "dotenv/config";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

// --- Port ---
const rawPort = process.env.PORT;
const port =
  rawPort && !Number.isNaN(Number(rawPort)) && Number(rawPort) > 0
    ? Number(rawPort)
    : 5173; // local default

// --- Base path ---
const basePath = process.env.BASE_PATH ?? "/"; // local default

// --- API proxy target ---
const apiTarget = process.env.API_URL ?? "http://localhost:3001";

const forbiddenClientEnvKeys = [
  "VITE_SUPABASE_SERVICE_ROLE_KEY",
  "VITE_SUPABASE_SECRET_KEY",
];

for (const envKey of forbiddenClientEnvKeys) {
  if (process.env[envKey]) {
    throw new Error(
      `${envKey} must not be configured in the frontend app. Use only VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in artifacts/maakon-web/.env.`,
    );
  }
}

export default defineConfig({
  base: basePath,
  envPrefix: "VITE_",
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src"),
    },
    dedupe: ["react", "react-dom", "@tanstack/react-query"],
  },
  root: path.resolve(import.meta.dirname),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true,
  },
  server: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
    fs: {
      strict: true,
      deny: ["**/.*"],
    },
    proxy: {
      "/api": {
        target: apiTarget,
        changeOrigin: true,
      },
    },
  },
  preview: {
    port,
    host: "0.0.0.0",
    allowedHosts: true,
  },
});
