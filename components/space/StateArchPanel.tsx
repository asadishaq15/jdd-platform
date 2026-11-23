"use client";

import type { CSSProperties, ReactNode } from "react";
import { stateImageSrc } from "../../lib/state-images";
import { SPACE_ICON_PIN } from "../../lib/space-icons";
import type { HospitalityWorld } from "../../lib/worlds";
import "./state-arch-panel.css";

export default function StateArchPanel({
  world,
  label,
  imageFailed,
  onImageError,
  actions,
}: {
  world: HospitalityWorld;
  label?: string;
  imageFailed?: boolean;
  onImageError?: () => void;
  actions?: ReactNode;
}) {
  const image = stateImageSrc(world);

  return (
    <article
      className="state-arch-panel fade"
      style={{ "--d": ".4s" } as CSSProperties}
      aria-label={label || `${world.state} — ${world.property}`}
    >
      <div className="state-arch-panel-media">
        <div
          className={`state-arch-panel-arch${imageFailed ? " noimg" : ""}`}
          role="img"
          aria-label={`${world.property} visual`}
        >
          <img src={image} alt={world.property} onError={onImageError} />
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
