/**
 * 扫描 repo 根下的 `design/` 文件夹，找一个可用的 .tsx 文件，转成 engine 路由
 * 约定的 href（`design/main/welcome.tsx` → `/designs/main/welcome`）。
 *
 * 用于跨 repo 注册表的缩略图 iframe —— 注册时把这个 href 写进 registry，
 * 别的 repo 的 workspace UI 拿它去拼 `<iframe src=http://localhost:port/designs/.../?embed=1>`。
 */
import { readdir } from "node:fs/promises";
import path from "node:path";

export async function discoverFirstEntryHref(
  root: string,
): Promise<string | undefined> {
  const designDir = path.join(root, "design");
  try {
    const entries = await readdir(designDir, { recursive: true, withFileTypes: true });
    // 按 (parentPath, name) 字典序找第一个 .tsx
    const tsxFiles: { full: string; name: string }[] = [];
    for (const e of entries) {
      if (e.isFile() && e.name.endsWith(".tsx")) {
        tsxFiles.push({
          full: path.join((e as { parentPath?: string }).parentPath ?? designDir, e.name),
          name: e.name,
        });
      }
    }
    tsxFiles.sort((a, b) => a.full.localeCompare(b.full));
    const first = tsxFiles[0];
    if (!first) return undefined;
    const rel = path.relative(designDir, first.full);
    const noExt = rel.replace(/\.tsx$/, "");
    // 兼容 win32 路径分隔符
    const normalized = noExt.split(path.sep).join("/");
    return `/designs/${normalized}`;
  } catch {
    return undefined;
  }
}
