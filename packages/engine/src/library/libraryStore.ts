/**
 * Library store — Zustand
 *
 * 三个面板（Skills / Patterns / PRDs）共用一个数据层：
 *   - index：从 /__omit/library 拉到的列表，弱类型缓存
 *   - selected：当前选中的条目 (kind + id)
 *   - draft / saved：编辑器双副本，沿用 theme-editor 的心智
 */

import { create } from "zustand";
import {
  api,
  type BootstrapPayload,
  type LibraryIndex,
  type PatternDetail,
} from "./api";

export type Kind = "skill" | "pattern" | "prd";

export interface Selection {
  kind: Kind;
  id: string;
}

interface DraftEnvelope {
  kind: Kind;
  id: string;
  // skill / prd → string; pattern → PatternDetail
  saved: string | PatternDetail;
  draft: string | PatternDetail;
}

interface LibraryState {
  index: LibraryIndex | null;
  presetComponents: string[];
  loading: boolean;
  error: string | null;

  selected: Selection | null;
  envelope: DraftEnvelope | null;

  /**
   * BootstrapBanner 流：Claude Code 用 /bootstrap-from-figma skill 把视觉主题抓取
   * 结果 PUT 到 dev-server，落 `.omit/bootstrap.json`。bootstrap 仅承载 colors +
   * spacing tokens；patterns 已与 Figma 解耦，统一走 /distill-patterns-from-prd
   * 或 /add-pattern 产出。
   */
  bootstrap: BootstrapPayload | null;

  loadIndex: () => Promise<void>;
  loadPresetData: () => Promise<void>;
  loadBootstrap: () => Promise<void>;
  clearBootstrap: () => Promise<void>;
  select: (kind: Kind, id: string) => Promise<void>;
  clearSelection: () => void;
  updateDraft: (next: string | PatternDetail) => void;
  save: () => Promise<void>;
  remove: () => Promise<void>;
  createSkill: (id: string) => Promise<void>;
  createPattern: (id: string, seed?: PatternDetail) => Promise<void>;
  createPrd: (id: string) => Promise<void>;
}

const SKILL_STARTER = (id: string) => `---
name: ${id}
description: TODO — one-line trigger description for ${id}.
---

# ${id}

## When to trigger

- TODO

## Execution flow

- TODO
`;

const PRD_STARTER = (id: string) => `---
title: ${id}
pattern: list-view
target: design/${id}/index.tsx
status: draft
---

# ${id}

## Goal

TODO

## Screens

- TODO

## Data

- TODO
`;

const PATTERN_STARTER = (id: string): PatternDetail => ({
  config: {
    name: id,
    whitelist: [],
    description: `Custom pattern: ${id}`,
  },
  template: `// @pattern: ${id}
export const meta = {
  name: "TODO",
  pattern: "${id}",
  description: "TODO",
  source: "prd",
} as const;
`,
  readme: `# ${id}\n\nTODO — describe when to use this pattern.\n`,
});

export const useLibraryStore = create<LibraryState>((set, get) => ({
  index: null,
  presetComponents: [],
  loading: false,
  error: null,
  selected: null,
  envelope: null,
  bootstrap: null,

  loadBootstrap: async () => {
    try {
      const payload = await api.readBootstrap();
      set({ bootstrap: payload });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  clearBootstrap: async () => {
    try {
      await api.clearBootstrap();
      set({ bootstrap: null });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  loadIndex: async () => {
    set({ loading: true, error: null });
    try {
      const index = await api.index();
      set({ index, loading: false });
    } catch (err) {
      set({ error: (err as Error).message, loading: false });
    }
  },

  loadPresetData: async () => {
    try {
      const components = await api.listPresetComponents();
      set({ presetComponents: components });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  select: async (kind, id) => {
    set({ selected: { kind, id }, envelope: null, error: null });
    try {
      if (kind === "skill") {
        const content = await api.readSkill(id);
        set({ envelope: { kind, id, saved: content, draft: content } });
      } else if (kind === "prd") {
        const content = await api.readPrd(id);
        set({ envelope: { kind, id, saved: content, draft: content } });
      } else {
        const detail = await api.readPattern(id);
        set({ envelope: { kind, id, saved: detail, draft: detail } });
      }
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  clearSelection: () => set({ selected: null, envelope: null }),

  updateDraft: (next) => {
    const env = get().envelope;
    if (!env) return;
    set({ envelope: { ...env, draft: next } });
  },

  save: async () => {
    const env = get().envelope;
    if (!env) return;
    try {
      if (env.kind === "skill") {
        await api.writeSkill(env.id, env.draft as string);
      } else if (env.kind === "prd") {
        await api.writePrd(env.id, env.draft as string);
      } else {
        await api.writePattern(env.id, env.draft as PatternDetail);
      }
      set({ envelope: { ...env, saved: env.draft } });
      await get().loadIndex();
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  remove: async () => {
    const env = get().envelope;
    if (!env) return;
    try {
      if (env.kind === "skill") await api.deleteSkill(env.id);
      else if (env.kind === "prd") await api.deletePrd(env.id);
      else await api.deletePattern(env.id);
      set({ envelope: null, selected: null });
      await get().loadIndex();
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  createSkill: async (id: string) => {
    await api.writeSkill(id, SKILL_STARTER(id));
    await get().loadIndex();
    await get().select("skill", id);
  },

  createPattern: async (id, seed) => {
    await api.writePattern(id, seed ?? PATTERN_STARTER(id));
    await get().loadIndex();
    await get().select("pattern", id);
  },

  createPrd: async (id) => {
    await api.writePrd(id, PRD_STARTER(id));
    await get().loadIndex();
    await get().select("prd", id);
  },
}));
