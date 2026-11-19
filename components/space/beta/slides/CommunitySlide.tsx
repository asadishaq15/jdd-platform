"use client";

import Link from "next/link";
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

/** Demo circle cards matching space (1).html circleItem for Stillness / Serein Kyoto. */
export const DEMO_COMMUNITY_EVENTS: CommunityCircleEvent[] = [
  {
    id: "demo-event",
    propertyId: "demo",
    category: "event",
    title: "A long table of Stillness",
    timing: "Thursday, 22 October · 8 pm",
    subtitle: "A silent kaiseki dinner",
    body: "A silent kaiseki dinner. An evening for guests connected by Stillness.",
    thumbnailUrl: "/assets/events/kaiseki.jpg",
  },
  {
    id: "demo-invite",
    propertyId: "demo",
    category: "invite",
    title: "An invitation at dawn",
    timing: "Tuesday, 3 November · 4 pm",
    subtitle: "Moss-garden contemplation at dawn",
    body: "Moss-garden contemplation at dawn. A quiet invitation for guests of Serein Kyoto.",
    thumbnailUrl: "/assets/events/moss.jpg",
  },
  {
    id: "demo-news",
    propertyId: "demo",
    category: "news",
    title: "Now open at Serein Kyoto",
    timing: "This week",
    subtitle: "Private meditation in the tea house",
    body: "Private meditation in the tea house – now open to guests of Serein Kyoto.",
    thumbnailUrl: "/assets/events/tea.jpg",
  },
];

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
  onOpenEvent,
  onRequestAccessCode,
}: {
  world: HospitalityWorld;
  guest: boolean;
  state: SpaceState;
  /** Kept for call-site compatibility; unlocked grid uses DEMO_COMMUNITY_EVENTS for now. */
  circleEvents?: CommunityCircleEvent[];
  onOpenEvent: (eventId: string) => void;
  onRequestAccessCode: () => void;
}) {
  const byCategory = Object.fromEntries(
    CATEGORIES.map((category) => [
      category,
      DEMO_COMMUNITY_EVENTS.find((event) => event.category === category) || null,
    ]),
  ) as Record<(typeof CATEGORIES)[number], CommunityCircleEvent | null>;

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
                  <p className="beta-community-event-body">{item.subtitle || item.body}</p>
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
