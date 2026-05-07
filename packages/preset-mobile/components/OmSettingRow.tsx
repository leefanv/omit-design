import type { ReactNode } from "react";
import { IonIcon, IonToggle } from "@ionic/react";
import { chevronForward } from "ionicons/icons";
import { inspectAttrs } from "./inspect-attrs";
import "./om-setting-row.css";

type OmSettingKind =
  | {
      kind: "toggle";
      enabled: boolean;
      onToggle?: (next: boolean) => void;
    }
  | {
      kind: "navigate";
      onClick?: () => void;
      href?: string;
    }
  | {
      kind: "value";
      value: ReactNode;
      onClick?: () => void;
    };

interface OmSettingRowBaseProps {
  label: string;
  description?: string;
  /** 左侧图标（可选） */
  icon?: string;
}

type OmSettingRowProps = OmSettingRowBaseProps & OmSettingKind;

/**
 * 设置项单行 —— 三种形态：toggle / navigate / value。
 * 用于 workstation / settings 设置页，列表语义统一。
 */
export function OmSettingRow(props: OmSettingRowProps) {
  const { label, description, icon } = props;
  const interactive = props.kind !== "toggle";
  const onClick =
    props.kind === "navigate" || props.kind === "value" ? props.onClick : undefined;

  const inspect = inspectAttrs("OmSettingRow", { bg: "background", spacing: "lg" });
  const className = `om-setting-row${interactive ? " pos-setting-row--interactive" : ""}`;

  const inner = (
    <>
      {icon && (
        <div className="om-setting-row__icon" aria-hidden>
          <IonIcon icon={icon} />
        </div>
      )}
      <div className="om-setting-row__body">
        <span className="om-setting-row__label">{label}</span>
        {description && <span className="om-setting-row__desc">{description}</span>}
      </div>
      <div className="om-setting-row__right">
        {props.kind === "toggle" && (
          <IonToggle
            checked={props.enabled}
            onIonChange={(e) => props.onToggle?.(e.detail.checked)}
            aria-label={label}
          />
        )}
        {props.kind === "value" && (
          <>
            <span className="om-setting-row__value">{props.value}</span>
            <IonIcon icon={chevronForward} className="om-setting-row__chevron" aria-hidden />
          </>
        )}
        {props.kind === "navigate" && (
          <IonIcon icon={chevronForward} className="om-setting-row__chevron" aria-hidden />
        )}
      </div>
    </>
  );

  if (props.kind === "navigate" && props.href) {
    return (
      <a className={className} href={props.href} {...inspect}>
        {inner}
      </a>
    );
  }

  return interactive ? (
    <button type="button" className={className} onClick={onClick} {...inspect}>
      {inner}
    </button>
  ) : (
    <div className={className} {...inspect}>
      {inner}
    </div>
  );
}
