export const SPACE_UI_KEY = "jdd-space-ui";

export type SpaceUiVersion = "classic" | "new";

export function isSpaceUiVersion(value: unknown): value is SpaceUiVersion {
  return value === "classic" || value === "new";
}

export function readSpaceUiVersion(): SpaceUiVersion {
  try {
    const saved = localStorage.getItem(SPACE_UI_KEY);
    if (isSpaceUiVersion(saved)) return saved;
  } catch {}
  return "new";
}

export function writeSpaceUiVersion(version: SpaceUiVersion) {
  try {
    localStorage.setItem(SPACE_UI_KEY, version);
  } catch {}
}
