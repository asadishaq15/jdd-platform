"use client";

import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import { stateImageGallery } from "../../lib/state-images";
import { SPACE_ICON_PIN } from "../../lib/space-icons";
import type { HospitalityWorld } from "../../lib/worlds";
import "./state-arch-panel.css";

function ArchArrow({ dir }: { dir: "prev" | "next" }) {
  return (
    <svg className="state-arch-panel-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {dir === "prev" ? (
        <path
          d="M18 12 H9.25 M12.25 8.25 L7.5 12 L12.25 15.75"
          stroke="currentColor"
          strokeWidth="1.15"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : (
        <path
          d="M6 12 H14.75 M11.75 8.25 L16.5 12 L11.75 15.75"
          stroke="currentColor"
          strokeWidth="1.15"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  );
}

export default function StateArchPanel({
  world,
  label,
  imageFailed,
  onImageError,
  actions,
  showArchNav = false,
}: {
  world: HospitalityWorld;
  label?: string;
  imageFailed?: boolean;
  onImageError?: () => void;
  actions?: ReactNode;
  /** Left/right controls cycle this world’s photos (disabled when only one). */
  showArchNav?: boolean;
}) {
  const gallery = stateImageGallery(world);
  const [imageIndex, setImageIndex] = useState(0);
  const canCycle = gallery.length > 1;
  const image = gallery[Math.min(imageIndex, gallery.length - 1)] || gallery[0];

  useEffect(() => {
    setImageIndex(0);
  }, [world.n]);

  function stepImage(delta: number) {
    if (!canCycle) return;
    setImageIndex((prev) => (prev + delta + gallery.length) % gallery.length);
  }

  return (
    <article
      className="state-arch-panel fade"
      style={{ "--d": ".4s", "--h": (world.n * 37) % 360 } as CSSProperties}
      aria-label={label || `${world.state} — ${world.property}`}
    >
      <div className="state-arch-panel-media">
        <div
          className={`state-arch-panel-arch${imageFailed ? " noimg" : ""}`}
          role="img"
          aria-label={`${world.property} visual`}
        >
          <img src={image} alt={world.property} onError={onImageError} />
          {showArchNav ? (
            <div className="state-arch-panel-nav">
              <button
                className="state-arch-panel-btn"
                type="button"
                aria-label="Previous image"
                disabled={!canCycle}
                onClick={() => stepImage(-1)}
              >
                <ArchArrow dir="prev" />
              </button>
              <button
                className="state-arch-panel-btn"
                type="button"
                aria-label="Next image"
                disabled={!canCycle}
                onClick={() => stepImage(1)}
              >
                <ArchArrow dir="next" />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      <div className="state-arch-panel-copy">
        {label ? <p className="state-arch-panel-eye">{label}</p> : null}
        <h1 className="state-arch-panel-state">
          <em className="cu">{world.state}</em>
        </h1>
        <p className="state-arch-panel-prop">{world.property}</p>
        <p className="state-arch-panel-loc">
          <img className="state-arch-panel-pin" src={SPACE_ICON_PIN} alt="" aria-hidden="true" />
          <span>{world.country}</span>
        </p>
        <p className="state-arch-panel-desc">{world.desc}</p>
        <p className="state-arch-panel-line">Your State begins here.</p>
        {actions ? <div className="state-arch-panel-actions">{actions}</div> : null}
      </div>
    </article>
  );
}
