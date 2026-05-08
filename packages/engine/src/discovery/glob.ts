/**
 * globDiscovery — 把 Vite `import.meta.glob` 的结果转成 engine 的 DesignSource。
 *
 * Vite 要求 glob 模式是字面量,所以**调用方**必须自己跑 import.meta.glob
 * 再把结果传过来:
 *
 *     const modules = import.meta.glob<DesignModule>(
 *       "/design/** /*.tsx",
 *       { eager: true }
 *     );
 *     const source = globDiscovery({
 *       project: {
 *         id: "app",
 *         name: "My App",
 *         description: "...",
 *         icon: "🧩",
 *         preset: presetMobileManifest,
 *         groups: [{ id: "main", label: "主页" }],
 *       },
 *       modules,
 *     });
 *
 * 文件路径约定(pathRoot 之后,默认 "/design"):
 *   - `<file>.tsx`              → entry.href = `/designs/${defaultGroupId}/${file}`
 *   - `<group>/<file>.tsx`      → entry.href = `/designs/${group}/${file}`
 *   - `<group>/<sub>/<file>.tsx` → entry.href = `/designs/${group}/${sub}/${file}`
 *
 * PascalCase 文件名(`OnboardingShell.tsx` 等)被视为共享 shell,跳过路由注册。
 */

import type { ComponentType } from "react";
import type { DesignEntry, DesignMeta, ProjectConfig } from "../registry/types";
import type { DesignSource } from "./types";

export interface DesignModule {
  default: ComponentType;
  meta?: DesignMeta;
}

export interface GlobDiscoveryInput {
  /** 项目配置 — 至少要有 id / preset / groups,其他字段可空 */
  project: ProjectConfig;
  /** Vite import.meta.glob 的产物 */
  modules: Record<string, DesignModule>;
  /**
   * 模块路径的"design 根",前缀会从 path 里剥掉。
   * 默认 "/design"(单项目脚手架默认布局)。
   */
  pathRoot?: string;
  /** 没在子目录里的文件归到哪个 group。默认 groups[0].id */
  defaultGroupId?: string;
}

export function globDiscovery(input: GlobDiscoveryInput): DesignSource {
  const { project, modules, pathRoot = "/design", defaultGroupId } = input;
  const fallbackGroup = defaultGroupId ?? project.groups[0]?.id ?? "main";
  const byGroup: Record<string, DesignEntry[]> = {};

  for (const [path, mod] of Object.entries(modules)) {
    const parsed = parsePath(path, pathRoot, fallbackGroup);
    if (!parsed) continue;
    const { groupId, subPath } = parsed;

    const filename = subPath.split("/").pop() ?? "";
    if (/^[A-Z]/.test(filename)) continue; // shell 文件,跳过

    if (!mod.default) {
      console.warn(`[engine/glob] ${path} missing default export, skipping`);
      continue;
    }
    if (!mod.meta) {
      console.warn(
        `[engine/glob] ${path} missing meta export, skipping — add \`export const meta = { name, pattern }\``,
      );
      continue;
    }

    const entry: DesignEntry = {
      ...mod.meta,
      href: `/designs/${groupId}/${subPath}`,
      groupId,
      component: mod.default,
    };

    byGroup[groupId] ??= [];
    byGroup[groupId].push(entry);
  }

  const entries: DesignEntry[] = [];
  for (const g of project.groups) {
    const list = byGroup[g.id];
    if (!list) continue;
    list.sort((a, b) => a.href.localeCompare(b.href));
    entries.push(...list);
  }
  for (const orphan of Object.keys(byGroup)) {
    if (!project.groups.some((g) => g.id === orphan)) {
      console.warn(
        `[engine/glob] group "${orphan}" appears under design/ but is not declared in config, skipping`,
      );
    }
  }

  return { projects: [{ ...project, entries }] };
}

function parsePath(
  filePath: string,
  pathRoot: string,
  fallbackGroup: string,
): { groupId: string; subPath: string } | null {
  const normalized = filePath.replace(/\.tsx$/, "");
  const root = pathRoot.replace(/\/$/, "");

  let rest: string;
  if (normalized.startsWith(root + "/")) {
    rest = normalized.slice(root.length + 1);
  } else {
    return null;
  }

  const parts = rest.split("/");
  if (parts.length === 0) return null;

  if (parts.length === 1) {
    return { groupId: fallbackGroup, subPath: parts[0] };
  }

  const [groupId, ...sub] = parts;
  return { groupId, subPath: sub.join("/") };
}
