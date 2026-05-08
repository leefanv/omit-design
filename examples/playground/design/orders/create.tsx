// @pattern: form-view
export const meta = {
  name: "新建订单",
  pattern: "form-view",
  description: "新建订单表单",
} as const;

import { OmButton, OmHeader, OmInput, OmPage, OmSelect } from "@omit-design/preset-mobile";

export function CreateOrderPage() {
  return (
    <OmPage padding="none" header={<OmHeader title="新建订单" />}>
      <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 12 }}>
        <OmInput label="顾客姓名" placeholder="请输入" />
        <OmSelect label="商品" options={[{ value: "p-001", label: "拿铁" }, { value: "p-002", label: "美式" }]} />
        <OmInput label="数量" type="number" placeholder="1" />
        <OmButton expand="block">提交</OmButton>
      </div>
    </OmPage>
  );
}
export default CreateOrderPage;
