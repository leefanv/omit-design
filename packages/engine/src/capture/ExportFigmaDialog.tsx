import { useEffect, useMemo, useRef, useState } from "react";
import type { DiscoveredProject } from "../registry";
import { captureTree } from "./index";
import type { CapturePayload } from "./index";

import "./export-dialog.css";

const VIEWPORT_BY_DEVICE: Record<"mobile" | "desktop", { w: number; h: number }> = {
  mobile: { w: 390, h: 844 },
  desktop: { w: 1280, h: 800 },
};

const PLUGIN_REPO_URL =
  "https://github.com/omit-design/omit-design/tree/main/packages/figma-plugin";

// unpkg URL resolves once the package is published to npm
const pluginZipUrl =
  "https://unpkg.com/@omit-design/figma-plugin@latest/omit-web-to-figma.zip";

const PLUGIN_NAME = "Omit Web to Figma";
const PLUGIN_ZIP_FILENAME = "omit-web-to-figma.zip";

export interface ExportFigmaDialogProps {
  project: DiscoveredProject;
  onClose: () => void;
}

export function ExportFigmaDialog({ project, onClose }: ExportFigmaDialogProps) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  const allDesigns = useMemo(() => project.entries, [project]);
  const [route, setRoute] = useState(allDesigns[0]?.href ?? "");
  // 当前 route 对应的 entry（拿 embedHref 用）。可能为 null 当用户还没选 route。
  const currentEntry = useMemo(
    () => allDesigns.find((e) => e.href === route),
    [allDesigns, route]
  );
  const currentSrc = currentEntry?.embedHref ?? (route ? `${route}?embed=1` : "about:blank");
  const [splitByGroup, setSplitByGroup] = useState(true);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{ count: number; filename: string; suffix?: string } | null>(null);

  const chrome = project.preset.canvas.chrome;
  const viewport =
    chrome === "desktop" ? VIEWPORT_BY_DEVICE.desktop : VIEWPORT_BY_DEVICE.mobile;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (!dialog.open) dialog.showModal();
  }, []);

  /** 等当前 src 已加载完成（用于 captureCurrent：src 由 JSX 控制，只需确认 ready） */
  const waitForCurrentLoad = (iframe: HTMLIFrameElement): Promise<void> => {
    if (iframe.contentDocument?.readyState === "complete") return Promise.resolve();
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error("iframe load timeout 5s")), 5000);
      iframe.onload = () => { clearTimeout(timer); resolve(); };
    });
  };

  /** 先挂 onload，再改 src，保证拿到新文档的 load 事件（避免旧文档 readyState=complete 误判） */
  const navigateIframe = (iframe: HTMLIFrameElement, src: string): Promise<void> =>
    new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error(`Load timeout: ${src}`)), 8000);
      iframe.onload = () => { clearTimeout(timer); resolve(); };
      iframe.src = src;
    });

  const settle = async () => {
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    await new Promise((r) => setTimeout(r, 300));
  };

  const downloadJson = (payload: CapturePayload | CapturePayload[], filename: string) => {
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  /** 导出 preset 的 token baseline 成 Figma Variables / Tokens Studio 兼容格式 */
  const exportTokensJson = () => {
    const preset = project.preset;
    const bl = preset.themeBaseline;
    const tokens: Record<string, Record<string, { value: string; type: string }>> = {
      color: {},
      spacing: {},
    };
    for (const [k, v] of Object.entries(bl.colors)) {
      tokens.color[k] = { value: v, type: "color" };
    }
    for (const [k, v] of Object.entries(bl.spacing)) {
      tokens.spacing[k] = { value: v, type: "spacing" };
    }
    const doc = {
      $metadata: {
        preset: preset.name,
        displayName: preset.displayName,
        tokenPrefixes: preset.tokenPrefixes,
        semanticColors: preset.semanticColors,
        generatedAt: new Date().toISOString(),
      },
      [preset.name]: tokens,
    };
    const blob = new Blob([JSON.stringify(doc, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tokens-${preset.name}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setLastResult({ count: 1, filename: `tokens-${preset.name}.json` });
  };

  /** 构造 capture meta；splitByGroup=false 时不传 group，插件会把所有 frame 放当前 page */
  const metaFor = (routeHref: string) => {
    const entry = project.entries.find((e) => e.href === routeHref);
    const group = splitByGroup && entry
      ? project.groups.find((g) => g.id === entry.groupId)
      : undefined;
    return {
      route: routeHref,
      viewport,
      name: entry?.name,
      projectId: project.id,
      group: group
        ? { id: group.id, label: group.label, icon: group.icon }
        : undefined,
    };
  };

  const captureCurrent = async () => {
    const iframe = iframeRef.current;
    if (!iframe || !route) return;
    setBusy(true);
    setError(null);
    setLastResult(null);
    setProgress("Capturing…");
    try {
      await waitForCurrentLoad(iframe);
      await settle();
      const doc = iframe.contentDocument;
      if (!doc) throw new Error("Cannot access iframe document (cross-origin)");
      const root = doc.querySelector(".shell-embed");
      if (!root) throw new Error("'.shell-embed' not found — route may not support embed mode");
      const payload = await captureTree(root, metaFor(route));
      const filename = `capture${route.replace(/\//g, "-")}.json`;
      downloadJson(payload, filename);
      setLastResult({ count: 1, filename });
      setProgress(null);
    } catch (e) {
      setError((e as Error).message);
      setProgress(null);
    } finally {
      setBusy(false);
    }
  };

  const captureAllInProject = async () => {
    const iframe = iframeRef.current;
    if (!iframe) return;
    setBusy(true);
    setError(null);
    setLastResult(null);
    const bundle: CapturePayload[] = [];
    let skipped = 0;
    try {
      for (let i = 0; i < allDesigns.length; i++) {
        const entry = allDesigns[i];
        setProgress(`Capturing ${i + 1}/${allDesigns.length}: ${entry.name}`);
        await navigateIframe(iframe, entry.embedHref ?? `${entry.href}?embed=1`);
        await settle();
        const doc = iframe.contentDocument;
        const root = doc?.querySelector(".shell-embed");
        if (root) {
          bundle.push(await captureTree(root, metaFor(entry.href)));
        } else {
          skipped++;
        }
      }
      const filename = `capture-${project.id}-${Date.now()}.json`;
      downloadJson(bundle, filename);
      const suffix = skipped > 0 ? ` (skipped ${skipped}: '.shell-embed' not found)` : "";
      setLastResult({ count: bundle.length, filename, suffix });
      setProgress(null);
    } catch (e) {
      setError((e as Error).message);
      setProgress(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <dialog ref={dialogRef} className="export-dialog" onClose={onClose}>
      <header className="export-dialog__head">
        <div>
          <h2>Export to Figma · {project.name}</h2>
          <p className="export-dialog__hint">
            Reads DOM → FigmaNode JSON; the companion plugin imports it into a Figma canvas as editable frames.
          </p>
        </div>
        <button
          type="button"
          className="export-dialog__close"
          aria-label="Close"
          onClick={onClose}
        >
          ×
        </button>
      </header>

      <div className="export-dialog__body">
        <section className="export-dialog__section">
          <h3>1 · Capture designs</h3>
          <label className="export-dialog__label">
            Select design
            <select
              value={route}
              onChange={(e) => setRoute(e.target.value)}
              disabled={busy}
            >
              {project.groups.map((g) => {
                const entries = project.entries.filter((e) => e.groupId === g.id);
                if (entries.length === 0) return null;
                return (
                  <optgroup key={g.id} label={`${g.icon ?? ""} ${g.label}`}>
                    {entries.map((e) => (
                      <option key={e.href} value={e.href}>
                        {e.name} · @{e.pattern}
                      </option>
                    ))}
                  </optgroup>
                );
              })}
            </select>
          </label>

          <label className="export-dialog__check">
            <input
              type="checkbox"
              checked={splitByGroup}
              onChange={(e) => setSplitByGroup(e.target.checked)}
              disabled={busy}
            />
            Split groups into separate Figma pages
            <span className="export-dialog__check-hint">
              {splitByGroup ? "One page per group" : "All frames on the current page"}
            </span>
          </label>

          <div className="export-dialog__actions">
            <button
              type="button"
              className="export-dialog__btn export-dialog__btn--primary"
              onClick={captureCurrent}
              disabled={busy || !route}
            >
              {busy ? "Capturing…" : "Capture & download JSON"}
            </button>
            <button
              type="button"
              className="export-dialog__btn"
              onClick={captureAllInProject}
              disabled={busy || allDesigns.length === 0}
            >
              {busy ? "…" : `Capture all (${allDesigns.length}) → bundle`}
            </button>
            <button
              type="button"
              className="export-dialog__btn export-dialog__btn--ghost"
              onClick={exportTokensJson}
              disabled={busy}
              title="Export the preset's token baseline — importable by Figma Variables / Tokens Studio plugins"
            >
              📐 Tokens.json
            </button>
          </div>

          {progress && <div className="export-dialog__progress">{progress}</div>}
          {error && <div className="export-dialog__error">⚠ {error}</div>}
          {lastResult && !error && !progress && (
            <div className="export-dialog__success">
              ✓ Downloaded <code>{lastResult.filename}</code> ({lastResult.count} designs){lastResult.suffix}
            </div>
          )}
        </section>

        <section className="export-dialog__section">
          <h3>2 · Install the Figma plugin "{PLUGIN_NAME}"</h3>
          <p className="export-dialog__hint">
            First-time setup requires importing the plugin into Figma desktop (the browser version does not support plugin development).
          </p>
          <div className="export-dialog__plugin-files">
            <a
              className="export-dialog__btn export-dialog__btn--primary"
              href={pluginZipUrl}
              download={PLUGIN_ZIP_FILENAME}
            >
              ↓ Download plugin .zip
            </a>
            <a
              className="export-dialog__btn export-dialog__btn--ghost"
              href={PLUGIN_REPO_URL}
              target="_blank"
              rel="noreferrer"
            >
              View source on GitHub ↗
            </a>
          </div>
          <ol className="export-dialog__steps">
            <li>Download <code>{PLUGIN_ZIP_FILENAME}</code> and unzip it to any folder</li>
            <li>Open Figma desktop → Menu → Plugins → Development → Import plugin from manifest…</li>
            <li>
              Select the unzipped <code>manifest.json</code>; once imported it appears under Plugins → Development → {PLUGIN_NAME}
            </li>
            <li>Open the plugin → drop the JSON from step 1 into the plugin panel → click "Import"</li>
          </ol>
        </section>
      </div>

      <iframe
        ref={iframeRef}
        src={currentSrc}
        width={viewport.w}
        height={viewport.h}
        title="capture target"
        className="export-dialog__capture-iframe"
        aria-hidden
      />
    </dialog>
  );
}
