import type { ReactNode } from "react";
import { IonButton } from "@ionic/react";
import { inspectAttrs } from "./inspect-attrs";
import type { ColorTokenName } from "../tokens";

type OmButtonVariant = "solid" | "outline" | "clear";
type OmButtonSize = "small" | "default" | "large";

interface OmButtonProps {
  children: ReactNode;
  variant?: OmButtonVariant;
  size?: OmButtonSize;
  color?: ColorTokenName;
  expand?: "block" | "full";
  disabled?: boolean;
  onClick?: () => void;
}

export function OmButton({
  children,
  variant = "solid",
  size = "default",
  color = "primary",
  expand,
  disabled,
  onClick,
}: OmButtonProps) {
  return (
    <IonButton
      fill={variant === "solid" ? "solid" : variant === "outline" ? "outline" : "clear"}
      size={size}
      color={color}
      expand={expand}
      disabled={disabled}
      onClick={onClick}
      {...inspectAttrs("OmButton", { color, radius: "md" })}
    >
      {children}
    </IonButton>
  );
}
