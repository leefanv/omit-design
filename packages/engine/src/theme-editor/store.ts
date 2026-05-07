import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { PresetManifest } from "../preset";

export interface ThemeValues {
  colors: Record<string, string>;
  spacing: Record<string, string>;
}

/** Preset 提供的 baseline + 编辑器需要的元信息（从 manifest 拿） */
export interface ThemeBaseline {
  presetName: string;
  /** 已发布基线 —— 等同 variables.css 当前值 */
  values: ThemeValues;
  /** Token 前缀，用于 buildCssText / applyToRoot */
  tokenPrefixes: PresetManifest["tokenPrefixes"];
  /** 这个 preset 在编辑器里要列的语义色 key 列表（manifest.semanticColors） */
  semanticColors: readonly string[];
  /**
   * CSS scope class（来自 manifest.cssScope，如 "gp-scope"）。
   * 设置后 applyToDocument 还会把 token 写到所有 .{cssScope} 元素，
   * 让 catalog WYSIWYG 预览能正确响应 token 变化。
   */
  cssScope?: string;
}

/**
 * 当前 active preset 的快照 —— ThemePanel 在 useEffect 里调 switchPreset 写入。
 * 没切过的 preset 时为 null（ThemePanel 渲染骨架）。
 */
interface ActiveSlice {
  baseline: ThemeBaseline;
  /** 当前 preset 在用的 applied（从 appliedByPreset 拷贝出来） */
  applied: ThemeValues;
  /** 当前 preset 的草稿（不持久化） */
  draft: ThemeValues;
}

interface ThemeState {
  /** 每个 preset 的 applied 值都持久化（`appliedByPreset[preset.name]`） */
  appliedByPreset: Record<string, ThemeValues>;

  /** 当前 preset 切到哪个 —— null 表示尚未 switchPreset */
  active: ActiveSlice | null;

  /** ThemePanel 在 location 变更时调一次：切换到新 preset 的视图 */
  switchPreset: (baseline: ThemeBaseline) => void;

  setDraftColor: (key: string, value: string) => void;
  setDraftSpacing: (key: string, value: string) => void;

  /** 草稿 → applied，写入 localStorage，全局生效。 */
  apply: () => void;
  /** 草稿回滚到 applied。 */
  discardDraft: () => void;
  /** 当前 preset 的 applied 回滚到 baseline。 */
  resetToPublished: () => void;
  /** 下载当前 preset 的 variables.css。 */
  publish: () => Promise<boolean>;

  hasUnappliedDraft: () => boolean;
  hasUnpublishedChanges: () => boolean;
}

/** 把 ThemeValues 写到目标 element 的 :root 上 —— 直接用 prefix + key 拼 cssVar */
function applyToRoot(root: HTMLElement, baseline: ThemeBaseline, values: ThemeValues) {
  const colorPrefix = baseline.tokenPrefixes.color;
  const spacingPrefix = baseline.tokenPrefixes.spacing;
  for (const [k, v] of Object.entries(values.colors)) {
    root.style.setProperty(`${colorPrefix}${k}`, v);
  }
  for (const [k, v] of Object.entries(values.spacing)) {
    root.style.setProperty(`${spacingPrefix}${k}`, v);
  }
}

function applyToDocument(baseline: ThemeBaseline, values: ThemeValues) {
  applyToRoot(document.documentElement, baseline, values);

  // Scoped presets（gp-scope / ga-scope）：把 token 也写到文档内所有 scope 元素上，
  // 让 catalog WYSIWYG 预览区域能正确响应 draft token 变化。
  if (baseline.cssScope) {
    document.querySelectorAll<HTMLElement>(`.${baseline.cssScope}`).forEach((el) => {
      applyToRoot(el, baseline, values);
    });
  }

  // 同源 iframe 也要同步（Studio split 预览模式）
  document.querySelectorAll("iframe").forEach((iframe) => {
    try {
      const doc = (iframe as HTMLIFrameElement).contentDocument;
      if (doc?.documentElement) applyToRoot(doc.documentElement, baseline, values);
    } catch {
      /* cross-origin, ignore */
    }
  });
}

/** 给外部（iframe onLoad）用的：把当前 draft 回填到目标 iframe */
export function syncCurrentDraftToFrame(iframe: HTMLIFrameElement) {
  const active = useThemeStore.getState().active;
  if (!active) return;
  try {
    const doc = iframe.contentDocument;
    if (doc?.documentElement) applyToRoot(doc.documentElement, active.baseline, active.draft);
  } catch {
    /* ignore */
  }
}

