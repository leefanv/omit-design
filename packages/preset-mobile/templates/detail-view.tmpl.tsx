// @pattern: detail-view
// TEMPLATE — 复制到 design/<filename>/<filename>.tsx 后:
//   1. 替换 meta + 字段
//   2. 把 RECORD 换成真实 mock import
//   3. 调整 IonBackButton 的 defaultHref
//   4. 主操作改成业务跳转

export const meta = {
  name: "TODO 详情页名",
  pattern: "detail-view",
  description: "TODO 一句话描述",
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
  title: "示例标题",
  amount: 0,
  status: "TODO 状态",
};

export function TodoDetailPage() {
  return (
    <OmPage
      padding="lg"
      header={
        <OmHeader
          title="TODO 详情"
          start={<IonBackButton defaultHref="/designs/TODO" />}
        />
      }
    >
      <OmCard title={RECORD.title} subtitle={`#${RECORD.id}`}>
        <p>金额:¥{RECORD.amount.toFixed(2)}</p>
        <p>状态:{RECORD.status}</p>
      </OmCard>

      {/* TODO: 关联信息分块 —— 增加更多 OmCard */}

      <OmButton expand="block">主操作</OmButton>
    </OmPage>
  );
}
export default TodoDetailPage;
