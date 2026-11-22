"use client";

import { useMemo, useState } from "react";
import {
  JOURNEY_DEMO_EVENTS,
  type JourneyEvent,
} from "../../../lib/my-journey-demo";
import "./space-drawer.css";

function CameraPlaceholder() {
  return (
    <div className="ph">
      <svg viewBox="0 0 24 24" fill="none" stroke="#D6A06D" strokeWidth="1.2" aria-hidden="true">
        <rect x="3" y="6" width="18" height="13" rx="1.5" />
        <circle cx="12" cy="12.5" r="3.5" />
        <path d="M8 6l1.5-2h5L16 6" />
      </svg>
      <span>Event photo</span>
    </div>
  );
}

export default function SpaceEventsDrawer({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [events, setEvents] = useState<JourneyEvent[]>(() =>
    JOURNEY_DEMO_EVENTS.map((item) => ({ ...item })),
  );
  const [evTab, setEvTab] = useState<"upcoming" | "past">("upcoming");

  const upcoming = useMemo(
    () => events.filter((event) => event.status === "reserved" && !event.cancelled),
    [events],
  );
  const past = useMemo(
    () => events.filter((event) => event.status === "to-confirm" || event.status === "attended"),
    [events],
  );
  const eventList = evTab === "upcoming" ? upcoming : past;

  function cancelEvent(id: string) {
    setEvents((prev) =>
      prev.map((item) => (item.id === id ? { ...item, cancelled: true } : item)),
    );
  }

  function answerAttendance(id: string, yes: boolean) {
    setEvents((prev) =>
      prev.map((item) => {
        if (item.id !== id) return item;
        if (yes) return { ...item, status: "attended", answered: null };
        return { ...item, answered: "Noted." };
      }),
    );
  }

  if (!open) return null;

  return (
    <div
      className="space-drawer-overlay open"
      role="presentation"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <aside
        className="space-drawer-panel space-events-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="My events"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="space-drawer-scroll">
          <div className="space-drawer-eyebrow">My events</div>
          <h3>
            Your <span className="cg">events</span>.
          </h3>
          <div className="space-ev-tabs">
          <button type="button" className={evTab === "upcoming" ? "on" : ""} onClick={() => setEvTab("upcoming")}>
            Upcoming<span className="count">{upcoming.length}</span>
          </button>
          <button type="button" className={evTab === "past" ? "on" : ""} onClick={() => setEvTab("past")}>
            Past<span className="count">{past.length}</span>
          </button>
        </div>
        {eventList.length ? (
          eventList.map((event) => (
            <div className="space-ev" key={event.id}>
              <div className="space-ev-img">
                {event.photo ? <img src={event.photo} alt="" /> : <CameraPlaceholder />}
              </div>
              <div className="space-ev-copy">
                <div className="meta">{event.date}</div>
                <h4>{event.title}</h4>
                <div className="ev-hotel">{event.hotel}</div>
                {event.status === "reserved" ? (
                  <>
                    <div className="status">Your place is reserved</div>
                    <div className="links">
                      <button className="muted" type="button" onClick={() => cancelEvent(event.id)}>Cancel</button>
                    </div>
                  </>
                ) : null}
                {event.status === "attended" ? <div className="status">Attended</div> : null}
                {event.status === "to-confirm" ? (
                  event.answered ? (
                    <div className="done">{event.answered}</div>
                  ) : (
                    <>
                      <p className="ask">Did you attend?</p>
                      <div className="btn-row">
                        <button className="btn primary" type="button" onClick={() => answerAttendance(event.id, true)}>
                          Yes, I was there
                        </button>
                        <button className="btn" type="button" onClick={() => answerAttendance(event.id, false)}>
                          I missed it
                        </button>
                      </div>
                    </>
                  )
                ) : null}
              </div>
            </div>
          ))
        ) : (
          <div className="space-ev-empty">
            {evTab === "upcoming" ? "No upcoming events." : "No past events yet."}
          </div>
        )}
        </div>
        <p className="links small space-drawer-foot">
          <button className="tlink" type="button" onClick={onClose}>
            Close
          </button>
        </p>
      </aside>
    </div>
  );
}
