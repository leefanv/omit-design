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
    description: "画布预览 · 多分组多页面 demo",
    icon: "🎨",
    preset: presetMobileManifest,
    groups: [
      { id: "main", label: "主页", icon: "🏠" },
      { id: "orders", label: "订单", icon: "🧾" },
      { id: "products", label: "商品", icon: "📦" },
      { id: "members", label: "会员", icon: "👥" },
      { id: "settings", label: "设置", icon: "⚙️" },
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
