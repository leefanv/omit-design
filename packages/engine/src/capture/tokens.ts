/**
 * 把 `data-omit-tokens="color:primary|radius:md|spacing:lg"` 解析成 kv。
 * 和 src/design-system/components/inspect-attrs.ts 的编码对称。
 */

export function parseTokenAttr(raw: string | null | undefined): Record<string, string> | undefined {
  if (!raw) return undefined;
  const out: Record<string, string> = {};
  for (const chunk of raw.split("|")) {
    const [k, v] = chunk.split(":");
    if (k && v) out[k.trim()] = v.trim();
  }
  return Object.keys(out).length ? out : undefined;
}
