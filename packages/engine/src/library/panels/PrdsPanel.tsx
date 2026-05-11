import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { useLibraryStore } from "../libraryStore";
import { CodeEditor } from "../MarkdownEditor";
import type { PrdSummary } from "../api";

const EMPTY_PRDS: PrdSummary[] = [];

export function PrdsPanel() {
  const prds = useLibraryStore((s) => s.index?.prds ?? EMPTY_PRDS);
  const selected = useLibraryStore((s) => s.selected);
  const envelope = useLibraryStore((s) => s.envelope);
  const select = useLibraryStore((s) => s.select);
  const updateDraft = useLibraryStore((s) => s.updateDraft);
  const save = useLibraryStore((s) => s.save);
  const remove = useLibraryStore((s) => s.remove);
  const createPrd = useLibraryStore((s) => s.createPrd);

  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState("");
  const [copied, setCopied] = useState(false);
  const [distillCopied, setDistillCopied] = useState(false);

  const isPrdSelected = selected?.kind === "prd" && envelope?.kind === "prd";
  const draftValue = isPrdSelected ? (envelope.draft as string) : "";
  const dirty = isPrdSelected && envelope.draft !== envelope.saved;

  const summary = useMemo(() => {
    if (!isPrdSelected) return null;
    return prds.find((p) => p.id === envelope.id) ?? null;
  }, [prds, envelope, isPrdSelected]);

  const copyPrompt = async () => {
    if (!isPrdSelected || !summary) return;
    const body = stripFrontmatter(envelope.draft as string);
    const prompt = [
      `请用 new-design skill 处理这个 PRD：`,
      summary.target ? `目标路径：${summary.target}` : "",
      summary.pattern ? `推荐 pattern：${summary.pattern}` : "",
      `────────`,
      body.trim(),
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.alert("Clipboard write blocked. Copy manually:\n\n" + prompt);
    }
  };

  const copyDistillPrompt = async () => {
    if (!isPrdSelected || !summary) return;
    const body = stripFrontmatter(envelope.draft as string);
    const prompt = [
      `请用 distill-patterns-from-prd skill 处理这个 PRD，从中蒸馏出 reusable 的页面 pattern（不要直接生成页面）：`,
      `PRD 来源：${summary.id}`,
      summary.target ? `目标页面（如有）：${summary.target}` : "",
      `────────`,
      body.trim(),
    ]
      .filter(Boolean)
      .join("\n");
    try {
      await navigator.clipboard.writeText(prompt);
      setDistillCopied(true);
      setTimeout(() => setDistillCopied(false), 2000);
    } catch {
      window.alert("Clipboard write blocked. Copy manually:\n\n" + prompt);
    }
  };

  return (
    <div className="lib-split">
      <aside className="lib-list">
        <div className="lib-list__header">
          <span>PRDs</span>
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
              await createPrd(id);
              setCreating(false);
              setNewName("");
            }}
          >
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="orders-list"
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
          {prds.length === 0 && <div className="lib-empty">No PRDs yet.</div>}
          {prds.map((p) => (
            <button
              key={p.id}
              className={`lib-list__item ${
                selected?.kind === "prd" && selected.id === p.id ? "lib-list__item--active" : ""
              }`}
              onClick={() => void select("prd", p.id)}
            >
              <span className="lib-list__item-name">{p.title}</span>
              <span className="lib-list__item-desc">
                <span className={`lib-tag lib-tag--${p.status}`}>{p.status}</span>
                {p.pattern ? ` · ${p.pattern}` : ""}
                {p.target ? ` → ${p.target}` : ""}
              </span>
            </button>
          ))}
        </div>
      </aside>

      <main className="lib-editor">
        {!isPrdSelected ? (
          <div className="lib-intro">
            <h2>PRDs</h2>
            <p>
              Product requirement docs that feed the <code>new-design</code> skill.
              Each PRD is a Markdown file under <code>prds/</code> with frontmatter
              fields: <code>title</code>, <code>pattern</code> (which archetype to
              use), <code>target</code> (where the design file should land), and{" "}
              <code>status</code>.
            </p>
            <p>
              Two hand-off buttons on a selected PRD:
            </p>
            <ul>
              <li>
                <strong>Distill patterns from this PRD</strong> — Claude analyzes the
                PRD and produces project-local patterns under{" "}
                <code>patterns/</code> (or reuses existing ones). Run this first when
                your <code>patterns/</code> is empty.
              </li>
              <li>
                <strong>Copy Claude prompt</strong> — wraps the PRD in a{" "}
                <code>new-design</code> invocation to scaffold the actual page from
                an existing pattern.
              </li>
            </ul>
            <p className="lib-intro__muted">
              PRDs are not auto-executed. Both buttons just put a prompt on your
              clipboard — you stay in control of which Claude session picks them up.
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
                  className="lib-btn lib-btn--ghost"
                  onClick={() => void copyDistillPrompt()}
                  disabled={dirty}
                  title={
                    dirty
                      ? "Save first"
                      : "Distill reusable patterns from this PRD (paste into Claude Code)"
                  }
                >
                  {distillCopied ? (
                    <><Check size={14} aria-hidden /> Copied</>
                  ) : (
                    "Distill patterns from this PRD"
                  )}
                </button>
                <button
                  className="lib-btn lib-btn--accent"
                  onClick={() => void copyPrompt()}
                  disabled={dirty}
                  title={dirty ? "Save first" : "Copy a Claude Code prompt to your clipboard"}
                >
                  {copied ? (<><Check size={14} aria-hidden /> Copied</>) : "Copy Claude prompt"}
                </button>
                <button
                  className="lib-btn lib-btn--danger"
                  onClick={() => {
                    if (window.confirm(`Delete PRD "${envelope.id}"?`)) void remove();
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

function stripFrontmatter(src: string): string {
  const m = /^---\r?\n[\s\S]*?\r?\n---\r?\n?([\s\S]*)$/.exec(src);
  return m ? m[1] : src;
}
