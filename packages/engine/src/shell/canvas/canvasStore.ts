import { create } from "zustand";

export type CanvasTool =
  | "move"
  | "hand"
  | "inspect"
  | "measure"
  | "a11y"
  | "comment"
  | "theme";

/** 三个 inspect 子工具集合，统一开 InspectOverlay + 右侧面板。 */
export const INSPECT_TOOLS: CanvasTool[] = ["inspect", "measure", "a11y"];
export function isInspectTool(t: CanvasTool): boolean {
  return t === "inspect" || t === "measure" || t === "a11y";
}

interface ViewportRect {
  width: number;
  height: number;
}

interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface PersistedState {
  zoom: number;
  panX: number;
  panY: number;
  activeTool: CanvasTool;
  selectedEntryHref: string | null;
  entryPickerPinned: boolean;
}

interface CanvasState {
  projectId: string | null;
  zoom: number;
  panX: number;
  panY: number;
  activeTool: CanvasTool;
  /** Currently displayed entry (single-page canvas). */
  selectedEntryHref: string | null;
  wheelMode: "auto" | "zoom" | "scroll";
  /** EntryPicker pinned (持久占位) vs 浮层（按需弹出）。 */
  entryPickerPinned: boolean;
  /** 浮层模式下是否显示。pinned 模式下忽略。 */
  entryPickerOpen: boolean;

  setProjectId: (id: string | null) => void;
  setZoom: (z: number) => void;
  setPan: (x: number, y: number) => void;
  panBy: (dx: number, dy: number) => void;
  zoomAt: (deltaY: number, anchorX: number, anchorY: number) => void;
  zoomCentered: (factor: number, viewport: ViewportRect) => void;
  setTool: (t: CanvasTool) => void;
  selectEntry: (href: string | null) => void;
  fitToContent: (bbox: BBox, viewport: ViewportRect, padding?: number) => void;
  resetTo100: (bbox: BBox, viewport: ViewportRect) => void;
  setWheelMode: (m: "auto" | "zoom" | "scroll") => void;
  setEntryPickerPinned: (pinned: boolean) => void;
  toggleEntryPickerOpen: () => void;
  setEntryPickerOpen: (open: boolean) => void;
}

export const ZOOM_MIN = 0.1;
export const ZOOM_MAX = 4;
const STORAGE_PREFIX = "omit-engine-canvas-";

function clamp(v: number, lo: number, hi: number): number {
  return v < lo ? lo : v > hi ? hi : v;
}

function storageKey(id: string) {
  return STORAGE_PREFIX + id;
}

