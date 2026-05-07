import { IonIcon, IonLabel, IonTabBar, IonTabButton } from "@ionic/react";
import { inspectAttrs } from "./inspect-attrs";

export interface OmTabItem {
  tab: string;
  href: string;
  label: string;
  icon: string;
}

interface OmTabBarProps {
  items: OmTabItem[];
}

export function OmTabBar({ items }: OmTabBarProps) {
  return (
    <IonTabBar slot="bottom" {...inspectAttrs("OmTabBar", { bg: "background" })}>
      {items.map((item) => (
        <IonTabButton key={item.tab} tab={item.tab} href={item.href}>
          <IonIcon icon={item.icon} aria-hidden="true" />
          <IonLabel>{item.label}</IonLabel>
        </IonTabButton>
      ))}
    </IonTabBar>
  );
}
