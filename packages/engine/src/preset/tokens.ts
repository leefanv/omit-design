/**
 * 通用 token 映射构造器 —— preset 通过它从 (keys, prefix) 反推出 `Record<key, "--prefix-key">`。
 *
 * 历史：M1 之前每个 preset 手写整张映射表（preset-mobile/tokens/index.ts、preset-desktop/同名）；
 * 想加一种 preset 就要 copy/改一遍。M2 把模式提到 engine 这层，prefix 由 preset.manifest 单点控制。
 *
 * 用法：
 *   const COLOR_KEYS = ["primary", "secondary", ...] as const;
 *   export const colorTokens = createTokenMap(COLOR_KEYS, "--ion-color-");
 *
 *   // 个别 token 不走前缀模式（如 Ionic 的 --ion-background-color），用 overrides：
 *   export const colorTokens = createTokenMap(
 *     ["primary", "background", "text"] as const,
 *     "--ion-color-",
 *     { background: "--ion-background-color", text: "--ion-text-color" },
 *   );
 */
export function createTokenMap<K extends string>(
  keys: readonly K[],
  prefix: string,
  overrides?: Partial<Record<K, string>>,
): Record<K, string> {
  const out = {} as Record<K, string>;
  for (const k of keys) {
    out[k] = overrides?.[k] ?? `${prefix}${k}`;
  }
  return out;
}
