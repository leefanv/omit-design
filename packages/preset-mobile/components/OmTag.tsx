import type { ReactNode } from "react";
import { inspectAttrs } from "./inspect-attrs";
import type { ColorTokenName } from "../tokens";
import "./om-tag.css";

interface OmTagProps {
  children: ReactNode;
  color?: ColorTokenName;
  /** 视觉：solid 填充色、soft 浅色底、outline 描边 */
  variant?: "solid" | "soft" | "outline";
  size?: "sm" | "md";
}

/**
 * 小尺寸的 chip / badge / 标签。
 * 用于：门槛标签（"无门槛"）、VIP 级别、状态徽章。
 */
export function OmTag({ children, color = "primary", variant = "soft", size = "sm" }: OmTagProps) {
  return (
    <span
      className={`pos-tag pos-tag--${variant} pos-tag--${size}`}
      data-color={color}
      {...inspectAttrs("OmTag", { color, radius: "sm", fontSize: "xs" })}
    >
      {children}
    </span>
  );
}
