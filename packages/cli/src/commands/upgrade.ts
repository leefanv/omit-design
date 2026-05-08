/**
 * `omit-design upgrade` — 一条命令把项目里所有 @omit-design/* 依赖升到 npm 上的最新版。
 *
 * 流程:
 *   1. 读 ./package.json，找出所有 @omit-design/* dep（dependencies / devDependencies）
 *   2. 并发拉每个包在 npm 上的 `latest` 版本
 *   3. 把范围改成 `^X.Y.Z`，写回 package.json
 *   4. 检测包管理器（bun.lock / pnpm-lock.yaml / yarn.lock / package-lock.json），跑对应 install
 *   5. 打印一条 CHANGELOG 链接给用户看 breaking changes
 *
 * 标志:
 *   --dry-run   只打印计划，不改文件、不装包
 *   --check     只做 1+2 步，列出可升级的包并 exit 1（CI 友好）
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
    "no-install": {
      type: "boolean",
      description: "改 package.json 但跳过 install（之后自己跑）。",
      default: false,
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

    if (args["no-install"]) {
      process.stdout.write(`(--no-install) 跳过依赖安装。手动跑 install 完成升级。\n`);
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
