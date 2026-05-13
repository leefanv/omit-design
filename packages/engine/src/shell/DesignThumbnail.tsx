/**
 * DesignThumbnail — 项目卡片 / 设计稿卡片用的预览缩略图。
 *
 * 加载策略（消除 12 个 iframe 同时跑卡死浏览器的问题）：
 *   1. 立即显示渐变占位（瞬间）
 *   2. 异步 HEAD `/api/preview-cache?href=<href>`：
 *      - 200 → 直接 <img> 渲染
 *      - 404 → 进入 capture 流程
 *   3. capture 流程：渲染 hidden iframe → onLoad 等 1s → html-to-image
 *      截图 → POST /api/preview-cache → swap 成 <img>
 *   4. capture 同时间最多 N 个并发，剩下排队（避免一次性 12 个 iframe）
 *
 * 5173 sample harness 没有 /api/preview-cache，HEAD 失败时直接回退到 iframe，
 * 不阻塞 engine 库本身的可用性。
 */
import { useEffect, useRef, useState } from "react";
import { logToServer } from "./debugLog";

interface Props {
  /** /designs/<group>/<file> — engine 路由路径 */
  href: string;
  /**
   * iframe src（apiDiscovery 设的 minimal embed URL）。不传时回退到
   * `${href}?embed=1`（5173 sample 等场景）。
   */
  embedHref?: string;
  /** 卡片是 desktop 形态（影响 iframe 宽高） */
  isDesktop?: boolean;
  /** 占位用的 emoji / icon */
  icon?: string;
  /** 失败时是否走 iframe fallback（5173 等场景） */
  fallbackToIframe?: boolean;
  /** className 透传 */
  className?: string;
}

type State =
  | { kind: "checking" }
  | { kind: "cached"; url: string }
  | { kind: "capturing" }
  | { kind: "ready"; url: string }
  | { kind: "failed" }
  | { kind: "fallback-iframe" };

// 全局 capture 队列：一次最多 2 个 iframe 同时跑截图
const CAPTURE_CONCURRENCY = 2;
let activeCaptures = 0;
const captureQueue: Array<() => void> = [];

function acquireCaptureSlot(): Promise<() => void> {
  return new Promise((resolve) => {
    const tryAcquire = () => {
      if (activeCaptures < CAPTURE_CONCURRENCY) {
        activeCaptures++;
        resolve(() => {
          activeCaptures--;
          const next = captureQueue.shift();
          if (next) next();
        });
      } else {
        captureQueue.push(tryAcquire);
      }
    };
    tryAcquire();
  });
}

export function DesignThumbnail({
  href,
  embedHref,
  isDesktop = false,
  icon = "◆",
  fallbackToIframe = true,
  className,
}: Props) {
  const iframeSrc = embedHref ?? `${href}?embed=1`;
  const [state, setState] = useState<State>({ kind: "checking" });
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "checking" });

    // OSS 本地模式:直接进 capture 流程或 fallback iframe(无云端预览缓存)
    if (fallbackToIframe) {
      setState({ kind: "fallback-iframe" });
    } else {
      void runCapture(href, setState, iframeRef, () => cancelled);
    }

    return () => {
      cancelled = true;
    };
  }, [href, fallbackToIframe]);

  const isImg = state.kind === "cached" || state.kind === "ready";

  return (
    <div
      ref={containerRef}
      className={className}
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        background:
          "linear-gradient(135deg, #f5f7fa 0%, #e5edf7 50%, #d8e4f5 100%)",
        overflow: "hidden",
      }}
    >
      {/* 占位：永远在底层 */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "48px",
          opacity: 0.25,
          pointerEvents: "none",
        }}
        aria-hidden
      >
        {icon}
      </div>

      {/* 缓存的 / 刚截好的图 */}
      {isImg && (
        <img
          src={state.url}
          alt="preview"
          loading="lazy"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "top center",
            background: "white",
          }}
        />
      )}

      {/* capturing 时挂个隐藏 iframe 用来渲染 + 截图 */}
      {state.kind === "capturing" && (
        <iframe
          ref={iframeRef}
          src={iframeSrc}
          title="capture-source"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: isDesktop ? "1280px" : "375px",
            height: isDesktop ? "800px" : "812px",
            border: "none",
            transform: isDesktop ? "scale(0.25)" : "scale(0.6)",
            transformOrigin: "top left",
            // 让用户看到加载中（半透明）
            opacity: 0.5,
            pointerEvents: "none",
          }}
        />
      )}

      {/* fallback 模式：直接 iframe 显示（5173 sample 用）。
          尺寸/缩放/定位都交给 .shell-project-card__cover iframe 的 CSS（container
          query 自适应容器宽度）—— 不要在这里设 inline width/transform 否则会盖掉。 */}
      {state.kind === "fallback-iframe" && (
        <iframe
          src={iframeSrc}
          title="design preview"
          loading="lazy"
          className={isDesktop ? "shell-project-card__iframe--desktop" : undefined}
        />
      )}
    </div>
  );
}

