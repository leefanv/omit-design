/**
 * 路径作用域规则:文件头 `// @pattern: <name>` 声明的 pattern,
 * 必须实际 import 至少一个该 pattern 的"签名组件"。
 *
 * 防止 AI 写一个挂着 `@pattern: list-view` 头注释、但没用任何列表组件的"假 list-view"。
 *
 * Config:
 *   "omit-design/require-pattern-components": ["error", {
 *     configPath: "node_modules/@omit-design/preset-mobile/patterns.config.json"
 *   }]
 *
 * 配置文件结构:`{ "patterns": { "<pattern-name>": ["OmFoo", "OmBar", ...] } }`
 *   值数组是"anyOf" — 文件 import 任意一个即可通过。
 */

import fs from "node:fs";
import path from "node:path";

const HEADER_RE = /^\s*@pattern:\s*([a-z][a-z0-9-]*)\s*$/;

const DEFAULT_CONFIG_PATH = "node_modules/@omit-design/preset-mobile/patterns.config.json";

let cachedConfig = null;
let cachedConfigKey = null;

function loadConfig(cwd, configPath) {
  const abs = path.isAbsolute(configPath)
    ? configPath
    : path.resolve(cwd, configPath);
  if (cachedConfigKey === abs && cachedConfig) return cachedConfig;
  try {
    const raw = fs.readFileSync(abs, "utf8");
    const parsed = JSON.parse(raw);
    cachedConfig = parsed?.patterns ?? null;
    cachedConfigKey = abs;
    return cachedConfig;
  } catch {
    cachedConfig = null;
    cachedConfigKey = abs;
    return null;
  }
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
        "`@pattern: {{name}}` 在 patterns.config.json 中未定义。已知模式:{{known}}。",
      missingComponent:
        "`@pattern: {{name}}` 要求至少 import 其中一个签名组件:{{required}};当前文件未 import 任何一个。",
      configMissing:
        "未找到 patterns.config.json(查找路径:{{path}})。请确保已安装 @omit-design/preset-mobile 或在规则 option 中传 `configPath`。",
    },
    schema: [
      {
        type: "object",
        properties: {
          configPath: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!isPageFile(filename)) return {};

    const opts = context.options[0] ?? {};
    const configPath = opts.configPath ?? DEFAULT_CONFIG_PATH;
    const cwd = context.cwd ?? process.cwd();
    const patterns = loadConfig(cwd, configPath);

    return {
      Program(node) {
        if (!patterns) {
          context.report({
            node,
            messageId: "configMissing",
            data: { path: configPath },
          });
          return;
        }

        const sourceCode = context.sourceCode ?? context.getSourceCode();
        const patternName = readPatternHeader(sourceCode);
        // 没头注释由 require-pattern-header 规则报,这里直接放行
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
