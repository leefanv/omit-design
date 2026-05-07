/**
 * @deprecated 用 [../baseline.ts](../baseline.ts) 的 `baseline` 代替，与 desktop 对齐命名。
 * 留作向后兼容（旧 import 路径仍生效）。
 */
import { baseline } from "../baseline";

export const lightPreset = baseline;
export type ThemePreset = typeof baseline;
