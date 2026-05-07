import { defineCommand } from "citty";
import { fileURLToPath } from "node:url";
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
            `✗ ${args.name} 已存在且非空。加 --force 覆盖,或换个名字。\n`
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
        `✗ 内置脚手架 templates/init 未找到(应位于 ${templateDir})。请检查 @omit-design/cli 安装是否完整。\n`
      );
      process.exit(1);
    }

    process.stdout.write(`→ 创建 ${path.relative(process.cwd(), targetDir)}/ ...\n`);
    await fs.copy(templateDir, targetDir, { overwrite: true });

    // 渲染 .tmpl 文件:替换占位符 + 重命名
    await renderTemplates(targetDir, { projectName: args.name });

    process.stdout.write(
      [
        `✓ 已创建 ${args.name}/`,
        ``,
        `下一步:`,
        `  cd ${args.name}`,
        `  npm install`,
        `  npm run dev`,
        ``,
      ].join("\n")
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
