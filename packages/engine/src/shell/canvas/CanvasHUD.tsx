import { useCanvasStore, ZOOM_MAX, ZOOM_MIN } from "./canvasStore";

interface Props {
  bbox: { x: number; y: number; width: number; height: number };
  viewport: { width: number; height: number };
  /** 自定义 fit 行为（默认走 store.fitToContent；SinglePageCanvas 传入会扣浮层占位）。 */
  onFit?: () => void;
}

/** Bottom-right floating zoom control: [− zoom% +] [Fit] [100%]. */
export function CanvasHUD({ bbox, viewport, onFit }: Props) {
  const zoom = useCanvasStore((s) => s.zoom);
  const zoomCentered = useCanvasStore((s) => s.zoomCentered);
  const fitToContent = useCanvasStore((s) => s.fitToContent);
  const resetTo100 = useCanvasStore((s) => s.resetTo100);

  const pct = Math.round(zoom * 100);
  return (
    <div className="canvas-hud" data-no-inspect>
      <button
        type="button"
        className="canvas-hud__btn"
        onClick={() => zoomCentered(1 / 1.2, viewport)}
        disabled={zoom <= ZOOM_MIN + 0.001}
        aria-label="Zoom out"
      >
        −
      </button>
      <span className="canvas-hud__pct" aria-live="polite">{pct}%</span>
      <button
        type="button"
        className="canvas-hud__btn"
        onClick={() => zoomCentered(1.2, viewport)}
        disabled={zoom >= ZOOM_MAX - 0.001}
        aria-label="Zoom in"
      >
        +
      </button>
      <span className="canvas-hud__sep" aria-hidden />
      <button
        type="button"
        className="canvas-hud__btn canvas-hud__btn--text"
        onClick={() => (onFit ? onFit() : fitToContent(bbox, viewport))}
        title="Fit (⌘0)"
      >
        Fit
      </button>
      <button
        type="button"
        className="canvas-hud__btn canvas-hud__btn--text"
        onClick={() => resetTo100(bbox, viewport)}
        title="100% (⌘1)"
      >
        100%
      </button>
    </div>
  );
}
