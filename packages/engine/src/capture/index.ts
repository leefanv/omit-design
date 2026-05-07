/**
 * 捕获入口：给一个 DOM 根，递归建出 FigmaNode 树。
 *
 * 典型调用场景：
 * - `/tools/capture` 工具页：iframe 加载某个 /designs/* 路由后，对 iframe 内部的
 *   `.shell-embed` 调用 captureTree()
 * - 批量模式：遍历 registry，切换 iframe src → onLoad → captureTree → 累加 JSON
 */

import { extractAutoLayout, rectRelativeTo } from "./layout";
import {
  extractFills,
  extractRadius,
  extractShadows,
  extractStrokes,
  hasVisualFill,
  shouldSkip,
} from "./paint";
import { extractText, isTextLeaf } from "./text";
import { parseTokenAttr } from "./tokens";
import type { CapturePayload, FigmaNode } from "./types";

export type { CapturePayload, FigmaNode } from "./types";

/**
 * 对给定根元素递归捕获；返回完整 payload。
 *
 * @param root         捕获起点（通常是 iframe 里 `.shell-embed`）
 * @param meta         补充信息（route、viewport）
 * @param skipSelector 额外跳过的选择器（如 `[data-no-inspect]`）
 */
export interface CaptureMeta {
  route: string;
  viewport: { w: number; h: number };
  /** 可选：人读名 —— figma plugin 用这个命名 frame，缺省退回 route */
  name?: string;
  /** 可选：所属 group + project —— figma plugin 用 group 拆 Page */
  group?: { id: string; label: string; icon?: string };
  projectId?: string;
}

export async function captureTree(
  root: Element,
  meta: CaptureMeta,
  skipSelector = "[data-no-inspect]"
): Promise<CapturePayload> {
  const counts = { totalNodes: 0, textNodes: 0, imageNodes: 0 };
  const rootNode = await walk(root, null, skipSelector, counts);
  return {
    route: meta.route,
    name: meta.name,
    group: meta.group,
    projectId: meta.projectId,
    viewport: meta.viewport,
    capturedAt: new Date().toISOString(),
    root: rootNode ?? emptyRoot(root),
    stats: counts,
  };
}

function emptyRoot(root: Element): FigmaNode {
  const r = root.getBoundingClientRect();
  return {
    name: "(empty)",
    kind: "FRAME",
    layout: { x: 0, y: 0, w: Math.round(r.width), h: Math.round(r.height) },
    children: [],
  };
}

