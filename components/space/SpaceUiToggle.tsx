"use client";

import {
  type SpaceUiVersion,
  writeSpaceUiVersion,
} from "../../lib/space-ui-version";

export default function SpaceUiToggle({
  version,
  onChange,
}: {
  version: SpaceUiVersion;
  onChange: (version: SpaceUiVersion) => void;
}) {
  const isNew = version === "new";

  function toggle() {
    const next: SpaceUiVersion = isNew ? "classic" : "new";
    writeSpaceUiVersion(next);
    onChange(next);
  }

  return (
    <button
      className="space-ui-toggle"
      type="button"
      aria-label={isNew ? "Switch to Classic Space UI" : "Switch to New Space UI"}
      aria-pressed={isNew}
      onClick={toggle}
    >
      <span className="space-ui-toggle-label">{isNew ? "New" : "Classic"}</span>
    </button>
  );
}
