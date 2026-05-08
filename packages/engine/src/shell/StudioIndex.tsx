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
          <span className="shell-studio__logo">◆</span>
          <h1>omit design</h1>
          <span className="shell-studio__tag">设计稿工作台</span>
        </div>
      </header>

      <div className="shell-projects">
        <h2 className="shell-projects__title">
          项目
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
            {project.groups.length} 个分组 · {total} 张设计稿
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
  { id: "move", icon: "↖", label: "选择", shortcut: "V" },
  { id: "hand", icon: "✋", label: "拖拽画布", shortcut: "H" },
  { id: "inspect", icon: "📐", label: "标注", shortcut: "I" },
  { id: "measure", icon: "📏", label: "测距", shortcut: "M" },
  { id: "a11y", icon: "♿", label: "无障碍", shortcut: "A" },
  { id: "comment", icon: "💬", label: "评论", shortcut: "C" },
];

export function ProjectDetail() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const project = useProject(projectId);

  if (!project) {
    return (
      <div className="shell-studio">
        <div className="shell-studio__empty">
          找不到项目「{projectId}」
          <br />
          <Link to="/workspace">← 返回 Workspace</Link>
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
          <Link to="/workspace" className="shell-pill shell-pill--icon" title="返回项目列表">
            <span aria-hidden>←</span>
          </Link>
          {!pickerPinned && (
            <button
              type="button"
              className="shell-pill shell-pill--text"
              data-entry-picker-trigger
              onClick={toggleEntryPickerOpen}
              title="切换页面"
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
            title="项目设置：访问范围 / 成员 / 删除"
            aria-label="项目设置"
          >
            <span aria-hidden>⚙</span>
          </Link>
          <Link
            to={`/workspace/${project.id}/theme-editor`}
            className="shell-pill shell-pill--icon"
            title="打开全屏主题编辑器"
            aria-label="主题编辑"
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
