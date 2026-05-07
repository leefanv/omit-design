/**
 * FigmaNode —— 捕获端与 Figma 插件之间的传输协议。
 *
 * 不依赖 Figma typings；消费端（Figma 插件）自己负责 map 到 SceneNode。
 * 设计原则：只记"Figma 能用得上的东西"，不带 DOM / CSS 无关的信息。
 */

export interface Rect {
  /** 相对父节点左上角（Figma Auto-Layout 定位本质上走 parent-relative） */
  x: number;
  y: number;
  w: number;
  h: number;
}

export interface Rgba {
  r: number; // 0..1
  g: number;
  b: number;
  a: number;
}

export type Fill =
  | { type: "SOLID"; color: Rgba }
  | { type: "LINEAR_GRADIENT"; stops: Array<{ offset: number; color: Rgba }>; angleDeg: number };

export interface Stroke {
  color: Rgba;
  width: number;
  /** "solid" 默认；dashed 走 dash pattern */
  style?: "solid" | "dashed";
}

export interface Shadow {
  /** Figma 的 DropShadow */
  offsetX: number;
  offsetY: number;
  blur: number;
  spread: number;
  color: Rgba;
}

export interface AutoLayout {
  direction: "HORIZONTAL" | "VERTICAL";
  /** flex gap；数值 px */
  gap: number;
  padding: { top: number; right: number; bottom: number; left: number };
  /** Figma 里叫 primaryAxisAlignItems */
  justify: "MIN" | "CENTER" | "MAX" | "SPACE_BETWEEN";
  /** Figma 里叫 counterAxisAlignItems */
  align: "MIN" | "CENTER" | "MAX";
}

export interface TextStyle {
  content: string;
  fontSize: number;
  fontWeight: number;
  fontFamily: string;
  color: Rgba;
  lineHeight: number;
  letterSpacing: number;
  textAlign: "LEFT" | "CENTER" | "RIGHT" | "JUSTIFIED";
}

/** DOM 节点捕获结果的最小单位。 */
export interface FigmaNode {
  /** Figma 图层名 —— 优先 data-omit-component，其次 pattern，最后 tag */
  name: string;
  /** 语义类别 */
  kind: "FRAME" | "TEXT" | "IMAGE" | "VECTOR" | "RECT";
  layout: Rect;
  autoLayout?: AutoLayout;
  fills?: Fill[];
  strokes?: Stroke[];
  /** 四角独立圆角；全一致时 Figma 插件可降级为 cornerRadius */
  radius?: { tl: number; tr: number; br: number; bl: number };
  effects?: Shadow[];
  /** 仅 kind="TEXT" 时有 */
  text?: TextStyle;
  /** 仅 kind="IMAGE" 时有 */
  imageSrc?: string;
  /** 仅 kind="VECTOR" 时有 —— ionicons / 内联 SVG 的 outerHTML */
  svg?: string;
  /** `data-omit-tokens` 解析后的 kv：{ color: "primary", radius: "md", spacing: "lg" } */
  tokens?: Record<string, string>;
  /** `overflow: hidden` / `overflow: clip` */
  clipContent?: boolean;
  /** `position: absolute` / `fixed` —— 在 Figma 插件侧设为 `layoutPositioning: "ABSOLUTE"`，
   *  避免父 auto-layout 把绝对定位元素当成普通 flex child 重新排版。 */
  absolute?: boolean;
  /** 节点整体 opacity（0-1，1 时省略）。小于 0.01 的会在捕获阶段直接 shouldSkip 过滤。 */
  opacity?: number;
  /** 子节点（顺序同 DOM 子序） */
  children: FigmaNode[];
}

/** 整次捕获的顶层产物。 */
export interface CapturePayload {
  /** 路由，如 "/designs/sales/main" */
  route: string;
  /** 人读名（entry.meta.name），用作 Figma frame 名称；缺省退回到 route */
  name?: string;
  /** 所属 group（engine registry 的 groupId + 展示 label + 可选 icon）。
   *  消费端（figma-plugin）据此为每个 group 建一个独立 Figma Page。缺省时全部放同页。 */
  group?: { id: string; label: string; icon?: string };
  /** 项目标识（用于多 project 导出时区分） */
  projectId?: string;
  /** 捕获时的 viewport（通常 390×844 for mobile，1280×800 for desktop） */
  viewport: { w: number; h: number };
  /** UTC ISO */
  capturedAt: string;
  /** 根节点（通常 1 个 —— 对应 `.shell-embed` 里的 `<IonPage>`） */
  root: FigmaNode;
  /** 可选统计 */
  stats?: { totalNodes: number; textNodes: number; imageNodes: number };
}