function loadPersisted(id: string): PersistedState | null {
  try {
    const raw = localStorage.getItem(storageKey(id));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (
      typeof parsed?.zoom === "number" &&
      typeof parsed?.panX === "number" &&
      typeof parsed?.panY === "number" &&
      typeof parsed?.activeTool === "string"
    ) {
      return {
        zoom: parsed.zoom,
        panX: parsed.panX,
        panY: parsed.panY,
        activeTool: parsed.activeTool,
        selectedEntryHref:
          typeof parsed.selectedEntryHref === "string" ? parsed.selectedEntryHref : null,
        entryPickerPinned:
          typeof parsed.entryPickerPinned === "boolean" ? parsed.entryPickerPinned : true,
      };
    }
  } catch {
    /* ignore */
  }
  return null;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function schedulePersist(id: string, snap: PersistedState) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      localStorage.setItem(storageKey(id), JSON.stringify(snap));
    } catch {
      /* ignore */
    }
  }, 250);
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  projectId: null,
  zoom: 1,
  panX: 0,
  panY: 0,
  activeTool: "move",
  selectedEntryHref: null,
  wheelMode: "auto",
  entryPickerPinned: true,
  entryPickerOpen: false,

  setProjectId: (id) => {
    if (get().projectId === id) return;
    if (id) {
      const persisted = loadPersisted(id);
      if (persisted) {
        set({
          projectId: id,
          zoom: persisted.zoom,
          panX: persisted.panX,
          panY: persisted.panY,
          activeTool: persisted.activeTool,
          selectedEntryHref: persisted.selectedEntryHref,
          entryPickerPinned: persisted.entryPickerPinned,
        });
      } else {
        set({
          projectId: id,
          selectedEntryHref: null,
        });
      }
    } else {
      set({ projectId: null });
    }
  },

  setZoom: (z) => {
    const next = clamp(z, ZOOM_MIN, ZOOM_MAX);
    set({ zoom: next });
    persistNow(get);
  },

  setPan: (x, y) => {
    set({ panX: x, panY: y });
    persistNow(get);
  },

  panBy: (dx, dy) => {
    set((s) => ({ panX: s.panX + dx, panY: s.panY + dy }));
    persistNow(get);
  },

  zoomAt: (deltaY, anchorX, anchorY) => {
    const s = get();
    const factor = Math.exp(-deltaY * 0.0015);
    const newZoom = clamp(s.zoom * factor, ZOOM_MIN, ZOOM_MAX);
    if (newZoom === s.zoom) return;
    const worldX = (anchorX - s.panX) / s.zoom;
    const worldY = (anchorY - s.panY) / s.zoom;
    const newPanX = anchorX - worldX * newZoom;
    const newPanY = anchorY - worldY * newZoom;
    set({ zoom: newZoom, panX: newPanX, panY: newPanY });
    persistNow(get);
  },

  zoomCentered: (factor, viewport) => {
    const s = get();
    const cx = viewport.width / 2;
    const cy = viewport.height / 2;
    const newZoom = clamp(s.zoom * factor, ZOOM_MIN, ZOOM_MAX);
    if (newZoom === s.zoom) return;
    const worldX = (cx - s.panX) / s.zoom;
    const worldY = (cy - s.panY) / s.zoom;
    set({
      zoom: newZoom,
      panX: cx - worldX * newZoom,
      panY: cy - worldY * newZoom,
    });
    persistNow(get);
  },

  setTool: (t) => {
    set({ activeTool: t });
    persistNow(get);
  },

  selectEntry: (href) => {
    set({ selectedEntryHref: href });
    persistNow(get);
  },

  fitToContent: (bbox, viewport, padding = 80) => {
    const w = bbox.width + padding * 2;
    const h = bbox.height + padding * 2;
    if (w <= 0 || h <= 0 || viewport.width <= 0 || viewport.height <= 0) return;
    const scale = clamp(
      Math.min(viewport.width / w, viewport.height / h),
      ZOOM_MIN,
      ZOOM_MAX
    );
    const panX = (viewport.width - bbox.width * scale) / 2 - bbox.x * scale;
    const panY = (viewport.height - bbox.height * scale) / 2 - bbox.y * scale;
    set({ zoom: scale, panX, panY });
    persistNow(get);
  },

  resetTo100: (bbox, viewport) => {
    const cx = bbox.x + bbox.width / 2;
    const cy = bbox.y + bbox.height / 2;
    set({
      zoom: 1,
      panX: viewport.width / 2 - cx,
      panY: viewport.height / 2 - cy,
    });
    persistNow(get);
  },

  setWheelMode: (m) => set({ wheelMode: m }),

  setEntryPickerPinned: (pinned) => {
    // 切到 pinned 时关闭浮层；切到 unpinned 时也关闭，由触发按钮显式打开
    set({ entryPickerPinned: pinned, entryPickerOpen: false });
    persistNow(get);
  },
  toggleEntryPickerOpen: () => set((s) => ({ entryPickerOpen: !s.entryPickerOpen })),
  setEntryPickerOpen: (open) => set({ entryPickerOpen: open }),
}));

function persistNow(get: () => CanvasState) {
  const s = get();
  if (!s.projectId) return;
  schedulePersist(s.projectId, {
    zoom: s.zoom,
    panX: s.panX,
    panY: s.panY,
    activeTool: s.activeTool,
    selectedEntryHref: s.selectedEntryHref,
    entryPickerPinned: s.entryPickerPinned,
  });
}

export function getPanelOpen(s: CanvasState): boolean {
  return isInspectTool(s.activeTool) || s.activeTool === "theme";
}
