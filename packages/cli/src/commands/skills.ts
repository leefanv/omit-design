import { defineCommand } from "citty";
import { fileURLToPath } from "node:url";
import path from "node:path";
import fs from "fs-extra";

const update = defineCommand({
  meta: {
    name: "update",
    description: "Sync the cli's built-in .claude/skills/ into ./.claude/skills/.",
  },
  args: {
    "dry-run": {
      type: "boolean",
      description: "Preview changes without writing files.",
      default: false,
    },
    target: {
      type: "string",
      description: "Override the target directory (default: ./.claude/skills).",
      default: ".claude/skills",
    },
  },
  async run({ args }) {
    const here = path.dirname(fileURLToPath(import.meta.url));
    const sourceDir = path.resolve(
      here,
      "..",
      "..",
      "templates",
      "init",
      ".claude",
      "skills"
    );
    const targetDir = path.resolve(process.cwd(), args.target);

    if (!(await fs.pathExists(sourceDir))) {
      process.stderr.write(
        `✗ built-in skills directory not found (expected at ${sourceDir}). check @omit-design/cli installation.\n`
      );
      process.exit(1);
    }

    const sourceFiles = await collectFiles(sourceDir);
    const plan: { rel: string; status: "add" | "update" | "same" }[] = [];

    for (const rel of sourceFiles) {
      const srcPath = path.join(sourceDir, rel);
      const dstPath = path.join(targetDir, rel);
      const srcBuf = await fs.readFile(srcPath);
      let status: "add" | "update" | "same" = "add";
      if (await fs.pathExists(dstPath)) {
        const dstBuf = await fs.readFile(dstPath);
        status = srcBuf.equals(dstBuf) ? "same" : "update";
      }
      plan.push({ rel, status });
    }

    const added = plan.filter((p) => p.status === "add");
    const updated = plan.filter((p) => p.status === "update");
    const same = plan.filter((p) => p.status === "same");

    const targetRel = path.relative(process.cwd(), targetDir) || ".claude/skills";
    process.stdout.write(`target: ${targetRel}\n`);
    process.stdout.write(
      `plan: +${added.length} added · ~${updated.length} updated · =${same.length} unchanged\n\n`
    );

    for (const p of added) process.stdout.write(`  + ${p.rel}\n`);
    for (const p of updated) process.stdout.write(`  ~ ${p.rel}\n`);

    if (added.length === 0 && updated.length === 0) {
      process.stdout.write(`\n✓ already up to date\n`);
      return;
    }

    if (args["dry-run"]) {
      process.stdout.write(`\n(--dry-run) not written. remove --dry-run to apply.\n`);
      return;
    }

    for (const p of [...added, ...updated]) {
      const srcPath = path.join(sourceDir, p.rel);
      const dstPath = path.join(targetDir, p.rel);
      await fs.ensureDir(path.dirname(dstPath));
      await fs.copyFile(srcPath, dstPath);
    }

    process.stdout.write(
      `\n✓ sync complete (${added.length + updated.length} file(s))\n`
    );
  },
});

export default defineCommand({
  meta: {
    name: "skills",
    description: "Manage the project's .claude/skills/ directory.",
  },
  subCommands: {
    update: () => Promise.resolve(update),
  },
});

async function collectFiles(root: string): Promise<string[]> {
  const out: string[] = [];
  const stack: string[] = [root];
  while (stack.length > 0) {
    const dir = stack.pop()!;
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) stack.push(full);
      else if (e.isFile()) out.push(path.relative(root, full));
    }
  }
  return out.sort();
}
