import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { omitDevServer } from "@omit-design/dev-server";

export default defineConfig({
  // omitDevServer exposes /__omit/* during dev so the workspace's Library page
  // can read/write skills, patterns, and PRDs in this project. Local-only.
  plugins: [react(), omitDevServer()],
  server: {
    port: 5173,
  },
});
