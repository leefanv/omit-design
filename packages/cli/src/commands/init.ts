import { defineCommand } from "citty";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";
import path from "node:path";
import fs from "fs-extra";

export default defineCommand({
  meta: {
    name: "init",
    description: "Scaffold a new omit-design project.",
  },
  args: {
    name: {
      type: "positional",
      required: true,
      description: "Project directory name (will be created in CWD).",
    },
    force: {
      type: "boolean",
      description: "Overwrite the target directory if it already exists.",
      default: false,
    },
    "no-git": {
      type: "boolean",
      description: "Skip auto `git init` (the pre-commit hook needs git).",
      default: false,
    },
    starters: {
      type: "boolean",
      description:
        "Copy the 8 starter patterns into patterns/. Disable with --no-starters to start with an empty patterns/ — let add-pattern create them on demand.",
      default: true,
    },
  },
  async run({ args }) {
    const targetDir = path.resolve(process.cwd(), args.name);
    const exists = await fs.pathExists(targetDir);

    if (exists && !args.force) {
      const stat = await fs.stat(targetDir);
      if (stat.isDirectory()) {
        const entries = await fs.readdir(targetDir);
        if (entries.length > 0) {
          process.stderr.write(
            `✗ ${args.name} exists and is not empty. use --force to overwrite, or pick a different name.\n`
          );
          process.exit(1);
        }
      }
    }

    // 找到 templates/init —— 相对 dist/commands/init.js 的位置
    const here = path.dirname(fileURLToPath(import.meta.url));
    const templateDir = path.resolve(here, "..", "..", "templates", "init");

    if (!(await fs.pathExists(templateDir))) {
      process.stderr.write(
        `✗ built-in templates/init directory not found (expected at ${templateDir}). check @omit-design/cli installation.\n`
      );
      process.exit(1);
    }

    process.stdout.write(`→ creating ${path.relative(process.cwd(), targetDir)}/ ...\n`);
    const skipStarters = args.starters === false;
    await fs.copy(templateDir, targetDir, {
      overwrite: true,
      filter: skipStarters
        ? (src) => {
            // 跳过 templates/init/patterns/<starter>/ 下的所有文件，但保留 patterns/ 目录
            const rel = path.relative(templateDir, src);
            const parts = rel.split(path.sep);
            return !(parts[0] === "patterns" && parts.length > 1);
          }
        : undefined,
    });

    // --no-starters 模式确保 patterns/ 目录存在（filter 只跳了里面的内容）
    if (skipStarters) {
      await fs.ensureDir(path.join(targetDir, "patterns"));
      await fs.writeFile(path.join(targetDir, "patterns", ".gitkeep"), "");
    }

    // 渲染 .tmpl 文件:替换占位符 + 重命名
    await renderTemplates(targetDir, { projectName: args.name });

    // 初始化 git 仓库,这样 husky pre-commit hook 在 npm install 时能装上
    let gitInited = false;
    if (!args["no-git"]) {
      const result = spawnSync("git", ["init", "--quiet"], {
        cwd: targetDir,
        stdio: "ignore",
      });
      gitInited = result.status === 0;
    }

    process.stdout.write(
      [
        `✓ Created ${args.name}/`,
        gitInited ? `✓ git initialized (pre-commit hook will install on npm install)` : ``,
        ``,
        `Next steps:`,
        `  cd ${args.name}`,
        `  npm install`,
        `  npm run dev`,
        ``,
      ]
        .filter((l) => l !== null)
        .join("\n")
    );
  },
});

async function renderTemplates(
  dir: string,
  vars: { projectName: string }
): Promise<void> {
  const stack: string[] = [dir];
  while (stack.length > 0) {
    const current = stack.pop()!;
    const entries = await fs.readdir(current, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(current, e.name);
      if (e.isDirectory()) {
        stack.push(full);
      } else if (e.isFile() && e.name.endsWith(".tmpl")) {
        const body = await fs.readFile(full, "utf8");
        const rendered = body
          .replace(/\{\{PROJECT_NAME\}\}/g, vars.projectName)
          .replace(/\{\{PROJECT_DIR\}\}/g, vars.projectName);
        const outPath = full.slice(0, -".tmpl".length);
        await fs.writeFile(outPath, rendered);
        await fs.remove(full);
      }
    }
  }
}
