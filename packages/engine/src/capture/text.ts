/**
 * 文本节点的提取 —— 判定叶子 + 读排版属性。
 */

import { parseColor } from "./paint";
import type { TextStyle } from "./types";

/** 一个元素算不算"文本叶子"：只包含 1 个非空 Text 子节点（没有 element 子）。 */
export function isTextLeaf(el: Element): string | undefined {
  if (el.childNodes.length === 0) return undefined;
  let text = "";
  for (const child of Array.from(el.childNodes)) {
    if (child.nodeType === Node.TEXT_NODE) {
      text += child.textContent ?? "";
    } else if (child.nodeType === Node.ELEMENT_NODE) {
      // 含子元素 → 不算叶子
      return undefined;
    }
  }
  const trimmed = text.trim();
  return trimmed.length ? trimmed : undefined;
}

export function extractText(_el: Element, cs: CSSStyleDeclaration, content: string): TextStyle {
  const color = parseColor(cs.color) ?? { r: 0, g: 0, b: 0, a: 1 };
  const fontSize = parseFloat(cs.fontSize) || 14;
  const fontWeight = parseFontWeight(cs.fontWeight);
  // font-family 可能是逗号列表，取第一个非引号词
  const fontFamily = (cs.fontFamily.split(",")[0] ?? "").replace(/["']/g, "").trim() || "Inter";
  const lineHeightPx = parseLineHeight(cs.lineHeight, fontSize);
  const letterSpacing = parseFloat(cs.letterSpacing) || 0;
  const textAlign = mapTextAlign(cs.textAlign);

  return {
    content,
    fontSize,
    fontWeight,
    fontFamily,
    color,
    lineHeight: lineHeightPx,
    letterSpacing,
    textAlign,
  };
}

function parseFontWeight(raw: string): number {
  const n = Number(raw);
  if (!Number.isNaN(n)) return n;
  if (raw === "bold") return 700;
  if (raw === "normal") return 400;
  return 400;
}

function parseLineHeight(raw: string, fontSize: number): number {
  if (raw === "normal") return Math.round(fontSize * 1.2);
  if (raw.endsWith("px")) return parseFloat(raw);
  const ratio = Number(raw);
  if (!Number.isNaN(ratio)) return Math.round(fontSize * ratio);
  return Math.round(fontSize * 1.2);
}

function mapTextAlign(raw: string): TextStyle["textAlign"] {
  if (raw === "center") return "CENTER";
  if (raw === "right" || raw === "end") return "RIGHT";
  if (raw === "justify") return "JUSTIFIED";
  return "LEFT";
}
