import type { ReactNode } from "react";
import { IonIcon } from "@ionic/react";
import { searchOutline } from "ionicons/icons";
import { inspectAttrs } from "./inspect-attrs";
import "./om-search-bar.css";

interface OmSearchBarProps {
  value?: string;
  placeholder?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  /** 右侧附加元素（如过滤 / 取消按钮） */
  trailing?: ReactNode;
  /** 只读视觉（列表页用来做"跳到搜索页"的入口） */
  readOnly?: boolean;
  onClick?: () => void;
}

/**
 * POS 搜索输入框 —— 圆角胶囊 + 左放大镜 + 可选右侧 slot。
 * 既作为真实输入（搜索页 focus 态），也作为入口（列表页 readOnly + onClick 跳转）。
 */
export function OmSearchBar({
  value,
  placeholder = "Search",
  onChange,
  onFocus,
  trailing,
  readOnly,
  onClick,
}: OmSearchBarProps) {
  return (
    <div
      className="om-search-bar"
      onClick={onClick}
      {...inspectAttrs("OmSearchBar", { bg: "background", radius: "full", spacing: "md" })}
    >
      <IonIcon icon={searchOutline} className="om-search-bar__icon" aria-hidden />
      <input
        className="om-search-bar__input"
        type="search"
        value={value ?? ""}
        placeholder={placeholder}
        readOnly={readOnly}
        onChange={(e) => onChange?.(e.target.value)}
        onFocus={onFocus}
      />
      {trailing && <div className="om-search-bar__trailing">{trailing}</div>}
    </div>
  );
}