async function walk(
  el: Element,
  parent: Element | null,
  skipSelector: string,
  counts: { totalNodes: number; textNodes: number; imageNodes: number }
): Promise<FigmaNode | null> {
  if (el.matches(skipSelector)) return null;

  const cs = getComputedStyle(el);
  if (shouldSkip(cs)) return null;

  const layout = rectRelativeTo(el, parent);
  // 跳过零尺寸元素（滚动占位之类）
  if (layout.w === 0 && layout.h === 0) return null;

  const node: FigmaNode = {
    name: nodeName(el),
    kind: "FRAME",
    layout,
    children: [],
  };

  // 有 shadow root 的元素（所有 Ionic web components）不能用其 light DOM 的
  // flex-direction / align 来推 auto-layout —— 它们的真实 layout 走 shadow DOM
  // 的 <slot> 结构。典型踩坑：ion-toolbar 自身 CSS 是 flex-direction: column
  // 给 toolbar 堆叠用，但 back button 和 title 其实是 shadow DOM 里 row 排的。
  // 给它打 VERTICAL 就会在 Figma 里把 back + title 上下叠。
  const autoLayout = el.shadowRoot ? undefined : extractAutoLayout(cs);
  if (autoLayout) node.autoLayout = autoLayout;

  const fills = extractFills(cs);
  if (fills) node.fills = fills;

  const strokes = extractStrokes(cs);
  if (strokes) node.strokes = strokes;

  const radius = extractRadius(cs);
  if (radius) node.radius = radius;

  const effects = extractShadows(cs);
  if (effects) node.effects = effects;

  const tokens = parseTokenAttr(el.getAttribute("data-omit-tokens"));
  if (tokens) node.tokens = tokens;

  if (cs.overflow === "hidden" || cs.overflow === "clip") node.clipContent = true;
  // position: absolute/fixed —— 脱离 flex flow，不应被父 auto-layout 排版
  if (cs.position === "absolute" || cs.position === "fixed") node.absolute = true;
  // opacity 非 1 时记录 —— 否则 Figma 里半透明效果全丢
  const op = parseFloat(cs.opacity);
  if (!Number.isNaN(op) && op < 1) node.opacity = op;

  // ion-input 的 placeholder 只活在 shadow DOM 里 —— 把它作为一个合成的 TEXT 子节点注入，
  // 确保在 Figma 里可见（灰色占位文字）
  if (el.tagName === "ION-INPUT" || el.tagName === "ION-TEXTAREA") {
    injectPlaceholderChild(el, cs, node, counts);
  }

  // IMG —— 尝试几条路径取真实字节；失败时把原因写进 tokens，便于前端预览里看到
  if (el.tagName === "IMG") {
    const img = el as HTMLImageElement;
    const resolved = await resolveImage(img);
    if (resolved.kind === "image") {
      node.kind = "IMAGE";
      node.imageSrc = resolved.dataUrl;
    } else if (resolved.kind === "svg") {
      node.kind = "VECTOR";
      node.svg = resolved.svg;
    } else {
      node.kind = "RECT";
      node.tokens = {
        ...(node.tokens ?? {}),
        imgResolveFailure: resolved.reason,
        imgSrc: (img.currentSrc || img.src).slice(0, 200),
      };
    }
    counts.imageNodes++;
    counts.totalNodes++;
    return node;
  }

  // 原生 SVG —— 直接把 outerHTML 丢给 Figma
  if (el.tagName === "SVG" || el.tagName === "svg") {
    node.kind = "VECTOR";
    node.svg = el.outerHTML;
    counts.totalNodes++;
    return node;
  }

  // ion-icon —— 从 shadow DOM 里捞 svg，替换 currentColor
  if (el.tagName === "ION-ICON") {
    node.kind = "VECTOR";
    const svg = extractIonIconSvg(el);
    if (svg) node.svg = svg;
    else {
      const name = el.getAttribute("icon") || el.getAttribute("name") || "icon";
      node.svg = `<svg data-ionicon="${name}" xmlns="http://www.w3.org/2000/svg"/>`;
    }
    counts.totalNodes++;
    return node;
  }

  // Shadow DOM 合并：Ionic 大部分组件（ion-button / ion-item / ion-input …）
  // 把视觉画到 shadow DOM 里的 .button-native / .item-native 上。
  // 从 shadow DOM 里找第一个有"可见填色"的元素，把 fills/radius/strokes/shadows
  // 合并到当前 FigmaNode，保持 light-DOM children 正常递归拿文本内容。
  if (el.shadowRoot) {
    mergeShadowVisuals(el, node);
  }

  const textContent = isTextLeaf(el);
  if (textContent !== undefined) {
    // 不管是否 hasBox，都用 Range 测文字真实渲染位置 —— 元素 rect 可能远大于
    // 文字 rect（ion-title position:absolute+inset:0 占满 header 宽，但文字
    // 居中渲染；ion-button 的文字也由 shadow DOM 内部 flex 居中）。
    // 直接用 element rect 会把文字钉在左上角，导致和其它内容视觉上叠在一起。
    const range = el.ownerDocument.createRange();
    range.selectNodeContents(el);
    const tr = range.getBoundingClientRect();
    const er = el.getBoundingClientRect();
    const textStyle = extractText(el, cs, textContent);

    const hasBox = !!(node.fills || node.strokes || node.radius || node.effects);
    if (!hasBox) {
      // 整个元素降级为 TEXT，layout 覆盖为文字实际 rect（相对 parent）
      const pRect = parent ? parent.getBoundingClientRect() : er;
      node.kind = "TEXT";
      node.layout = {
        x: Math.round(tr.left - pRect.left),
        y: Math.round(tr.top - pRect.top),
        w: Math.max(1, Math.round(tr.width)),
        h: Math.max(1, Math.round(tr.height)),
      };
      node.text = textStyle;
      counts.textNodes++;
      counts.totalNodes++;
      return node;
    }

    // 有盒子视觉：保持 FRAME，文字作为子节点（相对当前元素）
    node.children.push({
      name: "text",
      kind: "TEXT",
      layout: {
        x: Math.round(tr.left - er.left),
        y: Math.round(tr.top - er.top),
        w: Math.max(1, Math.round(tr.width)),
        h: Math.max(1, Math.round(tr.height)),
      },
      text: textStyle,
      children: [],
    });
    counts.textNodes++;
    counts.totalNodes++;
    return node;
  }

  // CSS 伪元素 ::before / ::after —— 不在 DOM 里，但在视觉上是真实存在的 box。
  // 典型：tab 的 active 下划线用 `::after { content:''; position:absolute; background:primary }`
  // 把它们合成为真实的子 Frame。
  addPseudoChildren(el, node, counts);

  // 子节点选择：light DOM children 优先（包含用户 slotted 的内容）；
  // 如果 light DOM 是空的（比如 ion-back-button / ion-menu-button，rendered content
  // 全在 shadow DOM 里），才回落到 shadow DOM children 继续走。
  let childrenSource: Element[] = Array.from(el.children);
  const lightText = (el.textContent || "").trim();
  if (childrenSource.length === 0 && !lightText && el.shadowRoot) {
    childrenSource = Array.from(el.shadowRoot.children);
  }
  for (const child of childrenSource) {
    const childNode = await walk(child, el, skipSelector, counts);
    if (childNode) node.children.push(childNode);
  }

  counts.totalNodes++;
  return node;
}

