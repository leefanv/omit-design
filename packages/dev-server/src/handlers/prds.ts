import fs from "node:fs/promises";
import path from "node:path";
import { safeJoin } from "../safe-path.js";
import { parseFrontmatter } from "../frontmatter.js";

export interface PrdSummary {
  id: string;
  title: string;
  pattern: string;
  target: string;
  status: string;
}

export async function listPrds(root: string): Promise<PrdSummary[]> {
  const dir = path.join(root, "prds");
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }
  const out: PrdSummary[] = [];
  for (const file of entries) {
    if (!file.endsWith(".md") || file.startsWith(".")) continue;
    const id = file.replace(/\.md$/, "");
    try {
      const raw = await fs.readFile(path.join(dir, file), "utf8");
      const { data } = parseFrontmatter(raw);
      out.push({
        id,
        title: typeof data.title === "string" ? data.title : id,
        pattern: typeof data.pattern === "string" ? data.pattern : "",
        target: typeof data.target === "string" ? data.target : "",
        status: typeof data.status === "string" ? data.status : "draft",
      });
    } catch {
      // skip
    }
  }
  out.sort((a, b) => a.id.localeCompare(b.id));
  return out;
}

export async function readPrd(root: string, id: string): Promise<string> {
  const file = safeJoin(root, "prd", `${id}.md`);
  return fs.readFile(file, "utf8");
}

export async function writePrd(root: string, id: string, content: string): Promise<void> {
  const file = safeJoin(root, "prd", `${id}.md`);
  await fs.mkdir(path.dirname(file), { recursive: true });
  await fs.writeFile(file, content, "utf8");
}

export async function deletePrd(root: string, id: string): Promise<void> {
  const file = safeJoin(root, "prd", `${id}.md`);
  await fs.rm(file, { force: true });
}
