import { useState } from "react";
import { useLibraryStore } from "../libraryStore";
import { CodeEditor } from "../MarkdownEditor";
import type { PatternDetail, PatternSummary } from "../api";

const EMPTY_PATTERNS: PatternSummary[] = [];

export function PatternsPanel() {
  const customs = useLibraryStore((s) => s.index?.patterns ?? EMPTY_PATTERNS);
  const components = useLibraryStore((s) => s.presetComponents);
  const selected = useLibraryStore((s) => s.selected);
  const envelope = useLibraryStore((s) => s.envelope);
  const select = useLibraryStore((s) => s.select);
  const updateDraft = useLibraryStore((s) => s.updateDraft);
  const save = useLibraryStore((s) => s.save);
  const remove = useLibraryStore((s) => s.remove);
  const createPattern = useLibraryStore((s) => s.createPattern);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const isPatternSelected = selected?.kind === "pattern" && envelope?.kind === "pattern";
  const detail = isPatternSelected ? (envelope.draft as PatternDetail) : null;
  const dirty = isPatternSelected && envelope.draft !== envelope.saved;

  const updateConfig = (patch: Partial<PatternDetail["config"]>) => {
    if (!detail) return;
    updateDraft({ ...detail, config: { ...detail.config, ...patch } });
  };

  const toggleComponent = (name: string) => {
    if (!detail) return;
    const set = new Set(detail.config.whitelist);
    if (set.has(name)) set.delete(name);
    else set.add(name);
    updateDraft({
      ...detail,
      config: { ...detail.config, whitelist: Array.from(set).sort() },
    });
  };

  return (
    <div className="lib-split">
      <aside className="lib-list">
        <div className="lib-list__header">
          <span>Patterns</span>
          <button className="lib-btn lib-btn--ghost" onClick={() => setCreating(true)}>
            + New
          </button>
        </div>

        {creating && (
          <form
            className="lib-list__create"
            onSubmit={async (e) => {
              e.preventDefault();
              const id = newName.trim();
              if (!id || !/^[a-z][a-z0-9-]*$/.test(id)) return;
              await createPattern(id);
              setCreating(false);
              setNewName("");
            }}
          >
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="my-pattern"
              spellCheck={false}
            />
            <div className="lib-list__create-row">
              <button type="submit" className="lib-btn lib-btn--apply">Create</button>
              <button
                type="button"
                className="lib-btn lib-btn--ghost"
                onClick={() => setCreating(false)}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        <div className="lib-list__scroll">
          {customs.length === 0 && (
            <div className="lib-empty">
              No patterns yet. Patterns are created on demand — write a PRD in the
              PRDs tab and click <strong>Distill patterns from this PRD</strong>, or
              ask Claude to <code>/add-pattern</code> directly.
            </div>
          )}
          {customs.map((p) => (
            <button
              key={p.id}
              className={`lib-list__item ${
                selected?.kind === "pattern" && selected.id === p.id ? "lib-list__item--active" : ""
              }`}
              onClick={() => void select("pattern", p.id)}
              title={p.description}
            >
              <span className="lib-list__item-name">{p.name}</span>
              <span className="lib-list__item-desc">
                {p.whitelist.length} component{p.whitelist.length === 1 ? "" : "s"}
                {p.description ? ` · ${p.description}` : ""}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <main className="lib-editor">
        {!isPatternSelected ? (
          <div className="lib-intro">
            <h2>Patterns</h2>
            <p>
              Patterns are the page archetypes your project knows about — list-view,
              detail-view, form-view, and so on. Each pattern declares{" "}
              <strong>which components</strong> a page using it must import (the
              whitelist) and ships a copy-paste <strong>TSX template</strong>.
            </p>
            <p>
              <strong>Recommended flow</strong>: write a PRD in the PRDs tab and click{" "}
              <strong>Distill patterns from this PRD</strong>. Claude analyzes the PRD
              and proposes patterns; you review them here. Then run{" "}
              <code>new-design</code> to scaffold the actual page. Patterns end up
              under <code>patterns/</code> in your project — git-tracked, fully
              editable here.
            </p>
            <p>
              Empty list? Two paths: <strong>(1)</strong> write a PRD in the PRDs tab,
              then <strong>Distill patterns from this PRD</strong> lets Claude analyze
              it and propose patterns; <strong>(2)</strong> click <strong>+ New</strong>{" "}
              above and fill in the four fields by hand. No PRD yet? Just ask Claude
              to <code>/add-pattern</code> directly — it'll ask 3-5 questions and
              produce a minimal pattern.
            </p>
            <p className="lib-intro__muted">
              Lint chain that consumes this: <code>require-pattern-header</code>{" "}
              (every design file declares <code>// @pattern: &lt;name&gt;</code>) +{" "}
              <code>require-pattern-components</code> (the file actually imports a
              whitelisted component).
            </p>
          </div>
        ) : detail ? (
          <>
            <div className="lib-editor__bar">
              <span className="lib-editor__title">{envelope.id}</span>
              <span className={`lib-pill ${dirty ? "lib-pill--draft" : "lib-pill--clean"}`}>
                {dirty ? "Unsaved" : "Saved"}
              </span>
              <div className="lib-editor__actions">
                <button
                  className="lib-btn lib-btn--apply"
                  onClick={() => void save()}
                  disabled={!dirty}
                >
                  Save
                </button>
                <button
                  className="lib-btn lib-btn--danger"
                  onClick={() => {
                    if (window.confirm(`Delete pattern "${envelope.id}"?`)) void remove();
                  }}
                >
                  Delete
                </button>
              </div>
            </div>

            <div className="lib-editor__scroll">
              <div className="lib-form">
                <label className="lib-field">
                  <span className="lib-field__label">Description</span>
                  <input
                    type="text"
                    value={detail.config.description ?? ""}
                    onChange={(e) => updateConfig({ description: e.target.value })}
                  />
                </label>
                <div className="lib-field">
                  <span className="lib-field__label">
                    Whitelist
                    <span className="lib-field__count">
                      {detail.config.whitelist.length} selected
                    </span>
                  </span>
                  <p className="lib-field__hint">
                    Signature components for this pattern. A design file declaring{" "}
                    <code>// @pattern: {detail.config.name}</code> must import at least
                    one of these — otherwise <code>npm run lint</code> rejects it.
                    Stops AI from declaring a pattern but skipping its actual components.
                  </p>
                  <div className="lib-chips">
                    {components.length === 0 && (
                      <span className="lib-empty">
                        No preset-mobile components found. Run dev with the preset installed.
                      </span>
                    )}
                    {components.map((name) => {
                      const on = detail.config.whitelist.includes(name);
                      return (
                        <button
                          key={name}
                          className={`lib-chip ${on ? "lib-chip--on" : ""}`}
                          onClick={() => toggleComponent(name)}
                          type="button"
                          title={on ? "Click to remove from whitelist" : "Click to add to whitelist"}
                        >
                          {name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="lib-tabs">
                <span className="lib-tabs__label">Notes (Markdown)</span>
                <small className="lib-tabs__hint">
                  Free-form description: when to use this pattern, examples, gotchas.
                </small>
              </div>
              <CodeEditor
                value={detail.readme}
                onChange={(v) => updateDraft({ ...detail, readme: v })}
                language="markdown"
                className="lib-editor__cm lib-editor__cm--split"
              />

              <details className="lib-advanced">
                <summary>
                  Advanced — edit TSX template
                  <small>
                    The skeleton <code>new-design</code> copies into{" "}
                    <code>design/</code> when scaffolding a page from this pattern.
                    Distilled patterns already include working templates. Most users
                    never need to touch this.
                  </small>
                </summary>
                <CodeEditor
                  value={detail.template}
                  onChange={(v) => updateDraft({ ...detail, template: v })}
                  language="tsx"
                  className="lib-editor__cm lib-editor__cm--advanced"
                />
              </details>
            </div>
          </>
        ) : null}
      </main>
    </div>
  );
}
