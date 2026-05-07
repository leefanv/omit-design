import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import {
  useProjects,
  useProjectGroups,
  useProject,
  type DesignEntry,
  type DesignGroup,
  type DiscoveredProject,
} from "../registry";
import { ExportFigmaDialog } from "../capture/ExportFigmaDialog";
import { DesignThumbnail } from "./DesignThumbnail";

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
// ─────────────────────────────────────────────

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
  // Group entries 是 useProjectGroups 算出来的 ——保留 group meta + 该 group 的 entries
  const groups = useProjectGroups(project.id);
  const total = project.entries.length;
  const [q, setQ] = useState("");
  const [exportOpen, setExportOpen] = useState(false);
  const [activeGroup, setActiveGroup] = useState<string>(groups[0]?.id ?? "");

  const visibleGroups = useMemo<DesignGroup[]>(() => {
    const term = q.trim().toLowerCase();
    if (!term) return groups;
    return groups
      .map((g) => ({
        ...g,
        entries: g.entries.filter((e) => matches(e, term)),
      }))
      .filter((g) => g.entries.length > 0);
  }, [q, groups]);

  const visibleTotal = useMemo(
    () => visibleGroups.reduce((sum, g) => sum + g.entries.length, 0),
    [visibleGroups]
  );

  useEffect(() => {
    const ids = visibleGroups.map((g) => `group-${g.id}`);
    const els = ids
      .map((id) => document.getElementById(id))
      .filter((x): x is HTMLElement => !!x);
    if (els.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible.length > 0) {
          const id = visible[0].target.id.replace(/^group-/, "");
          setActiveGroup(id);
        }
      },
      { rootMargin: "-40% 0px -50% 0px", threshold: 0 }
    );
    els.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [visibleGroups]);

  return (
    <div className="shell-studio">
      <header className="shell-studio__header">
        <div className="shell-studio__brand">
          <Link to="/workspace" className="shell-studio__back">
            <span className="shell-studio__logo">◆</span>
          </Link>
          <span className="shell-studio__project-icon">{project.icon}</span>
          <h1>{project.name}</h1>
          <span className="shell-studio__tag">{project.description}</span>
        </div>

        <div className="shell-studio__search">
          <span className="shell-studio__search-icon" aria-hidden>🔍</span>
          <input
            type="search"
            value={q}
            placeholder="搜索稿名 / 路由 / pattern…"
            onChange={(e) => setQ(e.target.value)}
            autoFocus
          />
          {q && (
            <button
              type="button"
              className="shell-studio__search-clear"
              onClick={() => setQ("")}
              aria-label="清空搜索"
            >
              ×
            </button>
          )}
          <kbd className="shell-studio__search-kbd">{visibleTotal}/{total}</kbd>
        </div>

        <Link
          to={`/workspace/${project.id}/settings`}
          className="shell-studio__action"
          title="项目设置：访问范围 / 成员 / 删除"
        >
          <span aria-hidden>⚙</span> 项目设置
        </Link>
        <Link
          to={`/workspace/${project.id}/theme-editor`}
          className="shell-studio__action"
          title="打开全屏主题编辑器 — 所见即所得调整 token，发布后更新全部页面"
        >
          <span aria-hidden>🎨</span> 主题编辑器
        </Link>
        <button
          type="button"
          className="shell-studio__action"
          onClick={() => setExportOpen(true)}
        >
          <span aria-hidden>↗</span> 导出到 Figma
        </button>
      </header>

      {exportOpen && (
        <ExportFigmaDialog
          project={project}
          onClose={() => setExportOpen(false)}
        />
      )}

      <div className="shell-studio__layout">
        <aside className="shell-studio__toc" aria-label="分组目录">
          <div className="shell-studio__toc-head">
            <span>分组</span>
            <span className="shell-studio__toc-count">{total}</span>
          </div>
          <ul>
            {groups.map((g) => {
              const visibleEntries =
                visibleGroups.find((v) => v.id === g.id)?.entries.length ?? 0;
              const isMuted = q.trim().length > 0 && visibleEntries === 0;
              return (
                <li key={g.id}>
                  <a
                    href={`#group-${g.id}`}
                    className={[
                      "shell-studio__toc-item",
                      activeGroup === g.id ? "shell-studio__toc-item--active" : "",
                      isMuted ? "shell-studio__toc-item--muted" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    onClick={(e) => {
                      e.preventDefault();
                      document.getElementById(`group-${g.id}`)?.scrollIntoView({
                        behavior: "smooth",
                        block: "start",
                      });
                    }}
                  >
                    {g.icon && (
                      <span className="shell-studio__toc-icon">{g.icon}</span>
                    )}
                    <span className="shell-studio__toc-label">{g.label}</span>
                    <span className="shell-studio__toc-badge">
                      {q.trim().length > 0
                        ? `${visibleEntries}/${g.entries.length}`
                        : g.entries.length}
                    </span>
                  </a>
                </li>
              );
            })}
          </ul>
        </aside>

        <main className="shell-studio__main">
          {visibleGroups.length === 0 ? (
            <div className="shell-studio__empty">
              没有匹配"{q}"的稿。
            </div>
          ) : (
            visibleGroups.map((g) => (
              <section
                key={g.id}
                id={`group-${g.id}`}
                className="shell-studio__group"
              >
                <h3 className="shell-studio__group-head">
                  {g.icon && (
                    <span className="shell-studio__group-icon">{g.icon}</span>
                  )}
                  {g.label}
                  <span className="shell-studio__group-count">
                    {g.entries.length}
                  </span>
                </h3>
                <ul className="shell-studio__grid">
                  {g.entries.map((d) => {
                    const isDesktop = project.preset.canvas.chrome === "desktop";
                    return (
                    <li
                      key={d.href}
                      className={
                        "shell-studio__card" +
                        (isDesktop ? " shell-studio__card--desktop" : "")
                      }
                    >
                      <Link to={d.href}>
                        <div
                          className={
                            "shell-studio__thumb" +
                            (isDesktop ? " shell-studio__thumb--desktop" : "")
                          }
                        >
                          <DesignThumbnail
                            href={d.href}
                            embedHref={d.embedHref}
                            isDesktop={isDesktop}
                            icon={g.icon}
                          />
                          {d.source === "prd" && (
                            <span className="shell-studio__source shell-studio__source--prd">
                              来自 PRD
                            </span>
                          )}
                        </div>
                        <div className="shell-studio__meta">
                          <div className="shell-studio__meta-top">
                            <strong>
                              {g.label} · {d.name}
                            </strong>
                            <span className="shell-studio__pattern">
                              @{d.pattern}
                            </span>
                          </div>
                          {d.description && <p>{d.description}</p>}
                        </div>
                      </Link>
                    </li>
                    );
                  })}
                </ul>
              </section>
            ))
          )}
        </main>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// 向后兼容 export（防止旧引用）
// ─────────────────────────────────────────────
export function StudioIndex() {
  return <ProjectsHome />;
}

function matches(e: DesignEntry, term: string): boolean {
  const hay =
    `${e.name} ${e.href} ${e.pattern} ${e.description ?? ""} ${e.source ?? ""}`.toLowerCase();
  return hay.includes(term);
}
