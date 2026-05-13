/**
 * BootstrapBanner — Library 页顶部入口
 *
 * 让用户从 0 启动一个项目的视觉主题。两条路径：
 *   1. 粘贴 Figma URL → Copy Claude prompt → 在 Claude Code 里执行
 *      /bootstrap-from-figma skill，结果写回 `.omit/bootstrap.json`，
 *      banner 检测到后弹出 Apply 预览。
 *   2. 没链接：从 8 个内置 palette 直接选一个，立即 import 到 theme-editor。
 *
 * 已经 import 过的项目：banner 折叠成单行 "Imported · [Reopen]"。
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ChevronDown, ChevronUp, X } from "lucide-react";
import { useLibraryStore } from "./libraryStore";
import { useProject } from "../registry";
import { useThemeStore, type ThemeBaseline } from "../theme-editor/store";
import { BUILT_IN_PALETTES, type BuiltInPalette } from "../theme-editor/palettes";
import { useCanvasStore } from "../shell/canvas/canvasStore";
import type { BootstrapPayload } from "./api";

interface BootstrapBannerProps {
  projectId: string;
}

const FIGMA_URL_RE = /^https?:\/\/(www\.)?figma\.com\/(design|file|board|make|slides)\//i;

export function BootstrapBanner({ projectId }: BootstrapBannerProps) {
  const project = useProject(projectId);
  const bootstrap = useLibraryStore((s) => s.bootstrap);
  const loadBootstrap = useLibraryStore((s) => s.loadBootstrap);
  const clearBootstrap = useLibraryStore((s) => s.clearBootstrap);

  const switchPreset = useThemeStore((s) => s.switchPreset);
  const active = useThemeStore((s) => s.active);
  const hasUnpublishedChanges = useThemeStore((s) => s.hasUnpublishedChanges());

  const navigate = useNavigate();
  const [url, setUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [applyMsg, setApplyMsg] = useState<string | null>(null);

  // 算出当前 project 的 ThemeBaseline（与 ThemePanel 同款）
  const baseline = useMemo<ThemeBaseline | null>(() => {
    if (!project) return null;
    const preset = project.preset;
    return {
      presetName: preset.name,
      values: {
        colors: { ...preset.themeBaseline.colors },
        spacing: { ...preset.themeBaseline.spacing },
      },
      tokenPrefixes: preset.tokenPrefixes,
      semanticColors: preset.semanticColors,
      cssScope: preset.cssScope,
    };
  }, [project]);

  // 首次挂载读 bootstrap.json；轮询不做（用户点 Refresh）
  useEffect(() => {
    void loadBootstrap();
  }, [loadBootstrap]);

  // 没有 bootstrap 且 theme 已经被人改过 → 默认折叠
  useEffect(() => {
    if (!bootstrap && hasUnpublishedChanges) setCollapsed(true);
  }, [bootstrap, hasUnpublishedChanges]);

  if (!project || !baseline) return null;

  const urlValid = FIGMA_URL_RE.test(url.trim());

  const ensureActivePreset = () => {
    if (!active || active.baseline.presetName !== baseline.presetName) {
      switchPreset(baseline);
    }
  };

  const copyFigmaPrompt = async () => {
    const trimmed = url.trim();
    if (!FIGMA_URL_RE.test(trimmed)) return;
    const endpoint = `${window.location.origin}/__omit/bootstrap`;
    const prompt = buildFigmaPrompt(trimmed, baseline.presetName, endpoint);
    try {
      await navigator.clipboard.writeText(prompt);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.alert("Clipboard write blocked. Copy manually:\n\n" + prompt);
    }
  };

  const applyPalette = (palette: BuiltInPalette) => {
    ensureActivePreset();
    // switchPreset 是同步 set，下一行可以直接调
    const result = useThemeStore.getState().importTheme(palette.values);
    setApplyMsg(
      `已应用 "${palette.name}" 主题 · ${result.appliedColors.length} 个颜色 token`,
    );
    setTimeout(() => setApplyMsg(null), 3000);
    navigate(`/workspace/${projectId}`);
    useCanvasStore.getState().setTool("theme");
  };

  const applyBootstrap = (payload: BootstrapPayload) => {
    ensureActivePreset();
    const result = useThemeStore.getState().importTheme({
      colors: payload.theme.colors,
      spacing: payload.theme.spacing,
    });
    const parts = [
      `应用 ${result.appliedColors.length} 个颜色`,
      result.appliedSpacing.length > 0
        ? `${result.appliedSpacing.length} 个 spacing`
        : "",
      result.unknownColors.length + result.unknownSpacing.length > 0
        ? `跳过 ${result.unknownColors.length + result.unknownSpacing.length} 个未知 key`
        : "",
    ].filter(Boolean);
    setApplyMsg(parts.join(" · "));
    setTimeout(() => setApplyMsg(null), 3000);
    navigate(`/workspace/${projectId}`);
    useCanvasStore.getState().setTool("theme");
  };

  // ── 折叠态 ─────────────────────────────────────
  if (collapsed) {
    return (
      <div className="boot-banner boot-banner--collapsed">
        <span>
          Theme bootstrap{" "}
          {bootstrap
            ? `· imported from ${bootstrap.source.kind} · ${formatExtractedAt(bootstrap.extractedAt)}`
            : "· theme has local changes"}
        </span>
        <button
          className="lib-btn lib-btn--ghost"
          onClick={() => setCollapsed(false)}
        >
          <ChevronDown size={14} aria-hidden /> Reopen
        </button>
      </div>
    );
  }

  // ── Bootstrap 已就绪（待 Apply）────────────────
  if (bootstrap) {
    const colorCount = Object.keys(bootstrap.theme.colors).length;
    const spacingCount = Object.keys(bootstrap.theme.spacing ?? {}).length;
    const previewColors = Object.values(bootstrap.theme.colors).slice(0, 6);
    return (
      <div className="boot-banner boot-banner--ready">
        <div className="boot-banner__head">
          <strong>Figma 主题已抓取完成</strong>
          <span className="boot-banner__meta">
            {bootstrap.source.url ?? bootstrap.source.kind} ·{" "}
            {formatExtractedAt(bootstrap.extractedAt)}
          </span>
          <button
            className="boot-banner__close"
            onClick={() => setCollapsed(true)}
            aria-label="Collapse"
            title="Collapse"
          >
            <ChevronUp size={14} aria-hidden />
          </button>
        </div>
        <div className="boot-banner__body">
          <div className="boot-banner__swatches">
            {previewColors.map((c, i) => (
              <span
                key={i}
                className="boot-swatch"
                style={{ background: c }}
                title={c}
              />
            ))}
          </div>
          <div className="boot-banner__counts">
            {colorCount} 个颜色
            {spacingCount > 0 ? ` · ${spacingCount} 个 spacing` : ""}
          </div>
          {bootstrap.notes && (
            <div className="boot-banner__notes">{bootstrap.notes}</div>
          )}
          <div className="boot-banner__actions">
            <button
              className="lib-btn lib-btn--accent"
              onClick={() => applyBootstrap(bootstrap)}
            >
              Apply to theme
            </button>
            <button
              className="lib-btn lib-btn--ghost"
              onClick={() => void loadBootstrap()}
            >
              Refresh
            </button>
            <button
              className="lib-btn lib-btn--ghost"
              onClick={() => void clearBootstrap()}
              title="Discard this import"
            >
              <X size={12} aria-hidden /> Discard
            </button>
          </div>
        </div>
        {applyMsg && <div className="boot-banner__toast">{applyMsg}</div>}
      </div>
    );
  }

  // ── 初始态：Figma URL 输入 + palette grid ──────
  return (
    <div className="boot-banner">
      <div className="boot-banner__head">
        <strong>Bootstrap from Figma</strong>
        <span className="boot-banner__meta">
          粘贴 Figma 链接让 AI 提取视觉主题 + 候选 patterns
        </span>
        <button
          className="boot-banner__close"
          onClick={() => setCollapsed(true)}
          aria-label="Collapse"
          title="Collapse"
        >
          <ChevronUp size={14} aria-hidden />
        </button>
      </div>

      <div className="boot-banner__row">
        <input
          type="url"
          className="boot-banner__url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://figma.com/design/..."
          spellCheck={false}
        />
        <button
          className="lib-btn lib-btn--accent"
          onClick={() => void copyFigmaPrompt()}
          disabled={!urlValid}
          title={
            urlValid ? "Copy a Claude Code prompt" : "Paste a figma.com URL first"
          }
        >
          {copied ? (
            <>
              <Check size={14} aria-hidden /> Copied
            </>
          ) : (
            "Copy Claude prompt"
          )}
        </button>
        <button
          className="lib-btn lib-btn--ghost"
          onClick={() => void loadBootstrap()}
          title="Re-check .omit/bootstrap.json"
        >
          Refresh
        </button>
      </div>
      <p className="boot-banner__hint">
        把 prompt 粘到 Claude Code 执行：会调用 Figma MCP 抓取设计 token，写入项目根的
        <code> .omit/bootstrap.json</code>。完成后这里会自动出现 Apply 按钮。
      </p>

      <div className="boot-banner__divider">
        <span>Or start from a palette</span>
      </div>
      <div className="boot-palette-grid">
        {BUILT_IN_PALETTES.map((p) => (
          <button
            key={p.id}
            className="boot-palette"
            onClick={() => applyPalette(p)}
            title={p.description}
          >
            <div className="boot-palette__swatches">
              {p.preview.map((c) => (
                <span
                  key={c}
                  className="boot-palette__swatch"
                  style={{ background: c }}
                />
              ))}
            </div>
            <div className="boot-palette__name">{p.name}</div>
            <div className="boot-palette__desc">{p.description}</div>
          </button>
        ))}
      </div>

      {applyMsg && <div className="boot-banner__toast">{applyMsg}</div>}
    </div>
  );
}

function buildFigmaPrompt(url: string, presetName: string, endpoint: string): string {
  return [
    `请使用 /bootstrap-from-figma skill 处理以下 Figma 链接，提取视觉主题和候选 patterns：`,
    ``,
    `URL: ${url}`,
    `目标 preset: ${presetName}`,
    `回写端点: ${endpoint}`,
    ``,
    `要点：`,
    `1. 用 Figma MCP（get_metadata / get_variable_defs / get_design_context / get_screenshot）抓取节点信息。`,
    `2. 按 packages/preset-mobile/theme/baseline.ts 的 semanticColors 语义映射 design tokens。`,
    `3. 从 packages/preset-mobile/patterns/* 的 README 中匹配 3-5 个候选 patterns。`,
    `4. 把结果 PUT 到 ${endpoint}，结构见 packages/dev-server/src/handlers/bootstrap.ts 中的 BootstrapPayload。`,
    `5. 完成后告诉我去工作台点 "Apply to theme"。`,
  ].join("\n");
}

function formatExtractedAt(iso: string): string {
  try {
    const d = new Date(iso);
    const now = Date.now();
    const diff = (now - d.getTime()) / 1000;
    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)} min ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} h ago`;
    return d.toLocaleDateString();
  } catch {
    return iso;
  }
}
