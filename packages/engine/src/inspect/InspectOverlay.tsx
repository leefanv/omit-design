import { useEffect } from "react";
import {
  buildInspectTarget,
  findInspectableTarget,
  navigate,
  useInspectStore,
  type Direction,
} from "./store";
import { BoxModelOverlay } from "./BoxModelOverlay";
import { MeasureOverlay } from "./MeasureOverlay";
import { A11yOverlay } from "./A11yOverlay";
import "./inspect.css";

export function InspectOverlay() {
  const { enabled, mode, hovered, setHovered, selected, setSelected, measureAnchor, setMeasureAnchor, showBoxModel } =
    useInspectStore();

  // Pointer events
  useEffect(() => {
    if (!enabled || mode === "a11y") {
      setHovered(null);
      return;
    }
    function onMouseMove(e: MouseEvent) {
      const t = findInspectableTarget(e.target as HTMLElement | null);
      setHovered(t);
    }
    function onClick(e: MouseEvent) {
      const t = findInspectableTarget(e.target as HTMLElement | null);
      if (!t) return;
      e.preventDefault();
      e.stopPropagation();
      const target = buildInspectTarget(t);
      if (mode === "measure") {
        if (!measureAnchor) {
          setMeasureAnchor(target);
        } else if (measureAnchor.el === target.el) {
          setMeasureAnchor(null);
        } else {
          setSelected(target);
        }
      } else {
        setSelected(target);
      }
    }
    document.addEventListener("mousemove", onMouseMove, true);
    document.addEventListener("click", onClick, true);
    return () => {
      document.removeEventListener("mousemove", onMouseMove, true);
      document.removeEventListener("click", onClick, true);
    };
  }, [enabled, mode, measureAnchor, setHovered, setSelected, setMeasureAnchor]);

  // Keyboard nav
  useEffect(() => {
    if (!enabled) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        if (measureAnchor) setMeasureAnchor(null);
        else if (selected) setSelected(null);
        return;
      }
      const anchor = selected?.el ?? measureAnchor?.el ?? hovered;
      if (!anchor) return;
      const dirMap: Record<string, Direction> = {
        ArrowUp: "up",
        ArrowDown: "down",
        ArrowLeft: "left",
        ArrowRight: "right",
      };
      const dir = dirMap[e.key];
      if (!dir) return;
      e.preventDefault();
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const next = navigate(anchor, dir);
      if (next) setSelected(buildInspectTarget(next));
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [enabled, hovered, selected, measureAnchor, setSelected, setMeasureAnchor]);

  if (!enabled) return null;

  const hoveredRect = hovered?.getBoundingClientRect();

  return (
    <>
      {/* Hover 高亮（inspect / measure 共用） */}
      {mode !== "a11y" && hoveredRect && (
        <div
          className="inspect-hover"
          style={{
            top: hoveredRect.top,
            left: hoveredRect.left,
            width: hoveredRect.width,
            height: hoveredRect.height,
          }}
        >
          <span className="inspect-hover-label">{hovered?.getAttribute("data-omit-component")}</span>
        </div>
      )}

      {mode === "inspect" && showBoxModel && hovered && <BoxModelOverlay el={hovered} />}
      {mode === "measure" && <MeasureOverlay anchor={measureAnchor} hovered={hovered} />}
      {mode === "a11y" && <A11yOverlay />}
    </>
  );
}
