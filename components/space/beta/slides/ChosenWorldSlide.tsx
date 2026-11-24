"use client";

import { useEffect, useState } from "react";
import { stateImageGallery } from "../../../../lib/state-images";
import { SPACE_ICON_PIN, SPACE_ICON_SCENT } from "../../../../lib/space-icons";
import type { HospitalityWorld } from "../../../../lib/worlds";
import { worldDetails } from "../../../../lib/worlds";
import BetaExploreStayModal from "../BetaExploreStayModal";

export default function ChosenWorldSlide({
  world,
  guest,
  fromExplore = false,
}: {
  world: HospitalityWorld;
  guest: boolean;
  /** Chosen via Explore all States — show commitment note on the copy column. */
  fromExplore?: boolean;
}) {
  const [bookOpen, setBookOpen] = useState(false);
  const [imageIndex, setImageIndex] = useState(0);
  const detail = worldDetails[world.n] || worldDetails[9];
  const gallery = stateImageGallery(world);
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
            src={image}
            alt={world.property}
          />
          <div className="beta-arch-nav">
            <button
              className="beta-arch-btn"
              type="button"
              aria-label="Previous image"
              disabled={!canCycle}
              onClick={() => stepImage(-1)}
            >
              <svg className="beta-arch-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M18 12 H9.25 M12.25 8.25 L7.5 12 L12.25 15.75"
                  stroke="currentColor"
                  strokeWidth="1.15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
            <button
              className="beta-arch-btn"
              type="button"
              aria-label="Next image"
              disabled={!canCycle}
              onClick={() => stepImage(1)}
            >
              <svg className="beta-arch-arrow" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <path
                  d="M6 12 H14.75 M11.75 8.25 L16.5 12 L11.75 15.75"
                  stroke="currentColor"
                  strokeWidth="1.15"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>

      <div className="beta-split-copy">
        <div className="beta-world-body">
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
          {fromExplore ? (
            <p className="beta-world-commit">
              Changing your world starts a new commitment. You’ll set
              a new intention, who you are becoming, and your actions.
            </p>
          ) : null}
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