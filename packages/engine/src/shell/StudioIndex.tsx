import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useProjects,
  useProjectGroups,
  useProject,
  type DiscoveredProject,
} from "../registry";
import { ExportFigmaDialog } from "../capture/ExportFigmaDialog";
import { DesignThumbnail } from "./DesignThumbnail";
import { InspectOverlay } from "../inspect/InspectOverlay";
import { SinglePageCanvas } from "./canvas/SinglePageCanvas";
import { EntryPicker } from "./canvas/EntryPicker";
import { ToolRail } from "./canvas/ToolRail";
import { useCanvasStore, getPanelOpen, type CanvasTool } from "./canvas/canvasStore";
import { RightPanel } from "./RightPanel";

// ─────────────────────────────────────────────
// ProjectsHome — /workspace（Figma 风格项目列表）
// ─────────────────────────────────────────────

export function ProjectsHome() {
  const projects = useProjects();
  return (
    <div className="shell-studio">
      <header className="shell-studio__header">
        <div className="shell-studio__brand">
          <span className="shell-studio__logo" aria-hidden="true">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="16" height="16" fill="black" />
              <path fillRule="evenodd" clipRule="evenodd" d="M11.5111 4.80005C13.2784 4.80005 14.7111 6.23274 14.7111 8.00005C14.7111 9.76736 13.2784 11.2 11.5111 11.2H4.39995C2.63264 11.2 1.19995 9.76736 1.19995 8.00005C1.19995 6.23274 2.63264 4.80005 4.39995 4.80005H11.5111ZM4.39995 6.93338C3.81085 6.93338 3.33328 7.41095 3.33328 8.00005C3.33328 8.58915 3.81085 9.06672 4.39995 9.06672H11.5111C12.1002 9.06672 12.5777 8.58915 12.5777 8.00005C12.5777 7.41095 12.1002 6.93338 11.5111 6.93338H4.39995Z" fill="white" />
            </svg>
          </span>
          <h1 className="shell-studio__wordmark" aria-label="omit">
            <svg width="30" height="16" viewBox="0 0 30 16" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <path d="M5.11661 12C4.27804 12 3.5462 11.8377 2.92109 11.513C2.30359 11.1807 1.82713 10.7169 1.49171 10.1217C1.1639 9.51884 1 8.81159 1 8C1 7.18841 1.1639 6.48502 1.49171 5.88985C1.82713 5.28696 2.30359 4.82319 2.92109 4.49855C3.5462 4.16618 4.27804 4 5.11661 4C5.98568 4 6.72895 4.16618 7.34645 4.49855C7.96394 4.82319 8.4404 5.28696 8.77583 5.88985C9.11125 6.48502 9.27897 7.18841 9.27897 8C9.27897 8.81159 9.11125 9.51884 8.77583 10.1217C8.4404 10.7169 7.96394 11.1807 7.34645 11.513C6.72895 11.8377 5.98568 12 5.11661 12ZM5.11661 10.3304C5.68074 10.3304 6.13052 10.257 6.46595 10.1101C6.809 9.95556 7.05676 9.70821 7.20923 9.36812C7.36932 9.02802 7.44936 8.57198 7.44936 8C7.44936 7.42029 7.36932 6.96425 7.20923 6.63188C7.05676 6.29179 6.809 6.04831 6.46595 5.90145C6.13052 5.74686 5.68074 5.66957 5.11661 5.66957C4.56011 5.66957 4.11414 5.74686 3.77871 5.90145C3.44329 6.04831 3.19934 6.29179 3.04687 6.63188C2.8944 6.96425 2.81817 7.42029 2.81817 8C2.81817 8.57198 2.8944 9.02802 3.04687 9.36812C3.19934 9.70821 3.44329 9.95556 3.77871 10.1101C4.11414 10.257 4.56011 10.3304 5.11661 10.3304Z" fill="black" />
              <path d="M20.4786 11.8841H18.7633V8.84638C18.7633 8.36715 18.6681 8.02705 18.4775 7.82609C18.2869 7.62512 17.9438 7.52464 17.4483 7.52464C16.9299 7.52464 16.5754 7.63672 16.3849 7.86087C16.2019 8.08502 16.1104 8.44831 16.1104 8.95072H15.8932L15.7559 7.86087H16.0875C16.1333 7.5285 16.2324 7.21932 16.3849 6.93333C16.545 6.64734 16.7775 6.41546 17.0824 6.23768C17.395 6.05217 17.7952 5.95942 18.2831 5.95942C18.7786 5.95942 19.1864 6.0599 19.5066 6.26087C19.8344 6.46184 20.0784 6.73623 20.2385 7.08406C20.3986 7.43188 20.4786 7.82609 20.4786 8.26667V11.8841ZM11.7422 11.8841H10.027V6.07536H11.6165V7.88406L11.7422 7.94203V11.8841ZM16.1104 11.8841H14.3952V8.84638C14.3952 8.36715 14.2999 8.02705 14.1093 7.82609C13.9187 7.62512 13.5757 7.52464 13.0801 7.52464C12.5541 7.52464 12.1996 7.63672 12.0167 7.86087C11.8337 8.08502 11.7422 8.44831 11.7422 8.95072H11.525L11.3992 7.83768H11.7079C11.7613 7.51304 11.8642 7.21159 12.0167 6.93333C12.1691 6.64734 12.394 6.41546 12.6913 6.23768C12.9887 6.05217 13.3774 5.95942 13.8577 5.95942C14.3532 5.95942 14.7573 6.06377 15.0698 6.27246C15.39 6.48116 15.6263 6.75942 15.7788 7.10725C15.9313 7.45507 16.0075 7.84155 16.0075 8.26667H16.1104V11.8841Z" fill="black" />
              <path d="M23.0656 11.8841H21.3503V6.07536H23.0656V11.8841ZM23.0656 5.48406H21.3503V4.11594H23.0656V5.48406Z" fill="black" />
              <path d="M28 11.8841H26.5821C25.9112 11.8841 25.3852 11.7179 25.004 11.3855C24.6229 11.0531 24.4323 10.5198 24.4323 9.78551V4.95072H26.1475V9.58841C26.1475 9.88213 26.2085 10.0792 26.3305 10.1797C26.4601 10.2725 26.6735 10.3188 26.9708 10.3188H28V11.8841ZM28 7.51304H23.5289V6.07536H28V7.51304Z" fill="black" />
            </svg>
          </h1>
          <span className="shell-studio__tag">Design workspace</span>
        </div>
      </header>

      <div className="shell-projects">
        <h2 className="shell-projects__title">
          Projects
          <span className="shell-projects__count">{projects.length}</span>
        </h2>
        <ul className="shell-projects__grid">
          {projects.map((p) => (
            <li key={p.id}>
              <ProjectCard project={p} />
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function ProjectCard({ project }: { project: DiscoveredProject }) {
  const total = project.entries.length;
  const firstEntry = project.entries[0];
  const previewHref = firstEntry?.href ?? "";
  const chrome = project.preset.canvas.chrome;
  const isDesktop = chrome === "desktop";

  return (
    <Link to={`/workspace/${project.id}`} className="shell-project-card">
      <div className="shell-project-card__cover">
        {previewHref && (
          <DesignThumbnail
            href={previewHref}
            embedHref={firstEntry?.embedHref}
            isDesktop={isDesktop}
            icon={project.icon}
          />
        )}
        <span className="shell-project-card__device-badge">
          {isDesktop ? "Desktop" : "Mobile"}
        </span>
      </div>
      <div className="shell-project-card__info">
        <span className="shell-project-card__icon">{project.icon}</span>
        <div className="shell-project-card__text">
          <strong className="shell-project-card__name">{project.name}</strong>
          <p className="shell-project-card__desc">{project.description}</p>
          <span className="shell-project-card__meta">
            {project.groups.length} groups · {total} designs
          </span>
        </div>
      </div>
    </Link>
  );
}

// ─────────────────────────────────────────────
// ProjectDetail — /workspace/:projectId
// 单页画布 + 左侧分组/页面选择
// ─────────────────────────────────────────────

const PROJECT_TOOLS: { id: CanvasTool; icon: string; label: string; shortcut: string }[] = [
  { id: "move", icon: "↖", label: "Select", shortcut: "V" },
  { id: "hand", icon: "✋", label: "Pan canvas", shortcut: "H" },
  { id: "inspect", icon: "📐", label: "Inspect", shortcut: "I" },
  { id: "measure", icon: "📏", label: "Measure", shortcut: "M" },
  { id: "a11y", icon: "♿", label: "A11y", shortcut: "A" },
  { id: "comment", icon: "💬", label: "Comment", shortcut: "C" },
];

export function ProjectDetail() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const project = useProject(projectId);

  if (!project) {
    return (
      <div className="shell-studio">
        <div className="shell-studio__empty">
          Project not found: "{projectId}"
          <br />
          <Link to="/workspace">← Back to Workspace</Link>
        </div>
      </div>
    );
  }

  return <ProjectDetailInner project={project} />;
}

function ProjectDetailInner({ project }: { project: DiscoveredProject }) {
  const groups = useProjectGroups(project.id);
  const [q, setQ] = useState("");
  const [exportOpen, setExportOpen] = useState(false);

  const setProjectId = useCanvasStore((s) => s.setProjectId);
  const selectedHref = useCanvasStore((s) => s.selectedEntryHref);
  const selectEntry = useCanvasStore((s) => s.selectEntry);
  const panelOpen = useCanvasStore(getPanelOpen);
  const pickerPinned = useCanvasStore((s) => s.entryPickerPinned);
  const toggleEntryPickerOpen = useCanvasStore((s) => s.toggleEntryPickerOpen);

  // Hydrate per-project state and pick a default entry if none persisted
  useEffect(() => {
    setProjectId(project.id);
  }, [project.id, setProjectId]);

  useEffect(() => {
    const current = useCanvasStore.getState().selectedEntryHref;
    const stillExists = current && project.entries.some((e) => e.href === current);
    if (!stillExists) {
      const first = project.entries[0];
      selectEntry(first?.href ?? null);
    }
  }, [project.id, project.entries, selectEntry]);

  const selectedEntry = useMemo(() => {
    if (!selectedHref) return null;
    return project.entries.find((e) => e.href === selectedHref) ?? null;
  }, [project.entries, selectedHref]);

  const SelectedComponent = selectedEntry?.component ?? null;
  const caption = selectedEntry
    ? `${groupLabel(groups, selectedEntry.groupId)} · ${selectedEntry.name}`
    : "";

  return (
    <div className="shell-studio shell-studio--canvas">
      <header className="shell-studio__header">
        <div className="shell-studio__header-left">
          <Link to="/workspace" className="shell-pill shell-pill--icon" title="Back to project list">
            <span aria-hidden>←</span>
          </Link>
          {!pickerPinned && (
            <button
              type="button"
              className="shell-pill shell-pill--text"
              data-entry-picker-trigger
              onClick={toggleEntryPickerOpen}
              title="Switch page"
            >
              <span aria-hidden>≡</span> Pages
            </button>
          )}
          <div className="shell-pill shell-pill--combobox" title={project.description}>
            <span className="shell-pill__icon-bubble" aria-hidden>{project.icon}</span>
            <span className="shell-pill__text">{project.name}</span>
            <span className="shell-pill__caret" aria-hidden>▾</span>
          </div>
        </div>

        <div className="shell-studio__header-spacer" />

        <div className="shell-studio__header-right">
          <Link
            to={`/workspace/${project.id}/settings`}
            className="shell-pill shell-pill--icon"
            title="Project Settings: access / members / delete"
            aria-label="Project Settings"
          >
            <span aria-hidden>⚙</span>
          </Link>
          <Link
            to={`/workspace/${project.id}/library`}
            className="shell-pill shell-pill--icon"
            title="Library: Skills · Patterns · PRDs"
            aria-label="Library"
          >
            <span aria-hidden>📚</span>
          </Link>
          <Link
            to={`/workspace/${project.id}/theme-editor`}
            className="shell-pill shell-pill--icon"
            title="Open full-screen Theme Editor"
            aria-label="Theme Editor"
          >
            <span aria-hidden>🎨</span>
          </Link>
          <button
            type="button"
            className="shell-pill shell-pill--text"
            onClick={() => setExportOpen(true)}
          >
            <span aria-hidden>↗</span> Export to Figma
          </button>
        </div>
      </header>

      {exportOpen && (
        <ExportFigmaDialog
          project={project}
          onClose={() => setExportOpen(false)}
        />
      )}

      <div className="canvas-root">
        <SinglePageCanvas
          Component={SelectedComponent}
          caption={caption}
          frameWidth={project.preset.canvas.default.width}
          frameHeight={project.preset.canvas.default.height}
        />
        <ToolRail tools={PROJECT_TOOLS} />
        <EntryPicker groups={groups} q={q} setQ={setQ} />
        {panelOpen && <RightPanel />}
      </div>

      <InspectOverlay />
    </div>
  );
}

function groupLabel(groups: { id: string; label: string }[], id: string): string {
  return groups.find((g) => g.id === id)?.label ?? id;
}

// ─────────────────────────────────────────────
// 向后兼容 export
// ─────────────────────────────────────────────
export function StudioIndex() {
  return <ProjectsHome />;
}
