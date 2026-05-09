/**
 * LibraryPage — 全屏 Library 工作台
 *
 * 路由：/workspace/:projectId/library
 *
 * 三个 tab：Skills / Patterns / PRDs。读写都通过 fetch /__omit/*，
 * 由用户项目 vite.config 注册的 @omit-design/dev-server Vite 插件提供文件 IO。
 */

import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ChevronRight, X } from "lucide-react";
import { useProject, useProjects } from "../registry";
import { useLibraryStore } from "./libraryStore";
import { SkillsPanel } from "./panels/SkillsPanel";
import { PatternsPanel } from "./panels/PatternsPanel";
import { PrdsPanel } from "./panels/PrdsPanel";
import "./library.css";

type Tab = "skills" | "patterns" | "prds";

export function LibraryPage() {
  const { projectId = "" } = useParams<{ projectId: string }>();
  const project = useProject(projectId);
  const all = useProjects();
  const resolved = project ?? all[0];

  const [tab, setTab] = useState<Tab>("skills");
  const loadIndex = useLibraryStore((s) => s.loadIndex);
  const loadPresetData = useLibraryStore((s) => s.loadPresetData);
  const clearSelection = useLibraryStore((s) => s.clearSelection);
  const error = useLibraryStore((s) => s.error);
  const loading = useLibraryStore((s) => s.loading);
  const index = useLibraryStore((s) => s.index);

  useEffect(() => {
    void loadIndex();
    void loadPresetData();
  }, [loadIndex, loadPresetData]);

  // 切 tab 时清当前选中（避免把 skill draft 带到 pattern 面板里）
  useEffect(() => {
    clearSelection();
  }, [tab, clearSelection]);

  if (!resolved) {
    return (
      <div className="lib-page">
        <div className="lib-empty lib-empty--center">No projects discovered.</div>
      </div>
    );
  }

  return (
    <div className="lib-page">
      <header className="lib-header">
        <Link to={`/workspace/${resolved.id}`} className="lib-header__back">
          <ArrowLeft size={14} aria-hidden /> {resolved.icon} {resolved.name}
        </Link>
        <ChevronRight size={14} className="lib-header__sep" aria-hidden />
        <span className="lib-header__title">Library</span>
        <nav className="lib-header__tabs">
          <TabButton id="skills" active={tab} onClick={setTab} count={index?.skills.length ?? 0}>
            Skills
          </TabButton>
          <TabButton id="patterns" active={tab} onClick={setTab} count={index?.patterns.length ?? 0}>
            Patterns
          </TabButton>
          <TabButton id="prds" active={tab} onClick={setTab} count={index?.prds.length ?? 0}>
            PRDs
          </TabButton>
        </nav>
        <div className="lib-header__spacer" />
        {loading && <span className="lib-pill lib-pill--info">Loading…</span>}
        {error && <span className="lib-pill lib-pill--danger" title={error}>! Error</span>}
      </header>
      <div className="lib-body">
        {tab === "skills" && <SkillsPanel />}
        {tab === "patterns" && <PatternsPanel />}
        {tab === "prds" && <PrdsPanel />}
      </div>
      {error && (
        <div className="lib-error">
          {error}
          <button onClick={() => useLibraryStore.setState({ error: null })} aria-label="Dismiss error"><X size={14} aria-hidden /></button>
        </div>
      )}
    </div>
  );
}

function TabButton({
  id,
  active,
  onClick,
  count,
  children,
}: {
  id: Tab;
  active: Tab;
  onClick: (id: Tab) => void;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <button
      className={`lib-tab ${active === id ? "lib-tab--active" : ""}`}
      onClick={() => onClick(id)}
    >
      {children}
      <span className="lib-tab__count">{count}</span>
    </button>
  );
}
