"use client";

import { useState } from "react";
import { communityCircleForWorld } from "../../../../lib/community-circle";
import BetaExploreStayModal from "../BetaExploreStayModal";
import type { CommunityCircleEvent } from "../../../../lib/space-data";
import { SPACE_ICON_PIN } from "../../../../lib/space-icons";
import type { SpaceState } from "../../../../lib/space-state";
import type { HospitalityWorld } from "../../../../lib/worlds";
import BetaLoopVideo from "../BetaLoopVideo";

const COMMUNITY_SRC = "/assets/bg-06-my-community-globe-stars-loop-15s.mp4";
const COMMUNITY_LIGHT_SRC = "/assets/bg-06-my-community-globe-stars-loop-15s_light.mp4";
const COMMUNITY_POSTER = "/assets/bg-06-my-community-globe-stars-poster.jpg";

const CATEGORY_LABELS: Record<CommunityCircleEvent["category"], string> = {
  event: "Event",
  invite: "Guest invitation",
  news: "News",
};

const CATEGORIES = ["event", "invite", "news"] as const;

export default function CommunitySlide({
  world,
  guest,
  state,
  onOpenEvent,
  onRequestAccessCode,
}: {
  world: HospitalityWorld;
  guest: boolean;
  state: SpaceState;
  /** Kept for call-site compatibility. The grid uses the HTML circle for the open stay. */
  circleEvents?: CommunityCircleEvent[];
  onOpenEvent: (eventId: string) => void;
  onRequestAccessCode: () => void;
}) {
  const [stayNoteOpen, setStayNoteOpen] = useState(false);
  const circle = communityCircleForWorld(world);

  const byCategory = Object.fromEntries(
    CATEGORIES.map((category) => [
      category,
      circle.find((event) => event.category === category) || null,
    ]),
  ) as Record<(typeof CATEGORIES)[number], CommunityCircleEvent | null>;

  return (
    <article className="beta-community" aria-label="My community">
      <div className="beta-community-hero">
        <h2 className="beta-community-title">My community</h2>
        <p className="beta-mantra beta-community-mantra">{world.mantra}</p>
        <p className="beta-community-desc">
          <span className="beta-community-desc-body">{world.desc}</span>
        </p>
        <button className="beta-cta" type="button" onClick={() => setStayNoteOpen(true)}>
          {guest ? "Plan your next stay" : "Plan your stay"}{" "}
          <span aria-hidden="true">→</span>
        </button>
      </div>

      <div className="beta-community-video-band" aria-hidden="true">
        <BetaLoopVideo
          className="beta-community-video"
          src={COMMUNITY_SRC}
          lightSrc={COMMUNITY_LIGHT_SRC}
          poster={COMMUNITY_POSTER}
        />
      </div>

      {guest ? (
        <div className="beta-community-unlocked">
          <div className="beta-community-place">
            <p className="beta-community-property">{world.property}</p>
            <p className="beta-world-place">
              <img className="beta-inline-icon" src={SPACE_ICON_PIN} alt="" aria-hidden="true" />
              {world.country}
            </p>
          </div>

          <div className="beta-community-grid">
            {CATEGORIES.map((category) => {
              const item = byCategory[category];
              if (!item) {
                return (
                  <div key={category} className="beta-community-col empty">
                    <p className="beta-label">{CATEGORY_LABELS[category]}</p>
                    <p className="beta-muted">Nothing published yet.</p>
                  </div>
                );
              }
              const saved = Boolean(state.rsvps?.[item.id]);
              return (
                <button
                  key={item.id}
                  type="button"
                  className="beta-community-col"
                  onClick={() => onOpenEvent(item.id)}
                >
                  {item.thumbnailUrl ? (
                    <span className="beta-community-thumb">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={item.thumbnailUrl} alt="" />
                    </span>
                  ) : null}
                  <span className="beta-community-copy">
                    <p className="beta-label">
                      {CATEGORY_LABELS[category]}
                      {saved ? " · Saved" : ""}
                    </p>
                    <p className="beta-community-event-title">{item.title}</p>
                    <p className="beta-community-event-body">{item.body}</p>
                  </span>
                </button>
              );
            })}
          </div>

          <button className="beta-text-link" type="button" onClick={onRequestAccessCode}>
            Add a code from another stay
          </button>
        </div>
      ) : (
        <div className="beta-community-locked">
          <h3 className="beta-community-reserved-title">Reserved for hotel guests</h3>
          <p className="beta-community-reserved-body">
            Private evenings, guest invitations and news
            <br />
            from {world.property} open with your stay.
          </p>
          <button className="beta-text-link" type="button" onClick={onRequestAccessCode}>
            Enter your access code
          </button>
        </div>
      )}

      <BetaExploreStayModal
        property={world.property}
        open={stayNoteOpen}
        onClose={() => setStayNoteOpen(false)}
      />
    </article>
  );
}
