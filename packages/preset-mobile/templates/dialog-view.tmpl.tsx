// @pattern: dialog-view
// TEMPLATE — 复制到 design/<filename>/<filename>.tsx 后:
//   1. 替换 meta
//   2. icon 用合适的 ionicons
//   3. cancelHref / confirmHref 指向真实路由
//   4. iconColor / confirmColor 按场景设(danger / warning / success / primary)

export const meta = {
  name: "TODO 对话框",
  pattern: "dialog-view",
  description: "TODO 一句话描述",
  source: "prd",
} as const;

import { informationCircleOutline } from "ionicons/icons";
import { OmDialog, OmPage } from "@omit-design/preset-mobile";

export function TodoDialogPage() {
  return (
    <OmPage padding="none">
      <OmDialog
        icon={informationCircleOutline}
        iconColor="primary"
        title="TODO 标题"
        subtitle="TODO 副标题描述。"
        cancelText="取消"
        cancelHref="/designs/TODO-from"
        confirmText="确认"
        confirmHref="/designs/TODO-next"
      />
    </OmPage>
  );
}
export default TodoDialogPage;
