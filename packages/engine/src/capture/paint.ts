/**
 * 把 CSS computed style 里的颜色 / 背景 / 边框 / 阴影 / 圆角
 * 转成 FigmaNode 能直接用的字段。
 */

import type { Fill, Rgba, Shadow, Stroke } from "./types";

/** CSS `rgb(r, g, b)` / `rgba(r, g, b, a)` / `#rrggbb` 解析为 0..1 RGBA。 */
export function parseColor(input: string): Rgba | undefined {
  if (!input || input === "transparent" || input === "rgba(0, 0, 0, 0)") {
    return undefined;
  }
  const m = input.match(/^rgba?\(([^)]+)\)$/i);
  if (m) {
    const parts = m[1].split(",").map((s) => s.trim());
    const [r, g, b] = parts.slice(0, 3).map((p) => Number(p.replace(/[^\d.]/g, "")));
    const a = parts[3] !== undefined ? Number(parts[3]) : 1;
    if ([r, g, b, a].some((x) => Number.isNaN(x))) return undefined;
    return { r: r / 255, g: g / 255, b: b / 255, a };
  }
  const hex = input.match(/^#([0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i);
  if (hex) {
    let hx = hex[1];
    if (hx.length === 3) hx = hx.split("").map((c) => c + c).join("");
    const r = parseInt(hx.slice(0, 2), 16);
    const g = parseInt(hx.slice(2, 4), 16);
    const b = parseInt(hx.slice(4, 6), 16);
    const a = hx.length === 8 ? parseInt(hx.slice(6, 8), 16) / 255 : 1;
    return { r: r / 255, g: g / 255, b: b / 255, a };
  }
  return undefined;
}

/** 提取 background-color + linear-gradient（取第一个 linear-gradient）。 */
export function extractFills(cs: CSSStyleDeclaration): Fill[] | undefined {
  const fills: Fill[] = [];
  const bg = cs.backgroundColor;
  const solid = parseColor(bg);
  if (solid && solid.a > 0) fills.push({ type: "SOLID", color: solid });

  const bgImage = cs.backgroundImage;
  if (bgImage && bgImage !== "none") {
    const grad = parseLinearGradient(bgImage);
    if (grad) fills.push(grad);
    // 注：`background-image: url(...)` 目前不转 IMAGE 节点。业务稿走 <img> 加载图片；
    // shell 用 data:image/svg+xml 背景图目前只会丢失背景装饰不影响结构。
    // 真要绑定为 Figma Image fill，等 M4 的 Figma Variables 方案一起做。
  }

  return fills.length ? fills : undefined;
}

/** 解析 `linear-gradient(180deg, rgb(245, 249, 255) 0%, …)`。
 *  处理 angle / `to <dir>` + 多色标。不处理 radial / conic。
 *  ⚠ 不能用简单 `\(([^)]+)\)`，`rgb(…)` 里的 `)` 会把匹配截断。走深度扫描。 */
function parseLinearGradient(input: string): Fill | undefined {
  const idx = input.indexOf("linear-gradient(");
  if (idx < 0) return undefined;
  const start = idx + "linear-gradient(".length;
  let depth = 0;
  let end = -1;
  for (let i = start; i < input.length; i++) {
    const ch = input[i];
    if (ch === "(") depth++;
    else if (ch === ")") {
      if (depth === 0) {
        end = i;
        break;
      }
      depth--;
    }
  }
  if (end < 0) return undefined;
  const body = input.slice(start, end);
  const parts = splitGradientParts(body);
  if (parts.length < 2) return undefined;

  let angleDeg = 180; // 默认
  let startIdx = 0;
  const first = parts[0].trim();
  const angleMatch = first.match(/^(-?\d+(?:\.\d+)?)deg$/);
  if (angleMatch) {
    angleDeg = Number(angleMatch[1]);
    startIdx = 1;
  } else if (first.startsWith("to ")) {
    // to top/bottom/left/right → 角度换算
    const dir = first.slice(3).trim();
    angleDeg = { top: 0, right: 90, bottom: 180, left: 270 }[dir] ?? 180;
    startIdx = 1;
  }

  const stops: Array<{ offset: number; color: Rgba }> = [];
  for (let i = startIdx; i < parts.length; i++) {
    const seg = parts[i].trim();
    // 可能形如 "#f5f9ff 0%" / "rgba(0,0,0,0.1) 50%"
    const stopMatch = seg.match(/^(.+?)\s+(\d+(?:\.\d+)?)%$/);
    let colorStr = seg;
    let offset = i === startIdx ? 0 : i === parts.length - 1 ? 1 : (i - startIdx) / (parts.length - startIdx - 1);
    if (stopMatch) {
      colorStr = stopMatch[1].trim();
      offset = Number(stopMatch[2]) / 100;
    }
    const color = parseColor(colorStr);
    if (color) stops.push({ offset, color });
  }
  if (stops.length < 2) return undefined;
  return { type: "LINEAR_GRADIENT", stops, angleDeg };
}

