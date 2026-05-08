/**
 * `omit-design upgrade` — 一条命令把项目里所有 @omit-design/* 依赖升到 npm 上的最新版。
 *
 * 流程:
 *   1. 读 ./package.json，找出所有 @omit-design/* dep（dependencies / devDependencies）
 *   2. 并发拉每个包在 npm 上的 `latest` 版本
 *   3. 把范围改成 `^X.Y.Z`，写回 package.json
 *   4. 检测包管理器（bun.lock / pnpm-lock.yaml / yarn.lock / package-lock.json），跑对应 install
 *   5. 扫项目里残留的旧类名 / API（来自历次 CHANGELOG），打印迁移建议
 *   6. 打印 CHANGELOG 链接
 *
 * 标志:
 *   --dry-run     只打印计划，不改文件、不装包
 *   --check       只做 1+2 步，列出可升级的包并 exit 1（CI 友好）
 *   --no-install  跳过 install
 *   --no-migrate  跳过项目代码扫描
 */
import { defineCommand } from "citty";
import { spawn } from "node:child_process";
import path from "node:path";
import fs from "fs-extra";

interface DepEntry {
  name: string;
  field: "dependencies" | "devDependencies";
  current: string;
}

type Pm = "bun" | "pnpm" | "yarn" | "npm";

export default defineCommand({
  meta: {
    name: "upgrade",
    description: "把项目里 @omit-design/* 依赖升级到 npm 最新版（含 CHANGELOG 提示）。",
  },
  args: {
    "dry-run": {
      type: "boolean",
      description: "只打印计划，不改 package.json、不装包。",
      default: false,
    },
    check: {
      type: "boolean",
      description: "只检查是否有可升级的版本，有则 exit 1（CI 友好）。",
      default: false,
    },
    install: {
      type: "boolean",
      description: "升级后自动跑 install（用 --no-install 跳过）。",
      default: true,
    },
    migrate: {
      type: "boolean",
      description: "扫描项目代码里残留的旧类名 / API（用 --no-migrate 跳过）。",
      default: true,
    },
  },
  async run({ args }) {
    const cwd = process.cwd();
    const pkgPath = path.join(cwd, "package.json");
    if (!(await fs.pathExists(pkgPath))) {
      process.stderr.write(`✗ 当前目录没有 package.json: ${cwd}\n`);
      process.exit(1);
    }
    const pkg = await fs.readJson(pkgPath);
    const targets: DepEntry[] = [];
    for (const field of ["dependencies", "devDependencies"] as const) {
      const map = pkg[field] ?? {};
      for (const name of Object.keys(map)) {
        if (name.startsWith("@omit-design/")) {
          targets.push({ name, field, current: String(map[name]) });
        }
      }
    }
    if (targets.length === 0) {
      process.stdout.write(
        "✓ 当前 package.json 没有 @omit-design/* 依赖，无需升级。\n"
      );
      return;
    }

    process.stdout.write(`发现 ${targets.length} 个 @omit-design/* 依赖，查询最新版本…\n`);

    const results = await Promise.all(
      targets.map(async (t) => ({ ...t, latest: await fetchLatest(t.name) }))
    );

    type Plan = DepEntry & { latest: string | null; nextRange: string };
    const plan: Plan[] = results.map((r) => ({
      ...r,
      nextRange: r.latest ? `^${r.latest}` : r.current,
    }));

    const upgradable = plan.filter(
      (p) => p.latest && stripCaret(p.current) !== p.latest
    );
    const fresh = plan.filter((p) => p.latest && stripCaret(p.current) === p.latest);
    const failed = plan.filter((p) => !p.latest);

    const colW = Math.max(...plan.map((p) => p.name.length));
    process.stdout.write("\n");
    for (const p of plan) {
      const line = padRight(p.name, colW);
      if (!p.latest) {
        process.stdout.write(`  ? ${line}  ${p.current} → (查询失败)\n`);
      } else if (stripCaret(p.current) === p.latest) {
        process.stdout.write(`  = ${line}  ${p.current} (已是最新)\n`);
      } else {
        process.stdout.write(`  ↑ ${line}  ${p.current} → ${p.nextRange}\n`);
      }
    }
    process.stdout.write("\n");

    if (failed.length > 0) {
      process.stderr.write(
        `⚠ ${failed.length} 个包查询失败，跳过升级。检查网络或 npm 注册表。\n`
      );
    }

    if (upgradable.length === 0) {
      process.stdout.write(`✓ 所有 @omit-design/* 已是最新（${fresh.length} 个）。\n`);
      return;
    }

    if (args.check) {
      process.stdout.write(
        `有 ${upgradable.length} 个包可以升级。运行 \`omit-design upgrade\` 应用。\n`
      );
      process.exit(1);
    }

    if (args["dry-run"]) {
      process.stdout.write(`(--dry-run) 未写入。去掉 --dry-run 即可应用。\n`);
      return;
    }

    // 写回 package.json
    for (const p of upgradable) {
      pkg[p.field][p.name] = p.nextRange;
    }
    await fs.writeJson(pkgPath, pkg, { spaces: 2 });
    // writeJson 不附换行，npm/bun init 默认带末尾换行 — 兼容一下
    const buf = await fs.readFile(pkgPath, "utf8");
    if (!buf.endsWith("\n")) await fs.writeFile(pkgPath, buf + "\n");

    process.stdout.write(`✓ 已更新 package.json（${upgradable.length} 个范围）。\n`);

    if (!args.install) {
      process.stdout.write(`(--no-install) 跳过依赖安装。手动跑 install 完成升级。\n`);
      // 仍然执行迁移扫描
      if (args.migrate) await scanLegacyUsage(cwd);
      return;
    }

    const pm = await detectPm(cwd);
    process.stdout.write(`检测到包管理器: ${pm} → 安装中…\n\n`);

    const code = await runInstall(pm, cwd);
    if (code !== 0) {
      process.stderr.write(`\n✗ install 退出码 ${code}。可能需要手动处理冲突。\n`);
      process.exit(code);
    }

    process.stdout.write(`\n✓ 升级完成。\n`);

    // 扫项目里残留的旧 class / API
    if (args.migrate) {
      await scanLegacyUsage(cwd);
    }

    // 提示 CHANGELOG
    const engineUpgraded = upgradable.find((p) => p.name === "@omit-design/engine");
    if (engineUpgraded) {
      process.stdout.write(
        `\n📖 engine 升级到 ${engineUpgraded.nextRange}，CHANGELOG:\n` +
          `   https://github.com/leefanv/omit-design/blob/main/CHANGELOG.md\n`
      );
    }
  },
});

