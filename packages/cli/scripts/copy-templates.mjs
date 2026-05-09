#!/usr/bin/env node
/**
 * Build helper: copy ../../templates/init/ → ./templates/init/
 * so the CLI bin can ship the scaffold via npm publish.
 */
import fs from "fs-extra";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const cliRoot = path.resolve(here, "..");
const repoRoot = path.resolve(cliRoot, "..", "..");

const src = path.join(repoRoot, "templates", "init");
const dst = path.join(cliRoot, "templates", "init");

if (!fs.existsSync(src)) {
  console.error(`✗ source missing: ${src}`);
  process.exit(1);
}

fs.removeSync(dst);
fs.copySync(src, dst);
console.log(`✓ copied templates/init → ${path.relative(repoRoot, dst)}`);

// Also copy skills into the scaffold's .claude/skills/
const skillsSrc = path.join(repoRoot, "skills");
const skillsDst = path.join(dst, ".claude", "skills");
if (fs.existsSync(skillsSrc)) {
  fs.removeSync(skillsDst);
  fs.copySync(skillsSrc, skillsDst);
  console.log(`✓ synced skills → ${path.relative(repoRoot, skillsDst)}`);
}

// And the lightweight sub-agents into .claude/agents/
const agentsSrc = path.join(repoRoot, "agents");
const agentsDst = path.join(dst, ".claude", "agents");
if (fs.existsSync(agentsSrc)) {
  fs.removeSync(agentsDst);
  fs.copySync(agentsSrc, agentsDst);
  console.log(`✓ synced agents → ${path.relative(repoRoot, agentsDst)}`);
}
