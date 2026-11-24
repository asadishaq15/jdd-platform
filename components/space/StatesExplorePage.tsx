"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import type { AccountSummary } from "../../lib/space-data";
import { stateImageSrc } from "../../lib/state-images";
import { loadSpaceState } from "../../lib/space-state";
import type { SpaceUiVersion } from "../../lib/space-ui-version";
import { worlds, type HospitalityWorld } from "../../lib/worlds";
import StateArchPanel from "./StateArchPanel";
import SpaceBetaHeader, { type SpaceProfileAction } from "./beta/SpaceBetaHeader";
import "../onboarding/visitor-onboarding.css";
import "./beta/space-entry-beta.css";
import "./states-explore.css";

export default function StatesExplorePage({
  account,
  uiVersion,
  onUiVersionChange,
  onProfileAction,
  onSignOut,
  onClose,
  chosen: chosenProp,
  visited: visitedProp,
  recommended: recommendedProp,
  onChooseWorld,
}: {
  account: AccountSummary;
  uiVersion: SpaceUiVersion;
  onUiVersionChange: (version: SpaceUiVersion) => void;
  onProfileAction: (action: SpaceProfileAction) => void;
  onSignOut: () => void;
  onClose: () => void;
  chosen?: number;
  visited?: number;
  recommended?: number;
  onChooseWorld?: (n: number) => void;
}) {
  const stored = useMemo(() => loadSpaceState(), []);
  const chosen = chosenProp ?? stored.chosen;
  const visited = visitedProp ?? stored.visited;
  const recommended = recommendedProp ?? stored.recommended;
  const [selected, setSelected] = useState<HospitalityWorld | null>(null);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== "Escape") return;
      if (selected) setSelected(null);
      else onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [selected, onClose]);

  const canChoose =
    Boolean(onChooseWorld) && selected != null && selected.n !== chosen;

  function handleBack() {
    if (selected) setSelected(null);
    else onClose();
  }

  return (
    <div
      className="visitor-app states-explore wide space-entry-beta"
      role="dialog"
      aria-modal="true"
      aria-label="Explore all States"
    >
      <SpaceBetaHeader
        account={account}
        menuOpen={menuOpen}
        uiVersion={uiVersion}
        onUiVersionChange={onUiVersionChange}
        showUiToggle={false}
        onToggleMenu={() => setMenuOpen((value) => !value)}
        onCloseMenu={() => setMenuOpen(false)}
        onProfileAction={(action) => {
          if (action === "explore") {
            setMenuOpen(false);
            return;
          }
          onProfileAction(action);
        }}
        onSignOut={onSignOut}
        topStart={
          <button className="beta-hback" type="button" onClick={handleBack}>
            Back
          </button>
        }
      />

      <div className="screens">
        <section className={`scr on${selected ? "" : " states-scr"}`} data-name={selected ? "prop" : "states"}>
          <div className="col">
            <div className="stage">
              {selected ? (
                <StateArchPanel
                  world={selected}
                  imageFailed={failedImages[selected.n]}
                  onImageError={() => setFailedImages((prev) => ({ ...prev, [selected.n]: true }))}
                  showArchNav
                  actions={
                    canChoose ? (
                      <>
                        <button
                          className="tlink bp"
                          type="button"
                          onClick={() => onChooseWorld?.(selected.n)}
                        >
                          Choose this world
                        </button>
                        <p className="states-explore-commit">
                          Changing your world starts a new commitment. You’ll set
                          a new intention, who you are becoming, and your actions.
                        </p>
                      </>
                    ) : undefined
                  }
                />
              ) : (
                <>
                  <p className="eyebrow fade" style={{ "--d": ".2s" } as CSSProperties}>
                    22 States · 22 hospitality worlds
                  </p>
                  <h1 className="title">
                    Explore the <em className="cu">States</em>.
                  </h1>
                  <div className="states-grid fade" style={{ "--d": ".9s" } as CSSProperties}>
                    {worlds.map((world) => {
                      const image = stateImageSrc(world);
                      const rec = world.n === recommended;
                      const isChosen = world.n === chosen;
                      const stay = world.n === visited;
                      const cls = stay ? "stay" : isChosen ? "chosen" : rec ? "rec" : "";
                      const tag = stay
                        ? "Your stay"
                        : isChosen
                          ? "Your chosen world"
                          : rec
                            ? "Your recommended world"
                            : "";
                      return (
                        <button
                          key={world.n}
                          type="button"
                          className={`st-cell ${cls}`.trim()}
                          onClick={() => setSelected(world)}
                        >
                          {tag ? (
                            <span className="c-beacon" aria-hidden="true">
                              <span className="cb-tag">{tag}</span>
                              <span className="cb-line" />
                              <span className="cb-dot" />
                            </span>
                          ) : null}
                          <span className={`c-img${failedImages[world.n] ? " noimg" : ""}`}>
                            <img
                              src={image}
                              alt=""
                              loading="lazy"
                              onError={() => setFailedImages((prev) => ({ ...prev, [world.n]: true }))}
                            />
                          </span>
                          <span className="c-txt">
                            <span className="c-h">{world.state}</span>
                            <span className="c-l">
                              {world.property} · {world.country}
                            </span>
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