/**
 * 历次 release 删除 / 重命名的 class / API。每条记录可指向：
 *   - removedIn: 删除发生的版本（仅供说明）
 *   - replacement: 一句话迁移建议；null 表示"已彻底移除，不再需要"
 *
 * 检测策略：用 RegExp `\b<token>\b` 匹配，避免误命中 substring。
 */
interface LegacyEntry {
  token: string;
  removedIn: string;
  replacement: string | null;
}

const LEGACY_TOKENS: LegacyEntry[] = [
  // 0.2.0 — RightPanel 三 Tab 删除
  { token: "shell-right-panel__tabs", removedIn: "engine 0.2.0", replacement: ".shell-right-panel__head" },
  { token: "shell-right-panel__tab", removedIn: "engine 0.2.0", replacement: "（已删除，标题改为单标题）" },
  { token: "shell-right-panel__tab-icon", removedIn: "engine 0.2.0", replacement: "（已删除）" },
  { token: "shell-right-panel__tab-label", removedIn: "engine 0.2.0", replacement: "（已删除）" },
  // 0.2.0 — DesignFrame 设备外壳删除
  { token: "shell-device-screen", removedIn: "engine 0.2.0", replacement: ".shell-design-frame" },
  { token: "shell-device-notch", removedIn: "engine 0.2.0", replacement: null },
  { token: "shell-device-statusbar", removedIn: "engine 0.2.0", replacement: null },
  { token: "shell-device-content", removedIn: "engine 0.2.0", replacement: ".canvas-page-frame 或 .shell-design-frame" },
  { token: "DeviceStatusBar", removedIn: "engine 0.2.0", replacement: null },
  // 0.2.0 — ProjectDetail 老布局删除
  { token: "shell-studio__layout", removedIn: "engine 0.2.0", replacement: ".canvas-root" },
  { token: "shell-studio__toc", removedIn: "engine 0.2.0", replacement: ".canvas-picker" },
  { token: "shell-studio__main", removedIn: "engine 0.2.0", replacement: ".canvas-viewport" },
  { token: "shell-studio__group", removedIn: "engine 0.2.0", replacement: ".canvas-picker__group" },
  { token: "shell-studio__grid", removedIn: "engine 0.2.0", replacement: "（已删除，改为单页画布）" },
  { token: "shell-studio__card", removedIn: "engine 0.2.0", replacement: "（已删除）" },
  { token: "shell-studio__thumb", removedIn: "engine 0.2.0", replacement: "（已删除）" },
  { token: "shell-studio__meta", removedIn: "engine 0.2.0", replacement: "（已删除）" },
];

const SCAN_EXTS = new Set([
  ".css",
  ".scss",
  ".sass",
  ".less",
  ".tsx",
  ".ts",
  ".jsx",
  ".js",
  ".mjs",
  ".cjs",
  ".html",
  ".vue",
  ".svelte",
  ".astro",
]);

const SKIP_DIRS = new Set([
  "node_modules",
  "dist",
  "build",
  "out",
  ".vite",
  ".next",
  ".nuxt",
  ".turbo",
  ".cache",
  ".git",
  ".svn",
  "coverage",
]);

