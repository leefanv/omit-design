import { useEffect, useState, type ChangeEvent, type KeyboardEvent } from "react";
import type { PresetManifest } from "../preset";

export interface Viewport {
  width: number;
  height: number;
}

const MIN_DIM = 240;
/** Desktop preset 最大到 1920，给一点余量 */
const MAX_DIM = 1920;

interface Props {
  viewport: Viewport;
  onChange: (next: Viewport) => void;
  /** 当前 project 的 preset —— 决定下拉里列哪些预设 */
  preset: PresetManifest;
}

export function DeviceToolbar({ viewport, onChange, preset }: Props) {
  const presets = preset.canvas.presets;
  const match = presets.find(
    (p) => p.width === viewport.width && p.height === viewport.height,
  );
  const presetValue = match ? match.label : "__custom";

  // 草稿 state：允许输入过程值（空串、低于最小值的半成品），只在 blur / Enter 时 clamp 并上报。
  // 否则每次按键都 clamp 会把 "5"（想输 500）立刻拉回 240，用户根本没法改值。
  const [draftW, setDraftW] = useState(String(viewport.width));
  const [draftH, setDraftH] = useState(String(viewport.height));

  useEffect(() => {
    setDraftW(String(viewport.width));
  }, [viewport.width]);
  useEffect(() => {
    setDraftH(String(viewport.height));
  }, [viewport.height]);

  function applyPreset(e: ChangeEvent<HTMLSelectElement>) {
    const label = e.target.value;
    const p = presets.find((x) => x.label === label);
    if (p) onChange({ width: p.width, height: p.height });
  }

  function commitDim(field: "width" | "height", raw: string) {
    const n = Number.parseInt(raw, 10);
    if (!Number.isFinite(n)) {
      // 无效输入 → 恢复为当前 viewport 值
      if (field === "width") setDraftW(String(viewport.width));
      else setDraftH(String(viewport.height));
      return;
    }
    const clamped = Math.min(MAX_DIM, Math.max(MIN_DIM, n));
    if (field === "width") setDraftW(String(clamped));
    else setDraftH(String(clamped));
    if (clamped !== viewport[field]) {
      onChange({ ...viewport, [field]: clamped });
    }
  }

  function onDimKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      (e.currentTarget as HTMLInputElement).blur();
    }
  }

  function rotate() {
    onChange({ width: viewport.height, height: viewport.width });
  }

  return (
    <div className="shell-device-toolbar" data-no-inspect>
      <select
        className="shell-device-toolbar__preset"
        value={presetValue}
        onChange={applyPreset}
        aria-label="设备预设"
      >
        {presets.map((p) => (
          <option key={p.label} value={p.label}>
            {p.label}
          </option>
        ))}
        <option value="__custom" disabled>
          自定义
        </option>
      </select>

      <div className="shell-device-toolbar__dims">
        <input
          type="number"
          className="shell-device-toolbar__input"
          value={draftW}
          min={MIN_DIM}
          max={MAX_DIM}
          onChange={(e) => setDraftW(e.target.value)}
          onBlur={(e) => commitDim("width", e.target.value)}
          onKeyDown={onDimKeyDown}
          aria-label="宽度 (px)"
        />
        <span className="shell-device-toolbar__x">×</span>
        <input
          type="number"
          className="shell-device-toolbar__input"
          value={draftH}
          min={MIN_DIM}
          max={MAX_DIM}
          onChange={(e) => setDraftH(e.target.value)}
          onBlur={(e) => commitDim("height", e.target.value)}
          onKeyDown={onDimKeyDown}
          aria-label="高度 (px)"
        />
      </div>

      <button
        type="button"
        className="shell-device-toolbar__rotate"
        onClick={rotate}
        aria-label="旋转方向"
        title="旋转方向"
      >
        ⤾
      </button>
    </div>
  );
}
