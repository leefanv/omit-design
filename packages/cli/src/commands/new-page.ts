import { defineCommand } from "citty";
import path from "node:path";
import fs from "fs-extra";

export default defineCommand({
  meta: {
    name: "new-page",
    description: "Scaffold a design page by copying a project-local pattern template.",
  },
  args: {
    pattern: {
      type: "positional",
      required: true,
      description: "Pattern name — must match a directory under <project>/patterns/.",
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
    const patternsDir = path.join(cwd, "patterns");

    if (!(await fs.pathExists(patternsDir))) {
      process.stderr.write(
        `✗ patterns/ not found. run this from an omit-design project root.\n`
      );
      process.exit(1);
    }

    const patternDir = path.join(patternsDir, args.pattern);
    const tmplFile = path.join(patternDir, "template.tmpl.tsx");

    if (!(await fs.pathExists(tmplFile))) {
      const available = (await fs.readdir(patternsDir, { withFileTypes: true }))
        .filter((d) => d.isDirectory() && !d.name.startsWith("."))
        .map((d) => `  · ${d.name}`)
        .sort()
        .join("\n");

      if (available.length === 0) {
        process.stderr.write(
          [
            `✗ no patterns yet in ${path.relative(cwd, patternsDir)}/.`,
            ``,
            `Patterns are produced on demand in Claude Code:`,
            `  - With a PRD: workspace Library → PRDs → "Distill patterns from this PRD"`,
            `    then paste into Claude Code (/distill-patterns-from-prd).`,
            `  - Without a PRD: ask Claude /add-pattern; it asks 3-5 questions`,
            `    and produces a minimal pattern.`,
            ``,
            `Then re-run: omit-design new-page ${args.pattern} ${args.path}`,
            ``,
          ].join("\n")
        );
      } else {
        process.stderr.write(
          [
            `✗ unknown pattern: ${args.pattern}`,
            ``,
            `Available patterns in ${path.relative(cwd, patternsDir)}/:`,
            available,
            ``,
            `(or run /add-pattern in Claude Code to create a new one)`,
            ``,
          ].join("\n")
        );
      }
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
        `  2. replace TODO placeholders (wire up data / refine copy)`,
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
