#!/usr/bin/env node
/**
 * 一次性迁移脚本:把 pos-design 风格的命名替换为 omit-design 风格。
 *
 * - `Pos<Word>` 标识符（PosPage / PosHeader ...）→ `Om<Word>`
 * - CSS 变量 `--pos-` → `--om-`
 * - SCSS / CSS 类名 `pos-` → `om-`(行首或 `.` 后)
 *
 * 用法:
 *   node scripts/migrate-pos-to-om.mjs <dir>
 */
import fs from "node:fs";
import path from "node:path";

const TARGET_DIR = process.argv[2];
if (!TARGET_DIR) {
  console.error("usage: node scripts/migrate-pos-to-om.mjs <dir>");
  process.exit(1);
}

const SUFFIXES = new Set([
  ".ts",
  ".tsx",
  ".js",
  ".jsx",
  ".mjs",
  ".css",
  ".scss",
  ".md",
  ".json",
  ".html",
]);

const RULES = [
  // Pos<UpperWord> 标识符 → Om<UpperWord>(支持 Pos 后跟大写字母,避免误伤 Position / Possible)
  { re: /\bPos([A-Z][A-Za-z0-9]*)\b/g, replace: "Om$1" },
  // CSS 变量
  { re: /--pos-/g, replace: "--om-" },
  // CSS 类名:.pos- 开头(JSX className 字符串和 CSS 选择器都覆盖到)
  { re: /\.pos-/g, replace: ".om-" },
  // CSS 类名:className 字符串里裸 pos-xxx(以词边界开头)
  { re: /(\bclassName\s*=\s*["'`][^"'`]*?\b)pos-/g, replace: "$1om-" },
  // 文件内 "pos-" namespaced data-attr 或 BEM
  { re: /\bpos-(component|spacing|color|radius|shadow|typography|font|size|weight)/g, replace: "om-$1" },
];

let filesTouched = 0;
let changesTotal = 0;

walk(TARGET_DIR);
console.log(`✓ 迁移完成:${filesTouched} 个文件,${changesTotal} 处替换`);

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
    } else if (entry.isFile() && SUFFIXES.has(path.extname(entry.name))) {
      processFile(full);
    }
  }
}

function processFile(file) {
  const original = fs.readFileSync(file, "utf8");
  let body = original;
  let changes = 0;

  for (const rule of RULES) {
    body = body.replace(rule.re, (...args) => {
      changes++;
      return rule.replace.replace(/\$(\d)/g, (_, n) => args[Number(n)] ?? "");
    });
  }

  if (changes > 0) {
    fs.writeFileSync(file, body);
    filesTouched++;
    changesTotal += changes;
    const rel = path.relative(process.cwd(), file);
    console.log(`  ${rel} (${changes})`);
  }
}

// 同步重命名以 Pos 开头的文件
const FILE_RENAMES = [];
walkRename(TARGET_DIR);
for (const { from, to } of FILE_RENAMES) {
  fs.renameSync(from, to);
  console.log(`  rename: ${path.relative(process.cwd(), from)} → ${path.basename(to)}`);
}

function walkRename(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === "node_modules" || entry.name.startsWith(".")) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walkRename(full);
    } else if (entry.isFile()) {
      const renamed = entry.name.replace(/^Pos([A-Z])/, "Om$1");
      if (renamed !== entry.name) {
        FILE_RENAMES.push({ from: full, to: path.join(dir, renamed) });
      }
    }
  }
}
