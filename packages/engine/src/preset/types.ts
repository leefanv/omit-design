/**
 * Preset manifest — 一个 preset（设计语言层）的全部元数据，由 engine 消费来决定：
 *   - 设备外框（canvas）
 *   - 是否要 setupIonicReact（requiresIonic）
 *   - Inspect 怎么识别业务组件（attributeName + componentPrefix）
 *   - A11y mode 标谁（a11ySelectors）
 *   - Theme editor 编辑哪些 token（semanticColors + tokenPrefixes）
 *
 * 每个 preset 包根目录写一份 `preset.manifest.ts`，typed export 这个 shape。
 * Project 在自己的 registry 里把对应 preset 的 manifest attach 到 DesignProject 上。
 *
 * 设计原则：engine 只读 manifest，不假设具体值（前缀、白名单、画布尺寸都来自 manifest）。
 * 加新 preset = 写一份 manifest + 提供 components。
 */

export interface CanvasPreset {
  label: string;
  width: number;
  height: number;
}

export interface CanvasSpec {
  /** 默认 viewport（DesignFrame 初次进入新 device 时的尺寸） */
  default: { width: number; height: number };
  /** DeviceToolbar 下拉的预设 */
  presets: CanvasPreset[];
  /** 外框样式：mobile = iPhone bezel + 状态栏 + notch；desktop = 显示器风；none = 无外框 */
  chrome: "mobile" | "desktop" | "none";
}

export interface TokenPrefixes {
  color: string;
  spacing: string;
  radius: string;
  font: string;
  shadow?: string;
}

export interface ThemeBaselineValues {
  colors: Record<string, string>;
  spacing: Record<string, string>;
}

export interface PresetManifest {
  /** 内部唯一 id，用于 engine map / theme store namespace */
  name: string;
  /** 人读 label，UI 上显示 */
  displayName: string;
  /**
   * 业务组件名前缀(如 "Om")。
   * 不是用来过滤的(白名单走 attribute),是 codegen / 报错信息要引用。
   */
  componentPrefix: string;
  /**
   * 业务组件挂在 DOM 上的 data-* attribute 名 —— Inspect / A11y 都按这个找。
   * 默认 "data-omit-component"。
   */
  attributeName: string;
  /** Token CSS 变量前缀 */
  tokenPrefixes: TokenPrefixes;
  /** 设备外框规格 */
  canvas: CanvasSpec;
  /** 是否需要 setupIonicReact —— mobile=true，desktop=false */
  requiresIonic: boolean;
  /** A11y mode 应该标记的 css selector 列表（可点击元素 + 缺 alt 的图） */
  a11ySelectors: {
    clickable: string[];
  };
  /** Theme editor 应当列出的语义色 key 列表 —— 每项必须存在于 themeBaseline.colors 里 */
  semanticColors: readonly string[];
  /**
   * 已发布主题基线（== preset 的 variables.css 当前值）。
   * Theme editor 的 published 基线就读这里；改 variables.css 时同步改 baseline 文件。
   */
  themeBaseline: ThemeBaselineValues;
  /**
   * CSS scope class（仅 scoped presets 需要，如 "gp-scope" / "ga-scope"）。
   * 设置后 theme store 在全局 :root 之外，还会把 token 写到所有 .{cssScope} 元素上，
   * 让 catalog WYSIWYG 预览和 iframe 都能正确拿到 scoped token 值。
   * pos-mobile / shadcn-desktop 不用设（变量在 :root）。
   */
  cssScope?: string;
}
