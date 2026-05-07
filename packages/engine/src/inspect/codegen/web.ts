import type { InspectTarget } from "../store";

/**
 * Web 代码模板 —— 给前端研发的 Ionic React 等价代码 + CSS 注解。
 * 后续可扩展为 per-component 精确模板（读组件白名单的元数据）。
 */
export function codegenWeb(t: InspectTarget): string {
  const tokenLines = Object.entries(t.tokens).map(
    ([k, v]) => `  // ${k} → ${v} (token)`
  );
  return [
    `// Component: ${t.component}`,
    ...tokenLines,
    `// 计算样式：`,
    `//   padding: ${t.computed.paddingTop} ${t.computed.paddingRight} ${t.computed.paddingBottom} ${t.computed.paddingLeft}`,
    `//   size:    ${t.computed.width} × ${t.computed.height}`,
    `//   bg:      ${t.computed.background}`,
    `//   color:   ${t.computed.color}`,
    `//   radius:  ${t.computed.borderRadius}`,
    `//   font:    ${t.computed.fontSize}`,
    "",
    `<${t.component}${propsHint(t.tokens)} />`,
  ].join("\n");
}

function propsHint(tokens: Record<string, string>): string {
  const parts: string[] = [];
  if (tokens.color) parts.push(`color="${tokens.color}"`);
  if (tokens.bg) parts.push(`/* bg=${tokens.bg} */`);
  if (tokens.radius) parts.push(`/* radius=${tokens.radius} */`);
  return parts.length ? " " + parts.join(" ") : "";
}
