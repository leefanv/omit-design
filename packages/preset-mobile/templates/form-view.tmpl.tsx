// @pattern: form-view
// TEMPLATE — 复制到 design/<filename>/<filename>.tsx 后:
//   1. 替换 meta + 字段
//   2. 调整 useState 初始值与字段标签
//   3. 提交按钮 navigate 到下一张稿
//   4. IonBackButton defaultHref 改成上一级

export const meta = {
  name: "TODO 表单页名",
  pattern: "form-view",
  description: "TODO 一句话描述",
  source: "prd",
} as const;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { IonBackButton } from "@ionic/react";
import {
  OmButton,
  OmHeader,
  OmInput,
  OmPage,
} from "@omit-design/preset-mobile";

export function TodoFormPage() {
  const navigate = useNavigate();
  const [field1, setField1] = useState("");
  const [field2, setField2] = useState("");

  return (
    <OmPage
      padding="lg"
      header={
        <OmHeader
          title="TODO 表单"
          start={<IonBackButton defaultHref="/designs/TODO" />}
        />
      }
    >
      <OmInput label="字段一" value={field1} onChange={setField1} />
      <OmInput label="字段二" value={field2} onChange={setField2} />

      <OmButton
        expand="block"
        onClick={() => navigate("/designs/TODO-next")}
      >
        提交
      </OmButton>
    </OmPage>
  );
}
export default TodoFormPage;
