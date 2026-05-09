import { Link, useLocation } from "react-router-dom";
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Info,
  Palette,
  SquareDashed,
} from "lucide-react";
import { useProjects, useProjectByHref } from "../../registry";

/** 右栏 Overview tab：当前项目说明 + 使用引导。无选中、无主题编辑时的默认状态。 */
export function OverviewPanel() {
  const location = useLocation();
  const allProjects = useProjects();
  const project = useProjectByHref(location.pathname)?.project ?? allProjects[0];

  return (
    <div className="shell-overview">
      <section>
        <h3>{project.icon} {project.name}</h3>
        <p className="muted">{project.description}</p>
      </section>

      <section>
        <h4>Right-panel tabs</h4>
        <ul className="shell-overview__list">
          <li>
            <strong><Info size={14} aria-hidden /> Overview</strong>
            <span>This page — project description and onboarding tips.</span>
          </li>
          <li>
            <strong><SquareDashed size={14} aria-hidden /> Inspect</strong>
            <span>Switching to this tab enables Inspect automatically. Hover/click an element on the canvas to see tokens, computed styles, and Web/Android-equivalent code.</span>
          </li>
          <li>
            <strong><Palette size={14} aria-hidden /> Theme</strong>
            <span>Edit tokens live; "Apply" writes to localStorage and takes effect globally; "Publish" exports CSS for you to commit (mobile preset only for now; desktop pending M2 manifest).</span>
          </li>
        </ul>
      </section>

      <section>
        <h4>Keyboard</h4>
        <ul className="shell-overview__list">
          <li><kbd><ArrowLeft size={12} aria-hidden /> <ArrowRight size={12} aria-hidden /></kbd><span>Jump to sibling element after selection</span></li>
          <li><kbd><ArrowUp size={12} aria-hidden /> <ArrowDown size={12} aria-hidden /></kbd><span>Jump to parent / first child</span></li>
          <li><kbd>Esc</kbd><span>Clear selection</span></li>
        </ul>
      </section>

      <section>
        <h4>Add a new design</h4>
        <ol className="shell-overview__list shell-overview__list--ordered">
          <li>Edit <code>{project.id}/registry.ts</code> and add an entry</li>
          <li>Edit <code>src/App.tsx</code> and add a <code>&lt;Route&gt;</code> inside <code>DesignsRoot</code></li>
          <li>Create a new page file with <code>// @pattern: xxx</code> on the first line</li>
        </ol>
        <p className="muted small">Or have AI run <code>.claude/skills/new-design</code> to automate the above.</p>
      </section>

      <section>
        <Link to="/workspace" className="shell-overview__link">
          <ArrowLeft size={14} aria-hidden /> Back to Workspace
        </Link>
      </section>
    </div>
  );
}
