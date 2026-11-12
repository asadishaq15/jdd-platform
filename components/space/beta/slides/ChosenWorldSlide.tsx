"use client";

import Link from "next/link";
import type { HospitalityWorld } from "../../../../lib/worlds";
import { worldDetails } from "../../../../lib/worlds";

export default function ChosenWorldSlide({
  world,
  guest,
}: {
  world: HospitalityWorld;
  guest: boolean;
}) {
  const detail = worldDetails[world.n] || worldDetails[9];

  return (
    <article className="beta-split beta-world" aria-label="Your chosen world">
      <div className="beta-split-media">
        <div
          className="beta-arch"
          style={{ "--h": (world.n * 37) % 360 } as React.CSSProperties}
          role="img"
          aria-label={`${world.property} visual`}
        >
          <span className="beta-arch-cap">{world.property}</span>
        </div>
        <div className="beta-arch-nav" aria-hidden="true">
          <span className="beta-arch-btn">‹</span>
          <span className="beta-arch-btn">›</span>
        </div>
      </div>

      <div className="beta-split-copy">
        <p className="beta-eyebrow">{guest ? "Your stay" : "Your chosen world"}</p>
        <h2 className="beta-world-name">{world.property}</h2>
        <p className="beta-world-place">
          <span className="beta-pin" aria-hidden="true" />
          {world.country}
        </p>
        <p className="beta-world-lead">
          Experience your <em className="cu">State</em> here.
        </p>
        <ul className="beta-world-list">
          {detail.experiences.map((experience) => (
            <li key={experience}>{experience}</li>
          ))}
        </ul>
        <Link className="beta-cta" href="/discover?mode=dash">
          Book your stay <span aria-hidden="true">→</span>
        </Link>
        <div className="beta-scent-foot">
          <p className="beta-label">Scent introduction</p>
          <p className="beta-scent-line">{detail.scent}</p>
        </div>
      </div>
    </article>
  );
}
