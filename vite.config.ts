// Standard Vite config replacing the previous @lovable.dev wrapper.
// If you relied on additional behaviors from the old wrapper (TanStack Start
// defaults, cloudflare build helpers, component tagging), we can re-add them
// explicitly later. For now this provides a minimal Vite setup.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

export default defineConfig({
  plugins: [react(), tsconfigPaths(), tailwindcss()],
  resolve: {
    alias: {
      "node:async_hooks": path.resolve(__dirname, "src/shims/async_hooks.ts"),
    },
  },
  server: {
    port: 5173,
  },
});
