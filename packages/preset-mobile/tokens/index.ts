/**
 * preset-mobile token 注册表 —— Inspect / 主题编辑器读这个映射。
 * 实际 token 值在 [../theme/variables.css](../theme/variables.css) 里。
 *
 * Prefix 由 [../preset.manifest.ts](../preset.manifest.ts) 单点声明；这里不写字面量。
 */

import { createTokenMap } from "@omit-design/engine/preset";
import { presetMobileManifest } from "../preset.manifest";

const PFX = presetMobileManifest.tokenPrefixes;

export const COLOR_KEYS = [
  "primary",
  "secondary",
  "tertiary",
  "success",
  "warning",
  "danger",
  "dark",
  "medium",
  "light",
  "background",
  "text",
] as const;

// background / text 不走 --ion-color-* 模式（Ionic 历史命名），单独 override
export const colorTokens = createTokenMap(COLOR_KEYS, PFX.color, {
  background: "--ion-background-color",
  text: "--ion-text-color",
});

export const SPACING_KEYS = ["xs", "sm", "md", "lg", "xl", "2xl"] as const;
export const spacingTokens = createTokenMap(SPACING_KEYS, PFX.spacing);

export const RADIUS_KEYS = ["sm", "md", "lg", "xl", "2xl", "full"] as const;
export const radiusTokens = createTokenMap(RADIUS_KEYS, PFX.radius);

export const FONT_KEYS = ["xs", "sm", "md", "lg", "xl", "2xl", "3xl"] as const;
export const fontSizeTokens = createTokenMap(FONT_KEYS, PFX.font);

export const SHADOW_KEYS = ["sm", "md", "lg"] as const;
export const shadowTokens = createTokenMap(SHADOW_KEYS, PFX.shadow ?? "--om-shadow-");

export type ColorTokenName = keyof typeof colorTokens;
export type SpacingTokenName = keyof typeof spacingTokens;
export type RadiusTokenName = keyof typeof radiusTokens;
export type FontSizeTokenName = keyof typeof fontSizeTokens;
export type ShadowTokenName = keyof typeof shadowTokens;

export const tokenVar = (cssVar: string) => `var(${cssVar})`;
