import type { ReactNode } from "react";
import { inspectAttrs } from "./inspect-attrs";
import "./om-stat-card.css";

interface OmStatCardProps {
  label: string;
  /** 大号数字 —— 可传格式化好的字符串（"¥12,480.50"） */
  value: string;
  /** 右上角辅助 slot（如「月份」小字） */
  meta?: ReactNode;
  /** 副标题（如单位、对比） */
  caption?: string;
}

/**
 * 统计数字卡 —— 用于工作台营收 / 客单等核心指标展示。
 * 单一职责：标签 + 大号数字 + 可选副标题 / meta。
 */
export function OmStatCard({ label, value, meta, caption }: OmStatCardProps) {
  return (
    <div className="om-stat" {...inspectAttrs("OmStatCard", { bg: "background", radius: "lg", shadow: "sm" })}>
      <div className="om-stat__head">
        <span className="om-stat__label">{label}</span>
        {meta && <span className="om-stat__meta">{meta}</span>}
      </div>
      <div className="om-stat__value">{value}</div>
      {caption && <div className="om-stat__caption">{caption}</div>}
    </div>
  );
}
