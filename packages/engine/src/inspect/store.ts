import { create } from "zustand";

export type InspectMode = "inspect" | "measure" | "a11y";

export interface InspectTarget {
  el: HTMLElement;
  component: string;
  tokens: Record<string, string>;
  rect: DOMRect;
  computed: {
    paddingTop: string;
    paddingRight: string;
    paddingBottom: string;
    paddingLeft: string;
    marginTop: string;
    marginRight: string;
    marginBottom: string;
    marginLeft: string;
    borderTopWidth: string;
    borderRightWidth: string;
    borderBottomWidth: string;
    borderLeftWidth: string;
    width: string;
    height: string;
    background: string;
    color: string;
    borderRadius: string;
    fontSize: string;
  };
}

interface InspectState {
  enabled: boolean;
  mode: InspectMode;
  hovered: HTMLElement | null;
  selected: InspectTarget | null;
  /** Measure mode 锚点（第一次点击锁定的元素） */
  measureAnchor: InspectTarget | null;
  /** Inspect mode 是否叠加盒模型可视化 */
  showBoxModel: boolean;

  setEnabled: (v: boolean) => void;
  setMode: (m: InspectMode) => void;
  setHovered: (el: HTMLElement | null) => void;
  setSelected: (t: InspectTarget | null) => void;
  setMeasureAnchor: (t: InspectTarget | null) => void;
  setShowBoxModel: (v: boolean) => void;
}

export const useInspectStore = create<InspectState>((set) => ({
  enabled: false,
  mode: "inspect",
  hovered: null,
  selected: null,
  measureAnchor: null,
  showBoxModel: true,
  setEnabled: (v) => set({ enabled: v, hovered: null, selected: null, measureAnchor: null }),
  setMode: (m) => set({ mode: m, selected: null, measureAnchor: null, hovered: null }),
  setHovered: (el) => set({ hovered: el }),
  setSelected: (t) => set({ selected: t }),
  setMeasureAnchor: (t) => set({ measureAnchor: t }),
  setShowBoxModel: (v) => set({ showBoxModel: v }),
}));

export function parseTokens(raw: string | null): Record<string, string> {
  if (!raw) return {};
  return Object.fromEntries(
    raw.split("|").map((seg) => {
      const [k, v] = seg.split(":");
      return [k, v];
    })
  );
}

/** 排除 Inspect 自己的浮层 / 工具栏 / 主题面板等不该被 hover/click 的容器 */
const EXCLUDE_SELECTOR = [
  ".inspect-drawer",
  ".inspect-hover",
  ".inspect-help",
  ".theme-panel",
  ".design-tools",
  ".design-mode-bar",
  ".box-model",
  ".box-model-label",
  ".measure-anchor",
  ".measure-target",
  ".measure-guide",
  ".measure-distance",
  ".measure-hint",
  ".a11y-mark",
  ".a11y-summary",
  "[data-no-inspect]",
].join(", ");

/**
 * 把任意 DOM target 解析成可 inspect 的元素：
 *  - 必须在 `.shell-device-content` 内（设备屏幕内）
 *  - 不在 inspect/theme overlay 自身里
 *  - 任何元素都行,不限于 preset 组件
 */
export function findInspectableTarget(start: HTMLElement | null): HTMLElement | null {
  if (!start) return null;
  if (start.closest(EXCLUDE_SELECTOR)) return null;
  if (!start.closest(".shell-device-content")) return null;
  return start;
}

/** 给非 preset 组件元素生成可读的组件名 */
function inferComponentName(el: HTMLElement): string {
  const fromAttr = el.getAttribute("data-omit-component");
  if (fromAttr) return fromAttr;
  const tag = el.tagName.toLowerCase();
  if (tag.startsWith("ion-")) {
    // ion-button → IonButton
    return tag
      .split("-")
      .map((s, i) => (i === 0 ? "Ion" + s.slice(3, 4).toUpperCase() + s.slice(4) : s.charAt(0).toUpperCase() + s.slice(1)))
      .join("");
  }
  return tag;
}

export function buildInspectTarget(el: HTMLElement): InspectTarget {
  const cs = window.getComputedStyle(el);
  return {
    el,
    component: inferComponentName(el),
    tokens: parseTokens(el.getAttribute("data-omit-tokens")),
    rect: el.getBoundingClientRect(),
    computed: {
      paddingTop: cs.paddingTop,
      paddingRight: cs.paddingRight,
      paddingBottom: cs.paddingBottom,
      paddingLeft: cs.paddingLeft,
      marginTop: cs.marginTop,
      marginRight: cs.marginRight,
      marginBottom: cs.marginBottom,
      marginLeft: cs.marginLeft,
      borderTopWidth: cs.borderTopWidth,
      borderRightWidth: cs.borderRightWidth,
      borderBottomWidth: cs.borderBottomWidth,
      borderLeftWidth: cs.borderLeftWidth,
      width: cs.width,
      height: cs.height,
      background: cs.backgroundColor,
      color: cs.color,
      borderRadius: cs.borderRadius,
      fontSize: cs.fontSize,
    },
  };
}

/** 在 DOM 树中按方向移动；自动跳过空 text 节点与被排除容器 */
export type Direction = "up" | "down" | "left" | "right";

function isInspectable(el: Element | null): boolean {
  if (!el || !(el instanceof HTMLElement)) return false;
  if (el.closest(EXCLUDE_SELECTOR)) return false;
  if (!el.closest(".shell-device-content")) return false;
  return true;
}

export function navigate(from: HTMLElement, dir: Direction): HTMLElement | null {
  if (dir === "up") {
    let p: HTMLElement | null = from.parentElement;
    while (p && !isInspectable(p)) p = p.parentElement;
    return p;
  }
  if (dir === "down") {
    let c: Element | null = from.firstElementChild;
    while (c && !isInspectable(c)) c = c.nextElementSibling;
    return (c as HTMLElement) ?? null;
  }
  // left / right
  let sib: Element | null = dir === "left" ? from.previousElementSibling : from.nextElementSibling;
  while (sib && !isInspectable(sib)) {
    sib = dir === "left" ? sib.previousElementSibling : sib.nextElementSibling;
  }
  return (sib as HTMLElement) ?? null;
}
