/**
 * 在 embed 模式 iframe 里挂一个 postMessage 监听器:
 * 宿主页面(任何外层页面或 figma-plugin)postMessage `omit:capture-request`,
 * 我们对自己的 .shell-embed 跑 captureTree,回 `omit:capture-result`。
 *
 * 协议：
 *   宿主 → iframe:  { type: "omit:capture-request", id, route, name? }
 *   iframe → 宿主:  { type: "omit:capture-result", id, ok, payload?, error? }
 */
import { useEffect } from "react";
import { captureTree } from "../capture";

interface CaptureRequest {
  type: "omit:capture-request";
  id: string;
  route: string;
  name?: string;
  group?: { id: string; label: string; icon?: string };
  projectId?: string;
}

function isCaptureRequest(x: unknown): x is CaptureRequest {
  return (
    typeof x === "object" &&
    x !== null &&
    (x as { type?: unknown }).type === "omit:capture-request"
  );
}

export function EmbedCaptureBridge() {
  useEffect(() => {
    async function onMessage(e: MessageEvent) {
      if (!isCaptureRequest(e.data)) return;
      const req = e.data;
      const reply = (data: Record<string, unknown>) => {
        // 不限制 origin —— 宿主可以是任意端口
        e.source?.postMessage(
          { type: "omit:capture-result", id: req.id, ...data },
          { targetOrigin: e.origin || "*" }
        );
      };
      try {
        const root = document.querySelector(".shell-embed");
        if (!root) {
          reply({ ok: false, error: "'.shell-embed' root node not found" });
          return;
        }
        const rect = root.getBoundingClientRect();
        const payload = await captureTree(root, {
          route: req.route,
          name: req.name,
          group: req.group,
          projectId: req.projectId,
          viewport: { w: Math.round(rect.width), h: Math.round(rect.height) },
        });
        reply({ ok: true, payload });
      } catch (err) {
        reply({ ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
    window.addEventListener("message", onMessage);
    // 通知宿主：bridge 已就绪
    window.parent?.postMessage(
      { type: "omit:capture-bridge-ready" },
      { targetOrigin: "*" }
    );
    return () => window.removeEventListener("message", onMessage);
  }, []);
  return null;
}
