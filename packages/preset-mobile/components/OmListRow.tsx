import type { ReactNode } from "react";
import { IonItem, IonLabel, IonNote } from "@ionic/react";
import { inspectAttrs } from "./inspect-attrs";

interface OmListRowProps {
  title: string;
  detail?: string;
  trailing?: ReactNode;
  leading?: ReactNode;
  onClick?: () => void;
  href?: string;
}

export function OmListRow({ title, detail, trailing, leading, onClick, href }: OmListRowProps) {
  return (
    <IonItem
      button={!!onClick || !!href}
      onClick={onClick}
      routerLink={href}
      {...inspectAttrs("OmListRow", { spacing: "lg" })}
    >
      {leading}
      <IonLabel>
        <h2>{title}</h2>
        {detail && <p>{detail}</p>}
      </IonLabel>
      {trailing && <IonNote slot="end">{trailing}</IonNote>}
    </IonItem>
  );
}
