import { useEffect, useMemo, useRef, useState } from "react";
import type { DesignEntry, DesignGroup } from "../../registry";
import { useCanvasStore } from "./canvasStore";

interface Props {
  groups: DesignGroup[];
  q: string;
  setQ: (v: string) => void;
}

const STORAGE_KEY = "omit-engine-entry-picker";

interface PersistedState {
  closedGroups: string[];
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PersistedState;
  } catch {
    /* ignore */
  }
  return { closedGroups: [] };
}

function saveState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

/**
 * 分组 + 页面选择面板。两种模式：
 *   - pinned: 固定占位左侧，宽 240
 *   - floating: 浮卡，仅在 entryPickerOpen=true 时显示，points-of-light 阴影
 *
 * 由 store.entryPickerPinned 控制；右上角小图钉切换。
 */
export function EntryPicker({ groups, q, setQ }: Props) {
  const selectedHref = useCanvasStore((s) => s.selectedEntryHref);
  const selectEntry = useCanvasStore((s) => s.selectEntry);
  const pinned = useCanvasStore((s) => s.entryPickerPinned);
  const open = useCanvasStore((s) => s.entryPickerOpen);
  const setPinned = useCanvasStore((s) => s.setEntryPickerPinned);
  const setOpen = useCanvasStore((s) => s.setEntryPickerOpen);

  const [closedGroups, setClosedGroups] = useState<Set<string>>(
    () => new Set(loadState().closedGroups)
  );
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    saveState({ closedGroups: Array.from(closedGroups) });
  }, [closedGroups]);

  useEffect(() => {
    if (!selectedHref) return;
    const containing = groups.find((g) =>
      g.entries.some((e) => e.href === selectedHref)
    );
    if (containing && closedGroups.has(containing.id)) {
      setClosedGroups((prev) => {
        const next = new Set(prev);
        next.delete(containing.id);
        return next;
      });
    }
  }, [selectedHref, groups, closedGroups]);

  // 浮层模式：点外面关闭 + Esc 关闭
  useEffect(() => {
    if (pinned || !open) return;
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) {
        // 排除 header 上 Layers 触发按钮
        const target = e.target as HTMLElement;
        if (target.closest("[data-entry-picker-trigger]")) return;
        setOpen(false);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [pinned, open, setOpen]);

  const term = q.trim().toLowerCase();
  const visibleGroups = useMemo<DesignGroup[]>(() => {
    if (!term) return groups;
    return groups
      .map((g) => ({
        ...g,
        entries: g.entries.filter((e) => matches(e, term)),
      }))
      .filter((g) => g.entries.length > 0);
  }, [groups, term]);

  const total = useMemo(
    () => groups.reduce((sum, g) => sum + g.entries.length, 0),
    [groups]
  );
  const visibleTotal = useMemo(
    () => visibleGroups.reduce((sum, g) => sum + g.entries.length, 0),
    [visibleGroups]
  );

  function toggleGroup(id: string) {
    setClosedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function handleSelect(href: string) {
    selectEntry(href);
    if (!pinned) setOpen(false); // 浮层模式选完即收
  }

  // 浮层模式且未打开时不渲染（避免无谓 DOM）
  if (!pinned && !open) return null;

  return (
    <aside
      ref={wrapRef}
      className={`canvas-picker ${pinned ? "canvas-picker--pinned" : "canvas-picker--floating"}`}
      data-no-inspect
    >
      <div className="canvas-picker__head">
        <span className="canvas-picker__head-title">Pages</span>
        <div className="canvas-picker__head-actions">
          <button
            type="button"
            className="canvas-picker__head-btn"
            onClick={() => setPinned(!pinned)}
            title={pinned ? "Float" : "Pin"}
            aria-label={pinned ? "Float" : "Pin"}
          >
            {pinned ? "📌" : "📍"}
          </button>
          {!pinned && (
            <button
              type="button"
              className="canvas-picker__head-btn"
              onClick={() => setOpen(false)}
              title="Close"
              aria-label="Close"
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="canvas-picker__search">
        <span className="canvas-picker__search-icon" aria-hidden>🔍</span>
        <input
          type="search"
          value={q}
          placeholder="Search designs / routes / patterns…"
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button
            type="button"
            className="canvas-picker__search-clear"
            onClick={() => setQ("")}
            aria-label="Clear search"
          >
            ×
          </button>
        )}
        <kbd className="canvas-picker__count">{visibleTotal}/{total}</kbd>
      </div>

      <nav className="canvas-picker__tree">
        {visibleGroups.length === 0 && (
          <div className="canvas-picker__empty">No designs match "{q}".</div>
        )}
        {visibleGroups.map((g) => {
          const isOpen = !closedGroups.has(g.id);
          const groupHasSelected = g.entries.some((e) => e.href === selectedHref);
          return (
            <div key={g.id} className="canvas-picker__group">
              <button
                type="button"
                className="canvas-picker__group-head"
                onClick={() => toggleGroup(g.id)}
                aria-expanded={isOpen}
                data-active={groupHasSelected || undefined}
              >
                <span
                  className={`canvas-picker__caret ${isOpen ? "canvas-picker__caret--open" : ""}`}
                  aria-hidden
                >
                  ▸
                </span>
                {g.icon && <span className="canvas-picker__group-icon">{g.icon}</span>}
                <span className="canvas-picker__group-label">{g.label}</span>
                <span className="canvas-picker__group-count">{g.entries.length}</span>
              </button>
              {isOpen && (
                <ul className="canvas-picker__entries">
                  {g.entries.map((e) => {
                    const active = e.href === selectedHref;
                    return (
                      <li key={e.href}>
                        <button
                          type="button"
                          className="canvas-picker__entry"
                          data-active={active || undefined}
                          onClick={() => handleSelect(e.href)}
                          title={`${e.name} · @${e.pattern}\n${e.description ?? ""}`}
                        >
                          <span className="canvas-picker__entry-name">{e.name}</span>
                          <span className="canvas-picker__entry-pattern">@{e.pattern}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>
    </aside>
  );
}

function matches(e: DesignEntry, term: string): boolean {
  const hay = `${e.name} ${e.href} ${e.pattern} ${e.description ?? ""} ${e.source ?? ""}`.toLowerCase();
  return hay.includes(term);
}