/** 图层名选择策略：data-omit-component > aria-label > 类名 > tag。 */
function nodeName(el: Element): string {
  const pos = el.getAttribute("data-omit-component");
  if (pos) return pos;
  const aria = el.getAttribute("aria-label");
  if (aria) return aria;
  const classList = Array.from(el.classList);
  // BEM 风格首类，截掉 --modifier 后缀
  const first = classList.find((c) => !c.startsWith("ion-"));
  if (first) return first.split("--")[0];
  return el.tagName.toLowerCase();
}

/**
 * 从 shadow DOM 里找第一个**有任意视觉贡献**（fill / border / shadow）的元素，
 * 把它的视觉属性合并到外层 node。主要给 Ionic 组件用。
 *
 * ⚠ 不要只看 fill —— outline 按钮（`variant="outline"`）和很多 ion-item
 * 的视觉完全靠 border + radius，没有 fill；只看 fill 会把它们判定为"无盒子"，
 * 最后被降级成纯 TEXT，外框全丢。
 */
function mergeShadowVisuals(el: Element, node: FigmaNode): void {
  const shadow = el.shadowRoot;
  if (!shadow) return;
  const all = shadow.querySelectorAll("*");
  for (const el2 of Array.from(all)) {
    const ccs = getComputedStyle(el2);
    const fill = hasVisualFill(ccs);
    const borderW = parseFloat(ccs.borderTopWidth) || 0;
    const borderColor = borderW > 0 ? borderColorVisible(ccs) : false;
    if (!fill && !borderColor) continue;
    if (!node.fills) {
      const f = extractFills(ccs);
      if (f) node.fills = f;
    }
    if (!node.radius) {
      const r = extractRadius(ccs);
      if (r) node.radius = r;
    }
    if (!node.strokes) {
      const s = extractStrokes(ccs);
      if (s) node.strokes = s;
    }
    if (!node.effects) {
      const eff = extractShadows(ccs);
      if (eff) node.effects = eff;
    }
    return; // 只取第一个
  }
}

/**
 * 把元素上的 ::before / ::after 伪元素合成为子 FigmaNode。
 *
 * 伪元素在 DOM 里不存在、getBoundingClientRect 拿不到坐标，但用
 * getComputedStyle(el, "::before") 能读到它的 box model + 填色。
 * 没有 size / content:"none" 则跳过。
 *
 * ⚠ 估算坐标：
 * - `position: absolute` 的伪元素（99% 的用法）用 inset 对应的 top/right/bottom/left
 *   + 元素自身 rect 推算（假设容器是 position:relative）。
 * - 其它情况能做出一个尺寸正确的子节点，位置用 0,0 兜底。
 */
function addPseudoChildren(
  el: Element,
  node: FigmaNode,
  counts: { totalNodes: number; textNodes: number; imageNodes: number }
) {
  for (const which of ["::before", "::after"] as const) {
    const pcs = getComputedStyle(el, which);
    const content = pcs.content;
    // 浏览器把 `content: ""` / `"some"` 都返回带引号；`content: none` / 未设置返回 "none"
    if (!content || content === "none" || content === "normal") continue;

    const w = parseFloat(pcs.width) || 0;
    const h = parseFloat(pcs.height) || 0;
    if (w === 0 && h === 0) continue; // 看不见

    const bg = parseColorSafe(pcs.backgroundColor);
    const hasFill = bg && bg.a > 0;
    const bw = parseFloat(pcs.borderTopWidth) || 0;
    const bc = parseColorSafe(pcs.borderTopColor);
    const hasBorder = bw > 0 && bc && bc.a > 0;
    if (!hasFill && !hasBorder) continue;

    // 坐标：若 absolute，按 inset 推算
    const er = el.getBoundingClientRect();
    let x = 0;
    let y = 0;
    if (pcs.position === "absolute" || pcs.position === "fixed") {
      const left = parseFloat(pcs.left);
      const right = parseFloat(pcs.right);
      const top = parseFloat(pcs.top);
      const bottom = parseFloat(pcs.bottom);
      if (!Number.isNaN(left)) x = Math.round(left);
      else if (!Number.isNaN(right)) x = Math.round(er.width - right - w);
      if (!Number.isNaN(top)) y = Math.round(top);
      else if (!Number.isNaN(bottom)) y = Math.round(er.height - bottom - h);
    }

    const pseudoNode: FigmaNode = {
      name: `pseudo${which}`,
      kind: "FRAME",
      layout: { x, y, w: Math.max(1, Math.round(w)), h: Math.max(1, Math.round(h)) },
      children: [],
    };
    if (hasFill && bg) pseudoNode.fills = [{ type: "SOLID", color: bg }];
    const r = extractRadius(pcs);
    if (r) pseudoNode.radius = r;
    if (hasBorder) {
      const s = extractStrokes(pcs);
      if (s) pseudoNode.strokes = s;
    }
    node.children.push(pseudoNode);
    counts.totalNodes++;
  }
}

