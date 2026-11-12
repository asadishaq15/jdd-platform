"use client";

import { useEffect, useState } from "react";
import type { CommunityCircleEvent } from "../../../lib/space-data";
import type { SpaceState } from "../../../lib/space-state";
import type { HospitalityWorld } from "../../../lib/worlds";

const CATEGORY_LABELS: Record<CommunityCircleEvent["category"], string> = {
  event: "Event",
  invite: "Guest invitation",
  news: "News",
};

const CATEGORY_ACTIONS: Record<"event" | "invite", string> = {
  event: "Reserve my place",
  invite: "Accept invitation",
};

const CATEGORY_DONE: Record<"event" | "invite", string> = {
  event: "Place reserved",
  invite: "Invitation accepted",
};

export default function BetaCircleDetail({
  world,
  event,
  state,
  activeStayId,
  onSave,
  onBack,
}: {
  world: HospitalityWorld;
  event: CommunityCircleEvent;
  state: SpaceState;
  activeStayId?: string;
  onSave: (next: SpaceState) => void;
  onBack: () => void;
}) {
  const [rsvpError, setRsvpError] = useState("");
  const [rsvping, setRsvping] = useState(false);
  const saved = Boolean(state.rsvps?.[event.id] || state.rsvps?.[event.category]);
  const rsvpCategory = event.category === "news" ? null : event.category;

  useEffect(() => {
    if (event.category !== "news" || !activeStayId) return;
    void fetch("/api/community/view", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId: event.id, stayId: activeStayId }),
    }).catch(() => {
      // Fire-and-forget: view counting should not interrupt reading news.
    });
  }, [event.category, event.id, activeStayId]);

  async function rsvp() {
    if (!rsvpCategory) return;
    if (!activeStayId) {
      setRsvpError("Activate a stay before responding.");
      return;
    }
    if (saved) return;
    setRsvping(true);
    setRsvpError("");
    const response = await fetch("/api/community/rsvp", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ eventId: event.id, stayId: activeStayId }),
    });
    const result = await response.json().catch(() => ({}));
    setRsvping(false);
    if (!response.ok) {
      setRsvpError(result.error || "Unable to save your response.");
      return;
    }
    onSave({
      ...state,
      rsvps: {
        ...(state.rsvps || {}),
        [event.id]: true,
        [event.category]: true,
      },
    });
  }

  return (
    <section className="beta-circle-detail" aria-label={`${CATEGORY_LABELS[event.category]} detail`}>
      <p className="beta-eyebrow">
        {CATEGORY_LABELS[event.category]} · {world.property}
      </p>
      <h1 className="beta-circle-title">{event.title}</h1>
      <p className="beta-muted">{event.timing}</p>
      {event.thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="beta-circle-thumb" src={event.thumbnailUrl} alt="" />
      )}
      <p className="beta-circle-body">{event.body}</p>
      {rsvpCategory && (
        saved ? (
          <>
            <p className="beta-circle-confirm">{CATEGORY_DONE[rsvpCategory]}</p>
            <p className="beta-muted">Saved in My events.</p>
          </>
        ) : (
          <button
            className="beta-cta"
            type="button"
            disabled={rsvping}
            onClick={() => void rsvp()}
          >
            {rsvping ? "Saving…" : CATEGORY_ACTIONS[rsvpCategory]}{" "}
            <span aria-hidden="true">→</span>
          </button>
        )
      )}
      {rsvpError && <p className="beta-code-error" role="alert">{rsvpError}</p>}
      <p className="links small">
        <button className="tlink" type="button" onClick={onBack}>Back</button>
      </p>
    </section>
  );
}
