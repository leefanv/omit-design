// @pattern: welcome-view
export const meta = {
  name: "Welcome",
  pattern: "welcome-view",
  description: "Default welcome page — Jump to dashboard",
} as const;

import { useNavigate } from "react-router-dom";
import { OmButton, OmPage } from "@omit-design/preset-mobile";
import { brand } from "../../mock/data";

export function WelcomePage() {
  const navigate = useNavigate();
  return (
    <OmPage padding="none">
      <div style={{ padding: "24px", display: "flex", flexDirection: "column", gap: 16 }}>
        <h1 style={{ margin: 0 }}>{brand.tagline}</h1>
        <p style={{ margin: 0, color: "#666" }}>{brand.version}</p>
        <OmButton expand="block" onClick={() => navigate("/workspace/playground")}>
          Enter Dashboard
        </OmButton>
      </div>
    </OmPage>
  );
}
export default WelcomePage;
