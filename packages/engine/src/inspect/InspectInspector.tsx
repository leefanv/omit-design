import { useMemo, useState } from "react";
import { SquareDashed, X } from "lucide-react";
import { useInspectStore, type InspectTarget } from "./store";
import { codegenWeb } from "./codegen/web";
import { codegenCompose } from "./codegen/compose";
import { codegenXml } from "./codegen/xml";
import { detectAssetSource, downloadUrl, exportElementAsPng, type ExportScale } from "./export";

type CodeTarget = "web" | "compose" | "xml";
type SecondaryTab = "props" | "code";

/**
 * 右侧面板里 inspect/measure/a11y 三个工具共用的内容。
 * Mode 由左侧 ToolRail 选哪个工具决定，此处不再渲染 mode segmented control。
 */
export function InspectInspector() {
  const mode = useInspectStore((s) => s.mode);
  const selected = useInspectStore((s) => s.selected);
  const setSelected = useInspectStore((s) => s.setSelected);
  const showBoxModel = useInspectStore((s) => s.showBoxModel);
  const setShowBoxModel = useInspectStore((s) => s.setShowBoxModel);
  const [secondary, setSecondary] = useState<SecondaryTab>("props");
  const [codeTarget, setCodeTarget] = useState<CodeTarget>("web");

  return (
    <div className="inspect-inspector-content">
      <header className="inspect-section inspect-section--mode">
        <p className="inspect-mode-hint">
          {mode === "inspect" && "Hover an element on the canvas to highlight it; click to select and see details."}
          {mode === "measure" && "Click an element to set the start point, then hover another element to see the distance."}
          {mode === "a11y" && "Scans clickable elements for touch target size and images for missing alt."}
        </p>
      </header>

      {!selected && mode !== "a11y" && (
        <div className="inspect-empty">
          <div className="inspect-empty__icon"><SquareDashed size={32} aria-hidden /></div>
          <p>No element selected</p>
          <p className="muted">Click an element on the canvas, or use the arrow keys to navigate.</p>
        </div>
      )}

      {selected && (
        <>
          <div className="inspect-section inspect-section--head">
            <div className="inspect-component">
              <span className="inspect-component__name">{selected.component}</span>
              <button className="inspect-clear" onClick={() => setSelected(null)} title="Clear selection" aria-label="Clear selection"><X size={14} aria-hidden /></button>
            </div>
            <div className="shell-segment">
              <button
                className={`shell-segment__btn ${secondary === "props" ? "active" : ""}`}
                onClick={() => setSecondary("props")}
              >
                Properties
              </button>
              <button
                className={`shell-segment__btn ${secondary === "code" ? "active" : ""}`}
                onClick={() => setSecondary("code")}
              >
                Code
              </button>
            </div>
          </div>

          {secondary === "props" && <PropsTab />}
          {secondary === "code" && <CodeTab codeTarget={codeTarget} setCodeTarget={setCodeTarget} />}
          <ExportSection selected={selected} />
        </>
      )}

      {mode === "inspect" && (
        <div className="inspect-section">
          <label className="inline-toggle">
            <input
              type="checkbox"
              checked={showBoxModel}
              onChange={(e) => setShowBoxModel(e.target.checked)}
            />
            <span>Box model overlay (color-codes padding/border/margin around the selected element)</span>
          </label>
        </div>
      )}
    </div>
  );
}

function PropsTab() {
  const selected = useInspectStore((s) => s.selected);
  if (!selected) return null;
  return (
    <>
      <section className="inspect-section">
        <h4>Tokens</h4>
        {Object.entries(selected.tokens).length === 0 ? (
          <p className="muted">(no tokens declared on this element)</p>
        ) : (
          <dl className="inspect-dl">
            {Object.entries(selected.tokens).map(([k, v]) => (
              <div key={k}>
                <dt>{k}</dt>
                <dd>{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </section>

      <section className="inspect-section">
        <h4>Computed</h4>
        <dl className="inspect-dl">
          <div>
            <dt>padding</dt>
            <dd>
              {selected.computed.paddingTop} {selected.computed.paddingRight} {selected.computed.paddingBottom} {selected.computed.paddingLeft}
            </dd>
          </div>
          <div>
            <dt>margin</dt>
            <dd>
              {selected.computed.marginTop} {selected.computed.marginRight} {selected.computed.marginBottom} {selected.computed.marginLeft}
            </dd>
          </div>
          <div><dt>size</dt><dd>{selected.computed.width} × {selected.computed.height}</dd></div>
          <div><dt>background</dt><dd>{selected.computed.background}</dd></div>
          <div><dt>color</dt><dd>{selected.computed.color}</dd></div>
          <div><dt>radius</dt><dd>{selected.computed.borderRadius}</dd></div>
          <div><dt>font-size</dt><dd>{selected.computed.fontSize}</dd></div>
        </dl>
      </section>
    </>
  );
}

interface CodeTabProps {
  codeTarget: CodeTarget;
  setCodeTarget: (t: CodeTarget) => void;
}

function CodeTab({ codeTarget, setCodeTarget }: CodeTabProps) {
  const selected = useInspectStore((s) => s.selected);
  if (!selected) return null;
  const code =
    codeTarget === "web"
      ? codegenWeb(selected)
      : codeTarget === "compose"
      ? codegenCompose(selected)
      : codegenXml(selected);

  return (
    <section className="inspect-section">
      <div className="shell-segment">
        {(["web", "compose", "xml"] as const).map((k) => (
          <button
            key={k}
            className={`shell-segment__btn ${codeTarget === k ? "active" : ""}`}
            onClick={() => setCodeTarget(k)}
          >
            {k === "web" ? "Web" : k === "compose" ? "Compose" : "XML"}
          </button>
        ))}
      </div>
      <pre className="code-block">{code}</pre>
      <button className="copy-btn" onClick={() => navigator.clipboard.writeText(code)}>
        Copy
      </button>
    </section>
  );
}

const SCALES: ExportScale[] = [1, 2, 3];

function ExportSection({ selected }: { selected: InspectTarget }) {
  const [busy, setBusy] = useState<ExportScale | null>(null);
  const [error, setError] = useState<string | null>(null);
  const asset = useMemo(() => detectAssetSource(selected.el), [selected]);

  const handlePng = async (scale: ExportScale) => {
    setError(null);
    setBusy(scale);
    try {
      await exportElementAsPng(selected.el, scale, selected.component);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Export failed");
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="inspect-section">
      <h4>Export</h4>
      {asset && (
        <div className="inspect-export-row">
          <span className="inspect-export-label">Original asset</span>
          <button
            className="copy-btn"
            onClick={() => downloadUrl(asset.url, asset.filename)}
          >
            Download {asset.filename}
          </button>
        </div>
      )}
      <div className="inspect-export-row">
        <span className="inspect-export-label">PNG screenshot</span>
        <div className="inspect-export-scales">
          {SCALES.map((s) => (
            <button
              key={s}
              className="copy-btn"
              disabled={busy !== null}
              onClick={() => handlePng(s)}
            >
              {busy === s ? "…" : `@${s}x`}
            </button>
          ))}
        </div>
      </div>
      {error && <p className="inspect-export-error">{error}</p>}
    </section>
  );
}
