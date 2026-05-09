import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { omitDevServer } from "@omit-design/dev-server";

export default defineConfig({
  plugins: [react(), omitDevServer()],
  server: {
    port: 5173,
  },
});
