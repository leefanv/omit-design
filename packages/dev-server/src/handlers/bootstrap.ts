import fs from "node:fs/promises";
import path from "node:path";

/**
 * Bootstrap payload —— Claude Code 用 /bootstrap-from-figma skill 跑完 Figma 抓取后，
 * PUT 进来的结构。落盘到 <root>/.omit/bootstrap.json。
 *
 * BootstrapBanner 在 LibraryPage 顶部读取这份数据，让用户预览 + Apply 到 theme-editor。
 */
export interface BootstrapPayload {
  source: {
    kind: "figma" | "palette" | "manual";
    url?: string;
    fileKey?: string;
    nodeId?: string;
  };
  extractedAt: string;
  theme: {
    presetName: string;
    colors: Record<string, string>;
    spacing?: Record<string, string>;
  };
  notes?: string;
}

const FILE = path.join(".omit", "bootstrap.json");

function resolveBootstrapFile(root: string): string {
  const target = path.resolve(root, FILE);
  const rootResolved = path.resolve(root);
  const rootWithSep = rootResolved.endsWith(path.sep)
    ? rootResolved
    : rootResolved + path.sep;
  if (!target.startsWith(rootWithSep)) {
    throw new Error("path traversal blocked");
  }
  return target;
}

export async function readBootstrap(root: string): Promise<BootstrapPayload | null> {
  const file = resolveBootstrapFile(root);
  try {
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as BootstrapPayload;
    return parsed;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return null;
    throw err;
  }
}

export async function writeBootstrap(root: string, payload: BootstrapPayload): Promise<void> {
  if (!payload || typeof payload !== "object") throw new Error("invalid payload");
  if (!payload.theme || typeof payload.theme !== "object") throw new Error("missing theme");
  if (!payload.source || typeof payload.source !== "object") throw new Error("missing source");
  const file = resolveBootstrapFile(root);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, JSON.stringify(payload, null, 2), "utf8");
}

export async function clearBootstrap(root: string): Promise<void> {
  const file = resolveBootstrapFile(root);
  await fs.rm(file, { force: true });
}
