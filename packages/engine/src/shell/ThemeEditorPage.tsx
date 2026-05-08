/**
 * ThemeEditorPage — 全屏三栏主题编辑器
 *
 * 路由：/workspace/:projectId/theme-editor
 *
 * 三栏：
 *   Left  220px  组件目录树（按分组）
 *   Center flex   所见即所得预览画布（渲染 catalog.tsx 里的每个组件 showcase）
 *   Right  300px  Token 编辑器（颜色 + 间距）
 *
 * Draft token → CSS variable 变化立即反映在中栏 → 所见即所得。
 * 发布 = 下载 variables.css，覆盖 preset/theme/variables.css 后 git commit 生效。
 */

import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useProject, useProjects } from "../registry";
import type { CatalogGroup, CatalogItem } from "../registry";
import { useThemeStore, type ThemeBaseline } from "../theme-editor/store";
import "./theme-editor-page.css";

type TokenTab = "colors" | "spacing";

// ─────────────────────────────────────────────
// Top-level page
// ─────────────────────────────────────────────

export function ThemeEditorPage() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const project = useProject(projectId);
  const allProjects = useProjects();
  const resolved = project ?? allProjects[0];

  const preset = resolved.preset;
  const catalog: CatalogGroup[] = resolved.catalog ?? [];

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
  const active       = useThemeStore((s) => s.active);

  useEffect(() => {
    if (active?.baseline.presetName !== baseline.presetName) {
      switchPreset(baseline);
    }
  }, [baseline, active?.baseline.presetName, switchPreset]);

  // Selected group — null = show all
  const [activeGroupId, setActiveGroupId] = useState<string | null>(null);

  const visibleGroups = useMemo<CatalogGroup[]>(() => {
    if (!activeGroupId) return catalog;
    return catalog.filter((g) => g.id === activeGroupId);
  }, [catalog, activeGroupId]);

  // ───── State dependent on active being ready ─────
  const setDraftColor   = useThemeStore((s) => s.setDraftColor);
  const setDraftSpacing = useThemeStore((s) => s.setDraftSpacing);
  const apply           = useThemeStore((s) => s.apply);
  const discard         = useThemeStore((s) => s.discardDraft);
  const publish         = useThemeStore((s) => s.publish);
  const resetPublished  = useThemeStore((s) => s.resetToPublished);
  const hasDraft        = useThemeStore((s) => s.hasUnappliedDraft());
  const hasUnpublished  = useThemeStore((s) => s.hasUnpublishedChanges());

  const [tokenTab, setTokenTab] = useState<TokenTab>("colors");

  const statusLabel = hasDraft
    ? "Draft not applied"
    : hasUnpublished
    ? "Applied, not published"
    : "Matches published";
  const statusClass = hasDraft
    ? "ted-header__status-pill--draft"
    : hasUnpublished
    ? "ted-header__status-pill--applied"
    : "ted-header__status-pill--clean";

  const draft = active?.draft ?? baseline.values;
  const applied = active?.applied ?? baseline.values;
  const colorKeys = baseline.semanticColors as readonly string[];
  const spacingKeys = Object.keys(baseline.values.spacing);

  return (
    <div className="ted-page">
      {/* ── Header ── */}
      <header className="ted-header">
        <Link to={`/workspace/${resolved.id}`} className="ted-header__back">
          ← {resolved.icon} {resolved.name}
        </Link>
        <span className="ted-header__sep">›</span>
        <span className="ted-header__title">Theme Editor</span>
        <span className="ted-header__preset">{preset.displayName}</span>
        <span className={`ted-header__status-pill ${statusClass}`}>{statusLabel}</span>
        <div className="ted-header__actions">
          <button className="ted-btn ted-btn--ghost" onClick={discard} disabled={!hasDraft}>
            Discard draft
          </button>
          <button className="ted-btn ted-btn--apply" onClick={apply} disabled={!hasDraft}>
            Apply
          </button>
          <button
            className="ted-btn ted-btn--publish"
            onClick={() => void publish()}
            disabled={!hasUnpublished}
            title="Download variables.css → overwrite project/<id>/preset/theme/variables.css and git commit"
          >
            ✓ Publish
          </button>
        </div>
      </header>

      <div className="ted-body">
        {/* ── Left: component tree ── */}
        <nav className="ted-sidebar">
          <div className="ted-sidebar__header">Components</div>
          <div className="ted-sidebar__scroll">
            <button
              className={`ted-group-btn ${!activeGroupId ? "ted-group-btn--active" : ""}`}
              onClick={() => setActiveGroupId(null)}
            >
              📋 All components
            </button>
            {catalog.map((g) => (
              <div key={g.id}>
                <div className="ted-group-header">
                  {g.icon} {g.label}
                </div>
                {g.items.map((item) => (
                  <button
                    key={item.id}
                    className={`ted-group-item ${
                      activeGroupId === g.id ? "ted-group-item--active" : ""
                    }`}
                    onClick={() =>
                      setActiveGroupId(activeGroupId === g.id ? null : g.id)
                    }
                    title={item.description}
                  >
                    {item.name}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </nav>

        {/* ── Center: component previews ── */}
        <main className="ted-canvas">
          {catalog.length === 0 ? (
            <div className="ted-empty">
              <div className="ted-empty__icon">🧩</div>
              <div>This project has no component catalog configured</div>
              <div style={{ fontSize: 12 }}>Add a `catalog` field in project.config.ts</div>
            </div>
          ) : (
            visibleGroups.map((g) => (
              <section key={g.id} className="ted-canvas-group">
                <div className="ted-canvas-group__label">
                  {g.icon} {g.label}
                </div>
                <div className="ted-canvas-group__grid">
                  {g.items.map((item) => (
                    <ComponentCard key={item.id} item={item} cssScope={preset.cssScope} />
                  ))}
                </div>
              </section>
            ))
          )}
        </main>

        {/* ── Right: token editor ── */}
        <aside className="ted-tokens">
          <div className="ted-tokens__tabs">
            <button
              className={`ted-tokens__tab ${tokenTab === "colors" ? "ted-tokens__tab--active" : ""}`}
              onClick={() => setTokenTab("colors")}
            >
              🎨 Colors
            </button>
            <button
              className={`ted-tokens__tab ${tokenTab === "spacing" ? "ted-tokens__tab--active" : ""}`}
              onClick={() => setTokenTab("spacing")}
            >
              📐 Spacing
            </button>
          </div>

          <div className="ted-tokens__scroll">
            {tokenTab === "colors" && (
              <div className="ted-token-section">
                <div className="ted-token-section__title">Semantic colors</div>
                {colorKeys.map((key) => {
                  const val = draft.colors[key] ?? "";
                  const dirty = val !== applied.colors[key];
                  return (
                    <label key={key} className={`ted-token-row ${dirty ? "ted-token-row--dirty" : ""}`}>
                      <span className="ted-token-row__name" title={`${baseline.tokenPrefixes.color}${key}`}>
                        {key}
                      </span>
                      <input
                        type="color"
                        value={val}
                        onChange={(e) => setDraftColor(key, e.target.value)}
                        className="ted-token-row__swatch"
                      />
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => setDraftColor(key, e.target.value)}
                        className="ted-token-row__hex"
                        spellCheck={false}
                      />
                    </label>
                  );
                })}
              </div>
            )}

            {tokenTab === "spacing" && (
              <div className="ted-token-section">
                <div className="ted-token-section__title">Spacing</div>
                {spacingKeys.map((key) => {
                  const val = draft.spacing[key] ?? "";
                  const dirty = val !== applied.spacing[key];
                  return (
                    <label key={key} className={`ted-token-row ${dirty ? "ted-token-row--dirty" : ""}`}>
                      <span className="ted-token-row__name" title={`${baseline.tokenPrefixes.spacing}${key}`}>
                        {key}
                      </span>
                      <input
                        type="text"
                        value={val}
                        onChange={(e) => setDraftSpacing(key, e.target.value)}
                        className="ted-token-row__text"
                        spellCheck={false}
                      />
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div style={{ padding: "10px 12px", borderTop: "1px solid #f0f0f0" }}>
            <button
              className="ted-btn ted-btn--reset"
              onClick={resetPublished}
              disabled={!hasUnpublished && !hasDraft}
            >
              Reset to published
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// Component preview card
// ─────────────────────────────────────────────

interface ComponentCardProps {
  item: CatalogItem;
  cssScope?: string;
}

function ComponentCard({ item, cssScope }: ComponentCardProps) {
  const rendered = item.render();
  return (
    <div className="ted-card">
      <div className="ted-card__meta">
        <span className="ted-card__name">{item.name}</span>
        {item.description && <span className="ted-card__desc">{item.description}</span>}
      </div>
      <div className={`ted-card__preview ted-card__preview--column ${cssScope ?? ""}`}>
        {rendered}
      </div>
    </div>
  );
}
