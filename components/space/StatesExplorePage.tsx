"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import BrandMark from "../brand/BrandMark";
import { stateImageSrc } from "../../lib/state-images";
import { loadSpaceState } from "../../lib/space-state";
import { worlds, type HospitalityWorld } from "../../lib/worlds";
import StateArchPanel from "./StateArchPanel";
import "../onboarding/visitor-onboarding.css";
import "./states-explore.css";

export default function StatesExplorePage({
  onClose,
  chosen: chosenProp,
  visited: visitedProp,
  recommended: recommendedProp,
  onChooseWorld,
}: {
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

  return (
    <div className="visitor-app states-explore wide" role="dialog" aria-modal="true" aria-label="Explore all States">
      <header className="top states-explore-top">
        <button
          className="back show"
          type="button"
          onClick={() => {
            if (selected) setSelected(null);
            else onClose();
          }}
        >
          Back
        </button>
        <div className="states-explore-brand" aria-hidden="true">
          <BrandMark className="states-explore-logo" decorative />
          <span className="states-explore-mark">My Space</span>
        </div>
        <span aria-hidden="true" style={{ minWidth: 44 }} />
      </header>

      <div className="screens">
        <section className={`scr on${selected ? "" : " states-scr"}`} data-name={selected ? "prop" : "states"}>
          <div className="col">
            <div className="stage">
              {selected ? (
                <StateArchPanel
                  world={selected}
                  imageFailed={failedImages[selected.n]}
                  onImageError={() => setFailedImages((prev) => ({ ...prev, [selected.n]: true }))}
                  actions={(
                    <>
                      {canChoose ? (
                        <button
                          className="tlink bp"
                          type="button"
                          onClick={() => onChooseWorld?.(selected.n)}
                        >
                          Choose this world
                        </button>
                      ) : null}
                      <button className="tlink tl cg" type="button" onClick={() => setSelected(null)}>
                        Back to all States
                      </button>
                    </>
                  )}
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
