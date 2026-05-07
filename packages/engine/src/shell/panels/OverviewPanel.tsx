import { Link, useLocation } from "react-router-dom";
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
        <h4>右侧三个 tab</h4>
        <ul className="shell-overview__list">
          <li>
            <strong>⊕ 概览</strong>
            <span>当前页面 — 项目说明 + 操作引导</span>
          </li>
          <li>
            <strong>📐 标注</strong>
            <span>切到此 tab 自动启用 Inspect。在画布上 hover/点击元素，查看 token、计算样式、Web/Android 等价代码</span>
          </li>
          <li>
            <strong>🎨 主题</strong>
            <span>实时改 token，"应用"写入 localStorage 全局生效；"发布"导出 CSS 让你 commit 到仓库（仅移动端 preset 当前可用，桌面端等 M2 manifest）</span>
          </li>
        </ul>
      </section>

      <section>
        <h4>键盘</h4>
        <ul className="shell-overview__list">
          <li><kbd>← →</kbd><span>选中后跳兄弟元素</span></li>
          <li><kbd>↑ ↓</kbd><span>跳父元素 / 第一个子元素</span></li>
          <li><kbd>Esc</kbd><span>取消选中</span></li>
        </ul>
      </section>

      <section>
        <h4>添加新设计稿</h4>
        <ol className="shell-overview__list shell-overview__list--ordered">
          <li>编辑 <code>{project.id}/registry.ts</code> 加一条 entry</li>
          <li>编辑 <code>src/App.tsx</code> 在 <code>DesignsRoot</code> 加 <code>&lt;Route&gt;</code></li>
          <li>新建 page 文件，第一行写 <code>// @pattern: xxx</code></li>
        </ol>
        <p className="muted small">或让 AI 跑 <code>.claude/skills/new-design</code> 自动化以上步骤。</p>
      </section>

      <section>
        <Link to="/workspace" className="shell-overview__link">← 返回 Workspace</Link>
      </section>
    </div>
  );
}
