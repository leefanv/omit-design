import { IonItem, IonLabel, IonSelect, IonSelectOption } from "@ionic/react";
import { inspectAttrs } from "./inspect-attrs";
import "./om-select.css";

export interface OmSelectOption {
  label: string;
  value: string;
}

interface OmSelectProps {
  label: string;
  value?: string;
  options: OmSelectOption[];
  placeholder?: string;
  onChange?: (value: string) => void;
  /** Ionic 弹出样式；默认 action-sheet，移动端更贴 iOS */
  interfaceType?: "alert" | "action-sheet" | "popover";
}

export function OmSelect({
  label,
  value,
  options,
  placeholder,
  onChange,
  interfaceType = "action-sheet",
}: OmSelectProps) {
  return (
    <div className="om-select">
      <IonItem {...inspectAttrs("OmSelect", { spacing: "md" })}>
        <IonLabel position="stacked">{label}</IonLabel>
        <IonSelect
          interface={interfaceType}
          value={value}
          placeholder={placeholder}
          onIonChange={(e) => onChange?.(e.detail.value)}
        >
          {options.map((o) => (
            <IonSelectOption key={o.value} value={o.value}>
              {o.label}
            </IonSelectOption>
          ))}
        </IonSelect>
      </IonItem>
    </div>
  );
}