interface Hit {
  file: string;
  line: number;
  token: string;
  excerpt: string;
}

async function scanLegacyUsage(root: string): Promise<void> {
  process.stdout.write(`\n扫描项目代码里残留的旧类名 / API…\n`);
  const files: string[] = [];
  await walk(root, files);
  if (files.length === 0) {
    process.stdout.write(`  （未发现可扫描的源文件）\n`);
    return;
  }

  // 一次性编译所有 token 的 regex（边界用 [^A-Za-z0-9_-] 而非 \b，因为 token
  // 含 `-` / `__` ，\b 不一定按预期工作）
  const tokenRegexes = LEGACY_TOKENS.map((t) => ({
    entry: t,
    re: new RegExp(`(^|[^A-Za-z0-9_-])${escapeRegex(t.token)}([^A-Za-z0-9_-]|$)`),
  }));

  const hits: Hit[] = [];
  for (const file of files) {
    let content: string;
    try {
      content = await fs.readFile(file, "utf8");
    } catch {
      continue;
    }
    if (!content) continue;
    const lines = content.split("\n");
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      for (const { entry, re } of tokenRegexes) {
        if (re.test(line)) {
          hits.push({
            file: path.relative(root, file),
            line: i + 1,
            token: entry.token,
            excerpt: line.trim().slice(0, 100),
          });
        }
      }
    }
  }

  if (hits.length === 0) {
    process.stdout.write(`  ✓ 无残留。扫描了 ${files.length} 个文件。\n`);
    return;
  }

  // 按 token 分组报告
  const byToken = new Map<string, Hit[]>();
  for (const h of hits) {
    let arr = byToken.get(h.token);
    if (!arr) {
      arr = [];
      byToken.set(h.token, arr);
    }
    arr.push(h);
  }
  const tokenInfo = new Map(LEGACY_TOKENS.map((t) => [t.token, t]));

  process.stdout.write(
    `  ⚠ 发现 ${hits.length} 处可能需迁移的引用（${byToken.size} 个 token）：\n\n`
  );
  for (const [token, list] of byToken) {
    const info = tokenInfo.get(token);
    const replacement =
      info?.replacement ?? "（已彻底移除）";
    process.stdout.write(
      `  ${token}  →  ${replacement}  [${info?.removedIn ?? "?"}]\n`
    );
    for (const h of list.slice(0, 5)) {
      process.stdout.write(`    ${h.file}:${h.line}  ${h.excerpt}\n`);
    }
    if (list.length > 5) {
      process.stdout.write(`    …还有 ${list.length - 5} 处\n`);
    }
  }
  process.stdout.write(
    `\n  迁移完成后再次运行 \`omit-design upgrade --no-install\` 验证。\n`
  );
}

async function walk(dir: string, out: string[]): Promise<void> {
  let entries: import("fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }
  for (const entry of entries) {
    const name = entry.name;
    if (name.startsWith(".") && name !== "." && !name.startsWith("..")) {
      // 隐藏目录除非显式白名单（这里不白名单任何）
      if (SKIP_DIRS.has(name)) continue;
      // 不扫描隐藏目录里的文件（.git / .vite 等）
      if (entry.isDirectory()) continue;
    }
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(name)) continue;
      await walk(path.join(dir, name), out);
    } else if (entry.isFile()) {
      if (SCAN_EXTS.has(path.extname(name).toLowerCase())) {
        out.push(path.join(dir, name));
      }
    }
  }
}

function escapeRegex(s: string): string {
  return s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");
}

async function fetchLatest(pkg: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://registry.npmjs.org/${encodeURIComponent(pkg).replace("%40", "@")}/latest`,
      { headers: { Accept: "application/json" } }
    );
    if (!res.ok) return null;
    const data = (await res.json()) as { version?: string };
    return typeof data.version === "string" ? data.version : null;
  } catch {
    return null;
  }
}

function stripCaret(range: string): string {
  return range.replace(/^[\^~>=<\s]+/, "");
}

function padRight(s: string, n: number): string {
  return s + " ".repeat(Math.max(0, n - s.length));
}

async function detectPm(cwd: string): Promise<Pm> {
  const has = (f: string) => fs.pathExists(path.join(cwd, f));
  if (await has("bun.lock")) return "bun";
  if (await has("bun.lockb")) return "bun";
  if (await has("pnpm-lock.yaml")) return "pnpm";
  if (await has("yarn.lock")) return "yarn";
  if (await has("package-lock.json")) return "npm";
  return "npm";
}

function runInstall(pm: Pm, cwd: string): Promise<number> {
  const cmd = pm === "yarn" ? "yarn" : pm;
  const args = pm === "yarn" ? [] : ["install"];
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { cwd, stdio: "inherit", env: process.env });
    child.on("close", (code) => resolve(code ?? 0));
    child.on("error", (err) => {
      process.stderr.write(`✗ 启动 ${cmd} 失败: ${err.message}\n`);
      resolve(1);
    });
  });
}
