/**
 * Engine 的 registry 抽象 — project 即文件夹,registry 由 engine 从文件系统自动发现。
 *
 * 设计要点:
 *   - 每张稿子的 meta 跟代码住一起(.tsx 里 `export const meta = {...}`),
 *     不再有跨文件的"列表表 vs 实现表"双源不同步风险
 *   - 路由从文件路径推(`design/<name>.tsx` → `/designs/<name>`),
 *     不需要在 App.tsx 维护 Route 列表
 *   - Project 通过 `project.config.ts` 声明基本信息 + group 标签映射,
 *     engine `EngineRoot` 接受 project list 后自动 discover
 */

import type { ComponentType, ReactNode } from "react";
import type { PresetManifest } from "../preset";

/** 单张稿子的 meta（跟着 .tsx 文件一起住） */
export interface DesignMeta {
  /** 稿子名（短，列表里的标题） */
  name: string;
  /** 模式 — 必须存在于 preset 的 PATTERNS.md */
  pattern: string;
  /** 一句话描述（Studio 卡片用） */
  description?: string;
  /** 来源：Figma 原型 / PRD 推导 */
  source?: "figma" | "prd";
}

/** Engine 把 meta + 文件路径推出的最终 entry —— 跟 M2 的 DesignEntry 字段相同 */
export interface DesignEntry extends DesignMeta {
  /** 路由路径，由 file path 自动推出 */
  href: string;
  /**
   * 缩略图 / 批量 capture 用的 iframe URL(可选)。
   * 默认 undefined → engine 用 `${href}?embed=1` 走完整 app shell。
   * 自定义 discovery 实现可以指向更精简的 embed 入口以避免大量 iframe 内存压力。
   */
  embedHref?: string;
  /** 所属 group id(path 第一段) */
  groupId: string;
  /** 渲染组件 —— 从 import.meta.glob 拿 */
  component: ComponentType;
  /**
   * Lazy import 用的原始 URL(可选,自定义 discovery 用)。
   * 配合一个版本号重建 lazy,实现 design 文件变更时局部刷新而非 Vite 整页 reload。
   */
  importHref?: string;
}

/** Project config 里声明的 group 元信息：id → 标签 + emoji */
export interface GroupMeta {
  id: string;
  label: string;
  icon?: string;
}

/**
 * 组件库目录 —— 每个 preset 定义自己的 catalog，主题编辑器渲染 WYSIWYG 预览。
 * `render` 是无参数的工厂函数（而不是 React 组件），避免丢失 hook context。
 */
export interface CatalogItem {
  id: string;
  name: string;
  description?: string;
  render: () => ReactNode;
}

export interface CatalogGroup {
  id: string;
  label: string;
  icon?: string;
  items: CatalogItem[];
}

/** Project config —— 每个项目根目录写一份 `project.config.ts` 导出 */
export interface ProjectConfig {
  /** repo 根下的文件夹名，也是 /workspace/:id */
  id: string;
  name: string;
  description: string;
  icon: string;
  /** 用哪份 preset —— 决定 canvas / 主题编辑器 / 白名单 */
  preset: PresetManifest;
  /**
   * Group 元信息 —— 把 path 第一段（group id）映射到展示标签 / 图标。
   * 顺序决定 Sidebar 里的呈现顺序。
   */
  groups: GroupMeta[];
  /**
   * 组件库目录 —— 主题编辑器 WYSIWYG 预览用。
   * 由各 preset 的 catalog.tsx 定义，在 project.config.ts 里引入。
   */
  catalog?: CatalogGroup[];
}

/** Discover 后的项目（含 config + 自动发现的 entries 列表） */
export interface DiscoveredProject extends ProjectConfig {
  entries: DesignEntry[];
}

/** Sidebar / Studio 用的分组视图（group meta + 对应 entries） */
export interface DesignGroup extends GroupMeta {
  entries: DesignEntry[];
}

/**
 * 跨 repo 注册表中其他正在跑（或曾经跑过）的 omit-design 项目。
 * 数据由 dev-server 的 `~/.omit-design/projects.json` 提供，前端用 fetch 拿。
 *
 * 与 `DiscoveredProject` 区别：external 项目的 design 组件**不在当前 bundle**
 * 里，所以没有 entries/groups/preset，能做的事仅限"卡片展示 + 跨端口跳转"。
 */
export interface ExternalProject {
  id: string;
  name: string;
  description?: string;
  icon?: string;
  /** 对方 dev server 的 origin，如 http://localhost:5174 */
  origin: string;
  port?: number;
  /** repo 绝对路径（前端仅展示用） */
  repoPath: string;
  /** ISO timestamp */
  lastSeenAt: string;
  /** 首个 design entry 的相对 href，如 /designs/main/welcome —— 用于缩略图 iframe */
  firstEntryHref?: string;
  /** 设备形态，决定卡片宽高 / iframe 尺寸 */
  chrome?: "mobile" | "desktop";
}
