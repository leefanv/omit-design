import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { EngineRoot } from "@omit-design/engine/registry";
import { globDiscovery, type DesignModule } from "@omit-design/engine/discovery";
import { presetMobileManifest } from "@omit-design/preset-mobile/preset.manifest";
import "@omit-design/preset-mobile";
import "../preset/theme.css";
import App from "./App";

const designModules = import.meta.glob<DesignModule>(
  "/design/**/*.tsx",
  { eager: true }
);

const source = globDiscovery({
  project: {
    id: "playground",
    name: "Playground",
    description: "Canvas preview · multi-group multi-page demo",
    icon: "🎨",
    preset: presetMobileManifest,
    groups: [
      { id: "main", label: "Main", icon: "🏠" },
      { id: "orders", label: "Orders", icon: "🧾" },
      { id: "products", label: "Products", icon: "📦" },
      { id: "members", label: "Members", icon: "👥" },
      { id: "settings", label: "Settings", icon: "⚙️" },
    ],
  },
  modules: designModules,
});

const root = document.getElementById("root");
if (!root) throw new Error("#root not found in index.html");

createRoot(root).render(
  <BrowserRouter>
    <EngineRoot source={source}>
      <App />
    </EngineRoot>
  </BrowserRouter>
);
