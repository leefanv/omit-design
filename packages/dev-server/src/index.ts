/**
 * @omit-design/dev-server — Vite plugin
 *
 * 为 omit-design 的工作台 UI 提供本地文件 IO，让浏览器里的 Library 页能读写
 * 项目根目录下的 .claude/skills/ 、 patterns/ 、 prds/。
 *
 * 严格 local-first：永远只挂在 Vite dev server 的 middleware 上，路径写入前必须
 * 过 safe-path 守卫，绝不接受 `..` 或绝对路径。
 *
 * 用法：
 *   import { omitDevServer } from "@omit-design/dev-server";
 *   plugins: [react(), omitDevServer()]
 */

import type { IncomingMessage, ServerResponse } from "node:http";
import type { Plugin } from "vite";
import path from "node:path";
import {
  listSkills,
  readSkill,
  writeSkill,
  deleteSkill,
  renameSkill,
} from "./handlers/skills.js";
import {
  listPatterns,
  readPattern,
  writePattern,
  deletePattern,
  listPresetComponents,
} from "./handlers/patterns.js";
import {
  listPrds,
  readPrd,
  writePrd,
  deletePrd,
} from "./handlers/prds.js";
import {
  readBootstrap,
  writeBootstrap,
  clearBootstrap,
} from "./handlers/bootstrap.js";

export interface OmitDevServerOptions {
  /** 项目根目录。默认 process.cwd()。 */
  root?: string;
}

export function omitDevServer(options: OmitDevServerOptions = {}): Plugin {
  const root = path.resolve(options.root ?? process.cwd());

  return {
    name: "omit-design:dev-server",
    apply: "serve",
    configureServer(server) {
      server.middlewares.use("/__omit", async (req, res) => {
        try {
          await route(root, req, res);
        } catch (err) {
          sendJson(res, 500, { error: (err as Error).message });
        }
      });
    },
  };
}

async function route(root: string, req: IncomingMessage, res: ServerResponse) {
  const url = new URL(req.url ?? "/", "http://localhost");
  const pathname = url.pathname;
  const method = req.method ?? "GET";

  // ── 索引 ───────────────────────────────────────
  if (method === "GET" && pathname === "/library") {
    const [skills, patterns, prds] = await Promise.all([
      listSkills(root),
      listPatterns(root),
      listPrds(root),
    ]);
    return sendJson(res, 200, { skills, patterns, prds });
  }

  // ── Skills ─────────────────────────────────────
  if (method === "GET" && pathname === "/skills") {
    return sendJson(res, 200, await listSkills(root));
  }
  if (method === "GET" && pathname.startsWith("/skills/")) {
    const id = decodeURIComponent(pathname.slice("/skills/".length));
    return sendJson(res, 200, { content: await readSkill(root, id) });
  }
  if (method === "PUT" && pathname.startsWith("/skills/")) {
    const id = decodeURIComponent(pathname.slice("/skills/".length));
    const body = await readBody(req);
    const { content } = JSON.parse(body || "{}") as { content?: string };
    if (typeof content !== "string") return sendJson(res, 400, { error: "missing content" });
    await writeSkill(root, id, content);
    return sendJson(res, 200, { ok: true });
  }
  if (method === "DELETE" && pathname.startsWith("/skills/")) {
    const id = decodeURIComponent(pathname.slice("/skills/".length));
    await deleteSkill(root, id);
    return sendJson(res, 200, { ok: true });
  }
  if (method === "POST" && pathname === "/skills/rename") {
    const body = await readBody(req);
    const { from, to } = JSON.parse(body || "{}") as { from?: string; to?: string };
    if (!from || !to) return sendJson(res, 400, { error: "missing from/to" });
    await renameSkill(root, from, to);
    return sendJson(res, 200, { ok: true });
  }

  // ── Patterns ───────────────────────────────────
  if (method === "GET" && pathname === "/patterns") {
    return sendJson(res, 200, await listPatterns(root));
  }
  if (method === "GET" && pathname === "/preset/components") {
    return sendJson(res, 200, await listPresetComponents(root));
  }
  if (method === "GET" && pathname.startsWith("/patterns/")) {
    const id = decodeURIComponent(pathname.slice("/patterns/".length));
    return sendJson(res, 200, await readPattern(root, id));
  }
  if (method === "PUT" && pathname.startsWith("/patterns/")) {
    const id = decodeURIComponent(pathname.slice("/patterns/".length));
    const body = await readBody(req);
    const detail = JSON.parse(body || "{}");
    if (!detail || typeof detail !== "object") {
      return sendJson(res, 400, { error: "invalid body" });
    }
    await writePattern(root, id, detail);
    return sendJson(res, 200, { ok: true });
  }
  if (method === "DELETE" && pathname.startsWith("/patterns/")) {
    const id = decodeURIComponent(pathname.slice("/patterns/".length));
    await deletePattern(root, id);
    return sendJson(res, 200, { ok: true });
  }

  // ── PRDs ───────────────────────────────────────
  if (method === "GET" && pathname === "/prds") {
    return sendJson(res, 200, await listPrds(root));
  }
  if (method === "GET" && pathname.startsWith("/prds/")) {
    const id = decodeURIComponent(pathname.slice("/prds/".length));
    return sendJson(res, 200, { content: await readPrd(root, id) });
  }
  if (method === "PUT" && pathname.startsWith("/prds/")) {
    const id = decodeURIComponent(pathname.slice("/prds/".length));
    const body = await readBody(req);
    const { content } = JSON.parse(body || "{}") as { content?: string };
    if (typeof content !== "string") return sendJson(res, 400, { error: "missing content" });
    await writePrd(root, id, content);
    return sendJson(res, 200, { ok: true });
  }
  if (method === "DELETE" && pathname.startsWith("/prds/")) {
    const id = decodeURIComponent(pathname.slice("/prds/".length));
    await deletePrd(root, id);
    return sendJson(res, 200, { ok: true });
  }

  // ── Bootstrap ──────────────────────────────────
  // Claude Code 的 /bootstrap-from-figma skill PUT 写入；BootstrapBanner GET 读取。
  if (method === "GET" && pathname === "/bootstrap") {
    return sendJson(res, 200, { payload: await readBootstrap(root) });
  }
  if (method === "PUT" && pathname === "/bootstrap") {
    const body = await readBody(req);
    let payload: unknown;
    try {
      payload = JSON.parse(body || "{}");
    } catch {
      return sendJson(res, 400, { error: "invalid JSON body" });
    }
    await writeBootstrap(root, payload as Parameters<typeof writeBootstrap>[1]);
    return sendJson(res, 200, { ok: true });
  }
  if (method === "DELETE" && pathname === "/bootstrap") {
    await clearBootstrap(root);
    return sendJson(res, 200, { ok: true });
  }

  sendJson(res, 404, { error: `no route for ${method} ${pathname}` });
}

function sendJson(res: ServerResponse, status: number, payload: unknown) {
  res.statusCode = status;
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.end(JSON.stringify(payload));
}

function readBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    req.on("data", (chunk: Buffer) => chunks.push(chunk));
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
}

export default omitDevServer;
