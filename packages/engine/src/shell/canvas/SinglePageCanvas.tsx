import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import type { ComponentType } from "react";
import { CanvasHUD } from "./CanvasHUD";
import { useCanvasStore } from "./canvasStore";

interface Props {
  /** Currently selected design entry component (rendered directly into the canvas). */
  Component: ComponentType | null;
  /** Display name shown in caption above the frame. */
  caption: string;
  /** Native size of the design frame (from preset.canvas.default). */
  frameWidth: number;
  frameHeight: number;
}

/**
 * Single-page canvas: one design renders inside a fixed-size frame, the canvas
 * provides zoom + pan around it. The component mounts directly into the host
 * React tree (no iframe, no capture pipeline).
 *
 * Performance: stage transform is updated imperatively via stageRef so pan/zoom
 * doesn't trigger React reconciliation.
 */
export function SinglePageCanvas({ Component, caption, frameWidth, frameHeight }: Props) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);
  const [viewportSize, setViewportSize] = useState({ width: 0, height: 0 });

  const resetTo100 = useCanvasStore((s) => s.resetTo100);
  const setTool = useCanvasStore((s) => s.setTool);
  const panBy = useCanvasStore((s) => s.panBy);
  const zoomAt = useCanvasStore((s) => s.zoomAt);
  const zoomCentered = useCanvasStore((s) => s.zoomCentered);
  const setWheelMode = useCanvasStore((s) => s.setWheelMode);

  const activeTool = useCanvasStore((s) => s.activeTool);
  const wheelMode = useCanvasStore((s) => s.wheelMode);

  // BBox of the single page in stage coords — the page is centered at origin.
  const bbox = useMemo(
    () => ({ x: 0, y: 0, width: frameWidth, height: frameHeight }),
    [frameWidth, frameHeight]
  );

  // Measure viewport
  useLayoutEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setViewportSize({ width: rect.width, height: rect.height });
    const ro = new ResizeObserver((entries) => {
      for (const e of entries) {
        setViewportSize({ width: e.contentRect.width, height: e.contentRect.height });
      }
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /**
   * Fit page into the *visible* region (excluding floating panels).
   * Replaces store.fitToContent for this canvas to account for ToolRail / Picker / RightPanel.
   */
  function fitVisible() {
    if (viewportSize.width === 0) return;
    const s = useCanvasStore.getState();
    const padding = 24;
    // Coordinates are local to .canvas-root (which already sits below the header).
    const offsetX = 84 + (s.entryPickerPinned ? 252 : 0); // ToolRail + pinned picker
    const offsetY = 12;                                    // top breathing room
    const rightReserve =
      s.activeTool === "inspect" || s.activeTool === "theme" ? 304 : 12;
    const availW = Math.max(200, viewportSize.width - offsetX - rightReserve - padding * 2);
    const availH = Math.max(200, viewportSize.height - offsetY - 12 - padding * 2);
    const raw = Math.min(availW / bbox.width, availH / bbox.height);
    const zoom = Math.max(0.1, Math.min(4, raw));
    const panX = offsetX + padding + (availW - bbox.width * zoom) / 2 - bbox.x * zoom;
    const panY = offsetY + padding + (availH - bbox.height * zoom) / 2 - bbox.y * zoom;
    useCanvasStore.setState({ zoom, panX, panY });
  }

  // Auto-fit on first mount ONLY if no persisted state for this project.
  const fittedRef = useRef(false);
  useEffect(() => {
    if (fittedRef.current) return;
    if (viewportSize.width === 0 || viewportSize.height === 0) return;
    fittedRef.current = true;
    const s = useCanvasStore.getState();
    const id = s.projectId;
    const hasPersisted = id ? !!localStorage.getItem(`omit-engine-canvas-${id}`) : false;
    if (!hasPersisted) {
      fitVisible();
    }
  }, [viewportSize.width, viewportSize.height, bbox]);

  // Imperative stage transform — subscribe to {panX, panY, zoom} and write DOM.
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    function applyTransform() {
      const s = useCanvasStore.getState();
      stage!.style.transform = `translate3d(${s.panX}px, ${s.panY}px, 0) scale(${s.zoom})`;
    }
    applyTransform();
    return useCanvasStore.subscribe((state, prev) => {
      if (
        state.panX !== prev.panX ||
        state.panY !== prev.panY ||
        state.zoom !== prev.zoom
      ) {
        applyTransform();
      }
    });
  }, []);

  // Wheel handler — non-passive, rAF-coalesced
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    let pendingDelta = 0;
    let pendingDX = 0;
    let pendingDY = 0;
    let pendingMode: "zoom" | "pan" | null = null;
    let lastAnchor = { x: 0, y: 0 };
    let scheduled = false;

    function flush() {
      scheduled = false;
      if (pendingMode === "zoom") {
        zoomAt(pendingDelta, lastAnchor.x, lastAnchor.y);
        pendingDelta = 0;
      } else if (pendingMode === "pan") {
        panBy(-pendingDX, -pendingDY);
        pendingDX = 0;
        pendingDY = 0;
      }
      pendingMode = null;
    }

    function handler(e: WheelEvent) {
      e.preventDefault();
      const rect = el!.getBoundingClientRect();
      const cx = e.clientX - rect.left;
      const cy = e.clientY - rect.top;
      const wm = useCanvasStore.getState().wheelMode;
      let isZoom: boolean;
      if (wm === "zoom") isZoom = true;
      else if (wm === "scroll") isZoom = e.ctrlKey;
      else {
        const isPinch = e.ctrlKey;
        const isMouseWheel =
          !e.ctrlKey &&
          e.deltaX === 0 &&
          Math.abs(e.deltaY) >= 50 &&
          Number.isInteger(e.deltaY);
        isZoom = isPinch || isMouseWheel;
      }
      if (isZoom) {
        if (pendingMode === "pan") flush();
        pendingMode = "zoom";
        pendingDelta += e.deltaY;
        lastAnchor = { x: cx, y: cy };
      } else {
        if (pendingMode === "zoom") flush();
        pendingMode = "pan";
        pendingDX += e.deltaX;
        pendingDY += e.deltaY;
      }
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(flush);
      }
    }
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, [panBy, zoomAt]);

  // Pan via pointer (hand tool / space / middle button)
  const dragStateRef = useRef<{ active: boolean; pointerId: number | null; pendingDX: number; pendingDY: number; scheduled: boolean }>({
    active: false,
    pointerId: null,
    pendingDX: 0,
    pendingDY: 0,
    scheduled: false,
  });
  const spaceHeldRef = useRef(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (isFromInput(e.target)) return;
      if (e.key === " " || e.code === "Space") {
        if (!spaceHeldRef.current) {
          spaceHeldRef.current = true;
          viewportRef.current?.setAttribute("data-space-pan", "1");
        }
        e.preventDefault();
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      if (mod && (e.key === "0" || e.code === "Digit0")) {
        e.preventDefault();
        fitVisible();
        return;
      }
      if (mod && (e.key === "1" || e.code === "Digit1")) {
        e.preventDefault();
        if (viewportSize.width > 0) resetTo100(bbox, viewportSize);
        return;
      }
      if (e.key === "+" || e.key === "=") {
        if (viewportSize.width > 0) zoomCentered(1.2, viewportSize);
        return;
      }
      if (e.key === "-") {
        if (viewportSize.width > 0) zoomCentered(1 / 1.2, viewportSize);
        return;
      }
      const k = e.key.toLowerCase();
      if (k === "v") setTool("move");
      else if (k === "h") setTool("hand");
      else if (k === "i") setTool("inspect");
      else if (k === "m") setTool("measure");
      else if (k === "a") setTool("a11y");
      else if (k === "c") setTool("comment");
    }
    function onKeyUp(e: KeyboardEvent) {
      if (e.key === " " || e.code === "Space") {
        spaceHeldRef.current = false;
        viewportRef.current?.removeAttribute("data-space-pan");
      }
    }
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [bbox, resetTo100, setTool, viewportSize, zoomCentered]);

  function flushDrag() {
    const d = dragStateRef.current;
    d.scheduled = false;
    if (d.pendingDX !== 0 || d.pendingDY !== 0) {
      panBy(d.pendingDX, d.pendingDY);
      d.pendingDX = 0;
      d.pendingDY = 0;
    }
  }

  function onPointerDown(e: React.PointerEvent) {
    const tool = useCanvasStore.getState().activeTool;
    const isMiddle = e.button === 1;
    const armedHand = tool === "hand" || spaceHeldRef.current;
    if (!isMiddle && !armedHand) return;
    if (e.button !== 0 && !isMiddle) return;
    e.preventDefault();
    dragStateRef.current.active = true;
    dragStateRef.current.pointerId = e.pointerId;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    viewportRef.current?.setAttribute("data-panning", "1");
  }

  function onPointerMove(e: React.PointerEvent) {
    const d = dragStateRef.current;
    if (!d.active || e.pointerId !== d.pointerId) return;
    d.pendingDX += e.movementX;
    d.pendingDY += e.movementY;
    if (!d.scheduled) {
      d.scheduled = true;
      requestAnimationFrame(flushDrag);
    }
  }

  function onPointerUp(e: React.PointerEvent) {
    const d = dragStateRef.current;
    if (!d.active || e.pointerId !== d.pointerId) return;
    flushDrag();
    d.active = false;
    d.pointerId = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
    viewportRef.current?.removeAttribute("data-panning");
  }

  return (
    <div
      ref={viewportRef}
      className="canvas-viewport canvas-viewport--single"
      data-tool={activeTool}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <div ref={stageRef} className="canvas-stage">
        {caption && <div className="canvas-page-caption">{caption}</div>}
        <div
          className="canvas-page-frame"
          style={{ width: frameWidth, height: frameHeight }}
        >
          {Component ? <Component /> : <div className="canvas-page-empty">No page selected</div>}
        </div>
      </div>

      <CanvasHUD bbox={bbox} viewport={viewportSize} onFit={fitVisible} />

      <button
        type="button"
        className="canvas-wheel-mode"
        data-no-inspect
        title={`Wheel: ${wheelMode === "auto" ? "Auto" : wheelMode === "zoom" ? "Zoom" : "Scroll"} (click to switch)`}
        onClick={() =>
          setWheelMode(wheelMode === "auto" ? "zoom" : wheelMode === "zoom" ? "scroll" : "auto")
        }
      >
        Wheel · {wheelMode === "auto" ? "Auto" : wheelMode === "zoom" ? "Zoom" : "Scroll"}
      </button>
    </div>
  );
}

function isFromInput(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  if (target.tagName === "INPUT" || target.tagName === "TEXTAREA") return true;
  if (target.isContentEditable) return true;
  return false;
}

