import { useState } from "react";
import { useLibraryStore } from "../libraryStore";
import { CodeEditor } from "../MarkdownEditor";
import type { SkillSummary } from "../api";

const EMPTY_SKILLS: SkillSummary[] = [];

export function SkillsPanel() {
  const skills = useLibraryStore((s) => s.index?.skills ?? EMPTY_SKILLS);
  const selected = useLibraryStore((s) => s.selected);
  const envelope = useLibraryStore((s) => s.envelope);
  const select = useLibraryStore((s) => s.select);
  const updateDraft = useLibraryStore((s) => s.updateDraft);
  const save = useLibraryStore((s) => s.save);
  const remove = useLibraryStore((s) => s.remove);
  const createSkill = useLibraryStore((s) => s.createSkill);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");

  const isSkillSelected = selected?.kind === "skill" && envelope?.kind === "skill";
  const draftValue = isSkillSelected ? (envelope.draft as string) : "";
  const dirty = isSkillSelected && envelope.draft !== envelope.saved;

  return (
    <div className="lib-split">
      <aside className="lib-list">
        <div className="lib-list__header">
          <span>Skills</span>
          <button
            className="lib-btn lib-btn--ghost"
            onClick={() => setCreating(true)}
            title="New skill"
          >
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
              await createSkill(id);
              setCreating(false);
              setNewName("");
            }}
          >
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="my-skill (lowercase, dashes)"
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
          {skills.length === 0 && (
            <div className="lib-empty">No skills yet. Click "+ New".</div>
          )}
          {skills.map((s) => (
            <button
              key={s.id}
              className={`lib-list__item ${
                selected?.kind === "skill" && selected.id === s.id ? "lib-list__item--active" : ""
              }`}
              onClick={() => void select("skill", s.id)}
              title={s.description}
            >
              <span className="lib-list__item-name">{s.name}</span>
              <span className="lib-list__item-desc">{s.description}</span>
            </button>
          ))}
        </div>
      </aside>

      <main className="lib-editor">
        {!isSkillSelected ? (
          <div className="lib-intro">
            <h2>Skills</h2>
            <p>
              Natural-language playbooks that Claude Code loads from{" "}
              <code>.claude/skills/</code>. Each skill tells the AI <em>when to trigger</em>{" "}
              and <em>what steps to follow</em> — e.g. <code>new-design</code> handles
              "make a page from this PRD", <code>audit-design</code> reviews the whole repo.
            </p>
            <p className="lib-intro__muted">
              Frontmatter (<code>name</code>, <code>description</code>) is the trigger
              hint Claude reads first. Body is the playbook.
            </p>
          </div>
        ) : (
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
                    if (window.confirm(`Delete skill "${envelope.id}"? This removes the directory.`)) {
                      void remove();
                    }
                  }}
                >
                  Delete
                </button>
              </div>
            </div>
            <CodeEditor
              value={draftValue}
              onChange={(v) => updateDraft(v)}
              language="markdown"
              className="lib-editor__cm"
            />
          </>
        )}
      </main>
    </div>
  );
}
