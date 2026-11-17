"use client";

import Link from "next/link";
import type { CommunityCircleEvent } from "../../../../lib/space-data";
import { SPACE_ICON_PIN } from "../../../../lib/space-icons";
import type { SpaceState } from "../../../../lib/space-state";
import type { HospitalityWorld } from "../../../../lib/worlds";
import BetaLoopVideo from "../BetaLoopVideo";

const COMMUNITY_SRC = "/assets/bg-06-my-community-globe-stars-loop-15s.mp4";
const COMMUNITY_POSTER = "/assets/bg-06-my-community-globe-stars-poster.jpg";

const CATEGORY_LABELS: Record<CommunityCircleEvent["category"], string> = {
  event: "Event",
  invite: "Guest invitation",
  news: "News",
};

const CATEGORIES = ["event", "invite", "news"] as const;

/** Four balanced lines sized to stay as four rows on mobile */
const COMMUNITY_HERO_LINES = [
  "You belong among people who are willing to see",
  "what others overlook connected by unconventional",
  "perception, creative solitude, experimentation and",
  "the ability to transform limitation into a new point of view.",
] as const;

export default function CommunitySlide({
  world,
  guest,
  state,
  circleEvents,
  onOpenEvent,
  onRequestAccessCode,
}: {
  world: HospitalityWorld;
  guest: boolean;
  state: SpaceState;
  circleEvents: CommunityCircleEvent[];
  onOpenEvent: (eventId: string) => void;
  onRequestAccessCode: () => void;
}) {
  const byCategory = Object.fromEntries(
    CATEGORIES.map((category) => [
      category,
      circleEvents.find((event) => event.category === category) || null,
    ]),
  ) as Record<(typeof CATEGORIES)[number], CommunityCircleEvent | null>;

  const hasAnyEvent = CATEGORIES.some((category) => byCategory[category]);

  return (
    <article className="beta-community" aria-label="My community">
      <div className="beta-community-hero">
        <h2 className="beta-community-title">My community</h2>
        <p className="beta-community-desc">
          {COMMUNITY_HERO_LINES.map((line) => (
            <span key={line} className="beta-community-desc-line">
              {line}
            </span>
          ))}
        </p>
        <Link className="beta-cta" href="/discover?mode=dash">
          {guest ? "Plan your next stay" : "Plan your stay"}{" "}
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="beta-community-video-band" aria-hidden="true">
        <BetaLoopVideo
          className="beta-community-video"
          src={COMMUNITY_SRC}
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

          {hasAnyEvent ? (
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
                const saved = Boolean(state.rsvps?.[item.id] || state.rsvps?.[item.category]);
                return (
                  <button
                    key={item.id}
                    type="button"
                    className="beta-community-col"
                    onClick={() => onOpenEvent(item.id)}
                  >
                    <p className="beta-label">
                      {CATEGORY_LABELS[category]}
                      {saved ? " · Saved" : ""}
                    </p>
                    <p className="beta-community-event-title">{item.title}</p>
                    <p className="beta-community-event-body">{item.body}</p>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="beta-community-empty">
              <p className="beta-community-reserved-title">Nothing published yet.</p>
              <p className="beta-community-reserved-body">
                When {world.property} shares an evening, invitation, or note, it will appear here.
              </p>
            </div>
          )}

          <button className="beta-text-link" type="button" onClick={onRequestAccessCode}>
            Add a code from another stay
          </button>
        </div>
      ) : (
        <div className="beta-community-locked">
          <h3 className="beta-community-reserved-title">
            Reserved for guests of the <em>house.</em>
          </h3>
          <p className="beta-community-reserved-body">
            Private evenings, guest invitations and news
            <br />
            from {world.property} open after your stay.
          </p>
          <button className="beta-text-link" type="button" onClick={onRequestAccessCode}>
            Enter your access code
          </button>
        </div>
      )}
    </article>
  );
}
