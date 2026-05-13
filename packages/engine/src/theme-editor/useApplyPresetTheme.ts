import { useEffect, useMemo } from "react";
import type { PresetManifest } from "../preset";
import { useThemeStore, type ThemeBaseline } from "./store";

/**
 * 把当前 preset 的主题（baseline + 用户在 localStorage 里 applied 过的覆盖）
 * 应用到 :root，让任何挂载这个 hook 的入口都能保证打开就有正确的 token。
 *
 * 必须在每个会展示 preset UI 的根（DesignFrame / ThemeEditorPage / ThemePanel）
 * 都调用一次，避免出现"只有打开 ThemePanel 才生效"的滞后。
 */
export function useApplyPresetTheme(preset: PresetManifest): ThemeBaseline {
  const baseline = useMemo<ThemeBaseline>(
    () => ({
      presetName: preset.name,
      values: {
        colors: { ...preset.themeBaseline.colors },
        spacing: { ...preset.themeBaseline.spacing },
      },
      tokenPrefixes: preset.tokenPrefixes,
      semanticColors: preset.semanticColors,
      cssScope: preset.cssScope,
    }),
    [preset]
  );

  const activePresetName = useThemeStore((s) => s.active?.baseline.presetName);
  const switchPreset = useThemeStore((s) => s.switchPreset);

  useEffect(() => {
    if (activePresetName !== baseline.presetName) {
      switchPreset(baseline);
    }
  }, [baseline, activePresetName, switchPreset]);

  return baseline;
}
