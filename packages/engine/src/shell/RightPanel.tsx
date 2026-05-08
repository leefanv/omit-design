import { useEffect } from "react";
import { useInspectStore, type InspectMode } from "../inspect/store";
import { InspectInspector } from "../inspect/InspectInspector";
import { ThemePanel } from "../theme-editor/ThemePanel";
import { isInspectTool, useCanvasStore } from "./canvas/canvasStore";

const PANEL_TITLE: Record<string, string> = {
  inspect: "Inspect",
  measure: "Measure",
  a11y: "A11y",
  theme: "Theme",
};

/**
 * 浮卡形态的右侧面板。按 activeTool 显示对应工具的面板。
 * inspect / measure / a11y 是独立工具，分别同步到 inspect store 的 mode + enabled。
 */
export function RightPanel() {
  const activeTool = useCanvasStore((s) => s.activeTool);
  const setEnabled = useInspectStore((s) => s.setEnabled);
  const setMode = useInspectStore((s) => s.setMode);
  const setTool = useCanvasStore((s) => s.setTool);

  // 同步：左栏选哪个 inspect 子工具 → inspect store 的 mode
  useEffect(() => {
    if (isInspectTool(activeTool)) {
      setEnabled(true);
      setMode(activeTool as InspectMode);
    } else {
      setEnabled(false);
    }
    return () => {
      setEnabled(false);
    };
  }, [activeTool, setEnabled, setMode]);

  const title = PANEL_TITLE[activeTool] ?? "";
  const inspectMode = isInspectTool(activeTool);

  return (
    <aside className="shell-right-panel" data-no-inspect>
      <header className="shell-right-panel__head">
        <span className="shell-right-panel__head-title">{title}</span>
        <button
          type="button"
          className="shell-right-panel__close"
          onClick={() => setTool("move")}
          aria-label="关闭面板"
          title="关闭面板"
        >
          ×
        </button>
      </header>
      <div className="shell-right-panel__content">
        {inspectMode && <InspectInspector />}
        {activeTool === "theme" && <ThemePanel variant="aside" />}
      </div>
    </aside>
  );
}
