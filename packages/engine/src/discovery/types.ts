/**
 * DesignSource — engine 与「设计稿从哪儿来」之间的唯一契约。
 *
 * Engine 自己不关心设计稿是 import.meta.glob 静态扫的还是远程拉的,
 * 只接受一个 DesignSource,从里面拿 projects 列表去渲染。
 *
 * 内置实现:
 *   - globDiscovery() — Vite 编译期扫本地文件(单项目脚手架默认用)
 *
 * 自定义实现:只要返回 { projects: DiscoveredProject[] },组件可以是 React.lazy
 * 包出来的(懒加载)或直接的 ComponentType(eager),engine 渲染时无差别。
 */

import type { DiscoveredProject } from "../registry/types";

export interface DesignSource {
  /** 已 resolve 的项目列表（含每个稿子的 component，可以是 lazy） */
  projects: DiscoveredProject[];
}
