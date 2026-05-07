import type { ReactNode } from "react";
import { IonContent, IonPage } from "@ionic/react";
import { inspectAttrs } from "./inspect-attrs";
import "./om-page.css";

interface OmPageProps {
  children: ReactNode;
  /** 顶部固定 header（通常是 `<OmHeader />`）。传入后会作为 IonPage 直接子渲染，
   * 从而与 IonContent 同级 —— header 不参与滚动。 */
  header?: ReactNode;
  /** 主体内边距 token（默认 lg） */
  padding?: "none" | "sm" | "md" | "lg" | "xl";
}

const PADDING_CLASS = {
  none: "pos-page-pad-none",
  sm: "pos-page-pad-sm",
  md: "pos-page-pad-md",
  lg: "pos-page-pad-lg",
  xl: "pos-page-pad-xl",
};

export function OmPage({ children, header, padding = "lg" }: OmPageProps) {
  return (
    <IonPage {...inspectAttrs("OmPage")}>
      {header}
      <IonContent className={PADDING_CLASS[padding]}>{children}</IonContent>
    </IonPage>
  );
}
