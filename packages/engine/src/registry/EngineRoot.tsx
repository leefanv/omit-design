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

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DesignSource } from "../discovery";
import type {
  DesignEntry,
  DesignGroup,
  DiscoveredProject,
  ExternalProject,
} from "./types";
import { fetchExternalProjects } from "./external";

interface EngineContextValue {
  projects: DiscoveredProject[];
  /** 跨 repo 注册表里其他项目（去重了本地） */
  externalProjects: ExternalProject[];
}

const EngineContext = createContext<EngineContextValue | null>(null);

interface EngineRootProps {
  source: DesignSource;
  children: ReactNode;
}

export function EngineRoot({ source, children }: EngineRootProps) {
  const [externalProjects, setExternalProjects] = useState<ExternalProject[]>([]);

  // 异步拉取跨 repo 注册表 —— 失败/超时静默忽略（dev-server 没启或没注册过都正常）
  useEffect(() => {
    const ac = new AbortController();
    const excludeIds = source.projects.map((p) => p.id);
    fetchExternalProjects({ excludeIds, signal: ac.signal })
      .then(setExternalProjects)
      .catch(() => {
        /* registry endpoint 不可用 —— 单 repo / 生产构建场景，静默跳过 */
      });
    return () => ac.abort();
  }, [source.projects]);

  const value = useMemo<EngineContextValue>(
    () => ({ projects: source.projects, externalProjects }),
    [source, externalProjects],
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

/** 跨 repo 注册表里其他项目（已去重本地） */
export function useExternalProjects(): ExternalProject[] {
  return useEngine().externalProjects;
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