function splitGradientParts(body: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let buf = "";
  for (const ch of body) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  if (buf) parts.push(buf);
  return parts;
}

/** 提取 border（只支持均匀单边框；复杂多边 border 降级为 top 边）。 */
export function extractStrokes(cs: CSSStyleDeclaration): Stroke[] | undefined {
  const width = parseFloat(cs.borderTopWidth) || 0;
  if (width === 0) return undefined;
  const color = parseColor(cs.borderTopColor);
  if (!color || color.a === 0) return undefined;
  const style = cs.borderTopStyle === "dashed" ? "dashed" : "solid";
  return [{ color, width, style }];
}

/** 四角圆角。均匀情况 Figma 可用 cornerRadius；不均匀走 individualCornerRadii。 */
export function extractRadius(
  cs: CSSStyleDeclaration
): { tl: number; tr: number; br: number; bl: number } | undefined {
  const tl = parseFloat(cs.borderTopLeftRadius) || 0;
  const tr = parseFloat(cs.borderTopRightRadius) || 0;
  const br = parseFloat(cs.borderBottomRightRadius) || 0;
  const bl = parseFloat(cs.borderBottomLeftRadius) || 0;
  if (tl + tr + br + bl === 0) return undefined;
  return { tl, tr, br, bl };
}

/** box-shadow —— 只取第一个 drop shadow（Figma 多 shadow 需要多 Effect）。 */
export function extractShadows(cs: CSSStyleDeclaration): Shadow[] | undefined {
  const raw = cs.boxShadow;
  if (!raw || raw === "none") return undefined;
  // 典型：`rgba(0, 0, 0, 0.05) 0px 1px 2px 0px`
  // 或多个用逗号分隔的阴影
  const shadows = splitShadowList(raw)
    .map((chunk) => parseSingleShadow(chunk.trim()))
    .filter((s): s is Shadow => !!s);
  return shadows.length ? shadows : undefined;
}

function splitShadowList(raw: string): string[] {
  const parts: string[] = [];
  let depth = 0;
  let buf = "";
  for (const ch of raw) {
    if (ch === "(") depth++;
    else if (ch === ")") depth--;
    if (ch === "," && depth === 0) {
      parts.push(buf);
      buf = "";
    } else {
      buf += ch;
    }
  }
  if (buf) parts.push(buf);
  return parts;
}

function parseSingleShadow(s: string): Shadow | undefined {
  // 匹配颜色 + 4 个 px 值
  // rgba(...) 0px 1px 2px 0px / #hex 0 1 2 0
  const colorMatch = s.match(/rgba?\([^)]+\)|#[0-9a-f]{3,8}/i);
  if (!colorMatch) return undefined;
  const color = parseColor(colorMatch[0]);
  if (!color) return undefined;
  const rest = s.replace(colorMatch[0], "").trim();
  const nums = rest.match(/-?\d*\.?\d+px/g);
  if (!nums || nums.length < 3) return undefined;
  const [offsetX, offsetY, blur, spread] = nums.map((n) => parseFloat(n));
  return { offsetX, offsetY, blur, spread: spread ?? 0, color };
}

/** opacity = 0 / display = none / visibility = hidden → 跳过该节点。 */
export function shouldSkip(cs: CSSStyleDeclaration): boolean {
  if (cs.display === "none") return true;
  if (cs.visibility === "hidden") return true;
  if (parseFloat(cs.opacity) === 0) return true;
  return false;
}

/** 该元素自身是否带"看得见"的填色（判断 shadow DOM 合并时要找谁） */
export function hasVisualFill(cs: CSSStyleDeclaration): boolean {
  const bg = parseColor(cs.backgroundColor);
  if (bg && bg.a > 0) return true;
  if (cs.backgroundImage && cs.backgroundImage !== "none") return true;
  return false;
}
