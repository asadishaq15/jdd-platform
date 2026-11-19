"use client";

import { useState } from "react";
import { worlds, type HospitalityWorld } from "../../../lib/worlds";
import "./space-drawer.css";

const STATE_IMAGES: Record<string, string> = {
  direction: "/images/journey/direction.jpg",
  stillness: "/images/journey/stillness.jpg",
  perspective: "/images/journey/perspective.jpg",
  connection: "/images/journey/connection.jpg",
};

function stateImage(world: HospitalityWorld) {
  const key = world.state.toLowerCase().replace(/\s+/g, "-");
  return STATE_IMAGES[key] || null;
}

export default function ExploreStatesDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [selected, setSelected] = useState<HospitalityWorld | null>(null);

  if (!open) return null;

  return (
    <div
      className="space-drawer-overlay open"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          setSelected(null);
          onClose();
        }
      }}
    >
      <aside
        className="space-drawer-panel"
        role="dialog"
        aria-modal="true"
        aria-label="Explore all States"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-drawer-top">
          <div className="space-drawer-eyebrow">Explore</div>
          <button
            className="space-drawer-close"
            type="button"
            onClick={() => {
              setSelected(null);
              onClose();
            }}
          >
            Close
          </button>
        </div>
        <h3>
          Explore all <span className="cg">States</span>.
        </h3>
        <p className="space-drawer-eyebrow" style={{ marginBottom: 18, textTransform: "none", letterSpacing: 0 }}>
          22 States. 22 hospitality worlds.
        </p>

        {selected ? (
          <div className="space-st-detail">
            <p className="space-st-name">{selected.state}</p>
            <p className="space-st-meta">
              {selected.property} · {selected.country}
            </p>
            <p className="mantra">{selected.mantra}</p>
            <p>{selected.desc}</p>
            <p className="links small">
              <button
                className="tlink"
                type="button"
                onClick={() => setSelected(null)}
              >
                Back to all States
              </button>
            </p>
          </div>
        ) : (
          <div className="space-states-grid">
            {worlds.map((world) => {
              const image = stateImage(world);
              return (
                <button
                  key={world.n}
                  type="button"
                  className="space-st-cell"
                  onClick={() => setSelected(world)}
                >
                  <div
                    className="space-st-arch"
                    style={{ ["--h" as string]: (world.n * 37) % 360 }}
                  >
                    {image ? <img src={image} alt="" /> : null}
                  </div>
                  <div>
                    <div className="space-st-name">{world.state}</div>
                    <div className="space-st-meta">
                      {world.property} · {world.country}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </aside>
    </div>
  );
}
