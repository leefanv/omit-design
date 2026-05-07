/**
 * preset-mobile manifest — engine 通过这个对象决定怎么对待 mobile 项目。
 * 见 [../engine/src/preset/types.ts](../engine/src/preset/types.ts) 里的 PresetManifest 接口注释。
 */

import type { PresetManifest } from "@omit-design/engine/preset";
import { baseline } from "./theme/baseline";

export const presetMobileManifest: PresetManifest = {
  name: "mobile",
  displayName: "Mobile (Ionic)",
  componentPrefix: "Om",
  attributeName: "data-omit-component",
  tokenPrefixes: {
    color: "--ion-color-",
    spacing: "--om-spacing-",
    radius: "--om-radius-",
    font: "--om-font-size-",
    shadow: "--om-shadow-",
  },
  canvas: {
    default: { width: 390, height: 844 },
    presets: [
      { label: "iPhone 14", width: 390, height: 844 },
      { label: "iPhone 14 Pro Max", width: 430, height: 932 },
      { label: "iPhone SE", width: 375, height: 667 },
      { label: "iPhone 12 mini", width: 360, height: 780 },
      { label: "Pixel 7", width: 412, height: 915 },
      { label: "Galaxy S20", width: 360, height: 800 },
      { label: "iPad mini", width: 744, height: 1133 },
    ],
    chrome: "mobile",
  },
  requiresIonic: true,
  a11ySelectors: {
    clickable: [
      "button",
      "a",
      "[role='button']",
      "input",
      "ion-button",
      "ion-item[button]",
      "[data-omit-component='OmButton']",
      "[data-omit-component='OmListRow']",
    ],
  },
  semanticColors: [
    "primary",
    "secondary",
    "tertiary",
    "success",
    "warning",
    "danger",
    "dark",
    "medium",
    "light",
  ],
  themeBaseline: {
    colors: { ...baseline.colors },
    spacing: { ...baseline.spacing },
  },
};
