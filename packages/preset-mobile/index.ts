/**
 * preset-mobile barrel — 业务稿 / App 入口通过单次 `import "@omit-design/preset-mobile"`
 * 就能拿到组件白名单 + 注入 token CSS + Ionic 运行时。
 *
 * CSS import 是故意的 side effect:preset 自包含,engine mount 时不需要关心
 * "哪些 CSS 要注入"。
 */

// Token 变量（side-effect）
import "./theme/variables.css";

export * from "./components";
export { presetMobileManifest } from "./preset.manifest";
export { presetMobileManifest as default } from "./preset.manifest";
