"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { stateImageSrc } from "../../lib/state-images";
import { loadSpaceState } from "../../lib/space-state";
import { worlds, type HospitalityWorld } from "../../lib/worlds";
import "../onboarding/visitor-onboarding.css";
import "./states-explore.css";

function PinIcon() {
  return (
    <svg className="pin" viewBox="0 0 20 26" aria-hidden="true">
      <path d="M10 24.5 C10 24.5 2 15.5 2 9.5 A8 8 0 0 1 18 9.5 C18 15.5 10 24.5 10 24.5Z" />
      <circle cx="10" cy="9.5" r="3.2" />
    </svg>
  );
}

function ArchBlock({
  world,
  label,
  imageFailed,
  onImageError,
}: {
  world: HospitalityWorld;
  label?: string;
  imageFailed?: boolean;
  onImageError?: () => void;
}) {
  const image = stateImageSrc(world);
  return (
    <div className="copy">
      {label ? (
        <p className="arch-eye fade" style={{ "--d": ".2s" } as CSSProperties}>
          {label}
        </p>
      ) : null}
      <h1 className="title arch-state">
        <em className="cu">{world.state}</em>
      </h1>
      <div className="arch-row fade" style={{ "--d": ".8s" } as CSSProperties}>
        <div className={`arch-img${imageFailed ? " noimg" : ""}`}>
          <img src={image} alt={world.property} onError={onImageError} />
        </div>
        <div className="arch-info">
          <p className="arch-prop">{world.property}</p>
          <p className="arch-loc">
            <PinIcon />
            <span>{world.country}</span>
          </p>
          <p className="arch-desc">{world.desc}</p>
          <p className="arch-line">Your State begins here.</p>
        </div>
      </div>
    </div>
  );
}

export default function StatesExplorePage({ onClose }: { onClose: () => void }) {
  const space = useMemo(() => loadSpaceState(), []);
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
        <p className="states-explore-mark">My Space</p>
        <span aria-hidden="true" style={{ minWidth: 44 }} />
      </header>

      <div className="screens">
        <section className={`scr on${selected ? "" : " states-scr"}`} data-name={selected ? "prop" : "states"}>
          <div className="col">
            <div className="stage">
              {selected ? (
                <>
                  <ArchBlock
                    world={selected}
                    imageFailed={failedImages[selected.n]}
                    onImageError={() => setFailedImages((prev) => ({ ...prev, [selected.n]: true }))}
                  />
                  <div className="actions fade" style={{ "--d": "1.2s" } as CSSProperties}>
                    <button className="tlink tl cg" type="button" onClick={() => setSelected(null)}>
                      Back to all States
                    </button>
                  </div>
                </>
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
                      const rec = world.n === space.recommended;
                      const chosen = world.n === space.chosen;
                      const stay = world.n === space.visited;
                      const cls = stay ? "stay" : chosen ? "chosen" : rec ? "rec" : "";
                      const tag = stay
                        ? "Your stay"
                        : chosen
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
