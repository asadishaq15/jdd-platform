"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import BrandMark from "../brand/BrandMark";
import GradientDefs from "../layout/GradientDefs";
import ThemeToggle from "../layout/ThemeToggle";
import { getWorld, HospitalityWorld, worlds } from "../../lib/worlds";
import { loadSpaceState, saveSpaceState, SpaceState } from "../../lib/space-state";

type ProfileMenu = "account" | "orders" | "stays" | "events" | "reminders" | null;
type Flow = "order" | "ritual" | "oil" | "action" | "circle" | "delete" | null;
type CardStatus = NonNullable<SpaceState["cardStatus"]>;

export default function SpaceEntry() {
  const [state, setState] = useState<SpaceState>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<ProfileMenu>(null);
  const [flow, setFlow] = useState<Flow>(null);
  const [orderStep, setOrderStep] = useState(1);
  const [circleDetail, setCircleDetail] = useState<string | null>(null);

  useEffect(() => setState(loadSpaceState()), []);

  const activeNumber = state.visited || state.chosen || state.recommended || 9;
  const world = getWorld(activeNumber);
  const recommended = state.recommended ? getWorld(state.recommended) : null;
  const guest = Boolean(state.visited && state.code);

  function chooseWorld(n: number) {
    const next = { ...state, chosen: n, visited: undefined, code: undefined, entryMode: "chosen" as const };
    setState(next);
    saveSpaceState(next);
    document.getElementById("sec-world")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <main className="space-entry">
      <GradientDefs />
      <DashboardHeader
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((value) => !value)}
        onOpenModal={(next) => {
          setModal(next);
          setMenuOpen(false);
        }}
      />

      <section className="space-welcome">
        <p className="eyebrow">{guest ? `Guest access · ${world.property}` : state.entryMode === "recommended" ? "Your recommended world" : "Your chosen world"}</p>
        <h1 className="title">Welcome to <em className="cu">My Space</em>.</h1>
      </section>

      <div className="space-grid">
        <MyWorld world={world} guest={guest} />
        <MyScent world={world} guest={guest} state={state} onOrder={() => { setOrderStep(1); setFlow("order"); }} onSimulate={() => {
          const nextStatus: CardStatus = state.cardStatus === "preparing" ? "sent" : state.cardStatus === "sent" ? "delivered" : "received";
          const next = { ...state, cardStatus: nextStatus };
          setState(next); saveSpaceState(next);
        }} />
        <MyIntention state={state} world={world} />
        <MyRitual active={Boolean(guest || state.intention || state.cardStatus === "received")} onRitual={() => setFlow("ritual")} onOil={() => setFlow("oil")} onAction={() => setFlow("action")} />
        <MyCommunity world={world} guest={guest} state={state} onOpen={() => setFlow("circle")} />
      </div>

      <ExploreStates activeNumber={activeNumber} recommended={recommended} onChoose={chooseWorld} />
      <ProfileModal modal={modal} state={state} world={world} onClose={() => setModal(null)} onDelete={() => { setModal(null); setFlow("delete"); }} />
      <FlowModal flow={flow} world={world} state={state} orderStep={orderStep} circleDetail={circleDetail} onCircleDetail={setCircleDetail} onStep={setOrderStep} onClose={() => { setFlow(null); setCircleDetail(null); }} onSave={(next) => { setState(next); saveSpaceState(next); }} />
    </main>
  );
}

