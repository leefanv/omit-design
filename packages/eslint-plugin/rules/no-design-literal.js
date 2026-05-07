/**
 * 禁止业务稿里出现颜色 / 像素长度字面量。必须走 token（var(--om-*) 或 var(--ion-*)）。
 *
 * 允许：var(...) / inherit / currentColor / transparent / 0 / auto / none / 百分比
 * 禁止：#hex / rgb(...) / rgba(...) / hsl(...) / hsla(...) / 数字+px
 *
 * Hex 只匹配标准 CSS 长度 3 / 6 / 8：
 *   - 跳过 4 字符（`#1042` 这类订单号误报）—— 4 字符是 `#rgba` alpha 简写，
 *     实际项目里几乎没人用；设计要写带透明度就用 8 字符展开形式
 *   - 跳过 5 / 7 字符（非法 CSS 长度，不可能是颜色）
 */

const HEX_RE = /^#(?:[0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/;
// 模糊版：在长字符串里（如 template literal 中的 CSS 文本）搜 hex。
// 前后界用 word boundary + 排除继续的 hex 字符，避免假阳性（如 #abc-def 这种 ID）。
const HEX_LOOSE_RE = /(?<![\w-])#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/g;
const FUNC_COLOR_RE = /\b(rgb|rgba|hsl|hsla)\s*\(/;
const PX_RE = /\b\d+(\.\d+)?px\b/;

const ALLOW_EXACT = new Set([
  "inherit",
  "currentColor",
  "transparent",
  "none",
  "auto",
  "0",
]);

function isLiteralAllowed(value) {
  if (typeof value !== "string") return true;
  const trimmed = value.trim();
  if (!trimmed) return true;
  if (ALLOW_EXACT.has(trimmed)) return true;
  if (trimmed.startsWith("var(")) return true;
  if (trimmed.endsWith("%")) return true;
  return false;
}

/**
 * @param {string} value
 * @param {boolean} loose - true → 在长字符串里搜（template literal 等 CSS 上下文）
 *
 * 返回数组：可能多个 violation（如 template literal 里同时有 #fff 和 #3b82f6）
 */
function findViolations(value, loose) {
  if (typeof value !== "string") return [];
  const out = [];
  if (loose) {
    for (const m of value.matchAll(HEX_LOOSE_RE)) {
      out.push({ kind: "hex color", sample: m[0] });
    }
  } else if (HEX_RE.test(value.trim())) {
    out.push({ kind: "hex color", sample: value });
  }
  if (FUNC_COLOR_RE.test(value)) out.push({ kind: "function color", sample: value });
  const pxMatch = value.match(PX_RE);
  if (pxMatch) out.push({ kind: "px length", sample: pxMatch[0] });
  return out;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "禁止业务稿里出现颜色 / px 字面量,必须走 token (var(--om-*) / var(--ion-*)) 或 Om* 组件 props。",
    },
    messages: {
      forbidden:
        "禁止字面量 {{kind}} '{{sample}}'。走 token:var(--om-*) / var(--ion-*),或通过 Om* 组件的 props。",
    },
    schema: [],
  },
  create(context) {
    function check(node, value, loose) {
      if (isLiteralAllowed(value)) return;
      const violations = findViolations(value, loose);
      for (const v of violations) {
        context.report({
          node,
          messageId: "forbidden",
          data: { kind: v.kind, sample: v.sample },
        });
      }
    }
    return {
      Literal(node) {
        if (typeof node.value === "string") check(node, node.value, false);
      },
      TemplateElement(node) {
        // 模板字符串通常是 <style>{` ... `}</style> 里的 CSS 文本 —— 用宽松搜索
        // 抓住嵌入在长字符串里的 hex / px / rgb()
        check(node, node.value.cooked ?? node.value.raw, true);
      },
      JSXAttribute(node) {
        if (node.name && node.name.name === "style") return;
      },
    };
  },
};
