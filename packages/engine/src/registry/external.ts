/**
 * 跨 repo 注册表的浏览器端获取逻辑。
 *
 * 从 dev-server 的 `/__omit/registry` endpoint 拿当前机器上所有正在跑（或曾跑过）
 * 的 omit-design 项目，转成 [ExternalProject](./types.ts)。
 *
 * 与本 repo 自身重复的项目（id 相同）会被剔除 —— 本 repo 的 project 由
 * globDiscovery 提供完整数据，不需要再走 external 链路。
 */
import type { ExternalProject } from "./types";

interface RegistryEntry {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  path: string;
  port?: number;
  lastSeenAt: string;
  firstEntryHref?: string;
  chrome?: "mobile" | "desktop";
}

interface RegistryResponse {
  projects: RegistryEntry[];
}

export async function fetchExternalProjects(opts: {
  /** 本地 project ids，用于去重（按 id）—— 当前 repo 不出现在 external 列表里 */
  excludeIds: readonly string[];
  signal?: AbortSignal;
}): Promise<ExternalProject[]> {
  const res = await fetch("/__omit/registry", { signal: opts.signal });
  if (!res.ok) throw new Error(`registry fetch failed: ${res.status}`);
  const data = (await res.json()) as RegistryResponse;
  const excludeIds = new Set(opts.excludeIds);
  // 按当前 window 的 port 排除自己 —— 即使多个 repo 重名 id 也能正确识别
  const selfPort =
    typeof window !== "undefined" && window.location.port
      ? Number(window.location.port)
      : NaN;
  return data.projects
    .filter((p) => {
      if (p.port == null) return false;
      if (p.port === selfPort) return false;
      if (excludeIds.has(p.id)) return false;
      return true;
    })
    .map<ExternalProject>((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      icon: p.icon,
      origin: `http://localhost:${p.port}`,
      port: p.port,
      repoPath: p.path,
      lastSeenAt: p.lastSeenAt,
      firstEntryHref: p.firstEntryHref,
      chrome: p.chrome,
    }));
}