function parseColorSafe(raw: string): { r: number; g: number; b: number; a: number } | undefined {
  if (!raw || raw === "transparent" || raw === "rgba(0, 0, 0, 0)") return undefined;
  const m = raw.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const parts = m[1].split(",").map((s) => s.trim());
    const [r, g, b] = parts.slice(0, 3).map((p) => Number(p));
    const a = parts[3] !== undefined ? Number(parts[3]) : 1;
    if ([r, g, b, a].some((x) => Number.isNaN(x))) return undefined;
    return { r: r / 255, g: g / 255, b: b / 255, a };
  }
  return undefined;
}

function borderColorVisible(cs: CSSStyleDeclaration): boolean {
  const raw = cs.borderTopColor;
  if (!raw || raw === "transparent" || raw === "rgba(0, 0, 0, 0)") return false;
  // 简单判别 alpha；精确解析走 parseColor 里的逻辑但避免循环依赖
  const m = raw.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const parts = m[1].split(",").map((s) => s.trim());
    const a = parts[3] !== undefined ? Number(parts[3]) : 1;
    return !Number.isNaN(a) && a > 0;
  }
  return true;
}

/**
 * 解析一张 <img>：
 *   - SVG 先走 fetch 拿原始文本（canvas 对 SVG 常常给空 PNG 或 taint 失败）
 *   - 其它走 canvas → data URL（同源光栅最稳）
 *   - canvas 失败再 fetch bytes 兜底
 *   - 全失败：RECT 占位 + 诊断信息
 */
async function resolveImage(
  img: HTMLImageElement
): Promise<
  | { kind: "image"; dataUrl: string }
  | { kind: "svg"; svg: string }
  | { kind: "fallback"; reason: string }
> {
  const src = img.currentSrc || img.src;
  if (!src) return { kind: "fallback", reason: "no src" };

  const looksSvg =
    src.toLowerCase().endsWith(".svg") ||
    src.includes(".svg?") ||
    src.startsWith("data:image/svg");

  // SVG 优先走 fetch
  if (looksSvg) {
    try {
      let text: string | null = null;
      if (src.startsWith("data:image/svg")) {
        const comma = src.indexOf(",");
        if (comma >= 0) {
          const enc = src.slice(comma + 1);
          text = src.slice(0, comma).includes("base64") ? atob(enc) : decodeURIComponent(enc);
        }
      } else {
        const r = await fetch(src);
        if (r.ok) text = await r.text();
      }
      if (text && text.includes("<svg")) return { kind: "svg", svg: text };
    } catch (e) {
      // fall through to canvas
    }
  }

  // Canvas 路径
  const viaCanvas = imgToDataUrl(img);
  if (viaCanvas) return { kind: "image", dataUrl: viaCanvas };

  // fetch bytes 兜底（含 canvas tainted 情况）
  try {
    const resp = await fetch(src);
    if (!resp.ok) return { kind: "fallback", reason: `fetch ${resp.status}` };
    const ct = resp.headers.get("content-type") || "";
    if (ct.includes("svg")) {
      const text = await resp.text();
      return { kind: "svg", svg: text };
    }
    const blob = await resp.blob();
    const dataUrl = await blobToDataUrl(blob);
    return { kind: "image", dataUrl };
  } catch (e) {
    return { kind: "fallback", reason: `fetch threw: ${(e as Error).message}` };
  }
}

function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader();
    fr.onload = () => resolve(String(fr.result));
    fr.onerror = () => reject(fr.error);
    fr.readAsDataURL(blob);
  });
}

