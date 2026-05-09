/**
 * 路径作用域规则:文件头 `// @pattern: <name>` 声明的 pattern,
 * 必须实际 import 至少一个该 pattern 的"签名组件"。
 *
 * 防止 AI 写一个挂着 `@pattern: list-view` 头注释、但没用任何列表组件的"假 list-view"。
 *
 * 数据源:**只读项目本地 `<cwd>/patterns/`**(0.3.x 起)。
 *   - 每个子目录是一个 pattern:`patterns/<name>/pattern.json` 含 `{ name, whitelist }`
 *   - whitelist 是 anyOf — 文件 import 任意一个即可通过
 *   - 0.3.x 之前 preset-mobile 包里的 patterns.config.json 已不再 ship,本规则不再 fallback
 */

import fs from "node:fs";
import path from "node:path";

const HEADER_RE = /^\s*@pattern:\s*([a-z][a-z0-9-]*)\s*$/;
const PATTERNS_DIR = "patterns";

let cachedConfig = null;
let cachedConfigKey = null;

function loadPatterns(cwd) {
  const dir = path.resolve(cwd, PATTERNS_DIR);
  if (cachedConfigKey === dir && cachedConfig !== null) return cachedConfig;
  const out = {};
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    cachedConfig = {};
    cachedConfigKey = dir;
    return cachedConfig;
  }
  for (const ent of entries) {
    if (!ent.isDirectory() || ent.name.startsWith(".")) continue;
    const cfgPath = path.join(dir, ent.name, "pattern.json");
    try {
      const raw = fs.readFileSync(cfgPath, "utf8");
      const parsed = JSON.parse(raw);
      const name = typeof parsed?.name === "string" ? parsed.name : ent.name;
      const whitelist = Array.isArray(parsed?.whitelist) ? parsed.whitelist : [];
      out[name] = whitelist;
    } catch {
      // 损坏的 pattern.json 忽略
    }
  }
  cachedConfig = out;
  cachedConfigKey = dir;
  return cachedConfig;
}

function isPageFile(filename) {
  const ext = path.extname(filename);
  if (ext !== ".tsx") return false;
  const base = path.basename(filename, ext);
  if (!base) return false;
  return /^[a-z]/.test(base);
}

function readPatternHeader(sourceCode) {
  const comments = sourceCode.getAllComments();
  const first = comments[0];
  if (!first || first.type !== "Line" || first.loc.start.line !== 1) return null;
  const m = HEADER_RE.exec(first.value);
  return m ? m[1] : null;
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "page 级稿的 `@pattern: <name>` 头声明的模式,必须 import 至少一个该模式的签名组件。",
    },
    messages: {
      unknownPattern:
        "`@pattern: {{name}}` 在 patterns/ 中未定义。已知模式:{{known}}。",
      missingComponent:
        "`@pattern: {{name}}` 要求至少 import 其中一个签名组件:{{required}};当前文件未 import 任何一个。",
      configMissing:
        "未在项目根目录找到 patterns/ — 请运行 `omit-design init` 或在 Library 里 Import starters。",
    },
    schema: [{ type: "object", additionalProperties: false }],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!isPageFile(filename)) return {};

    const cwd = context.cwd ?? process.cwd();
    const patterns = loadPatterns(cwd);

    return {
      Program(node) {
        if (!patterns || Object.keys(patterns).length === 0) {
          context.report({ node, messageId: "configMissing" });
          return;
        }

        const sourceCode = context.sourceCode ?? context.getSourceCode();
        const patternName = readPatternHeader(sourceCode);
        if (!patternName) return;

        const required = patterns[patternName];
        if (!Array.isArray(required)) {
          context.report({
            node,
            messageId: "unknownPattern",
            data: {
              name: patternName,
              known: Object.keys(patterns).join(", "),
            },
          });
          return;
        }

        const importedNames = new Set();
        for (const stmt of node.body) {
          if (stmt.type !== "ImportDeclaration") continue;
          for (const spec of stmt.specifiers) {
            if (spec.type === "ImportSpecifier") {
              importedNames.add(spec.imported.name);
            } else if (spec.type === "ImportDefaultSpecifier") {
              importedNames.add(spec.local.name);
            }
          }
        }

        const hit = required.some((name) => importedNames.has(name));
        if (!hit) {
          context.report({
            node,
            messageId: "missingComponent",
            data: {
              name: patternName,
              required: required.join(" / "),
            },
          });
        }
      },
    };
  },
};
