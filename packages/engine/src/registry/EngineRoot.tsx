/**
 * Engine context provider —— 调用方传一个 DesignSource 进来，engine 不再
 * 假设设计稿来自 import.meta.glob：可以是 globDiscovery（本地）/ apiDiscovery（远程）
 * / 任何自定义实现。
 *
 * 用法：
 *   import { globDiscovery } from "../discovery";
 *   const source = globDiscovery([goParentProject, goAgentProject]);
 *   <EngineRoot source={source}>...</EngineRoot>
 */

import { createContext, useContext, useMemo, type ReactNode } from "react";
import type { DesignSource } from "../discovery";
import type {
  DesignEntry,
  DesignGroup,
  DiscoveredProject,
} from "./types";

interface EngineContextValue {
  projects: DiscoveredProject[];
}

const EngineContext = createContext<EngineContextValue | null>(null);

interface EngineRootProps {
  source: DesignSource;
  children: ReactNode;
}

export function EngineRoot({ source, children }: EngineRootProps) {
  const value = useMemo<EngineContextValue>(
    () => ({ projects: source.projects }),
    [source],
  );
  return <EngineContext.Provider value={value}>{children}</EngineContext.Provider>;
}

function useEngine(): EngineContextValue {
  const v = useContext(EngineContext);
  if (!v) throw new Error("useEngine must be used inside <EngineRoot>");
  return v;
}

/** 全部 project（顺序 = main.tsx 传入顺序） */
export function useProjects(): DiscoveredProject[] {
  return useEngine().projects;
}

/** 按 id 找 project（不存在返回 undefined） */
export function useProject(id: string): DiscoveredProject | undefined {
  return useEngine().projects.find((p) => p.id === id);
}

/** 按当前路由 pathname 找 project + entry */
export function useProjectByHref(href: string):
  | { project: DiscoveredProject; entry?: DesignEntry }
  | undefined {
  const path = href.split("?")[0];
  const projects = useProjects();
  for (const p of projects) {
    const entry = p.entries.find((e) => e.href.split("?")[0] === path);
    if (entry) return { project: p, entry };
  }
  return undefined;
}

/** 当前 project 按 id 拆 group（顺序 = config.groups 顺序） */
export function useProjectGroups(projectId: string): DesignGroup[] {
  const p = useProject(projectId);
  if (!p) return [];
  return p.groups.map((g) => ({
    ...g,
    entries: p.entries.filter((e) => e.groupId === g.id),
  }));
}
