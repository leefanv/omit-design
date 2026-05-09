// @pattern: form-view
// TEMPLATE — 复制到 design/<filename>/<filename>.tsx 后:
//   1. 替换 meta + 字段
//   2. 调整 useState 初始值与字段标签
//   3. 提交按钮 navigate 到下一张稿
//   4. IonBackButton defaultHref 改成上一级

export const meta = {
  name: "TODO Form page",
  pattern: "form-view",
  description: "TODO one-line description",
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
          title="TODO Form"
          start={<IonBackButton defaultHref="/designs/TODO" />}
        />
      }
    >
      <OmInput label="Field one" value={field1} onChange={setField1} />
      <OmInput label="Field two" value={field2} onChange={setField2} />

      <OmButton
        expand="block"
        onClick={() => navigate("/designs/TODO-next")}
      >
        Submit
      </OmButton>
    </OmPage>
  );
}
export default TodoFormPage;
