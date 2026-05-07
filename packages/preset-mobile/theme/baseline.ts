/**
 * preset-mobile theme baseline —— theme editor 用这个值作 published 基准。
 * 历史名 `lightPreset`，2026-04-25 重命名为 baseline 与 desktop 对齐；
 * 老符号 `lightPreset` 仍 re-export 兼容（[presets/light.ts](./presets/light.ts)）。
 *
 * ⚠️ 改 [variables.css](./variables.css) 时同步改这里，否则 baseline 偏移。
 * 改完 bump engine/theme-editor/store.ts 里的 `version`。
 */
export const baseline = {
  name: "Default Light",
  colors: {
    primary: "#0d8ce9",
    secondary: "#00cfff",
    tertiary: "#e56e35",
    success: "#22c55e",
    warning: "#e56e35",
    danger: "#da342e",
    dark: "#1f2024",
    medium: "#90909a",
    light: "#dbd9e0",
  },
  spacing: {
    xs: "4px",
    sm: "8px",
    md: "12px",
    lg: "16px",
    xl: "24px",
    "2xl": "32px",
  },
} as const;

export type MobileThemeBaseline = typeof baseline;
