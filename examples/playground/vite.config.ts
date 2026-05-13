import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { omitDevServer } from "@omit-design/dev-server";

export default defineConfig({
  plugins: [
    react(),
    omitDevServer({
      project: {
        id: "playground",
        name: "Playground",
        description: "Canvas preview · multi-group multi-page demo",
        icon: "🎨",
        chrome: "mobile",
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