async function runCapture(
  href: string,
  setState: (s: State) => void,
  iframeRef: React.RefObject<HTMLIFrameElement | null>,
  isCancelled: () => boolean,
) {
  const tag = `cap ${href}`;
  logToServer(tag, "queued");
  const release = await acquireCaptureSlot();
  if (isCancelled()) {
    release();
    return;
  }
  logToServer(tag, "slot acquired");
  setState({ kind: "capturing" });
  const t0 = performance.now();

  try {
    // 等 iframe 真正挂上 DOM —— 单帧 RAF 在并发场景下可能早于 React commit。
    // 轮询 ref 最多 500ms。
    let iframe: HTMLIFrameElement | null = null;
    const refStart = performance.now();
    while (performance.now() - refStart < 500) {
      iframe = iframeRef.current;
      if (iframe) break;
      await new Promise((r) => requestAnimationFrame(() => r(undefined)));
    }
    if (!iframe) {
      release();
      logToServer(tag, "no iframe ref");
      if (!isCancelled()) setState({ kind: "failed" });
      return;
    }

    // 等 EmbedPage 真正渲染（dataset.embedReady = '1'）。dev 冷加载可能慢，给 15s。
    await waitForEmbedReady(iframe, 15000);
    if (isCancelled()) {
      release();
      return;
    }
    const t1 = performance.now();
    logToServer(tag, "embed ready", { ms: Math.round(t1 - t0) });

    // 给一帧让 layout/font 落定
    await new Promise((r) => setTimeout(r, 200));

    // 截图：用 html-to-image 对 iframe 内的 .shell-embed 截
    const doc = iframe.contentDocument;
    const root = doc?.querySelector(".shell-embed");
    if (!root) {
      logToServer(tag, "shell-embed missing", {
        bodyHTML: doc?.body?.innerHTML?.slice(0, 200),
      });
      throw new Error("'.shell-embed' node not found");
    }
    logToServer(tag, "html-to-image start");
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(root as HTMLElement, {
      cacheBust: true,
      pixelRatio: 1,
      // 让 html-to-image 能 inline 同源 stylesheet
    });
    const t2 = performance.now();
    logToServer(tag, "html-to-image done", {
      ms: Math.round(t2 - t1),
      bytes: dataUrl.length,
    });

    if (isCancelled()) {
      release();
      return;
    }

    // OSS 本地模式:截好的 dataUrl 直接挂 <img src>,不上传任何缓存
    if (!isCancelled()) {
      setState({ kind: "ready", url: dataUrl });
    }
  } catch (e) {
    console.warn("[DesignThumbnail] capture failed:", href, e);
    logToServer(tag, "capture failed", {
      err: e instanceof Error ? e.message : String(e),
      total_ms: Math.round(performance.now() - t0),
    });
    // capture 失败 → 退回占位（卸掉 iframe，不再无限挂半透明状态）
    if (!isCancelled()) setState({ kind: "failed" });
  } finally {
    release();
  }
}

/**
 * 轮询 iframe 内 documentElement.dataset.embedReady === "1"。
 * 比 iframe.load / readyState 可靠：后者在 iframe 初始 about:blank 阶段就报 "complete"。
 */
function waitForEmbedReady(iframe: HTMLIFrameElement, timeoutMs: number): Promise<void> {
  return new Promise((resolve, reject) => {
    const start = performance.now();
    const tick = () => {
      try {
        const doc = iframe.contentDocument;
        const url = doc?.location?.href ?? "";
        const ready = doc?.documentElement?.dataset.embedReady === "1";
        if (ready && url && url !== "about:blank") {
          resolve();
          return;
        }
        if (performance.now() - start > timeoutMs) {
          reject(
            new Error(
              `embed ready timeout (url=${url} bodyLen=${doc?.body?.innerHTML?.length ?? 0})`,
            ),
          );
          return;
        }
        setTimeout(tick, 100);
      } catch (err) {
        reject(err instanceof Error ? err : new Error(String(err)));
      }
    };
    tick();
  });
}
