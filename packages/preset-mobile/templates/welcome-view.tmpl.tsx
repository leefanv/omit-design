// @pattern: welcome-view
// TEMPLATE — 复制到 design/<filename>/<filename>.tsx 后:
//   1. 替换 meta
//   2. 接入真实品牌 logo 组件(可选)
//   3. CTA navigate 到下一张稿
//   4. tagline / version 走 mock 或常量

export const meta = {
  name: "TODO 欢迎页",
  pattern: "welcome-view",
  description: "TODO 一句话描述",
  source: "prd",
} as const;

import { useNavigate } from "react-router-dom";
import { OmButton, OmPage } from "@omit-design/preset-mobile";

export function TodoWelcomePage() {
  const navigate = useNavigate();

  return (
    <OmPage padding="none">
      {/* TODO: 替换为品牌 logo 组件 */}
      <div>
        <h1>Welcome</h1>
        <p>TODO 欢迎语</p>
      </div>

      <OmButton
        expand="block"
        onClick={() => navigate("/designs/TODO-next")}
      >
        开始
      </OmButton>
    </OmPage>
  );
}
export default TodoWelcomePage;
