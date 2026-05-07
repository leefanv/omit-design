import type { ColorTokenName, SpacingTokenName, RadiusTokenName, FontSizeTokenName, ShadowTokenName } from "../tokens";

export type TokenRefs = {
  color?: ColorTokenName;
  bg?: ColorTokenName;
  spacing?: SpacingTokenName | SpacingTokenName[];
  radius?: RadiusTokenName;
  fontSize?: FontSizeTokenName;
  shadow?: ShadowTokenName;
};

/**
 * Inspect 用：把组件用到的 token 编码到 data-omit-tokens 属性，
 * 运行时由 packages/engine/src/inspect 读取并展示「token 名」而不是字面量值。
 */
export function inspectAttrs(component: string, tokens?: TokenRefs) {
  const attrs: Record<string, string> = {
    "data-omit-component": component,
  };
  if (tokens) {
    const flat: string[] = [];
    if (tokens.color) flat.push(`color:${tokens.color}`);
    if (tokens.bg) flat.push(`bg:${tokens.bg}`);
    if (tokens.spacing) {
      const arr = Array.isArray(tokens.spacing) ? tokens.spacing : [tokens.spacing];
      flat.push(`spacing:${arr.join(",")}`);
    }
    if (tokens.radius) flat.push(`radius:${tokens.radius}`);
    if (tokens.fontSize) flat.push(`fontSize:${tokens.fontSize}`);
    if (tokens.shadow) flat.push(`shadow:${tokens.shadow}`);
    if (flat.length) attrs["data-omit-tokens"] = flat.join("|");
  }
  return attrs;
}