function valuesEqual(a: ThemeValues, b: ThemeValues): boolean {
  const keys: Array<keyof ThemeValues> = ["colors", "spacing"];
  for (const k of keys) {
    const A = a[k];
    const B = b[k];
    const allKeys = new Set([...Object.keys(A), ...Object.keys(B)]);
    for (const key of allKeys) {
      if (A[key] !== B[key]) return false;
    }
  }
  return true;
}

function buildCssText(baseline: ThemeBaseline, values: ThemeValues): string {
  const colorPrefix = baseline.tokenPrefixes.color;
  const spacingPrefix = baseline.tokenPrefixes.spacing;
  const lines = [
    `/* Exported from Theme Editor — preset: ${baseline.presetName} */`,
    "/* 覆盖到对应 preset 的 variables.css 后 git commit。 */",
    "",
    ":root {",
  ];
  for (const [k, v] of Object.entries(values.colors)) {
    lines.push(`  ${colorPrefix}${k}: ${v};`);
  }
  for (const [k, v] of Object.entries(values.spacing)) {
    lines.push(`  ${spacingPrefix}${k}: ${v};`);
  }
  lines.push("}");
  lines.push("");
  return lines.join("\n");
}

function cloneValues(v: ThemeValues): ThemeValues {
  return { colors: { ...v.colors }, spacing: { ...v.spacing } };
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      appliedByPreset: {},
      active: null,

      switchPreset: (baseline) => {
        const map = get().appliedByPreset;
        const persistedApplied = map[baseline.presetName];
        const applied = persistedApplied
          ? cloneValues(persistedApplied)
          : cloneValues(baseline.values);
        const draft = cloneValues(applied);
        set({ active: { baseline, applied, draft } });
        applyToDocument(baseline, applied);
      },

      setDraftColor: (key, value) => {
        const a = get().active;
        if (!a) return;
        const next = { ...a.draft, colors: { ...a.draft.colors, [key]: value } };
        set({ active: { ...a, draft: next } });
        applyToDocument(a.baseline, next);
      },
      setDraftSpacing: (key, value) => {
        const a = get().active;
        if (!a) return;
        const next = { ...a.draft, spacing: { ...a.draft.spacing, [key]: value } };
        set({ active: { ...a, draft: next } });
        applyToDocument(a.baseline, next);
      },

      apply: () => {
        const a = get().active;
        if (!a) return;
        const snapshot = cloneValues(a.draft);
        set({
          active: { ...a, applied: snapshot },
          appliedByPreset: {
            ...get().appliedByPreset,
            [a.baseline.presetName]: snapshot,
          },
        });
        applyToDocument(a.baseline, snapshot);
      },

      discardDraft: () => {
        const a = get().active;
        if (!a) return;
        const restored = cloneValues(a.applied);
        set({ active: { ...a, draft: restored } });
        applyToDocument(a.baseline, restored);
      },

      resetToPublished: () => {
        const a = get().active;
        if (!a) return;
        const restored = cloneValues(a.baseline.values);
        const map = { ...get().appliedByPreset };
        delete map[a.baseline.presetName];
        set({
          active: { ...a, applied: restored, draft: cloneValues(restored) },
          appliedByPreset: map,
        });
        applyToDocument(a.baseline, restored);
      },

      publish: async () => {
        const a = get().active;
        if (!a) return false;
        const ok = window.confirm(
          [
            `确认发布 "${a.baseline.presetName}" 主题？`,
            "",
            "将下载 variables.css。请用它覆盖该 preset 的 theme/variables.css，",
            "然后 git commit。",
            "",
            "（这一步会让所有研发与设计师在下次拉代码后看到新主题。）",
          ].join("\n")
        );
        if (!ok) return false;
        const css = buildCssText(a.baseline, a.applied);
        const blob = new Blob([css], { type: "text/css" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `variables.css`;
        link.click();
        URL.revokeObjectURL(url);
        return true;
      },

      hasUnappliedDraft: () => {
        const a = get().active;
        return !!a && !valuesEqual(a.draft, a.applied);
      },
      hasUnpublishedChanges: () => {
        const a = get().active;
        return !!a && !valuesEqual(a.applied, a.baseline.values);
      },
    }),
    {
      name: "omit-engine-theme",
      // M2: 状态结构从 single-preset { applied, draft } 升到 multi-preset
      // { appliedByPreset, active }。老存档读不出来，直接清。
      version: 4,
      migrate: () => ({ appliedByPreset: {} }),
      // 只持久化 appliedByPreset；active 是 React-driven，draft 不持久化
      partialize: (s) => ({ appliedByPreset: s.appliedByPreset }),
    }
  )
);