function DashboardHeader({ menuOpen, onToggleMenu, onOpenModal }: { menuOpen: boolean; onToggleMenu: () => void; onOpenModal: (modal: Exclude<ProfileMenu, null>) => void }) {
  return (
    <header className="top dash-top">
      <Link className="demo-restart" href="/discover">Restart demo</Link>
      <div className="dash-brand">
        <BrandMark className="dash-logo" />
        <span className="dash-title">My Space</span>
      </div>
      <div className="dash-actions">
        <ThemeToggle />
        <div className="pmenu-wrap">
          <button className="profile" type="button" aria-label="Account menu" aria-haspopup="true" aria-expanded={menuOpen} onClick={onToggleMenu}>A</button>
          {menuOpen && (
            <div className="pmenu" role="menu">
              <div className="pm-head"><p className="pm-name">Alex Laurent</p><p className="pm-mail">alex@example.com</p></div>
              <button className="pm-item" role="menuitem" onClick={() => onOpenModal("account")}>My account</button>
              <button className="pm-item" role="menuitem" onClick={() => onOpenModal("orders")}>My orders</button>
              <button className="pm-item" role="menuitem" onClick={() => onOpenModal("stays")}>My stays</button>
              <button className="pm-item" role="menuitem" onClick={() => onOpenModal("events")}>My events</button>
              <button className="pm-item" role="menuitem" onClick={() => onOpenModal("reminders")}>Reminders</button>
              <span className="pm-rule" />
              <Link className="pm-item small" href="/sign-in">Sign out</Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

function MyWorld({ world, guest }: { world: HospitalityWorld; guest: boolean }) {
  return (
    <DashboardSection id="sec-world" eyebrow={guest ? "Your stay" : "My World"}>
      <PropertyCard world={world} />
      <p className="body sec-text">{world.desc}</p>
      <div className="sec-act"><button className="tlink" type="button">Plan your stay</button></div>
    </DashboardSection>
  );
}

function MyScent({ world, guest, state, onOrder, onSimulate }: { world: HospitalityWorld; guest: boolean; state: SpaceState; onOrder: () => void; onSimulate: () => void }) {
  const status = state.cardStatus || (guest ? "received" : "none");
  return (
    <DashboardSection id="sec-scent" eyebrow="My Scent">
      <p className="sc-title">Your scented <em className="cu">card</em>.</p>
      <div className="order-card dash-card" style={{ "--h": (world.n * 37) % 360 } as React.CSSProperties}>
        <span className="d-card-e">Scent Invitation</span>
        <span className="d-card-t">{world.property}</span>
        <span className="d-card-s">{world.state}</span>
        <span className="oc-name">For Alex Laurent</span>
      </div>
      <p className="sec-text">{status === "none" ? "A personalized card that introduces the aroma of this hospitality world." : `Status: ${statusLabel(status)}.`}</p>
      <div className="sec-act">
        {["preparing", "sent", "delivered"].includes(status) ? <button className="tlink" type="button" onClick={onSimulate}>{status === "delivered" ? "I received my card" : "Simulate card delivery"}</button> : <button className="tlink" type="button" onClick={onOrder}>{guest || status === "received" ? "Order another card" : "Order my card"}</button>}
      </div>
    </DashboardSection>
  );
}

function MyIntention({ state, world }: { state: SpaceState; world: HospitalityWorld }) {
  return (
    <DashboardSection id="sec-intention" eyebrow="My Intention">
      <div className="icard" style={{ "--h": (world.n * 37) % 360 } as React.CSSProperties}>
        {state.intention ? <p className="ic-intent">{state.intention}</p> : <p className="ic-empty">Your intention will appear here.</p>}
        {state.becoming && <p className="ic-becoming">I am becoming {state.becoming}</p>}
      </div>
      <div className="sec-act"><Link className="tlink" href="/discover">Edit intention</Link></div>
    </DashboardSection>
  );
}

function MyRitual({ active, onRitual, onOil, onAction }: { active: boolean; onRitual: () => void; onOil: () => void; onAction: () => void }) {
  return (
    <DashboardSection id="sec-ritual" eyebrow="My Ritual">
      <ol className="rit-preview">
        <li><span>01</span>Pause. Read your intention.</li>
        <li><span>02</span>Remember the State you chose.</li>
        <li><span>03</span>Breathe in the scent of your card.</li>
        <li><span>04</span>Choose one action that supports your intention.</li>
      </ol>
      <p className="sec-text">{active ? "Your invitation ritual is ready." : "Your invitation ritual begins when your card arrives."}</p>
      <div className="sec-act ritual-actions"><button className="tlink" type="button" onClick={onRitual}>{active ? "Open my invitation ritual" : "Read the steps"}</button><button className="tlink" type="button" onClick={onOil}>Open perfume oil ritual</button><button className="tlink" type="button" onClick={onAction}>Edit action reminder</button></div>
    </DashboardSection>
  );
}

function MyCommunity({ world, guest, state, onOpen }: { world: HospitalityWorld; guest: boolean; state: SpaceState; onOpen: () => void }) {
  return (
    <DashboardSection id="sec-community" eyebrow="My Community">
      <CommunityGlobe />
      <p className="c-eye small from-stay">Property Circle · {world.property}</p>
      <p className="sec-text pc-text">
        {guest || state.code ? `Private evenings, guest invitations and news from ${world.property} are open in your Property Circle.` : `Private evenings, guest invitations and news from ${world.property} open after your stay.`}
      </p>
      <div className="sec-act"><button className="tlink" type="button" onClick={onOpen}>{guest || state.code ? "Open Property Circle" : "Preview Property Circle"}</button></div>
    </DashboardSection>
  );
}

function ExploreStates({ activeNumber, recommended, onChoose }: { activeNumber: number; recommended: HospitalityWorld | null; onChoose: (n: number) => void }) {
  return (
    <section className="states-section" id="sec-worlds">
      <p className="eyebrow">Explore all States</p>
      <h2 className="title">22 hospitality <em className="cu">worlds</em>.</h2>
      <div className="states-grid dashboard-states">
        {worlds.map((world) => (
          <button className={`state-cell ${world.n === activeNumber ? "current" : ""}`} type="button" key={world.n} onClick={() => onChoose(world.n)}>
            <span className="c-num">{String(world.n).padStart(2, "0")}</span>
            <span className="c-h">{world.state}</span>
            <span className="c-p">{world.property}</span>
            <span className="c-tag">{world.n === activeNumber ? "Current" : recommended?.n === world.n ? "Recommended" : "Explore"}</span>
          </button>
        ))}
      </div>
    </section>
  );
}

function DashboardSection({ id, eyebrow, children }: { id: string; eyebrow: string; children: React.ReactNode }) {
  return (
    <section className="sec" id={id}>
      <p className="c-eye">{eyebrow}</p>
      {children}
    </section>
  );
}

function PropertyCard({ world }: { world: HospitalityWorld }) {
  return (
    <button className="hw-card" type="button">
      <div className="pimg-wrap">
        <div className="pimg" style={{ "--h": (world.n * 37) % 360 } as React.CSSProperties}>
          <svg viewBox="0 0 400 240" aria-hidden="true">
            <path d="M40 200 L360 200" />
            <path d="M150 200 L150 120 A50 50 0 0 1 250 120 L250 200" />
            <path d="M175 200 L175 132 A25 25 0 0 1 225 132 L225 200" opacity=".6" />
            <circle cx="300" cy="70" r="14" opacity=".7" />
          </svg>
          <span className="pimg-cap">{world.property} · {world.country}</span>
        </div>
      </div>
      <span className="hw-eye">Your world</span>
      <span className="hw-name">{world.property}</span>
      <span className="country">{world.country}</span>
      <span className="stay-state"><em className="cu">{world.state}</em></span>
    </button>
  );
}

function CommunityGlobe() {
  return (
    <svg className="community-globe" viewBox="0 0 620 620" aria-hidden="true">
      <g className="ggrid">
        <circle className="gouter" cx="310" cy="310" r="260" />
        <ellipse cx="310" cy="310" rx="260" ry="60" /><ellipse cx="310" cy="310" rx="260" ry="130" /><ellipse cx="310" cy="310" rx="260" ry="200" />
        <ellipse cx="310" cy="310" rx="60" ry="260" /><ellipse cx="310" cy="310" rx="130" ry="260" /><ellipse cx="310" cy="310" rx="200" ry="260" />
        <line x1="310" y1="50" x2="310" y2="570" /><line x1="50" y1="310" x2="570" y2="310" />
      </g>
      {Array.from({ length: 22 }).map((_, i) => (
        <circle key={i} className="gdot" cx={130 + ((i * 61) % 360)} cy={130 + ((i * 83) % 360)} r={i === 21 ? 5 : 3.2} style={{ "--tw": `${3.4 + (i % 5) * .45}s` } as React.CSSProperties} />
      ))}
    </svg>
  );
}

function ProfileModal({ modal, state, world, onClose, onDelete }: { modal: ProfileMenu; state: SpaceState; world: HospitalityWorld; onClose: () => void; onDelete: () => void }) {
  if (!modal) return null;
  const title = { account: "My account", orders: "My orders", stays: "My stays", events: "My events", reminders: "Reminders" }[modal];

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="legal-modal" role="dialog" aria-modal="true" aria-label={title}>
        <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>×</button>
        <p className="eyebrow">Account</p>
        <h2 className="doc-title">{title}</h2>
        {modal === "account" && <p>Alex Laurent · alex@example.com</p>}
        {modal === "orders" && <p>{state.order ? `${state.order.property} · ${state.order.state}` : "No orders yet."}<br />Scented card status: {statusLabel(state.cardStatus || "none")}.</p>}
        {modal === "stays" && <p>{state.code ? `${world.property} is connected by access code.` : "No stay code connected yet."}</p>}
        {modal === "events" && <p>{Object.values(state.rsvps || {}).some(Boolean) ? "You have accepted or reserved Property Circle items." : "No events yet."}</p>}
        {modal === "reminders" && <p>{state.reminder?.action ? `${state.reminder.action} · ${state.reminder.frequency}` : "No reminder set."}</p>}
        {modal === "account" && <div className="stay-actions"><button className="tlink danger" type="button" onClick={onDelete}>Delete my account</button></div>}
      </section>
    </div>
  );
}

function FlowModal({ flow, world, state, orderStep, circleDetail, onCircleDetail, onStep, onClose, onSave }: { flow: Flow; world: HospitalityWorld; state: SpaceState; orderStep: number; circleDetail: string | null; onCircleDetail: (v: string | null) => void; onStep: (n: number) => void; onClose: () => void; onSave: (next: SpaceState) => void }) {
  const [action, setAction] = useState(state.reminder?.action || "");
  const [frequency, setFrequency] = useState<"off" | "once" | "daily">(state.reminder?.frequency || "off");
  if (!flow) return null;

  function completeOrder() {
    onSave({ ...state, cardStatus: "preparing", order: { property: world.property, state: world.state, recipient: "Alex Laurent", address: "Demo address", payment: "Card" } });
    onClose();
  }

  function rsvp(key: string) {
    onSave({ ...state, rsvps: { ...(state.rsvps || {}), [key]: true } });
    onCircleDetail(null);
  }

  const circleItems = [
    { key: "event", label: "Event", title: "Stillness Evening", when: "Friday · 19:00", body: `An evening for guests connected by ${world.state}.`, action: "Reserve my place" },
    { key: "invite", label: "Guest invitation", title: "Tea House Invitation", when: "Saturday · 16:00", body: `A quiet invitation for guests of ${world.property}.`, action: "Accept invitation" },
    { key: "news", label: "News", title: "Seasonal fragrance note", when: "Now open", body: `${world.property} introduces its latest sensory ritual.`, action: "Save" },
  ];
  const detail = circleItems.find((item) => item.key === circleDetail);

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="legal-modal flow-modal" role="dialog" aria-modal="true" aria-label="Space flow">
        <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>×</button>
        {flow === "order" && <>
          <p className="eyebrow">Scented card order · {orderStep} of 4</p>
          {orderStep === 1 && <><h2 className="doc-title">Your scented card.</h2><div className="order-card dash-card" style={{ "--h": (world.n * 37) % 360 } as React.CSSProperties}><span className="d-card-e">Scent Invitation</span><span className="d-card-t">{world.property}</span><span className="d-card-s">{world.state}</span><span className="oc-name">For Alex Laurent</span></div><button className="btn primary" onClick={() => onStep(2)}>Continue</button></>}
          {orderStep === 2 && <><h2 className="doc-title">Delivery details.</h2><div className="field"><input placeholder="Full name" defaultValue="Alex Laurent" /></div><div className="field"><input placeholder="Address" /></div><button className="btn primary" onClick={() => onStep(3)}>Review</button></>}
          {orderStep === 3 && <><h2 className="doc-title">Payment.</h2><div className="field"><input placeholder="4242 4242 4242 4242" inputMode="numeric" /></div><div className="pay-row"><div className="field"><input placeholder="MM / YY" /></div><div className="field"><input placeholder="CVC" /></div></div><button className="btn primary" onClick={() => onStep(4)}>Continue</button></>}
          {orderStep === 4 && <><h2 className="doc-title">Review order.</h2><p>{world.property} · {world.state}<br />Total · demo payment</p><button className="btn primary" onClick={completeOrder}>Place order</button></>}
        </>}
        {flow === "ritual" && <RitualContent state={state} onAction={() => onSave({ ...state, reminder: { action: state.reminder?.action || "One quiet action today", frequency: state.reminder?.frequency || "once" } })} />}
        {flow === "oil" && <><p className="eyebrow">Perfume oil ritual</p><h2 className="doc-title">Your State, on skin.</h2><ol className="rit-preview"><li><span>01</span>Remember. Recall your intention.</li><li><span>02</span>Apply. Place the oil on pulse points.</li><li><span>03</span>Return. Let the scent bring you back to your State.</li></ol><p className="sec-text">Wear alone, layer beneath your favourite perfume, or combine oils collected from different hospitality worlds.</p></>}
        {flow === "action" && <><p className="eyebrow">Reminder</p><h2 className="doc-title">Choose one action.</h2><div className="field"><input value={action} onChange={(e) => setAction(e.target.value)} placeholder="One action that supports your intention" /></div><div className="seg"><button className={frequency === "off" ? "sel" : ""} onClick={() => setFrequency("off")}>Off</button><button className={frequency === "once" ? "sel" : ""} onClick={() => setFrequency("once")}>Once</button><button className={frequency === "daily" ? "sel" : ""} onClick={() => setFrequency("daily")}>Daily</button></div><button className="btn primary" onClick={() => { onSave({ ...state, reminder: { action: action || "One quiet action today", frequency } }); onClose(); }}>Save</button></>}
        {flow === "circle" && <><p className="eyebrow">Property Circle · {world.property}</p>{detail ? <><h2 className="doc-title">{detail.title}</h2><p className="country">{detail.when}</p><p className="body dob-intro">{detail.body}</p><button className="btn primary" onClick={() => rsvp(detail.key)}>{state.rsvps?.[detail.key] ? "Saved" : detail.action}</button><p className="links"><button className="tlink" onClick={() => onCircleDetail(null)}>Back</button></p></> : <div className="circle-list">{circleItems.map((item) => <button key={item.key} className="circle-item" onClick={() => onCircleDetail(item.key)}><span>{item.label}</span><strong>{item.title}</strong><em>{state.rsvps?.[item.key] ? "Saved" : item.when}</em></button>)}</div>}</>}
        {flow === "delete" && <><p className="eyebrow">Delete account</p><h2 className="doc-title">Delete your Space?</h2><p>This removes your local demo Space, intention, State, orders and linked stays.</p><button className="btn primary danger" onClick={() => { localStorage.clear(); location.href = "/"; }}>Delete my account</button></>}
      </section>
    </div>
  );
}

function RitualContent({ state, onAction }: { state: SpaceState; onAction: () => void }) {
  return <><p className="eyebrow">Your Scent Invitation</p><h2 className="doc-title">Your invitation ritual.</h2><ol className="rit-preview"><li><span>01</span>Pause. Read your intention. {state.intention}</li><li><span>02</span>Remember who you are becoming.</li><li><span>03</span>Breathe in the scent of your card.</li><li><span>04</span>Act. Choose one action that supports your intention.</li></ol><button className="btn primary" onClick={onAction}>Use this action</button></>;
}

function statusLabel(status: NonNullable<SpaceState["cardStatus"]> | "none") {
  return ({ none: "No card ordered", preparing: "Preparing", sent: "Sent", delivered: "Delivered", received: "Received" } as const)[status];
}
