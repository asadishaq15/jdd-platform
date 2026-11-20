"use client";

import { useState } from "react";
import { SPACE_ICON_PIN, SPACE_ICON_SCENT } from "../../../../lib/space-icons";
import type { HospitalityWorld } from "../../../../lib/worlds";
import { worldDetails } from "../../../../lib/worlds";
import BetaExploreStayModal from "../BetaExploreStayModal";

export default function ChosenWorldSlide({
  world,
  guest,
}: {
  world: HospitalityWorld;
  guest: boolean;
}) {
  const [bookOpen, setBookOpen] = useState(false);
  const detail = worldDetails[world.n] || worldDetails[9];

  return (
    <article
      className="beta-split beta-world"
      aria-label={guest ? "Your stay" : "Your chosen world"}
    >
      <div className="beta-split-media">
        <div
          className="beta-arch"
          style={{ "--h": (world.n * 37) % 360 } as React.CSSProperties}
          role="img"
          aria-label={`${world.property} visual`}
        >
          <img
            className="beta-arch-photo"
            src="/assets/photo-oblique-house-lake-lounge.jpg"
            alt=""
            aria-hidden="true"
          />
          <div className="beta-arch-nav" aria-hidden="true">
            <span className="beta-arch-btn">
              <svg className="beta-arch-arrow" viewBox="0 0 24 24" fill="none">
                <path
                  d="M18 12 H9.25 M12.25 8.25 L7.5 12 L12.25 15.75"
                  stroke="currentColor"
                  strokeWidth="1.15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            <span className="beta-arch-btn">
              <svg className="beta-arch-arrow" viewBox="0 0 24 24" fill="none">
                <path
                  d="M6 12 H14.75 M11.75 8.25 L16.5 12 L11.75 15.75"
                  stroke="currentColor"
                  strokeWidth="1.15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
          </div>
        </div>
      </div>

      <div className="beta-split-copy">
        <h2 className="beta-world-name">{world.property}</h2>
        <p className="beta-world-place">
          <img className="beta-inline-icon" src={SPACE_ICON_PIN} alt="" aria-hidden="true" />
          {world.country}
        </p>
        <p className="beta-world-lead">
          Experience your <em>State</em> here.
        </p>
        <ul className="beta-world-list">
          {detail.experiences.map((experience) => (
            <li key={experience}>{experience}</li>
          ))}
        </ul>
        <div className="beta-world-cta">
          {guest ? (
            <>
              <button className="beta-cta" type="button" disabled>
                Reflect on your stay <span aria-hidden="true">→</span>
              </button>
              <p className="beta-cta-note">Opens after your check-out.</p>
            </>
          ) : (
            <button className="beta-cta" type="button" onClick={() => setBookOpen(true)}>
              Book your stay <span aria-hidden="true">→</span>
            </button>
          )}
        </div>
        <div className="beta-scent-foot">
          <p className="beta-label beta-scent-label">
            <img className="beta-inline-icon" src={SPACE_ICON_SCENT} alt="" aria-hidden="true" />
            Scent introduction
          </p>
          <p className="beta-scent-line">{detail.scent}</p>
        </div>
      </div>

      <BetaExploreStayModal
        property={world.property}
        open={bookOpen}
        onClose={() => setBookOpen(false)}
      />
    </article>
  );
}