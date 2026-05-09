import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import {
  Accessibility,
  Hand,
  MousePointer2,
  Palette,
  Ruler,
  SquareDashed,
  type LucideIcon,
} from "lucide-react";
import { InspectOverlay } from "../inspect/InspectOverlay";
import { useProjects, useProjectByHref } from "../registry";
import type { PresetManifest } from "../preset";
import { Sidebar } from "./Sidebar";
import { RightPanel } from "./RightPanel";
import { DeviceToolbar, type Viewport } from "./DeviceToolbar";
import { EmbedCaptureBridge } from "./EmbedCaptureBridge";
import { ToolRail } from "./canvas/ToolRail";
import type { CanvasTool } from "./canvas/canvasStore";
import { useCanvasStore, getPanelOpen } from "./canvas/canvasStore";

interface DesignFrameProps {
  children: ReactNode;
}

/**
 * Embed iframe 模式 shell。在挂载完成后给 documentElement 打 data-embed-ready,
 * 让宿主（缩略图捕获 / canvas 等）知道可以截图了。
 */
function EmbedShell({ children }: { children: ReactNode }) {
  useEffect(() => {
    // 等一帧让子树完成首次绘制，再标 ready
    const id = requestAnimationFrame(() => {
      document.documentElement.dataset.embedReady = "1";
    });
    return () => {
      cancelAnimationFrame(id);
      delete document.documentElement.dataset.embedReady;
    };
  }, []);
  return (
    <div className="shell-embed">
      {children}
      <EmbedCaptureBridge />
    </div>
  );
}

const SIDEBAR_COLLAPSED_KEY = "omit-engine-sidebar-collapsed";
function viewportKey(preset: PresetManifest) {
  return `omit-engine-viewport-${preset.canvas.chrome}`;
}

function loadViewport(preset: PresetManifest): Viewport {
  const fallback: Viewport = { ...preset.canvas.default };
  try {
    const raw = localStorage.getItem(viewportKey(preset));
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.width === "number" &&
      typeof parsed?.height === "number"
    ) {
      return { width: parsed.width, height: parsed.height };
    }
  } catch {
    /* ignore */
  }
  return fallback;
}

const IS_EMBED =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("embed") === "1";

const DESIGN_TOOLS: { id: CanvasTool; icon: LucideIcon; label: string; shortcut: string }[] = [
  { id: "move", icon: MousePointer2, label: "Select", shortcut: "V" },
  { id: "hand", icon: Hand, label: "Pan", shortcut: "H" },
  { id: "inspect", icon: SquareDashed, label: "Inspect", shortcut: "I" },
  { id: "measure", icon: Ruler, label: "Measure", shortcut: "M" },
  { id: "a11y", icon: Accessibility, label: "A11y", shortcut: "A" },
  { id: "theme", icon: Palette, label: "Theme", shortcut: "T" },
];

/**
 * 单页设计稿外框 — 不再套设备 mockup，统一为画布化心智：
 *   ┌──────────┬──────────┬──────────────────┬──────────────┐
 *   │ Sidebar  │ ToolRail │  Stage (no mockup)│  RightPanel │
 *   │ 240/36   │   56     │     flex: 1      │  按需出现    │
 *   └──────────┴──────────┴──────────────────┴──────────────┘
 *
 * 工具：选择 / 拖拽 / 查看标注 / 主题。激活 inspect 或 theme 时右侧面板才显示。
 */
export function DesignFrame({ children }: DesignFrameProps) {
  const location = useLocation();
  const allProjects = useProjects();
  const project = useProjectByHref(location.pathname)?.project ?? allProjects[0];
  const preset = project.preset;

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  });
  const [viewport, setViewport] = useState<Viewport>(() => loadViewport(preset));

  const activeTool = useCanvasStore((s) => s.activeTool);
  const panelOpen = useCanvasStore(getPanelOpen);
  const setTool = useCanvasStore((s) => s.setTool);

  useEffect(() => {
    setViewport(loadViewport(preset));
  }, [preset]);

  // Global keyboard shortcuts — only when not focused on input
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        return;
      }
      // Don't consume modifier shortcuts (cmd/ctrl) so browser/page shortcuts still work
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const k = e.key.toLowerCase();
      if (k === "v") setTool("move");
      else if (k === "h") setTool("hand");
      else if (k === "i") setTool("inspect");
      else if (k === "m") setTool("measure");
      else if (k === "a") setTool("a11y");
      else if (k === "t") setTool("theme");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [setTool]);

  function toggleSidebar() {
    setSidebarCollapsed((v) => {
      const next = !v;
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, next ? "1" : "0");
      return next;
    });
  }

  function updateViewport(next: Viewport) {
    setViewport(next);
    localStorage.setItem(viewportKey(preset), JSON.stringify(next));
  }

  if (IS_EMBED) {
    return <EmbedShell>{children}</EmbedShell>;
  }

  return (
    <div className="shell-workspace" data-tool={activeTool}>
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapsed={toggleSidebar} />
      <ToolRail tools={DESIGN_TOOLS} />

      <div className="shell-design-stage">
        <DeviceToolbar viewport={viewport} onChange={updateViewport} preset={preset} />
        <div className="shell-design-stage__canvas">
          <div
            className="shell-design-frame"
            style={{ width: `${viewport.width}px`, height: `${viewport.height}px` }}
          >
            {children}
          </div>
        </div>
      </div>

      {panelOpen && <RightPanel />}
      <InspectOverlay />
    </div>
  );
}
