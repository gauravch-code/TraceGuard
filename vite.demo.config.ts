import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "demo",
  base: "/TraceGuard/",
  plugins: [react()],
  build: {
    outDir: "../docs",
    emptyOutDir: true,
  },
});
