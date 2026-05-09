/**
 * 极简 YAML frontmatter 解析/序列化。只支持顶层 string / number / boolean，
 * 这是 skill / PRD frontmatter 的实际形态——不引入 yaml 依赖。
 */

export type Frontmatter = Record<string, string | number | boolean>;

const FENCE_RE = /^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/;

export function parseFrontmatter(src: string): { data: Frontmatter; body: string } {
  const m = FENCE_RE.exec(src);
  if (!m) return { data: {}, body: src };
  const data: Frontmatter = {};
  for (const line of m[1].split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    const idx = line.indexOf(":");
    if (idx < 0) continue;
    const key = line.slice(0, idx).trim();
    let val = line.slice(idx + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (val === "true") data[key] = true;
    else if (val === "false") data[key] = false;
    else if (/^-?\d+(\.\d+)?$/.test(val)) data[key] = Number(val);
    else data[key] = val;
  }
  return { data, body: m[2] };
}

export function buildFrontmatter(data: Frontmatter, body: string): string {
  const lines: string[] = ["---"];
  for (const [k, v] of Object.entries(data)) {
    if (v === undefined || v === null) continue;
    if (typeof v === "string") {
      // 多行或含特殊字符 → 加引号
      const needsQuote = /[:#\n]/.test(v);
      lines.push(`${k}: ${needsQuote ? JSON.stringify(v) : v}`);
    } else {
      lines.push(`${k}: ${v}`);
    }
  }
  lines.push("---", "");
  return lines.join("\n") + body.replace(/^\n+/, "");
}
