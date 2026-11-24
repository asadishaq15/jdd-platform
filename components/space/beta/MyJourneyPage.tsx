"use client";

import { useEffect, useLayoutEffect, useState, type ReactNode } from "react";
import type { AccountSummary } from "../../../lib/space-data";
import {
  JOURNEY_DEMO_NOTIFICATIONS,
  JOURNEY_DEMO_WORLDS,
  type JourneyNotification,
  type JourneyStay,
  type JourneyWorld,
} from "../../../lib/my-journey-demo";
import BrandMark from "../../brand/BrandMark";
import ThemeToggle from "../../layout/ThemeToggle";
import type { SpaceProfileAction } from "./SpaceBetaHeader";
import "./my-journey.css";

const THEME_KEY = "jdd-theme";

function readJourneyLight() {
  if (typeof document !== "undefined" && document.body.classList.contains("night")) {
    return false;
  }
  try {
    if (typeof localStorage !== "undefined" && localStorage.getItem(THEME_KEY) === "dark") {
      return false;
    }
  } catch {
    // ignore
  }
  return true;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseIso(iso: string) {
  return new Date(`${iso}T00:00:00`);
}

function monthYear(iso: string) {
  const d = parseIso(iso);
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function fullDate(iso: string) {
  const d = parseIso(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

function stayRange(stay: JourneyStay) {
  const a = parseIso(stay.from);
  const b = parseIso(stay.to);
  return a.getMonth() === b.getMonth()
    ? `${a.getDate()}–${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`
    : `${a.getDate()} ${MONTHS[a.getMonth()]} – ${b.getDate()} ${MONTHS[b.getMonth()]} ${b.getFullYear()}`;
}

function PinIcon() {
  return (
    <svg className="ico" viewBox="0 0 20 26" fill="none" stroke="#D6A06D" strokeWidth="1.6" aria-hidden="true">
      <path d="M10 24.5 C10 24.5 2 15.5 2 9.5 A8 8 0 0 1 18 9.5 C18 15.5 10 24.5 10 24.5Z" />
      <circle cx="10" cy="9.5" r="3.2" />
    </svg>
  );
}

function NoseIcon() {
  return (
    <svg className="ico nose" viewBox="0 0 26 26" fill="none" stroke="#D6A06D" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M9 1.5 V8 L3.5 16.5 C2.5 18.5 3 21 5.5 21.5" />
      <path d="M17 1.5 V8 L22.5 16.5 C23.5 18.5 23 21 20.5 21.5" />
      <path d="M4.5 19 C6.5 18.5 8.5 19 9.5 21 C11 23.5 15 23.5 16.5 21 C17.5 19 19.5 18.5 21.5 19" />
    </svg>
  );
}

function DatesBlock({
  world,
  staysOpen,
  onToggleStays,
}: {
  world: JourneyWorld;
  staysOpen: boolean;
  onToggleStays: () => void;
}) {
  const now = world.current ? <span className="lead">Now · </span> : null;

  if (world.status === "chosen") {
    return (
      <div className="eyebrow dates">
        {world.current ? <span className="lead">Now · </span> : null}
        Since {fullDate(world.chosenSince || "")}
      </div>
    );
  }

  const n = world.stays.length;
  if (world.status === "in-stay" || n === 1) {
    return (
      <div className="eyebrow dates">
        {now}
        {stayRange(world.stays[0])}
      </div>
    );
  }

  if (n === 2) {
    return (
      <div className="eyebrow dates">
        {now}2 stays
        <br />
        {monthYear(world.stays[0].from)} · {monthYear(world.stays[1].from)}
      </div>
    );
  }

  return (
    <>
      <div className="eyebrow dates">
        {now}
        {n} stays
        <br />
        Since {monthYear(world.stays[n - 1].from)} · Last {monthYear(world.stays[0].from)}
      </div>
      <button className="stays-toggle" type="button" onClick={onToggleStays}>
        See all stays
      </button>
      <ul className={`stays-list${staysOpen ? " open" : ""}`}>
        {world.stays.map((stay) => (
          <li key={`${stay.from}-${stay.to}`}>{stayRange(stay)}</li>
        ))}
      </ul>
    </>
  );
}

type TabId = "actions" | "moments" | "reflection";

function WorldTabs({
  world,
  openTab,
  onTab,
}: {
  world: JourneyWorld;
  openTab: TabId | null;
  onTab: (tab: TabId) => void;
}) {
  const total = world.actions.reduce((sum, action) => sum + action.acted, 0);
  const momentsLabel = world.status === "chosen" ? "—" : String(world.moments.length);
  const reflectionLabel = world.reflection ? "✓" : "—";

  let momentsBody: ReactNode;
  if (world.status === "chosen") momentsBody = <div className="empty">Moments open with your first stay.</div>;
  else if (!world.moments.length) momentsBody = <div className="empty">No events yet.</div>;
  else {
    momentsBody = (
      <ul>
        {world.moments.map((moment) => (
          <li key={moment}><div>{moment}</div></li>
        ))}
      </ul>
    );
  }

  let reflectionBody: ReactNode;
  if (world.status === "chosen") {
    reflectionBody = (
      <>
        <button className="book" type="button">Book your stay</button>
        <div className="empty">Reflect opens after your first stay.</div>
      </>
    );
  } else if (world.status === "in-stay") {
    reflectionBody = <div className="empty">Opens after your check-out.</div>;
  } else if (!world.reflection) {
    reflectionBody = <div className="empty">Not reflected yet.</div>;
  } else {
    reflectionBody = (
      <>
        <div className="choice">{world.reflection.choice}</div>
        {world.reflection.note ? <div className="note">“{world.reflection.note}”</div> : null}
      </>
    );
  }

  return (
    <>
      <div className="tabs">
        <button className={`tab${openTab === "actions" ? " on" : ""}`} type="button" onClick={() => onTab("actions")}>
          <div className="lbl">Actions</div>
          <div className={`val ${total ? "cg" : "zero"}`}>{total}</div>
        </button>
        <button className={`tab${openTab === "moments" ? " on" : ""}`} type="button" onClick={() => onTab("moments")}>
          <div className="lbl">Moments</div>
          <div className={`val ${world.moments.length ? "cg" : "zero"}`}>{momentsLabel}</div>
        </button>
        <button className={`tab${openTab === "reflection" ? " on" : ""}`} type="button" onClick={() => onTab("reflection")}>
          <div className="lbl">Reflection</div>
          <div className={`val ${world.reflection ? "cg" : "zero"}`}>{reflectionLabel}</div>
        </button>
      </div>
      <div className={`panel${openTab === "actions" ? " open" : ""}`}>
        <ul>
          {world.actions.map((action) => (
            <li key={action.id}>
              <div>
                {action.text} <span>· {action.schedule}</span>
              </div>
              <b className="cg">{action.acted}×</b>
            </li>
          ))}
        </ul>
      </div>
      <div className={`panel${openTab === "moments" ? " open" : ""}`}>{momentsBody}</div>
      <div className={`panel${openTab === "reflection" ? " open" : ""}`}>{reflectionBody}</div>
    </>
  );
}

export default function MyJourneyPage({
  account,
  onClose,
  onProfileAction,
  onSignOut,
}: {
  account: AccountSummary;
  onClose: () => void;
  onProfileAction: (action: SpaceProfileAction) => void;
  onSignOut: () => void;
}) {
  const [light, setLight] = useState(readJourneyLight);
  const [worlds, setWorlds] = useState<JourneyWorld[]>(() =>
    JOURNEY_DEMO_WORLDS.map((world) => ({
      ...world,
      actions: world.actions.map((action) => ({ ...action })),
      stays: [...world.stays],
      moments: [...world.moments],
      reflection: world.reflection ? { ...world.reflection } : null,
    })),
  );
  const [notifications, setNotifications] = useState<JourneyNotification[]>(() =>
    JOURNEY_DEMO_NOTIFICATIONS.map((item) => ({ ...item })),
  );
  const [bellOpen, setBellOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const [openIntent, setOpenIntent] = useState<Record<string, boolean>>({});
  const [openTab, setOpenTab] = useState<Record<string, TabId | null>>({});
  const [staysOpen, setStaysOpen] = useState<Record<string, boolean>>({});

  const initial = account.fullName.trim().charAt(0).toUpperCase() || "G";
  const hasUnread = notifications.some((item) => !item.answered);

  useLayoutEffect(() => {
    function syncLight() {
      setLight(!document.body.classList.contains("night"));
    }
    syncLight();
    const observer = new MutationObserver(syncLight);
    observer.observe(document.body, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!bellOpen && !accountOpen) return;
    function onDocClick(event: MouseEvent) {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".my-journey .bell-wrap") || target?.closest(".my-journey .pmenu-wrap")) {
        return;
      }
      setBellOpen(false);
      setAccountOpen(false);
    }
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, [bellOpen, accountOpen]);

  function closeMenus() {
    setBellOpen(false);
    setAccountOpen(false);
  }

  function runProfileAction(action: SpaceProfileAction) {
    closeMenus();
    onProfileAction(action);
  }

  function answerAction(id: string, yes: boolean) {
    const note = notifications.find((item) => item.id === id);
    if (!note) return;
    if (yes) {
      setWorlds((prev) =>
        prev.map((world) => {
          if (world.id !== note.worldId) return world;
          return {
            ...world,
            actions: world.actions.map((action) =>
              action.id === note.actionId ? { ...action, acted: action.acted + 1 } : action,
            ),
          };
        }),
      );
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, answered: "Saved." } : item)),
      );
    } else {
      setNotifications((prev) =>
        prev.map((item) => (item.id === id ? { ...item, answered: "Noted." } : item)),
      );
    }
  }

  function toggleTab(worldId: string, tab: TabId) {
    setOpenTab((prev) => ({
      ...prev,
      [worldId]: prev[worldId] === tab ? null : tab,
    }));
  }

  return (
    <div className={`my-journey${light ? " light" : ""}`}>
      <svg width="0" height="0" style={{ position: "absolute" }} aria-hidden="true">
        <defs>
          <linearGradient id="cgIco" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#A66A3F" />
            <stop offset=".45" stopColor="#D6A06D" />
            <stop offset=".7" stopColor="#F0C79B" />
            <stop offset="1" stopColor="#B47749" />
          </linearGradient>
        </defs>
      </svg>

      <header>
        <button className="journey-back" type="button" onClick={onClose}>
          Back
        </button>
        <button className="brand" type="button" onClick={onClose} aria-label="Back to My Space">
          <BrandMark className="journey-logo" decorative />
          <span className="journey-brand-title">My Space</span>
        </button>
        <div className="icons">
          <ThemeToggle />
          <div className="bell-wrap">
            <button
              className="icon-btn"
              type="button"
              aria-label="Notifications"
              aria-haspopup="true"
              aria-expanded={bellOpen}
              onClick={() => {
                setAccountOpen(false);
                setBellOpen((value) => !value);
              }}
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" aria-hidden="true">
                <path d="M6 17V11a6 6 0 0 1 12 0v6M4 17h16M10 20h4" />
              </svg>
              {hasUnread ? <span className="badge" /> : null}
            </button>
            {bellOpen ? (
              <div className="dropdown notifs open">
                {notifications.map((note) => {
                  const world = worlds.find((item) => item.id === note.worldId);
                  const action = world?.actions.find((item) => item.id === note.actionId);
                  if (!world || !action) return null;
                  return (
                    <div className="notif" key={note.id}>
                      <div className="eyebrow">
                        Action · {action.schedule} · {note.when}
                      </div>
                      <h4>Have you acted today?</h4>
                      <p>{action.text}</p>
                      {note.answered ? (
                        <div className="done">{note.answered}</div>
                      ) : (
                        <div className="btn-row">
                          <button className="btn primary" type="button" onClick={() => answerAction(note.id, true)}>
                            Yes, I did
                          </button>
                          <button className="btn" type="button" onClick={() => answerAction(note.id, false)}>
                            Not today
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
          <div className="pmenu-wrap">
            <button
              className="profile"
              type="button"
              aria-label="Account menu"
              aria-haspopup="true"
              aria-expanded={accountOpen}
              onClick={() => {
                setBellOpen(false);
                setAccountOpen((value) => !value);
              }}
            >
              {account.avatarUrl ? (
                <img src={account.avatarUrl} alt="" referrerPolicy="no-referrer" />
              ) : (
                initial
              )}
            </button>
            {accountOpen ? (
              <div className="pmenu beta-pmenu" role="menu">
                <div className="pm-head">
                  <p className="pm-name">{account.fullName}</p>
                  <p className="pm-mail">{account.email}</p>
                </div>
                <button className="pm-item" role="menuitem" type="button" onClick={() => runProfileAction("account")}>
                  My account
                </button>
                <button className="pm-item" role="menuitem" type="button" onClick={() => runProfileAction("orders")}>
                  My orders
                </button>
                <button className="pm-item" role="menuitem" type="button" onClick={closeMenus}>
                  My journey
                </button>
                <button className="pm-item" role="menuitem" type="button" onClick={() => runProfileAction("events")}>
                  My events
                </button>
                <button className="pm-item" role="menuitem" type="button" onClick={() => runProfileAction("explore")}>
                  Explore all States
                </button>
                <span className="pm-rule" />
                <button className="pm-item small" role="menuitem" type="button" onClick={() => runProfileAction("legal")}>
                  Terms of Use · Privacy Policy
                </button>
                <button className="pm-item small" role="menuitem" type="button" onClick={() => runProfileAction("delete")}>
                  Delete account
                </button>
                <button
                  className="pm-item small"
                  role="menuitem"
                  type="button"
                  onClick={() => {
                    closeMenus();
                    onSignOut();
                  }}
                >
                  Sign out
                </button>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <main>
        <div className="page-head">
          <div className="eyebrow">My journey</div>
          <h1>
            Your <em className="cg">journey</em>.
          </h1>
          <p>
            Every State you have lived,
            <br />
            and who you became there.
          </p>
        </div>
        <div className="journey">
          <div id="stops">
            {worlds.map((world, index) => {
              const side = index % 2 === 0 ? "right" : "left";
              const intentOpen = Boolean(openIntent[world.id]);
              return (
                <section
                  className={`stop ${side}${world.current ? " now" : ""}`}
                  key={world.id}
                >
                  <div className="arch-wrap">
                    {world.current ? <span className="now-dot" /> : null}
                    <div className="arch">
                      <img src={world.image} alt={world.hotel} />
                    </div>
                  </div>
                  <div className="info">
                    <DatesBlock
                      world={world}
                      staysOpen={Boolean(staysOpen[world.id])}
                      onToggleStays={() =>
                        setStaysOpen((prev) => ({ ...prev, [world.id]: !prev[world.id] }))
                      }
                    />
                    <h2>
                      <span className="cg">{world.state}</span>
                    </h2>
                    <div className="loc-int">
                      <div className="place">
                        <PinIcon />
                        <span>
                          {world.hotel} · {world.country}
                        </span>
                      </div>
                      <button
                        className={`intent-btn${intentOpen ? " on" : ""}`}
                        type="button"
                        onClick={() =>
                          setOpenIntent((prev) => ({ ...prev, [world.id]: !prev[world.id] }))
                        }
                      >
                        <NoseIcon />
                        <span>Intention</span>
                      </button>
                    </div>
                    <div className={`intent${intentOpen ? " open" : ""}`}>
                      <div className="card-stage">
                        <div className="card">
                          <div className="w">{world.intention}</div>
                          <div className="b">I am becoming</div>
                          <div className="w sm">{world.becoming}</div>
                        </div>
                      </div>
                      <WorldTabs
                        world={world}
                        openTab={openTab[world.id] || null}
                        onTab={(tab) => toggleTab(world.id, tab)}
                      />
                    </div>
                  </div>
                </section>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
