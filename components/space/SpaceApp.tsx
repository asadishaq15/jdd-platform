"use client";

import { useLayoutEffect, useState } from "react";
import {
  readSpaceUiVersion,
  type SpaceUiVersion,
  writeSpaceUiVersion,
} from "../../lib/space-ui-version";
import SpaceEntry, { type SpaceEntryProps } from "./SpaceEntry";
import SpaceEntryBeta from "./beta/SpaceEntryBeta";

export default function SpaceApp(props: SpaceEntryProps) {
  const [version, setVersion] = useState<SpaceUiVersion>("classic");

  useLayoutEffect(() => {
    setVersion(readSpaceUiVersion());
  }, []);

  function onUiVersionChange(next: SpaceUiVersion) {
    writeSpaceUiVersion(next);
    setVersion(next);
  }

  if (version === "new") {
    return (
      <SpaceEntryBeta
        {...props}
        uiVersion={version}
        onUiVersionChange={onUiVersionChange}
      />
    );
  }

  return (
    <SpaceEntry
      {...props}
      uiVersion={version}
      onUiVersionChange={onUiVersionChange}
    />
  );
}
