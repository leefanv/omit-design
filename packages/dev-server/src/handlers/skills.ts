import fs from "node:fs/promises";
import path from "node:path";
import { safeJoin } from "../safe-path.js";
import { parseFrontmatter } from "../frontmatter.js";

export interface SkillSummary {
  id: string;
  name: string;
  description: string;
}

export async function listSkills(root: string): Promise<SkillSummary[]> {
  const dir = path.join(root, ".claude/skills");
  let entries: string[];
  try {
    entries = await fs.readdir(dir);
  } catch {
    return [];
  }
  const out: SkillSummary[] = [];
  for (const id of entries) {
    if (id.startsWith(".")) continue;
    const skillPath = path.join(dir, id, "SKILL.md");
    try {
      const stat = await fs.stat(skillPath);
      if (!stat.isFile()) continue;
      const raw = await fs.readFile(skillPath, "utf8");
      const { data } = parseFrontmatter(raw);
      out.push({
        id,
        name: typeof data.name === "string" ? data.name : id,
        description: typeof data.description === "string" ? data.description : "",
      });
    } catch {
      // 忽略读不到的目录
    }
  }
  out.sort((a, b) => a.id.localeCompare(b.id));
  return out;
}

export async function readSkill(root: string, id: string): Promise<string> {
  const dir = safeJoin(root, "skill", id);
  const file = path.join(dir, "SKILL.md");
  return fs.readFile(file, "utf8");
}

export async function writeSkill(root: string, id: string, content: string): Promise<void> {
  const dir = safeJoin(root, "skill", id);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, "SKILL.md"), content, "utf8");
}

export async function deleteSkill(root: string, id: string): Promise<void> {
  const dir = safeJoin(root, "skill", id);
  await fs.rm(dir, { recursive: true, force: true });
}

export async function renameSkill(root: string, oldId: string, newId: string): Promise<void> {
  const oldDir = safeJoin(root, "skill", oldId);
  const newDir = safeJoin(root, "skill", newId);
  await fs.rename(oldDir, newDir);
}
