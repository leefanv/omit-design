import type { ReactNode } from "react";
import { IonButtons, IonHeader, IonTitle, IonToolbar } from "@ionic/react";
import { inspectAttrs } from "./inspect-attrs";

interface OmHeaderProps {
  title: string;
  start?: ReactNode;
  end?: ReactNode;
}

export function OmHeader({ title, start, end }: OmHeaderProps) {
  return (
    <IonHeader {...inspectAttrs("OmHeader", { bg: "background" })}>
      <IonToolbar>
        {start && <IonButtons slot="start">{start}</IonButtons>}
        <IonTitle>{title}</IonTitle>
        {end && <IonButtons slot="end">{end}</IonButtons>}
      </IonToolbar>
    </IonHeader>
  );
}
