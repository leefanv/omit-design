#!/usr/bin/env node
// Generate packages/figma-plugin/omit-web-to-figma.zip from the plugin source files.
// Uses the system `zip` command (present on macOS / Linux by default).

import { spawnSync } from "node:child_process";
import { existsSync, rmSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const pluginDir = resolve(here, "..", "packages", "figma-plugin");
const zipName = "omit-web-to-figma.zip";
const zipPath = resolve(pluginDir, zipName);
const entries = ["code.js", "manifest.json", "ui.html", "README.md"];

for (const f of entries) {
  if (!existsSync(resolve(pluginDir, f))) {
    console.error(`✗ missing ${f} in ${pluginDir}`);
    process.exit(1);
  }
}

if (existsSync(zipPath)) rmSync(zipPath);

const result = spawnSync("zip", ["-q", zipName, ...entries], {
  cwd: pluginDir,
  stdio: "inherit",
});

if (result.status !== 0) {
  console.error("✗ zip failed");
  process.exit(result.status ?? 1);
}

console.log(`✓ wrote ${zipPath}`);
