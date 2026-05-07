// @pattern: welcome-view
export const meta = {
  name: "欢迎",
  pattern: "welcome-view",
  description: "默认欢迎页",
  source: "scaffold",
} as const;

import { useNavigate } from "react-router-dom";
import { OmButton, OmPage } from "@omit-design/preset-mobile";
import { brand } from "../mock/onboarding";

export function WelcomePage() {
  const navigate = useNavigate();
  return (
    <OmPage padding="none">
      <div style={{ padding: "var(--om-spacing-xl)" }}>
        <h1>Welcome to {brand.tagline}</h1>
        <p>{brand.version}</p>
        <OmButton expand="block" onClick={() => navigate("/workspace")}>
          进入工作台
        </OmButton>
      </div>
    </OmPage>
  );
}
export default WelcomePage;
