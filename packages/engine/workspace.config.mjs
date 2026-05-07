/**
 * Workspace path 单一真源 —— vite / eslint / tsconfig 都从这里派生。
 *
 * 加 / 改 / 删任何 `@/...` 子树：
 *   1. 改这份里的 `paths` 数组
 *   2. 跑 `npm run sync-tsconfig`（会重写 tsconfig.paths.json）
 *   3. vite / eslint 直接 import，无需额外步骤
 *
 * CI / prebuild 会跑 `sync-tsconfig --check`，mismatch 失败。
 */
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
/** repo 根 */
export const repoRoot = path.resolve(here, "../..");

/**
 * 单条 alias 映射。
 *  - `key`: alias 前缀（不带尾 `*`）
 *  - `abs`: 相对 repo 根的实际路径
 *  - `bare`: 是否 export 一个裸 alias（`@/shell`）指向文件，`abs` 须带 `.ts` 后缀
 *  - `wildcard`: 是否 export 一个通配 alias（`@/shell/*`），`abs` 须以 `/` 结尾
 *
 * 大多数子树两样都有（bare + wildcard），少数只有 wildcard（如 `@/lib/inspect/*`）。
 */
const paths = [
  // Engine
  { key: "@/shell",                   abs: "packages/engine/src/shell/index.ts",            bare: true,  wildcard: false },
  { key: "@/shell",                   abs: "packages/engine/src/shell/",                    bare: false, wildcard: true  },
  { key: "@/preset",                  abs: "packages/engine/src/preset/index.ts",           bare: true,  wildcard: false },
  { key: "@/preset",                  abs: "packages/engine/src/preset/",                   bare: false, wildcard: true  },
  { key: "@/registry",                abs: "packages/engine/src/registry/index.ts",         bare: true,  wildcard: false },
  { key: "@/registry",                abs: "packages/engine/src/registry/",                 bare: false, wildcard: true  },
  { key: "@/discovery",               abs: "packages/engine/src/discovery/index.ts",        bare: true,  wildcard: false },
  { key: "@/discovery",               abs: "packages/engine/src/discovery/",                bare: false, wildcard: true  },
  { key: "@/lib/inspect",             abs: "packages/engine/src/inspect/",                  bare: false, wildcard: true  },
  { key: "@/lib/theme-editor",        abs: "packages/engine/src/theme-editor/",             bare: false, wildcard: true  },
  { key: "@/lib/capture",             abs: "packages/engine/src/capture/index.ts",          bare: true,  wildcard: false },
  { key: "@/lib/capture",             abs: "packages/engine/src/capture/",                  bare: false, wildcard: true  },
  // pos-design preset aliases（legacy @/design-system/* → project/pos-design/preset/）
  { key: "@/design-system/components", abs: "project/pos-design/preset/components/index.ts", bare: true,  wildcard: false },
  { key: "@/design-system/components", abs: "project/pos-design/preset/components/",         bare: false, wildcard: true  },
  { key: "@/design-system/tokens",     abs: "project/pos-design/preset/tokens/index.ts",     bare: true,  wildcard: false },
  { key: "@/design-system/tokens",     abs: "project/pos-design/preset/tokens/",             bare: false, wildcard: true  },
  { key: "@/design-system/theme",      abs: "project/pos-design/preset/theme/",              bare: false, wildcard: true  },
  // Mock 数据（pos-design 项目内）
  { key: "@/lib/mock",                 abs: "project/pos-design/mock/",                      bare: false, wildcard: true  },
  // Fallback —— 必须放最后
  { key: "@",                          abs: "src/",                                         bare: false, wildcard: true  },
];

/** 给 vite `resolve.alias` 用（regex + absolute replacement） */
export const viteAlias = paths.flatMap((p) => {
  const out = [];
  const absPath = path.join(repoRoot, p.abs);
  if (p.bare) {
    out.push({ find: new RegExp(`^${escapeRe(p.key)}$`), replacement: absPath });
  }
  if (p.wildcard) {
    out.push({ find: new RegExp(`^${escapeRe(p.key)}/`), replacement: absPath });
  }
  return out;
});

/** 给 tsconfig `compilerOptions.paths` 用（相对 repo 根路径） */
export const tsconfigPaths = (() => {
  const out = {};
  for (const p of paths) {
    if (p.bare) out[p.key] = [p.abs];
    if (p.wildcard) out[`${p.key}/*`] = [`${p.abs}*`];
  }
  return out;
})();

/** tsconfig include 列表 */
export const tsconfigInclude = [
  "src",
  "packages/engine/src",
  "project",
];

/** eslint 全仓 ignores —— 所有 lint job 共用 */
export const eslintIgnores = [
  "dist/**",
  "node_modules/**",
  "packages/figma-plugin/**",
  "eslint-plugin-omit-design/**",
];

/** eslint 业务稿 files glob —— project/ 下所有项目的设计稿 .tsx */
export const eslintDesignFiles = ["project/*/design/**/*.tsx"];

/** eslint plugin 里 whitelist-ds-import 允许的 preset 包名 */
export const presetPackages = [
  "@omit-design/preset-mobile",
  "@omit-design/preset-desktop",
  "@omit-design/preset-go-parent",
  "@omit-design/preset-go-agent",
];

function escapeRe(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
