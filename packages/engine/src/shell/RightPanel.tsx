import { useEffect, useState } from "react";
import { useInspectStore } from "../inspect/store";
import { InspectInspector } from "../inspect/InspectInspector";
import { ThemePanel } from "../theme-editor/ThemePanel";
import { OverviewPanel } from "./panels/OverviewPanel";

type TabId = "overview" | "inspect" | "theme";
const TAB_STORAGE_KEY = "omit-engine-right-tab";

const TABS: Array<{ id: TabId; icon: string; label: string }> = [
  { id: "overview", icon: "⊕", label: "概览" },
  { id: "inspect", icon: "📐", label: "标注" },
  { id: "theme", icon: "🎨", label: "主题" },
];

function loadTab(): TabId {
  const saved = localStorage.getItem(TAB_STORAGE_KEY);
  if (saved === "overview" || saved === "inspect" || saved === "theme") return saved;
  return "overview";
}

export function RightPanel() {
  const [tab, setTab] = useState<TabId>(loadTab);
  const setEnabled = useInspectStore((s) => s.setEnabled);
  const selected = useInspectStore((s) => s.selected);

  // tab 切换驱动 Inspect mode 启停（Figma 风格：tabs 互斥）
  useEffect(() => {
    setEnabled(tab === "inspect");
    localStorage.setItem(TAB_STORAGE_KEY, tab);
  }, [tab, setEnabled]);

  // 用户点画布上的元素 → 强制切到标注 tab
  useEffect(() => {
    if (selected) setTab("inspect");
  }, [selected]);

  return (
    <aside className="shell-right-panel" data-no-inspect>
      <nav className="shell-right-panel__tabs" role="tablist">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={`shell-right-panel__tab ${tab === t.id ? "active" : ""}`}
            onClick={() => setTab(t.id)}
          >
            <span className="shell-right-panel__tab-icon">{t.icon}</span>
            <span className="shell-right-panel__tab-label">{t.label}</span>
          </button>
        ))}
      </nav>

      <div className="shell-right-panel__content">
        {tab === "overview" && <OverviewPanel />}
        {tab === "inspect" && <InspectInspector />}
        {tab === "theme" && <ThemePanel variant="aside" />}
      </div>
    </aside>
  );
}
