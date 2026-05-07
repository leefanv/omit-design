import type { InspectTarget } from "../store";

/**
 * Android XML 等价代码（占位实现）。
 * 输出常用控件骨架 + token 名映射到 colors.xml / dimens.xml 引用。
 */
const XML_TOKEN_COLOR: Record<string, string> = {
  primary: "@color/pos_primary",
  secondary: "@color/pos_secondary",
  tertiary: "@color/pos_tertiary",
  success: "@color/pos_success",
  warning: "@color/pos_warning",
  danger: "@color/pos_danger",
  dark: "@color/pos_dark",
  medium: "@color/pos_medium",
  light: "@color/pos_light",
  background: "@color/pos_background",
  text: "@color/pos_text",
};

const XML_SPACING: Record<string, string> = {
  xs: "@dimen/spacing_xs",
  sm: "@dimen/spacing_sm",
  md: "@dimen/spacing_md",
  lg: "@dimen/spacing_lg",
  xl: "@dimen/spacing_xl",
  "2xl": "@dimen/spacing_2xl",
};

const COMPONENT_TO_VIEW: Record<string, string> = {
  PosPage: "androidx.constraintlayout.widget.ConstraintLayout",
  PosHeader: "com.google.android.material.appbar.MaterialToolbar",
  PosButton: "com.google.android.material.button.MaterialButton",
  PosCard: "com.google.android.material.card.MaterialCardView",
  PosListRow: "LinearLayout",
  PosInput: "com.google.android.material.textfield.TextInputLayout",
  PosTabBar: "com.google.android.material.bottomnavigation.BottomNavigationView",
};

export function codegenXml(t: InspectTarget): string {
  const view = COMPONENT_TO_VIEW[t.component] ?? "View";
  const attrs: string[] = [
    `android:layout_width="wrap_content"`,
    `android:layout_height="wrap_content"`,
  ];

  if (t.tokens.color) {
    attrs.push(`app:backgroundTint="${XML_TOKEN_COLOR[t.tokens.color] ?? t.tokens.color}"`);
  }
  if (t.tokens.bg) {
    attrs.push(`android:background="${XML_TOKEN_COLOR[t.tokens.bg] ?? t.tokens.bg}"`);
  }
  if (t.tokens.spacing) {
    const sp = t.tokens.spacing.split(",")[0];
    attrs.push(`android:padding="${XML_SPACING[sp] ?? sp}"`);
  }

  const lines: string[] = [
    `<!-- Component: ${t.component} → ${view} -->`,
    `<${view}`,
    ...attrs.map((a) => `    ${a}`),
    `    />`,
  ];
  return lines.join("\n");
}
