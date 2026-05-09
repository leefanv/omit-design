import { useEffect, useMemo } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { useThemeStore, type ThemeBaseline } from "./store";
import { useProjects, useProjectByHref } from "../registry";
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

  // 把 manifest 的 themeBaseline / tokenPrefixes / semanticColors 揉成 store 用的 ThemeBaseline
  const baseline = useMemo<ThemeBaseline>(
    () => ({
      presetName: preset.name,
      values: {
        colors: { ...preset.themeBaseline.colors },
        spacing: { ...preset.themeBaseline.spacing },
      },
      tokenPrefixes: preset.tokenPrefixes,
      semanticColors: preset.semanticColors,
      cssScope: preset.cssScope,
    }),
    [preset]
  );

  const switchPreset = useThemeStore((s) => s.switchPreset);
  const active = useThemeStore((s) => s.active);
  const setDraftColor = useThemeStore((s) => s.setDraftColor);
  const setDraftSpacing = useThemeStore((s) => s.setDraftSpacing);
  const apply = useThemeStore((s) => s.apply);
  const discardDraft = useThemeStore((s) => s.discardDraft);
  const resetToPublished = useThemeStore((s) => s.resetToPublished);
  const publish = useThemeStore((s) => s.publish);
  const hasUnappliedDraft = useThemeStore((s) => s.hasUnappliedDraft());
  const hasUnpublishedChanges = useThemeStore((s) => s.hasUnpublishedChanges());

  // 路由切到不同 preset 时把 store 切过去
  useEffect(() => {
    if (active?.baseline.presetName !== baseline.presetName) {
      switchPreset(baseline);
    }
  }, [baseline, active?.baseline.presetName, switchPreset]);

  // aside 关闭时如果有未应用的草稿 → 自动 discard
  useEffect(() => {
    return () => {
      if (variant === "aside" && useThemeStore.getState().hasUnappliedDraft()) {
        useThemeStore.getState().discardDraft();
      }
    };
  }, [variant]);

  if (!active || active.baseline.presetName !== baseline.presetName) {
    // 切 preset 还没 settle —— 渲染骨架（不要让旧 preset 的 token 短暂闪现）
    return (
      <aside className={`theme-panel theme-panel--${variant}`}>
        <header className="theme-panel__header">
          <h3>Theme Editor</h3>
          {onClose && <button className="theme-panel__close" onClick={onClose} aria-label="Close"><X size={14} aria-hidden /></button>}
        </header>
        <div className="theme-panel__loading">Loading {preset.displayName} theme…</div>
      </aside>
    );
  }

  const { draft, applied } = active;
  const visibleColorKeys = baseline.semanticColors;
  const visibleSpacingKeys = Object.keys(baseline.values.spacing);

  return (
    <aside className={`theme-panel theme-panel--${variant}`}>
      <header className="theme-panel__header">
        <h3>Theme Editor · {preset.displayName}</h3>
        {onClose && <button className="theme-panel__close" onClick={onClose} aria-label="Close"><X size={14} aria-hidden /></button>}
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
        <button className="btn-link" onClick={resetToPublished} disabled={!hasUnpublishedChanges && !hasUnappliedDraft}>
          Reset to published
        </button>
      </div>
    </aside>
  );
}