function imgToDataUrl(img: HTMLImageElement): string | undefined {
  try {
    if (!img.complete || img.naturalWidth === 0) return undefined;
    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.drawImage(img, 0, 0);
    return canvas.toDataURL("image/png");
  } catch {
    return undefined;
  }
}

/**
 * 从 ion-icon 的 shadow DOM 抽出内嵌 SVG。
 * Ionic 会把图标渲染成 `<div class="icon-inner"><svg>...</svg></div>` 结构。
 * 提取后把 `currentColor` 替换为元素计算出来的真实颜色。
 */
function extractIonIconSvg(el: Element): string | undefined {
  const shadow = el.shadowRoot;
  if (!shadow) return undefined;
  const svg = shadow.querySelector("svg");
  if (!svg) return undefined;
  const clone = svg.cloneNode(true) as SVGElement;
  if (!clone.getAttribute("viewBox")) clone.setAttribute("viewBox", "0 0 512 512");
  if (!clone.getAttribute("xmlns")) clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  const color = getComputedStyle(el).color;
  if (color) replaceCurrentColor(clone, color);
  return clone.outerHTML;
}

/**
 * ion-input 的 placeholder 在 shadow DOM 的 ::placeholder 里，light DOM 看不到。
 * 当前没有 value 且 placeholder 存在时，合成一个 TEXT 子节点。
 */
function injectPlaceholderChild(
  el: Element,
  cs: CSSStyleDeclaration,
  node: FigmaNode,
  counts: { totalNodes: number; textNodes: number; imageNodes: number }
) {
  const placeholder = el.getAttribute("placeholder");
  if (!placeholder) return;
  // 已有 value 就不展示 placeholder
  const value = (el as HTMLInputElement).value ?? el.getAttribute("value") ?? "";
  if (value) return;

  const er = el.getBoundingClientRect();
  // placeholder 一般左对齐，垂直居中；padding 按 PosInput 规范 md
  const padX = parseFloat(cs.paddingLeft) || 12;
  const padY = parseFloat(cs.paddingTop) || 0;

  // 颜色走 medium token —— ion-input 的 placeholder 实际颜色在 shadow DOM，取 CSS var
  const mediumRgb = getComputedStyle(document.documentElement)
    .getPropertyValue("--ion-color-medium")
    .trim();
  const text = {
    content: placeholder,
    fontSize: parseFloat(cs.fontSize) || 16,
    fontWeight: 400,
    fontFamily: (cs.fontFamily.split(",")[0] ?? "Inter").replace(/["']/g, "").trim(),
    color: (parseHexOrRgb(mediumRgb) ?? { r: 0.56, g: 0.56, b: 0.6, a: 1 }) as {
      r: number;
      g: number;
      b: number;
      a: number;
    },
    lineHeight: (parseFloat(cs.fontSize) || 16) * 1.4,
    letterSpacing: 0,
    textAlign: "LEFT" as const,
  };
  node.children.push({
    name: "placeholder",
    kind: "TEXT",
    layout: {
      x: Math.round(padX),
      y: Math.round(padY),
      w: Math.max(1, Math.round(er.width - padX * 2)),
      h: Math.max(1, Math.round(text.fontSize * 1.4)),
    },
    text,
    children: [],
  });
  counts.textNodes++;
  counts.totalNodes++;
}

function parseHexOrRgb(raw: string): { r: number; g: number; b: number; a: number } | undefined {
  const s = raw.trim();
  if (!s) return undefined;
  if (s.startsWith("#")) {
    let hx = s.slice(1);
    if (hx.length === 3) hx = hx.split("").map((c) => c + c).join("");
    return {
      r: parseInt(hx.slice(0, 2), 16) / 255,
      g: parseInt(hx.slice(2, 4), 16) / 255,
      b: parseInt(hx.slice(4, 6), 16) / 255,
      a: 1,
    };
  }
  const m = s.match(/rgba?\(([^)]+)\)/);
  if (m) {
    const [r, g, b] = m[1].split(",").map((n) => Number(n.trim()));
    return { r: r / 255, g: g / 255, b: b / 255, a: 1 };
  }
  return undefined;
}

function replaceCurrentColor(svg: SVGElement, color: string) {
  const apply = (n: Element) => {
    const f = n.getAttribute("fill");
    if (!f || f === "currentColor") n.setAttribute("fill", color);
    const s = n.getAttribute("stroke");
    if (s === "currentColor") n.setAttribute("stroke", color);
  };
  apply(svg);
  svg.querySelectorAll("*").forEach(apply);
}
