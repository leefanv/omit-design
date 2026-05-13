/**
 * Cross-repo project registry — ~/.omit-design/projects.json
 *
 * 维护用户机器上所有 omit-design 项目的索引。每个 repo 启动 `omit-design dev`
 * 时通过 [self-register.ts](../self-register.ts) 把自己写进来：
 *   { id, name, description, icon, path, port, lastSeenAt }
 *
 * 任一 repo 的 workspace UI 读这份注册表，就能在首页看到全部项目（包括同时跑
 * 着的其他 dev server）。
 *
 * 写入策略：以 `path`（repo 绝对路径）为唯一键 upsert。删除策略：暂不删除离线
 * 项目，仅靠 `lastSeenAt` 给前端排序/筛选。
 */
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { homedir } from "node:os";
import path from "node:path";

const REGISTRY_DIR = path.join(homedir(), ".omit-design");
const REGISTRY_FILE = path.join(REGISTRY_DIR, "projects.json");

export interface RegisteredProject {
  /** Project.id（来自 ProjectConfig），同一台机器内应唯一；冲突时以 path 为准。 */
  id: string;
  name: string;
  description?: string;
  icon?: string;
  /** repo 根目录绝对路径 —— 注册表唯一键 */
  path: string;
  /** dev server 上次绑定的端口；离线时仍保留，前端 fetch 失败可识别为 offline */
  port?: number;
  /** ISO timestamp，dev server 上次启动时间 */
  lastSeenAt: string;
  /** 首个 design 入口 href，例如 /designs/main/welcome —— 用于跨端口缩略图 iframe */
  firstEntryHref?: string;
  /** "mobile" | "desktop" —— 卡片宽高 / iframe 尺寸 */
  chrome?: "mobile" | "desktop";
}

interface RegistryFile {
  version: 1;
  projects: RegisteredProject[];
}

const EMPTY: RegistryFile = { version: 1, projects: [] };

export async function readRegistry(): Promise<RegistryFile> {
  try {
    const raw = await readFile(REGISTRY_FILE, "utf-8");
    const parsed = JSON.parse(raw);
    if (parsed?.version === 1 && Array.isArray(parsed.projects)) {
      return parsed as RegistryFile;
    }
  } catch {
    /* not found / unparseable —— 当成空 */
  }
  return { ...EMPTY };
}

async function writeRegistry(reg: RegistryFile): Promise<void> {
  await mkdir(REGISTRY_DIR, { recursive: true });
  await writeFile(REGISTRY_FILE, JSON.stringify(reg, null, 2), "utf-8");
}

/** 以 path 为唯一键 upsert，merge 已有字段 */
export async function upsertProject(entry: RegisteredProject): Promise<void> {
  const reg = await readRegistry();
  const idx = reg.projects.findIndex((p) => p.path === entry.path);
  if (idx >= 0) {
    reg.projects[idx] = { ...reg.projects[idx], ...entry };
  } else {
    reg.projects.push(entry);
  }
  await writeRegistry(reg);
}

export async function listProjects(): Promise<RegisteredProject[]> {
  return (await readRegistry()).projects;
}
