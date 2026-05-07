import { useEffect, useMemo, useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { useProjects, useProjectByHref, useProjectGroups } from "../registry";

const STORAGE_KEY = "omit-engine-sidebar";

interface PersistedState {
  collapsed: boolean;
  closedGroups: string[];
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw) as PersistedState;
  } catch {
    /* ignore */
  }
  return { collapsed: false, closedGroups: [] };
}

function saveState(state: PersistedState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* ignore */
  }
}

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapsed: () => void;
}

/**
 * Sidebar — DesignFrame 左栏。
 * 只显示**当前路由所属 project** 的 groups（不再混 pos + cafe 全列）。
 * 路由不在任何 project 内时（极少出现，理论上 /designs 立即 redirect 走）
 * 退化成第一个 project（兜底，不空白）。
 */
export function Sidebar({ collapsed, onToggleCollapsed }: SidebarProps) {
  const location = useLocation();
  const allProjects = useProjects();
  const matched = useProjectByHref(location.pathname);
  const project = matched?.project ?? allProjects[0];
  const groups = useProjectGroups(project.id);

  const [closedGroups, setClosedGroups] = useState<Set<string>>(
    () => new Set(loadState().closedGroups)
  );

  useEffect(() => {
    saveState({ collapsed, closedGroups: Array.from(closedGroups) });
  }, [collapsed, closedGroups]);

  // 当前路由属于的 group 自动展开（避免用户点完链接后 group 仍折叠看不到 active）
  useEffect(() => {
    const currentGroup = groups.find((g) =>
      g.entries.some((e) => e.href === location.pathname)
    );
    if (currentGroup && closedGroups.has(currentGroup.id)) {
      setClosedGroups((prev) => {
        const next = new Set(prev);
        next.delete(currentGroup.id);
        return next;
      });
    }
  }, [location.pathname, closedGroups, groups]);

  const totalEntries = useMemo(
    () => groups.reduce((sum, g) => sum + g.entries.length, 0),
    [groups]
  );

  function toggleGroup(id: string) {
    setClosedGroups((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  if (collapsed) {
    return (
      <aside className="shell-sidebar shell-sidebar--collapsed">
        <button className="shell-sidebar__collapse-btn" onClick={onToggleCollapsed} title="展开侧栏" data-no-inspect>
          ›
        </button>
      </aside>
    );
  }

  return (
    <aside className="shell-sidebar" data-no-inspect>
      <header className="shell-sidebar__header">
        <NavLink to={`/workspace/${project.id}`} className="shell-sidebar__brand" title={`返回 ${project.name}`}>
          <span className="shell-sidebar__logo">{project.icon ?? "◆"}</span>
          {project.name}
        </NavLink>
        <button className="shell-sidebar__collapse-btn" onClick={onToggleCollapsed} title="收起侧栏">
          ‹
        </button>
      </header>

      <div className="shell-sidebar__project-meta">
        <span>{groups.length} 组 · {totalEntries} 张稿</span>
        <NavLink to="/workspace" className="shell-sidebar__switch" title="切换项目">切换…</NavLink>
      </div>

      <nav className="shell-sidebar__tree">
        {groups.map((g) => {
          const isOpen = !closedGroups.has(g.id);
          return (
            <div key={g.id} className="shell-sidebar__group">
              <button
                className="shell-sidebar__group-head"
                onClick={() => toggleGroup(g.id)}
                aria-expanded={isOpen}
              >
                <span className={`shell-sidebar__caret ${isOpen ? "shell-sidebar__caret--open" : ""}`}>▸</span>
                {g.icon && <span className="shell-sidebar__group-icon">{g.icon}</span>}
                <span className="shell-sidebar__group-label">{g.label}</span>
                <span className="shell-sidebar__group-count">{g.entries.length}</span>
              </button>
              {isOpen && (
                <ul className="shell-sidebar__entries">
                  {g.entries.map((e) => (
                    <li key={e.href}>
                      <NavLink
                        to={e.href}
                        end
                        className={({ isActive }) =>
                          isActive
                            ? "shell-sidebar__entry active"
                            : "shell-sidebar__entry"
                        }
                      >
                        <span className="shell-sidebar__entry-name">{e.name}</span>
                        <span className="shell-sidebar__entry-pattern">@{e.pattern}</span>
                      </NavLink>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

    </aside>
  );
}
