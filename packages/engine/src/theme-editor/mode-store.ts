/**
 * Theme drawer mode store —— 抽屉的"窄抽屉 vs 全屏浮卡"开关。
 *
 * 仅内存状态，刷新即回 drawer。目前不持久化（用户偏好下次再加）。
 * 全局共享：从 ProjectDetail / DesignFrame 任意位置触发 theme 工具，都共用同一个 mode。
 */
import { create } from "zustand";

export type ThemeEditorMode = "drawer" | "fullscreen";

interface ThemeEditorModeState {
  mode: ThemeEditorMode;
  setMode: (mode: ThemeEditorMode) => void;
  toggleMode: () => void;
}

export const useThemeEditorMode = create<ThemeEditorModeState>((set, get) => ({
  mode: "drawer",
  setMode: (mode) => set({ mode }),
  toggleMode: () => {
    set({ mode: get().mode === "drawer" ? "fullscreen" : "drawer" });
  },
}));
