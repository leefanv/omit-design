import { IonIcon } from "@ionic/react";
import { backspaceOutline } from "ionicons/icons";
import { inspectAttrs } from "./inspect-attrs";
import "./om-numpad.css";

interface OmNumpadProps {
  /** 按键回调：数字（"0"~"9"）、"." 或 "abc" */
  onKey?: (key: string) => void;
  /** 退格 */
  onBackspace?: () => void;
  /** 清空（"清空" 按钮） */
  onClear?: () => void;
  /** 左下角：支持 "abc" 切换字母输入（登录密码数字键盘） 或 "." 小数点（金额） */
  leftSlot?: "abc" | "dot" | "none";
  /** 右下角退格（默认 true） */
  showBackspace?: boolean;
  /** 是否显示「清空」按钮替换右下角（会员登录页） */
  clearMode?: boolean;
}

const KEYS: string[] = ["1", "2", "3", "4", "5", "6", "7", "8", "9"];

/**
 * 通用数字键盘（4 列 / 3 行 + 底排）—— 用于：
 * - 登录页 "密码数字输入"（左下 "abc" 可切换字母键盘）
 * - 会员登录 "手机号输入"（左下 "0"、右下 "清空"）
 * - 金额输入（左下 "."）
 */
export function OmNumpad({
  onKey,
  onBackspace,
  onClear,
  leftSlot = "none",
  showBackspace = true,
  clearMode = false,
}: OmNumpadProps) {
  return (
    <div className="om-numpad" {...inspectAttrs("OmNumpad", { bg: "light", radius: "md", spacing: "sm" })}>
      {KEYS.map((k) => (
        <button key={k} className="om-numpad__key" type="button" onClick={() => onKey?.(k)}>
          {k}
        </button>
      ))}

      {/* 左下角 */}
      {leftSlot === "abc" && (
        <button className="om-numpad__key pos-numpad__key--ghost" type="button" onClick={() => onKey?.("abc")}>
          abc
        </button>
      )}
      {leftSlot === "dot" && (
        <button className="om-numpad__key" type="button" onClick={() => onKey?.(".")}>
          .
        </button>
      )}
      {leftSlot === "none" && <span className="om-numpad__spacer" aria-hidden />}

      {/* 中间 0 */}
      <button className="om-numpad__key" type="button" onClick={() => onKey?.("0")}>
        0
      </button>

      {/* 右下角 */}
      {clearMode ? (
        <button className="om-numpad__key pos-numpad__key--clear" type="button" onClick={() => onClear?.()}>
          清空
        </button>
      ) : showBackspace ? (
        <button
          className="om-numpad__key pos-numpad__key--ghost"
          type="button"
          onClick={() => onBackspace?.()}
          aria-label="退格"
        >
          <IonIcon icon={backspaceOutline} />
        </button>
      ) : (
        <span className="om-numpad__spacer" aria-hidden />
      )}
    </div>
  );
}
