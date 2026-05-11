import type { ThemeValues } from "./store";

/**
 * BootstrapBanner 在用户没有 Figma 链接时提供的兜底入口：8 个预设主题色。
 *
 * 每个 palette 至少填齐 preset-mobile 的 9 个 semanticColors
 * （primary / secondary / tertiary / success / warning / danger / dark / medium / light）。
 * spacing 沿用 baseline，不在 palette 中覆盖 —— 主题色样本只接管颜色。
 *
 * preview 给 4 个 hex 用于 swatch 显示（通常是 primary / secondary / tertiary / dark）。
 */
export interface BuiltInPalette {
  id: string;
  name: string;
  description: string;
  preview: string[];
  values: Partial<ThemeValues>;
}

export const BUILT_IN_PALETTES: BuiltInPalette[] = [
  {
    id: "latte",
    name: "奶咖",
    description: "暖米 + 焦糖，咖啡馆 / 生活方式",
    preview: ["#a8693a", "#d4a574", "#e07b39", "#3a2a1f"],
    values: {
      colors: {
        primary: "#a8693a",
        secondary: "#d4a574",
        tertiary: "#e07b39",
        success: "#7a9b6e",
        warning: "#e07b39",
        danger: "#c75450",
        dark: "#3a2a1f",
        medium: "#8a7560",
        light: "#f3ebe0",
      },
    },
  },
  {
    id: "midnight",
    name: "暗黑科技",
    description: "深蓝 + 青绿强调，后台 / 监控",
    preview: ["#3b82f6", "#10b981", "#8b5cf6", "#0f172a"],
    values: {
      colors: {
        primary: "#3b82f6",
        secondary: "#10b981",
        tertiary: "#8b5cf6",
        success: "#22c55e",
        warning: "#f59e0b",
        danger: "#ef4444",
        dark: "#0f172a",
        medium: "#64748b",
        light: "#1e293b",
      },
    },
  },
  {
    id: "nordic",
    name: "北欧极简",
    description: "白灰 + 黑强调，工具 / 文档",
    preview: ["#1a1a1a", "#5e6573", "#0066cc", "#0a0a0a"],
    values: {
      colors: {
        primary: "#1a1a1a",
        secondary: "#5e6573",
        tertiary: "#0066cc",
        success: "#2d8659",
        warning: "#c97a1e",
        danger: "#c0392b",
        dark: "#0a0a0a",
        medium: "#8a8f97",
        light: "#eef0f2",
      },
    },
  },
  {
    id: "vivid-orange",
    name: "活力橙",
    description: "橙 + 深蓝，电商 / 运营",
    preview: ["#ff6b35", "#1e3a8a", "#fbbf24", "#1c1917"],
    values: {
      colors: {
        primary: "#ff6b35",
        secondary: "#1e3a8a",
        tertiary: "#fbbf24",
        success: "#10b981",
        warning: "#f59e0b",
        danger: "#dc2626",
        dark: "#1c1917",
        medium: "#78716c",
        light: "#fef3e8",
      },
    },
  },
  {
    id: "morandi",
    name: "莫兰迪",
    description: "低饱和粉绿灰，内容 / 阅读",
    preview: ["#a8a29e", "#9caf88", "#d4a5a5", "#3f3a3a"],
    values: {
      colors: {
        primary: "#a8a29e",
        secondary: "#9caf88",
        tertiary: "#d4a5a5",
        success: "#9caf88",
        warning: "#d4a574",
        danger: "#b87575",
        dark: "#3f3a3a",
        medium: "#857d7a",
        light: "#ede8e3",
      },
    },
  },
  {
    id: "neon-purple",
    name: "霓虹紫",
    description: "深紫 + 品红，娱乐 / 游戏",
    preview: ["#a855f7", "#ec4899", "#06b6d4", "#1a0b2e"],
    values: {
      colors: {
        primary: "#a855f7",
        secondary: "#ec4899",
        tertiary: "#06b6d4",
        success: "#10b981",
        warning: "#fbbf24",
        danger: "#f43f5e",
        dark: "#1a0b2e",
        medium: "#6b5b8c",
        light: "#2d1b4e",
      },
    },
  },
  {
    id: "forest",
    name: "森林绿",
    description: "墨绿 + 米白，户外 / 自然",
    preview: ["#2d5a3d", "#a8c4a2", "#c97a1e", "#1c2e1c"],
    values: {
      colors: {
        primary: "#2d5a3d",
        secondary: "#a8c4a2",
        tertiary: "#c97a1e",
        success: "#5a9b6e",
        warning: "#d4a574",
        danger: "#b54040",
        dark: "#1c2e1c",
        medium: "#6e7d6e",
        light: "#f0eee5",
      },
    },
  },
  {
    id: "sea-salt",
    name: "海盐蓝",
    description: "浅蓝 + 珊瑚，旅行 / 海洋",
    preview: ["#3a9bb8", "#7dcfdb", "#ff8a65", "#1a3a4a"],
    values: {
      colors: {
        primary: "#3a9bb8",
        secondary: "#7dcfdb",
        tertiary: "#ff8a65",
        success: "#4dbfa8",
        warning: "#ffb74d",
        danger: "#e57373",
        dark: "#1a3a4a",
        medium: "#6e8a96",
        light: "#e8f3f5",
      },
    },
  },
];
