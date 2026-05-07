/**
 * 布局相关：bounding rect + auto-layout 检测。
 */

import type { AutoLayout, Rect } from "./types";

/** 计算元素相对父节点左上角的位置 + 自身尺寸。 */
export function rectRelativeTo(el: Element, parentEl: Element | null): Rect {
  const r = el.getBoundingClientRect();
  if (!parentEl) return { x: 0, y: 0, w: r.width, h: r.height };
  const p = parentEl.getBoundingClientRect();
  return {
    x: Math.round(r.left - p.left),
    y: Math.round(r.top - p.top),
    w: Math.round(r.width),
    h: Math.round(r.height),
  };
}

/**
 * 如果元素是 flex 容器，把 direction / gap / padding / justify / align
 * 映射到 Figma Auto-Layout。
 * 非 flex 返回 undefined（Figma 插件会把子元素按绝对定位放）。
 */
export function extractAutoLayout(cs: CSSStyleDeclaration): AutoLayout | undefined {
  if (cs.display !== "flex" && cs.display !== "inline-flex") return undefined;

  const direction =
    cs.flexDirection === "row" || cs.flexDirection === "row-reverse" ? "HORIZONTAL" : "VERTICAL";

  const gap = parseFloat(cs.rowGap || cs.gap || "0") || 0;

  const padding = {
    top: parseFloat(cs.paddingTop) || 0,
    right: parseFloat(cs.paddingRight) || 0,
    bottom: parseFloat(cs.paddingBottom) || 0,
    left: parseFloat(cs.paddingLeft) || 0,
  };

  const justify: AutoLayout["justify"] =
    cs.justifyContent === "center"
      ? "CENTER"
      : cs.justifyContent === "flex-end" || cs.justifyContent === "end"
      ? "MAX"
      : cs.justifyContent === "space-between"
      ? "SPACE_BETWEEN"
      : "MIN";

  const align: AutoLayout["align"] =
    cs.alignItems === "center"
      ? "CENTER"
      : cs.alignItems === "flex-end" || cs.alignItems === "end"
      ? "MAX"
      : "MIN";

  return { direction, gap, padding, justify, align };
}
