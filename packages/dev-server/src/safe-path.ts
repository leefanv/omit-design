import path from "node:path";

export type Kind = "skill" | "pattern" | "prd";

export const SUBDIR: Record<Kind, string> = {
  skill: ".claude/skills",
  pattern: "patterns",
  prd: "prds",
};

/**
 * 把 (root, kind, id) 解析成绝对路径，并强制要求落在 root/<kind-subdir> 之下。
 * id 不能含 `..`、绝对路径或前导分隔符。skill 的 id 是目录名（如 "my-skill"），
 * pattern 同理；prd 的 id 是文件名（如 "checkout.md"）。
 */
export function safeJoin(root: string, kind: Kind, id: string): string {
  if (!id || id.includes("\0")) throw new Error("invalid id");
  if (path.isAbsolute(id)) throw new Error("absolute id forbidden");
  const subdir = SUBDIR[kind];
  if (!subdir) throw new Error(`unknown kind: ${kind}`);
  const base = path.resolve(root, subdir);
  const target = path.resolve(base, id);
  const baseWithSep = base.endsWith(path.sep) ? base : base + path.sep;
  if (target !== base && !target.startsWith(baseWithSep)) {
    throw new Error("path traversal blocked");
  }
  return target;
}
