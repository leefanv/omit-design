import type { ReactNode } from "react";
import { IonCard, IonCardContent, IonCardHeader, IonCardSubtitle, IonCardTitle } from "@ionic/react";
import { inspectAttrs } from "./inspect-attrs";

interface OmCardProps {
  title?: string;
  subtitle?: string;
  children?: ReactNode;
  onClick?: () => void;
}

export function OmCard({ title, subtitle, children, onClick }: OmCardProps) {
  return (
    <IonCard
      button={!!onClick}
      onClick={onClick}
      {...inspectAttrs("OmCard", { bg: "background", radius: "lg", shadow: "md" })}
    >
      {(title || subtitle) && (
        <IonCardHeader>
          {subtitle && <IonCardSubtitle>{subtitle}</IonCardSubtitle>}
          {title && <IonCardTitle>{title}</IonCardTitle>}
        </IonCardHeader>
      )}
      {children && <IonCardContent>{children}</IonCardContent>}
    </IonCard>
  );
}
