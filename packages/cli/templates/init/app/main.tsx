import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { EngineRoot } from "@omit-design/engine/registry";
import { globDiscovery, type DesignModule } from "@omit-design/engine/discovery";
import { presetMobileManifest } from "@omit-design/preset-mobile/preset.manifest";
import "@omit-design/preset-mobile";
import "../preset/theme.css";
import App from "./App";

// import.meta.glob 在编译期由 Vite 静态扫描;模式必须是字面量
const designModules = import.meta.glob<DesignModule>(
  "/design/**/*.tsx",
  { eager: true }
);

const source = globDiscovery({
  project: {
    id: "app",
    name: "App",
    description: "omit-design 项目",
    icon: "🧩",
    preset: presetMobileManifest,
    groups: [{ id: "main", label: "主页" }],
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
