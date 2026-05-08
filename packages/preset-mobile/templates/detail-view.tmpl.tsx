// @pattern: detail-view
// TEMPLATE — 复制到 design/<filename>/<filename>.tsx 后:
//   1. 替换 meta + 字段
//   2. 把 RECORD 换成真实 mock import
//   3. 调整 IonBackButton 的 defaultHref
//   4. 主操作改成业务跳转

export const meta = {
  name: "TODO Detail page",
  pattern: "detail-view",
  description: "TODO one-line description",
  source: "prd",
} as const;

import { IonBackButton } from "@ionic/react";
import {
  OmButton,
  OmCard,
  OmHeader,
  OmPage,
} from "@omit-design/preset-mobile";

interface Record {
  id: string;
  title: string;
  amount: number;
  status: string;
}

// TODO: 替换为真实 mock import
const RECORD: Record = {
  id: "TODO",
  title: "Sample title",
  amount: 0,
  status: "TODO status",
};

export function TodoDetailPage() {
  return (
    <OmPage
      padding="lg"
      header={
        <OmHeader
          title="TODO Detail"
          start={<IonBackButton defaultHref="/designs/TODO" />}
        />
      }
    >
      <OmCard title={RECORD.title} subtitle={`#${RECORD.id}`}>
        <p>Amount: ${RECORD.amount.toFixed(2)}</p>
        <p>Status: {RECORD.status}</p>
      </OmCard>

      {/* TODO: 关联信息分块 —— 增加更多 OmCard */}

      <OmButton expand="block">Primary action</OmButton>
    </OmPage>
  );
}
export default TodoDetailPage;
