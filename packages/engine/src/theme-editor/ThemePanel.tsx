import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Maximize2, Minimize2, X } from "lucide-react";
import { useThemeStore } from "./store";
import { useApplyPresetTheme } from "./useApplyPresetTheme";
import { useThemeEditorMode } from "./mode-store";
import { useProjects, useProjectByHref } from "../registry";
import type { CatalogItem } from "../registry";
import "./theme-panel.css";

interface ThemePanelProps {
  /**
   * embedded — 自动充满父容器（用于 Studio split 的右栏）
   * aside    — 设计稿页面右侧栏，整 shell 重排时自然让位
   */
  variant?: "embedded" | "aside";
  onClose?: () => void;
}

export function ThemePanel({ variant = "embedded", onClose }: ThemePanelProps) {
  const location = useLocation();
  const allProjects = useProjects();
  const project = useProjectByHref(location.pathname)?.project ?? allProjects[0];
  const preset = project.preset;
  const catalog = project.catalog ?? [];

  // 把 manifest 的 themeBaseline / tokenPrefixes / semanticColors 揉成 store 用的 ThemeBaseline
  // 并且确保 active preset 已切到当前路由对应的 preset。
  const baseline = useApplyPresetTheme(preset);

  const active = useThemeStore((s) => s.active);
  const setDraftColor = useThemeStore((s) => s.setDraftColor);
  const setDraftSpacing = useThemeStore((s) => s.setDraftSpacing);
  const apply = useThemeStore((s) => s.apply);
  const discardDraft = useThemeStore((s) => s.discardDraft);
  const resetToPublished = useThemeStore((s) => s.resetToPublished);
  const publish = useThemeStore((s) => s.publish);
  const hasUnappliedDraft = useThemeStore((s) => s.hasUnappliedDraft());
  const hasUnpublishedChanges = useThemeStore((s) => s.hasUnpublishedChanges());

  // aside 关闭时如果有未应用的草稿 → 自动 discard
  useEffect(() => {
    return () => {
      if (variant === "aside" && useThemeStore.getState().hasUnappliedDraft()) {
        useThemeStore.getState().discardDraft();
      }
    };
  }, [variant]);

  const editorMode = useThemeEditorMode((s) => s.mode);
  const toggleEditorMode = useThemeEditorMode((s) => s.toggleMode);
  const isFullscreen = editorMode === "fullscreen";

  // ESC 从 fullscreen 退到 drawer
  useEffect(() => {
    if (!isFullscreen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key !== "Escape") return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) {
        return;
      }
      e.preventDefault();
      useThemeEditorMode.getState().setMode("drawer");
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isFullscreen]);

  const headerActions = (
    <div className="theme-panel__header-actions">
      <button
        type="button"
        className="theme-panel__icon-btn"
        onClick={toggleEditorMode}
        title={editorMode === "drawer" ? "Expand to full screen" : "Collapse to drawer"}
        aria-label={editorMode === "drawer" ? "Expand to full screen" : "Collapse to drawer"}
      >
        {editorMode === "drawer" ? (
          <Maximize2 size={14} aria-hidden />
        ) : (
          <Minimize2 size={14} aria-hidden />
        )}
      </button>
      {onClose && (
        <button
          className="theme-panel__icon-btn"
          onClick={onClose}
          aria-label="Close"
          title="Close"
        >
          <X size={14} aria-hidden />
        </button>
      )}
    </div>
  );

  const asideClass = `theme-panel theme-panel--${variant}${isFullscreen ? " theme-panel--fullscreen" : ""}`;

  if (!active || active.baseline.presetName !== baseline.presetName) {
    // 切 preset 还没 settle —— 渲染骨架（不要让旧 preset 的 token 短暂闪现）
    return (
      <aside className={asideClass}>
        <header className="theme-panel__header">
          <h3>Theme Editor</h3>
          {headerActions}
        </header>
        <div className="theme-panel__loading">Loading {preset.displayName} theme…</div>
      </aside>
    );
  }

  const { draft, applied } = active;
  const visibleColorKeys = baseline.semanticColors;
  const visibleSpacingKeys = Object.keys(baseline.values.spacing);

  const tokensMain = (
    <div className="theme-panel__main">
      <section className="theme-panel__section">
        <h4>Colors</h4>
        <div className="token-grid">
          {visibleColorKeys.map((key) => {
            const draftValue = draft.colors[key] ?? "";
            const isDirty = draftValue !== applied.colors[key];
            return (
              <label key={key} className={`token-row ${isDirty ? "token-row--dirty" : ""}`}>
                <span className="token-row__name">{key}</span>
                <input
                  type="color"
                  value={draftValue}
                  onChange={(e) => setDraftColor(key, e.target.value)}
                  className="token-row__color"
                />
                <input
                  type="text"
                  value={draftValue}
                  onChange={(e) => setDraftColor(key, e.target.value)}
                  className="token-row__hex"
                />
              </label>
            );
          })}
        </div>
      </section>

      <section className="theme-panel__section">
        <h4>Spacing</h4>
        <div className="token-grid">
          {visibleSpacingKeys.map((key) => {
            const draftValue = draft.spacing[key] ?? "";
            const isDirty = draftValue !== applied.spacing[key];
            return (
              <label key={key} className={`token-row ${isDirty ? "token-row--dirty" : ""}`}>
                <span className="token-row__name">{key}</span>
                <input
                  type="text"
                  value={draftValue}
                  onChange={(e) => setDraftSpacing(key, e.target.value)}
                  className="token-row__hex"
                />
              </label>
            );
          })}
        </div>
      </section>
    </div>
  );

  return (
    <aside className={asideClass}>
      <header className="theme-panel__header">
        <h3>Theme Editor · {preset.displayName}</h3>
        {headerActions}
      </header>

      <div className="theme-panel__status">
        {hasUnappliedDraft && (
          <span className="status-pill status-pill--draft">Draft not applied</span>
        )}
        {!hasUnappliedDraft && hasUnpublishedChanges && (
          <span className="status-pill status-pill--applied">Applied, not published</span>
        )}
        {!hasUnappliedDraft && !hasUnpublishedChanges && (
          <span className="status-pill status-pill--clean">Matches published</span>
        )}
      </div>

      <div className="theme-panel__body">
        {isFullscreen && (
          <div className="theme-panel__catalog">
            {catalog.length === 0 ? (
              <div className="theme-panel__catalog-empty">
                This project has no component catalog configured
              </div>
            ) : (
              catalog.map((group) => (
                <section key={group.id} className="theme-panel__catalog-group">
                  <div className="theme-panel__catalog-label">
                    {group.icon} {group.label}
                  </div>
                  <div className="theme-panel__catalog-grid">
                    {group.items.map((item) => (
                      <CatalogPreviewCard
                        key={item.id}
                        item={item}
                        cssScope={preset.cssScope}
                      />
                    ))}
                  </div>
                </section>
              ))
            )}
          </div>
        )}
        {tokensMain}
      </div>

      <footer className="theme-panel__footer">
        <button className="btn btn--ghost" onClick={discardDraft} disabled={!hasUnappliedDraft}>
          Discard draft
        </button>
        <button className="btn btn--primary" onClick={apply} disabled={!hasUnappliedDraft}>
          Apply
        </button>
        <button
          className="btn btn--success"
          onClick={() => void publish()}
          disabled={!hasUnpublishedChanges}
          title="Export the current preset's variables.css so you can commit it to the repo"
        >
          Publish…
        </button>
      </footer>

      <div className="theme-panel__reset">
        <button
          className="btn-link"
          onClick={resetToPublished}
          disabled={!hasUnpublishedChanges && !hasUnappliedDraft}
        >
          Reset to published
        </button>
      </div>
    </aside>
  );
}

interface CatalogPreviewCardProps {
  item: CatalogItem;
  cssScope?: string;
}

function CatalogPreviewCard({ item, cssScope }: CatalogPreviewCardProps) {
  return (
    <div className="theme-panel__card">
      <div className="theme-panel__card-meta">
        <span className="theme-panel__card-name">{item.name}</span>
        {item.description && (
          <span className="theme-panel__card-desc">{item.description}</span>
        )}
      </div>
      <div className={`theme-panel__card-preview ${cssScope ?? ""}`}>
        {item.render()}
      </div>
    </div>
  );
}
