/**
 * Thin wrappers around `/__omit/*` (served by @omit-design/dev-server).
 * Throws on non-2xx so callers can surface errors in the UI.
 */

const BASE = "/__omit";

export interface SkillSummary {
  id: string;
  name: string;
  description: string;
}

export interface PatternSummary {
  id: string;
  name: string;
  whitelist: string[];
  description: string;
  source: "custom";
}

export interface PrdSummary {
  id: string;
  title: string;
  pattern: string;
  target: string;
  status: string;
}

export interface ImportStartersResult {
  imported: string[];
  skipped: string[];
  source: string | null;
}

export interface LibraryIndex {
  skills: SkillSummary[];
  patterns: PatternSummary[];
  prds: PrdSummary[];
}

export interface PatternConfig {
  name: string;
  whitelist: string[];
  description?: string;
}

export interface PatternDetail {
  config: PatternConfig;
  template: string;
  readme: string;
}

async function req<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}: ${body}`);
  }
  return (await res.json()) as T;
}

export const api = {
  index: () => req<LibraryIndex>("/library"),

  // Skills
  listSkills: () => req<SkillSummary[]>("/skills"),
  readSkill: (id: string) =>
    req<{ content: string }>(`/skills/${encodeURIComponent(id)}`).then((r) => r.content),
  writeSkill: (id: string, content: string) =>
    req<{ ok: true }>(`/skills/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),
  deleteSkill: (id: string) =>
    req<{ ok: true }>(`/skills/${encodeURIComponent(id)}`, { method: "DELETE" }),
  renameSkill: (from: string, to: string) =>
    req<{ ok: true }>(`/skills/rename`, {
      method: "POST",
      body: JSON.stringify({ from, to }),
    }),

  // Patterns
  listPatterns: () => req<PatternSummary[]>("/patterns"),
  listPresetComponents: () => req<string[]>("/preset/components"),
  readPattern: (id: string) =>
    req<PatternDetail>(`/patterns/${encodeURIComponent(id)}`),
  writePattern: (id: string, detail: PatternDetail) =>
    req<{ ok: true }>(`/patterns/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify(detail),
    }),
  deletePattern: (id: string) =>
    req<{ ok: true }>(`/patterns/${encodeURIComponent(id)}`, { method: "DELETE" }),
  importStarters: (overwrite = false) =>
    req<ImportStartersResult>(`/starters/import`, {
      method: "POST",
      body: JSON.stringify({ overwrite }),
    }),

  // PRDs
  listPrds: () => req<PrdSummary[]>("/prds"),
  readPrd: (id: string) =>
    req<{ content: string }>(`/prds/${encodeURIComponent(id)}`).then((r) => r.content),
  writePrd: (id: string, content: string) =>
    req<{ ok: true }>(`/prds/${encodeURIComponent(id)}`, {
      method: "PUT",
      body: JSON.stringify({ content }),
    }),
  deletePrd: (id: string) =>
    req<{ ok: true }>(`/prds/${encodeURIComponent(id)}`, { method: "DELETE" }),
};
