// @pattern: dialog-view
// TEMPLATE — 复制到 design/<filename>/<filename>.tsx 后:
//   1. 替换 meta
//   2. icon 用合适的 ionicons
//   3. cancelHref / confirmHref 指向真实路由
//   4. iconColor / confirmColor 按场景设(danger / warning / success / primary)

export const meta = {
  name: "TODO Dialog",
  pattern: "dialog-view",
  description: "TODO one-line description",
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
        title="TODO Title"
        subtitle="TODO subtitle description."
        cancelText="Cancel"
        cancelHref="/designs/TODO-from"
        confirmText="Confirm"
        confirmHref="/designs/TODO-next"
      />
    </OmPage>
  );
}
export default TodoDialogPage;
