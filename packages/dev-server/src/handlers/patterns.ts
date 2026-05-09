import fs from "node:fs/promises";
import path from "node:path";
import { safeJoin } from "../safe-path.js";

export interface PatternConfig {
  name: string;
  whitelist: string[];
  description?: string;
}

export interface PatternSummary {
  id: string;
  name: string;
  whitelist: string[];
  description: string;
  source: "custom";
}

export interface ImportStartersResult {
  imported: string[];
  skipped: string[];
  source: string | null;
}

export async function listPatterns(root: string): Promise<PatternSummary[]> {
  const dir = path.join(root, "patterns");
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }
  const out: PatternSummary[] = [];
  for (const id of entries) {
    if (id.startsWith(".")) continue;
    const cfgPath = path.join(dir, id, "pattern.json");
    try {
      const stat = await fs.stat(cfgPath);
      if (!stat.isFile()) continue;
      const raw = await fs.readFile(cfgPath, "utf8");
      const cfg = JSON.parse(raw) as PatternConfig;
      out.push({
        id,
        name: cfg.name ?? id,
        whitelist: Array.isArray(cfg.whitelist) ? cfg.whitelist : [],
        description: cfg.description ?? "",
        source: "custom",
      });
    } catch {
      // 忽略损坏配置
    }
  }
  out.sort((a, b) => a.id.localeCompare(b.id));
  return out;
}

export interface PatternDetail {
  config: PatternConfig;
  template: string;
  readme: string;
}

export async function readPattern(root: string, id: string): Promise<PatternDetail> {
  const dir = safeJoin(root, "pattern", id);
  const [cfg, tpl, readme] = await Promise.all([
    fs.readFile(path.join(dir, "pattern.json"), "utf8"),
    safeRead(path.join(dir, "template.tmpl.tsx")),
    safeRead(path.join(dir, "README.md")),
  ]);
  return {
    config: JSON.parse(cfg) as PatternConfig,
    template: tpl,
    readme,
  };
}

export async function writePattern(
  root: string,
  id: string,
  detail: PatternDetail,
): Promise<void> {
  const dir = safeJoin(root, "pattern", id);
  await fs.mkdir(dir, { recursive: true });
  await Promise.all([
    fs.writeFile(path.join(dir, "pattern.json"), JSON.stringify(detail.config, null, 2) + "\n", "utf8"),
    fs.writeFile(path.join(dir, "template.tmpl.tsx"), detail.template, "utf8"),
    fs.writeFile(path.join(dir, "README.md"), detail.readme, "utf8"),
  ]);
}

export async function deletePattern(root: string, id: string): Promise<void> {
  const dir = safeJoin(root, "pattern", id);
  await fs.rm(dir, { recursive: true, force: true });
}

/**
 * 从 @omit-design/cli 包内置的 starter 复制到项目 patterns/ 下。
 * Source: <root>/node_modules/@omit-design/cli/templates/init/patterns/
 *
 * 已存在的 pattern 默认跳过；overwrite=true 时覆盖。
 */
export async function importStarters(
  root: string,
  opts: { overwrite?: boolean } = {},
): Promise<ImportStartersResult> {
  const sourceRoot = path.join(
    root,
    "node_modules",
    "@omit-design",
    "cli",
    "templates",
    "init",
    "patterns",
  );
  let entries: string[];
  try {
    const dirents = await fs.readdir(sourceRoot, { withFileTypes: true });
    entries = dirents.filter((d) => d.isDirectory() && !d.name.startsWith(".")).map((d) => d.name);
  } catch {
    return { imported: [], skipped: [], source: null };
  }
  const targetRoot = path.join(root, "patterns");
  await fs.mkdir(targetRoot, { recursive: true });

  const imported: string[] = [];
  const skipped: string[] = [];

  for (const name of entries) {
    const targetDir = path.join(targetRoot, name);
    const srcDir = path.join(sourceRoot, name);
    if (!opts.overwrite) {
      try {
        await fs.access(targetDir);
        skipped.push(name);
        continue;
      } catch {
        // not present — proceed to copy
      }
    }
    await fs.mkdir(targetDir, { recursive: true });
    for (const file of ["pattern.json", "template.tmpl.tsx", "README.md"]) {
      try {
        const buf = await fs.readFile(path.join(srcDir, file));
        await fs.writeFile(path.join(targetDir, file), buf);
      } catch {
        // 单个文件缺失不阻断别的 pattern
      }
    }
    imported.push(name);
  }

  return { imported, skipped, source: sourceRoot };
}

export async function listPresetComponents(root: string): Promise<string[]> {
  const presetDir = path.join(root, "node_modules", "@omit-design", "preset-mobile");
  // 扫两个候选入口：components/index.ts（真实 barrel），index.ts（顶层 re-export）
  const candidates = [
    path.join(presetDir, "components", "index.ts"),
    path.join(presetDir, "index.ts"),
  ];
  const names = new Set<string>();
  const NAMED_RE = /export\s*\{\s*([^}]+)\s*\}\s*from/g;
  const DECL_RE = /export\s+(?:const|function|class)\s+(Om[A-Za-z0-9]+)/g;
  for (const file of candidates) {
    let raw: string;
    try {
      raw = await fs.readFile(file, "utf8");
    } catch {
      continue;
    }
    let m: RegExpExecArray | null;
    while ((m = NAMED_RE.exec(raw))) {
      for (const id of m[1].split(",")) {
        const trimmed = id.trim().replace(/^type\s+/, "").replace(/\s+as\s+\w+$/, "");
        if (/^Om[A-Z]/.test(trimmed)) names.add(trimmed);
      }
    }
    while ((m = DECL_RE.exec(raw))) {
      names.add(m[1]);
    }
  }
  return Array.from(names).sort();
}

async function safeRead(p: string): Promise<string> {
  try {
    return await fs.readFile(p, "utf8");
  } catch {
    return "";
  }
}
