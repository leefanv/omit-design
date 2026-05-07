import { IonInput, IonItem, IonLabel, IonNote } from "@ionic/react";
import { inspectAttrs } from "./inspect-attrs";
import "./om-input.css";

interface OmInputProps {
  label: string;
  value?: string;
  placeholder?: string;
  type?: "text" | "number" | "tel" | "email" | "password";
  onChange?: (value: string) => void;
  /** 内联错误文案；有值时整项进入错误态（红框 + 红色辅助文本） */
  errorText?: string;
}

export function OmInput({
  label,
  value,
  placeholder,
  type = "text",
  onChange,
  errorText,
}: OmInputProps) {
  const hasError = !!errorText;
  return (
    <div className={hasError ? "pos-input pos-input--error" : "pos-input"}>
      <IonItem {...inspectAttrs("OmInput", { spacing: "md" })}>
        <IonLabel position="stacked">{label}</IonLabel>
        <IonInput
          type={type}
          value={value}
          placeholder={placeholder}
          onIonInput={(e) => onChange?.(e.detail.value ?? "")}
        />
      </IonItem>
      {hasError && <IonNote color="danger">{errorText}</IonNote>}
    </div>
  );
}
