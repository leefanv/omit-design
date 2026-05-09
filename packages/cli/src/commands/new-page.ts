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
        `✗ ${path.relative(cwd, templatesDir)}/ not found. run npm install first, or run from an omit-design project root.\n`
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
        `✗ unknown pattern: ${args.pattern}\n\navailable patterns:\n${available}\n`
      );
      process.exit(1);
    }

    const targetPath = resolveTarget(cwd, args.path);
    const targetRel = path.relative(cwd, targetPath);

    if ((await fs.pathExists(targetPath)) && !args.force) {
      process.stderr.write(
        `✗ ${targetRel} already exists. use --force to overwrite, or pick a different path.\n`
      );
      process.exit(1);
    }

    await fs.ensureDir(path.dirname(targetPath));
    await fs.copyFile(tmplFile, targetPath);

    if (!targetRel.startsWith("design/") && !targetRel.startsWith("design\\")) {
      process.stdout.write(
        `⚠ warning: path is not under design/ — dev server will not auto-discover ${targetRel}.\n`
      );
    }

    process.stdout.write(
      [
        `✓ Created ${targetRel} (pattern: ${args.pattern})`,
        ``,
        `Next steps:`,
        `  1. update meta.name / description`,
        `  2. replace TODO placeholders (wire up data / refine copy / fix IonBackButton.defaultHref)`,
        `  3. start dev server: npm run dev`,
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
