import { useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { InspectOverlay } from "../inspect/InspectOverlay";
import { useProjects, useProjectByHref } from "../registry";
import type { PresetManifest } from "../preset";
import { Sidebar } from "./Sidebar";
import { RightPanel } from "./RightPanel";
import { DeviceToolbar, type Viewport } from "./DeviceToolbar";
import { EmbedCaptureBridge } from "./EmbedCaptureBridge";

interface DesignFrameProps {
  children: ReactNode;
}

const SIDEBAR_COLLAPSED_KEY = "omit-engine-sidebar-collapsed";
/** 每种 preset 一个 viewport 持久化 key —— 切换不同 chrome 不会丢对方的尺寸。 */
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

/** 缩略图 / 主题预览 iframe 用 ?embed=1 跳过 sidebar / RightPanel / 设备外框，只渲染设计稿本身 */
const IS_EMBED =
  typeof window !== "undefined" &&
  new URLSearchParams(window.location.search).get("embed") === "1";

/**
 * 设计稿外框 — Figma 风格三栏稳态布局：
 *   ┌──────────┬──────────────────┬──────────────┐
 *   │ Sidebar  │  设备 / 显示器外框 │  RightPanel  │
 *   │ 240/36   │     flex: 1       │  360 (tabs)  │
 *   └──────────┴──────────────────┴──────────────┘
 *
 * 当前路由属 mobile project → iPhone 外框（圆角 + 灵动岛 + iOS 状态栏）。
 * 当前路由属 desktop project → 显示器风格外框（小圆角，无 notch / 无状态栏）。
 *
 * RightPanel 内含三个一级 tab：⊕ 概览 / 📐 标注 / 🎨 主题。
 * 切到「标注」自动启用 Inspect 模式；离开则关闭。画布上不再有浮动按钮。
 */
export function DesignFrame({ children }: DesignFrameProps) {
  const location = useLocation();
  const allProjects = useProjects();
  const project = useProjectByHref(location.pathname)?.project ?? allProjects[0];
  const preset = project.preset;
  const chrome = preset.canvas.chrome;

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "1";
  });
  const [viewport, setViewport] = useState<Viewport>(() => loadViewport(preset));

  // 路由切换到不同 preset 的 project 时，载入对应 preset 的持久化 viewport
  useEffect(() => {
    setViewport(loadViewport(preset));
  }, [preset]);

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

  // Embed:缩略图 / 主题预览 iframe 用,去掉外壳装饰,children 撑满;
  // 同时挂 EmbedCaptureBridge,让宿主(figma-plugin 等)通过 postMessage 触发 Figma 导出
  if (IS_EMBED) {
    return (
      <div className="shell-embed">
        {children}
        <EmbedCaptureBridge />
      </div>
    );
  }

  const screenClass = `shell-device-screen shell-device-screen--${chrome}`;

  return (
    <div className="shell-workspace">
      <Sidebar collapsed={sidebarCollapsed} onToggleCollapsed={toggleSidebar} />

      <div className="shell-device-stage">
        <DeviceToolbar viewport={viewport} onChange={updateViewport} preset={preset} />
        <div
          className={screenClass}
          style={{ width: `${viewport.width}px`, height: `${viewport.height}px` }}
        >
          {chrome === "mobile" && (
            <>
              <DeviceStatusBar />
              <div className="shell-device-notch" />
            </>
          )}
          <div className="shell-device-content">{children}</div>
        </div>
      </div>

      <RightPanel />
      <InspectOverlay />
    </div>
  );
}

/** iOS 风格状态栏 mock：左侧时间，右侧信号 / Wifi / 电池 */
function DeviceStatusBar() {
  return (
    <div className="shell-device-statusbar" data-no-inspect>
      <span className="shell-device-statusbar__time">9:41</span>
      <div className="shell-device-statusbar__icons">
        <svg width="17" height="11" viewBox="0 0 17 11" fill="currentColor" aria-hidden>
          <rect x="0"  y="7" width="3" height="4" rx="0.5" />
          <rect x="4"  y="5" width="3" height="6" rx="0.5" />
          <rect x="8"  y="3" width="3" height="8" rx="0.5" />
          <rect x="12" y="0" width="3" height="11" rx="0.5" />
        </svg>
        <svg width="15" height="11" viewBox="0 0 15 11" fill="currentColor" aria-hidden>
          <path d="M7.5 0C4.6 0 1.9 1 0 2.6l1.4 1.4C3 2.7 5.2 1.9 7.5 1.9s4.5.8 6.1 2.1L15 2.6C13.1 1 10.4 0 7.5 0Zm0 4C5.7 4 4 4.6 2.7 5.7l1.4 1.4C5 6.4 6.2 6 7.5 6s2.5.4 3.4 1.1l1.4-1.4C11 4.6 9.3 4 7.5 4Zm0 4c-1 0-1.9.4-2.6 1L7.5 11l2.6-2c-.7-.6-1.6-1-2.6-1Z" />
        </svg>
        <svg width="27" height="12" viewBox="0 0 27 12" fill="none" aria-hidden>
          <rect x="0.5" y="0.5" width="22" height="11" rx="2.5" stroke="currentColor" opacity="0.4" />
          <rect x="2"   y="2"   width="19" height="8"  rx="1.5" fill="currentColor" />
          <rect x="24"  y="4"   width="2"  height="4"  rx="0.7" fill="currentColor" opacity="0.4" />
        </svg>
      </div>
    </div>
  );
}
