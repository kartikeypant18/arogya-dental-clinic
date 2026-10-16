import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: __dirname,
  plugins: [react()],
  server: {
    middlewareMode: true
  },
  appType: "spa",
  build: {
    outDir: "dist",
    emptyOutDir: true
  }
});
