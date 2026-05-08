import { defineCommand } from "citty";
import path from "node:path";
import fs from "fs-extra";

export default defineCommand({
  meta: {
    name: "new-page",
    description: "Scaffold a design page from a preset-mobile pattern template.",
  },
  args: {
    pattern: {
      type: "positional",
      required: true,
      description: "Pattern name (e.g. list-view, detail-view, form-view).",
    },
    path: {
      type: "positional",
      required: true,
      description: "Target file path (relative to cwd; .tsx auto-appended).",
    },
    force: {
      type: "boolean",
      description: "Overwrite the target file if it already exists.",
      default: false,
    },
  },
  async run({ args }) {
    const cwd = process.cwd();
    const templatesDir = path.join(
      cwd,
      "node_modules",
      "@omit-design",
      "preset-mobile",
      "templates"
    );

    if (!(await fs.pathExists(templatesDir))) {
      process.stderr.write(
        `✗ 找不到 ${path.relative(cwd, templatesDir)}/。请先 npm install 或在 omit-design 项目根目录运行。\n`
      );
      process.exit(1);
    }

    const tmplFile = path.join(templatesDir, `${args.pattern}.tmpl.tsx`);
    if (!(await fs.pathExists(tmplFile))) {
      const available = (await fs.readdir(templatesDir))
        .filter((f) => f.endsWith(".tmpl.tsx"))
        .map((f) => `  · ${f.replace(/\.tmpl\.tsx$/, "")}`)
        .sort()
        .join("\n");
      process.stderr.write(
        `✗ 未知 pattern: ${args.pattern}\n\n可用 pattern:\n${available}\n`
      );
      process.exit(1);
    }

    const targetPath = resolveTarget(cwd, args.path);
    const targetRel = path.relative(cwd, targetPath);

    if ((await fs.pathExists(targetPath)) && !args.force) {
      process.stderr.write(
        `✗ ${targetRel} 已存在。加 --force 覆盖,或换个路径。\n`
      );
      process.exit(1);
    }

    await fs.ensureDir(path.dirname(targetPath));
    await fs.copyFile(tmplFile, targetPath);

    if (!targetRel.startsWith("design/") && !targetRel.startsWith("design\\")) {
      process.stdout.write(
        `⚠ ${targetRel} 不在 design/ 下,dev server 不会自动发现该稿。\n`
      );
    }

    process.stdout.write(
      [
        `✓ 已创建 ${targetRel}(pattern: ${args.pattern})`,
        ``,
        `下一步:`,
        `  1. 改 meta.name / description`,
        `  2. 替换 TODO 占位(导入数据 / 调整文案 / 修 IonBackButton.defaultHref)`,
        `  3. 启动 dev server: npm run dev`,
        ``,
      ].join("\n")
    );
  },
});

function resolveTarget(cwd: string, raw: string): string {
  let p = raw.endsWith(".tsx") ? raw : `${raw}.tsx`;
  if (!path.isAbsolute(p)) p = path.resolve(cwd, p);
  return p;
}
