import type { InspectTarget } from "../store";

/**
 * Android Jetpack Compose 等价代码（占位实现）。
 * MVP 阶段先做骨架与 token 名映射；具体 per-component 模板在后续迭代里补。
 */
const COMPOSE_TOKEN_MAP: Record<string, string> = {
  primary: "MaterialTheme.colorScheme.primary",
  secondary: "MaterialTheme.colorScheme.secondary",
  tertiary: "MaterialTheme.colorScheme.tertiary",
  success: "Color(0xFF10B981)",
  warning: "Color(0xFFF59E0B)",
  danger: "MaterialTheme.colorScheme.error",
  dark: "MaterialTheme.colorScheme.onSurface",
  medium: "MaterialTheme.colorScheme.outline",
  light: "MaterialTheme.colorScheme.surfaceVariant",
  background: "MaterialTheme.colorScheme.background",
  text: "MaterialTheme.colorScheme.onBackground",
};

const COMPOSE_SPACING_MAP: Record<string, string> = {
  xs: "4.dp",
  sm: "8.dp",
  md: "12.dp",
  lg: "16.dp",
  xl: "24.dp",
  "2xl": "32.dp",
};

const COMPOSE_RADIUS_MAP: Record<string, string> = {
  sm: "4.dp",
  md: "8.dp",
  lg: "12.dp",
  xl: "16.dp",
  full: "9999.dp",
};

const COMPONENT_TO_COMPOSABLE: Record<string, string> = {
  PosPage: "Scaffold",
  PosHeader: "TopAppBar",
  PosButton: "Button",
  PosCard: "Card",
  PosListRow: "ListItem",
  PosInput: "OutlinedTextField",
  PosTabBar: "BottomAppBar",
};

export function codegenCompose(t: InspectTarget): string {
  const composable = COMPONENT_TO_COMPOSABLE[t.component] ?? `/* TODO: ${t.component} */`;
  const lines: string[] = [`// Component: ${t.component} → ${composable}`];

  if (t.tokens.color) {
    lines.push(`// color: ${t.tokens.color} → ${COMPOSE_TOKEN_MAP[t.tokens.color] ?? t.tokens.color}`);
  }
  if (t.tokens.bg) {
    lines.push(`// background: ${t.tokens.bg} → ${COMPOSE_TOKEN_MAP[t.tokens.bg] ?? t.tokens.bg}`);
  }
  if (t.tokens.radius) {
    lines.push(`// radius: ${t.tokens.radius} → ${COMPOSE_RADIUS_MAP[t.tokens.radius] ?? t.tokens.radius}`);
  }
  if (t.tokens.spacing) {
    const spList = t.tokens.spacing.split(",");
    lines.push(`// spacing: ${spList.map((s) => `${s} → ${COMPOSE_SPACING_MAP[s] ?? s}`).join(", ")}`);
  }
  lines.push("");
  lines.push(`${composable}(`);
  if (t.tokens.color) {
    lines.push(`  colors = ButtonDefaults.buttonColors(`);
    lines.push(`    containerColor = ${COMPOSE_TOKEN_MAP[t.tokens.color] ?? "Color.Unspecified"},`);
    lines.push(`  ),`);
  }
  lines.push(`  // ... 子内容由设计稿决定`);
  lines.push(`)`);
  return lines.join("\n");
}
