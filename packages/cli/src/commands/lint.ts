import { defineCommand } from "citty";
import { spawnSync } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";

const SEVERITY: Record<string, string> = {
  "omit-design/require-pattern-header": "🔴",
  "omit-design/whitelist-ds-import": "🔴",
  "omit-design/no-design-literal": "🟡",
};

const HINT: Record<string, string> = {
  "omit-design/require-pattern-header":
    "add `// @pattern: <name>` on the first line (name must match a directory under <project>/patterns/)",
  "omit-design/whitelist-ds-import":
    "use @omit-design/preset-mobile / whitelisted Ionic containers (IonList / IonBackButton / IonIcon)",
  "omit-design/no-design-literal":
    "use tokens: var(--om-*) / var(--ion-*), or pass Om* component props",
};

async function hasDesignFiles(cwd: string): Promise<boolean> {
  const dir = path.join(cwd, "design");
  try {
    const stack: string[] = [dir];
    while (stack.length > 0) {
      const cur = stack.pop()!;
      const entries = await fs.readdir(cur, { withFileTypes: true });
      for (const e of entries) {
        if (e.name.startsWith(".")) continue;
        const full = path.join(cur, e.name);
        if (e.isDirectory()) stack.push(full);
        else if (e.isFile() && e.name.endsWith(".tsx")) return true;
      }
    }
  } catch {
    // no design/ at all
  }
  return false;
}

interface ESLintMessage {
  ruleId: string | null;
  severity: number;
  message: string;
  line?: number;
  column?: number;
}
interface ESLintResult {
  filePath: string;
  errorCount: number;
  warningCount: number;
  messages: ESLintMessage[];
}

export default defineCommand({
  meta: {
    name: "lint",
    description: "Run omit-design compliance check on design/**/*.tsx with AI-friendly output.",
  },
  args: {
    json: {
      type: "boolean",
      description: "Emit raw ESLint JSON instead of the markdown summary.",
      default: false,
    },
    glob: {
      type: "string",
      description: "Override the glob (default: design/**/*.tsx).",
      default: "design/**/*.tsx",
    },
  },
  async run({ args }) {
    const cwd = process.cwd();
    const eslintBin = path.join(cwd, "node_modules", ".bin", "eslint");

    // Collect positional file paths passed by lint-staged
    // (e.g. `omit-design lint design/foo.tsx design/bar.tsx`).
    // Skip the `lint` subcommand itself plus any flag-shaped tokens.
    const positional = process.argv
      .slice(2)
      .filter((tok) => tok !== "lint" && !tok.startsWith("-"));
    const explicitFiles = positional.filter(
      (f) => /(^|\/)design\//.test(f) && f.endsWith(".tsx")
    );
    const usedExplicit = positional.length > 0;

    // Pre-commit ran but nothing in design/ → silent pass.
    if (usedExplicit && explicitFiles.length === 0) {
      process.stdout.write(
        `✓ no design/*.tsx changes — compliance check skipped\n`
      );
      process.exit(0);
      return;
    }

    // Fresh project (no design/*.tsx yet) → silent pass instead of failing
    // with "No files matching ...". Lint has nothing to enforce here.
    if (!usedExplicit && !(await hasDesignFiles(cwd))) {
      process.stdout.write(
        `✓ no design/*.tsx files yet — nothing to lint\n`
      );
      process.exit(0);
      return;
    }

    const targets =
      explicitFiles.length > 0 ? explicitFiles : [args.glob];

    const child = spawnSync(
      eslintBin,
      ["--format", "json", ...targets],
      {
        cwd,
        encoding: "utf8",
      }
    );

    let results: ESLintResult[];
    try {
      results = JSON.parse(child.stdout) as ESLintResult[];
    } catch {
      process.stderr.write(child.stderr || "failed to parse ESLint output\n");
      process.stderr.write(child.stdout || "");
      process.exit(2);
      return;
    }

    if (args.json) {
      process.stdout.write(JSON.stringify(results, null, 2) + "\n");
      process.exit(hasViolations(results) ? 1 : 0);
      return;
    }

    renderMarkdown(results, cwd);
    process.exit(hasViolations(results) ? 1 : 0);
  },
});

function hasViolations(results: ESLintResult[]): boolean {
  return results.some((r) => r.errorCount > 0 || r.warningCount > 0);
}

function extractSample(msg: string | undefined): string {
  if (!msg) return "";
  const m = msg.match(/'([^']+)'/);
  return m ? `\`${m[1]}\`` : "";
}

function renderMarkdown(results: ESLintResult[], cwd: string): void {
  const filesWithIssues = results.filter(
    (r) => r.errorCount > 0 || r.warningCount > 0
  );
  const totalFiles = results.length;
  const okFiles = totalFiles - filesWithIssues.length;

  if (filesWithIssues.length === 0) {
    process.stdout.write(`✓ compliance check passed (${totalFiles} files, 0 violations)\n`);
    return;
  }

  process.stdout.write(`# omit-design compliance check\n\n`);

  const tally = { red: 0, yellow: 0, green: 0 };

  for (const file of filesWithIssues) {
    const rel = path.relative(cwd, file.filePath);
    process.stdout.write(`## ${rel}\n\n`);
    for (const m of file.messages) {
      const ruleId = m.ruleId ?? "(unknown)";
      const emoji = SEVERITY[ruleId] ?? (m.severity === 2 ? "🔴" : "🟡");
      if (emoji === "🔴") tally.red++;
      else if (emoji === "🟡") tally.yellow++;
      else tally.green++;

      const loc =
        m.line != null
          ? `:${m.line}${m.column != null ? `:${m.column}` : ""}`
          : "";
      const hint = HINT[ruleId] ?? "";
      const sample = extractSample(m.message);
      const sampleStr = sample ? ` — ${sample}` : "";
      const hintStr = hint ? ` → ${hint}` : "";
      process.stdout.write(
        `${emoji} [${ruleId}] ${rel}${loc}${sampleStr}${hintStr}\n`
      );
    }
    process.stdout.write(`\n`);
  }

  process.stdout.write(`---\n\n`);
  process.stdout.write(`**Compliant**: ${okFiles}/${totalFiles} files\n`);
  process.stdout.write(
    `**Violations**: 🔴 ${tally.red} · 🟡 ${tally.yellow} · 🟢 ${tally.green}\n`
  );
}
