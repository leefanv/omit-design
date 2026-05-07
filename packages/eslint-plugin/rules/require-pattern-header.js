/**
 * 每份 page 级设计稿文件头第一行必须是 `// @pattern: <name>`。
 *
 * 约定：kebab-case.tsx 是 page 稿（校验），PascalCase.tsx 是 shell/组件（免检）。
 */

import path from "node:path";

const HEADER_RE = /^\s*@pattern:\s*([a-z][a-z0-9-]*)\s*$/;

function isPageFile(filename) {
  const ext = path.extname(filename);
  if (ext !== ".tsx") return false;
  const base = path.basename(filename, ext);
  if (!base) return false;
  return /^[a-z]/.test(base);
}

export default {
  meta: {
    type: "problem",
    docs: {
      description:
        "page 级设计稿文件头第一行必须是 `// @pattern: <name>`，name 需存在于 @omit-design/preset-mobile/PATTERNS.md。",
    },
    messages: {
      missing:
        "page 级稿子文件头第一行必须是 `// @pattern: <name>`（参考 @omit-design/preset-mobile/PATTERNS.md）。",
      malformed:
        "`@pattern` 头格式错误：应为 `// @pattern: <name>`，name 为 kebab-case（如 list-view）。",
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename ?? context.getFilename();
    if (!isPageFile(filename)) return {};

    return {
      Program(node) {
        const sourceCode = context.sourceCode ?? context.getSourceCode();
        const comments = sourceCode.getAllComments();
        const first = comments[0];
        if (!first || first.type !== "Line" || first.loc.start.line !== 1) {
          context.report({ node, messageId: "missing" });
          return;
        }
        if (!HEADER_RE.test(first.value)) {
          context.report({ node: first, messageId: "malformed" });
        }
      },
    };
  },
};
