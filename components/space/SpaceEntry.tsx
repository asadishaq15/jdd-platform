"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import BrandMark from "../brand/BrandMark";
import GradientDefs from "../layout/GradientDefs";
import ThemeToggle from "../layout/ThemeToggle";
import { getWorld, HospitalityWorld, worldDetails } from "../../lib/worlds";
import { loadSpaceState, saveSpaceState, SpaceState } from "../../lib/space-state";
import type { AccountSummary, ConnectedStay } from "../../lib/space-data";
import { createClient } from "../../lib/supabase/client";

type ProfileMenu = "account" | "orders" | "stays" | "events" | "reminders" | "legal" | "delete" | null;
type Flow = "order" | "ritual" | "oil" | "action" | "circle" | "delete" | null;
type CardStatus = NonNullable<SpaceState["cardStatus"]>;

type SpaceEntryProps = {
  account: AccountSummary;
  stays: ConnectedStay[];
  activeStayId?: string;
};

export default function SpaceEntry({ account, stays, activeStayId }: SpaceEntryProps) {
  const [state, setState] = useState<SpaceState>({});
  const [menuOpen, setMenuOpen] = useState(false);
  const [modal, setModal] = useState<ProfileMenu>(null);
  const [flow, setFlow] = useState<Flow>(null);
  const [orderStep, setOrderStep] = useState(1);
  const [circleDetail, setCircleDetail] = useState<string | null>(null);
  const connectedStay = stays.find((stay) => stay.id === activeStayId) || stays[0];

  useEffect(() => {
    const loaded = loadSpaceState();
    const next = connectedStay ? { ...loaded, visited: connectedStay.property.worldNumber } : loaded;
    setState(next);
    if (connectedStay) saveSpaceState(next);
  }, [connectedStay]);

  const activeNumber = connectedStay?.property.worldNumber || state.visited || state.chosen || state.recommended || 9;
  const baseWorld = getWorld(activeNumber);
  const world = connectedStay
    ? { ...baseWorld, property: connectedStay.property.name, country: connectedStay.property.country || baseWorld.country }
    : baseWorld;
  const guest = Boolean(connectedStay || (state.visited && state.code));
  const guestName = connectedStay?.guestName || account.fullName;
  const ritualActive = Boolean(guest || state.cardStatus === "received");

  function updateState(next: SpaceState) {
    setState(next);
    saveSpaceState(next);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/sign-in");
  }

  function restartDemo() {
    localStorage.removeItem("jdd-space-react-v1");
    window.location.assign("/discover");
  }

  return (
    <main className="space-entry">
      <GradientDefs />
      <DashboardHeader
        account={account}
        guest={guest}
        menuOpen={menuOpen}
        onToggleMenu={() => setMenuOpen((value) => !value)}
        onOpenModal={(next) => {
          setModal(next);
          setMenuOpen(false);
        }}
        onRestart={restartDemo}
        onSignOut={signOut}
      />

      <div className="space-stage">
        <section className="space-view" aria-label="My Space">
          <div className="calm">
            <div className="calm-head reveal in">
              <svg className="emblem" viewBox="0 0 140 140" aria-hidden="true">
                <circle className="em-c" cx="70" cy="70" r="66" pathLength="1" />
                <path className="em-t" d="M70 36 L99 90 L41 90 Z" pathLength="1" />
              </svg>
              {guest && <p className="calm-status">Guest access · {world.property}</p>}
              <h1 className="calm-name">{account.fullName}</h1>
              <Link className="calm-world" href="/discover" aria-label="Open your hospitality world">
                <span className="calm-state"><span>State</span><span className="sep">·</span><em className="cu">{world.state}</em></span>
              </Link>
            </div>

            <div className="secs">
              <WorldSection world={world} guest={guest} />
              <ScentSection
                world={world}
                guest={guest}
                guestName={guestName}
                state={state}
                onOrder={() => { setOrderStep(1); setFlow("order"); }}
                onSimulate={() => {
                  const nextStatus: CardStatus = state.cardStatus === "preparing" ? "sent" : state.cardStatus === "sent" ? "delivered" : "received";
                  updateState({ ...state, cardStatus: nextStatus });
                }}
              />
              <IntentionSection state={state} world={world} />
              <RitualSection
                active={ritualActive}
                onRitual={() => setFlow("ritual")}
                onOil={() => setFlow("oil")}
              />
              <CommunitySection world={world} guest={guest} state={state} onOpen={() => setFlow("circle")} />
            </div>

            <button className="wide-world reveal in" type="button" aria-label={`Open ${world.property}`} onClick={() => window.location.assign("/discover")}>
              <PropertyImage world={world} wide />
            </button>

            <div className="sp-note reveal in">
              <p className="hw5-note">Your card introduces you to the scent. A stay lets you experience the place, its rituals and its way of hospitality.</p>
            </div>

            {/* The legacy access-code block stays intentionally hidden. Guest access is handled by secure activation links. */}

            <div className="calm-explore reveal in">
              <p className="c-eye">Hospitality Worlds</p>
              <div className="sec-act"><Link className="tlink" href="/discover?mode=dash">Explore all States</Link></div>
            </div>

            <p className="links small demo-ctl">
              <button className="tlink" type="button" onClick={signOut}>Sign out</button>
              <span className="sep">·</span>
              <button className="tlink" type="button" onClick={restartDemo}>Restart demo</button>
            </p>
          </div>
        </section>
      </div>

      <ProfileModal modal={modal} account={account} stays={stays} state={state} world={world} onClose={() => setModal(null)} onDelete={() => { setModal(null); setFlow("delete"); }} />
      <FlowModal flow={flow} world={world} guestName={guestName} state={state} orderStep={orderStep} circleDetail={circleDetail} onCircleDetail={setCircleDetail} onStep={setOrderStep} onClose={() => { setFlow(null); setCircleDetail(null); }} onSave={updateState} />
    </main>
  );
}

function DashboardHeader({ account, guest, menuOpen, onToggleMenu, onOpenModal, onRestart, onSignOut }: {
  account: AccountSummary;
  guest: boolean;
  menuOpen: boolean;
  onToggleMenu: () => void;
  onOpenModal: (modal: Exclude<ProfileMenu, null>) => void;
  onRestart: () => void;
  onSignOut: () => void;
}) {
  const initial = account.fullName.trim().charAt(0).toUpperCase() || "G";

  return (
    <header className="top dash-top">
      <span className="demo-tag"><button className="demo-restart" type="button" onClick={onRestart}>Restart demo</button></span>
      <div className="dash-brand"><BrandMark className="dash-logo" /><span className="dash-title">My Space</span></div>
      <ThemeToggle />
      <div className="pmenu-wrap">
        <button className="profile" type="button" aria-label="Account menu" aria-haspopup="true" aria-expanded={menuOpen} onClick={onToggleMenu}>{initial}</button>
        {menuOpen && (
          <div className="pmenu" role="menu">
            <div className="pm-head"><p className="pm-name">{account.fullName}</p><p className="pm-mail">{account.email}</p></div>
            <button className="pm-item" role="menuitem" onClick={() => onOpenModal("account")}>My account</button>
            <button className="pm-item" role="menuitem" onClick={() => onOpenModal("orders")}>My orders</button>
            <button className="pm-item" role="menuitem" onClick={() => onOpenModal("stays")}>My stays</button>
            {guest && <button className="pm-item" role="menuitem" onClick={() => onOpenModal("events")}>My events</button>}
            <button className="pm-item" role="menuitem" onClick={() => onOpenModal("reminders")}>Reminders</button>
            <span className="pm-rule" />
            <button className="pm-item small" role="menuitem" onClick={() => onOpenModal("legal")}>Terms of Use · Privacy Policy</button>
            <button className="pm-item small" role="menuitem" onClick={() => onOpenModal("delete")}>Delete account</button>
            <button className="pm-item small" role="menuitem" type="button" onClick={onSignOut}>Sign out</button>
          </div>
        )}
      </div>
    </header>
  );
}

function WorldSection({ world, guest }: { world: HospitalityWorld; guest: boolean }) {
  const detail = worldDetails[world.n] || worldDetails[9];
  return (
    <article className="sec reveal in" id="sec-world">
      <Link className="hw-card hw-in-box" href="/discover" aria-label={`Open ${world.property}`}>
        <span className="hw-eye">{guest ? "Your stay" : "Your chosen world"}</span>
        <span className="hw-name">{world.property}</span>
        <span className="hw-country">{world.country}</span>
      </Link>
      <span className="sec-rule" />
      <p className="hw-h">Experience your State here.</p>
      <ul className="hw-list">{detail.experiences.map((experience) => <li key={experience}>{experience}</li>)}</ul>
      <p className="hw-l">Scent introduction</p>
      <p className="hw-scent">{detail.scent}</p>
    </article>
  );
}

function ScentSection({ world, guest, guestName, state, onOrder, onSimulate }: {
  world: HospitalityWorld;
  guest: boolean;
  guestName: string;
  state: SpaceState;
  onOrder: () => void;
  onSimulate: () => void;
}) {
  const status = state.cardStatus || (guest ? "received" : "none");
  return (
    <article className="sec reveal in" id="sec-scent">
      <div className="scent-in">
        <p className="c-eye">Scent Invitation</p>
        <p className="sc-title">Your scented <em className="cu">card</em>.</p>
        <div className="order-card dash-card" style={{ "--h": (world.n * 37) % 360 } as React.CSSProperties}>
          <span className="d-card-t">{world.property}</span>
          <span className="d-card-s">{world.state}</span>
          <span className="oc-name">For {guestName}</span>
        </div>
        {guest && !state.order ? <p className="c-s">Received during your stay</p> : status === "none" ? <><p className="sec-text">A personalized card that introduces the aroma of this hospitality world.</p><p className="c-s muted">Not ordered</p></> : <OrderTracker status={status} />}
        {status === "delivered" && <div className="sec-act"><button className="tlink" type="button" onClick={onSimulate}>I received my card</button></div>}
        {["preparing", "sent"].includes(status) && <p className="demo-ctl-in"><button className="tlink" type="button" onClick={onSimulate}>Simulate card delivery</button></p>}
        <div className="sec-act"><button className="tlink" type="button" onClick={onOrder}>{guest || status === "received" ? "Order another card" : "Order my card"}</button></div>
      </div>
    </article>
  );
}

function OrderTracker({ status }: { status: CardStatus | "none" }) {
  const steps: CardStatus[] = ["preparing", "sent", "delivered"];
  const activeIndex = status === "received" ? 3 : steps.indexOf(status as CardStatus);
  return <ol className="track">{steps.map((step, index) => <li className={index <= activeIndex ? "done" : ""} key={step}>{statusLabel(step)}</li>)}</ol>;
}

function IntentionSection({ state, world }: { state: SpaceState; world: HospitalityWorld }) {
  return (
    <article className="sec reveal in" id="sec-intention">
      <p className="c-eye">My Intention</p>
      <div className="icard still" style={{ "--h": (world.n * 37) % 360 } as React.CSSProperties}>
        <div className="ic-in">
          {state.intention ? <p className="ic-intent">{state.intention}</p> : <p className="ic-empty">Your intention will appear here.</p>}
          {state.becoming && <><p className="ic-label">I am becoming</p><p className="ic-becoming">{state.becoming}</p></>}
        </div>
        <span className="pimg-cap">{world.property} · {world.country}</span>
      </div>
      <div className={state.intention ? "ic-acts" : "sec-act"}>
        <Link className={state.intention ? "mini" : "tlink"} href="/discover">{state.intention ? "Edit intention" : "Add your intention"}</Link>
        {state.intention && <Link className="mini" href="/discover">{state.becoming ? "Edit I am becoming" : "Add I am becoming"}</Link>}
      </div>
      {state.intention && !state.becoming && <p className="sec-q">Who do you need to become to welcome this into your life and sustain it?</p>}
    </article>
  );
}

function RitualSection({ active, onRitual, onOil }: { active: boolean; onRitual: () => void; onOil: () => void }) {
  return (
    <article className="sec reveal in" id="sec-ritual">
      <p className="c-eye">My Ritual</p>
      {active ? <><p className="c-h">Pause · Scent · Reflect · Act</p><p className="c-s">Active</p></> : <><p className="sec-text">Your invitation ritual begins when your card arrives.</p><p className="c-s muted">Preview</p></>}
      <div className="sec-act"><button className="tlink" type="button" onClick={onRitual}>{active ? "Open my invitation ritual" : "Read the steps"}</button></div>
      <div className="oil-block">
        <p className="ob-h sc-title">Your State, on <em className="cu">skin</em>.</p>
        <p className="sec-text">A perfume oil to wear alone or layer with your favourite fragrance.</p>
        <div className="ob-acts"><button className="tlink" type="button" onClick={onOil}>Open my perfume oil ritual</button></div>
      </div>
    </article>
  );
}

function CommunitySection({ world, guest, state, onOpen }: { world: HospitalityWorld; guest: boolean; state: SpaceState; onOpen: () => void }) {
  const circleItems = [
    ["Event", "Stillness Evening", "Friday · 19:00"],
    ["Guest invitation", "Tea House Invitation", "Saturday · 16:00"],
    ["News", "Seasonal fragrance note", "Now open"],
  ];
  return (
    <article className="sec reveal in" id="sec-community">
      <p className="c-eye">My Community</p>
      <p className="hw-mantra box-mantra">{world.mantra}</p>
      <p className="hw5-desc box-desc">{world.desc}</p>
      <div className="sec-act"><Link className="tlink" href="/discover">{guest ? "Plan your next stay" : "Plan your stay"}</Link></div>
      <div className="cmap"><CommunityGlobe /></div>
      <p className="c-eye small from-stay">Property Circle · {world.property}</p>
      {guest ? circleItems.map(([label, title, timing], index) => (
        <button className="w-row" type="button" key={label} onClick={onOpen}>
          <span className="w-k">{label}{state.rsvps?.[["event", "invite", "news"][index]] ? " · Saved" : ""}</span>
          <span className="w-t">{title}</span>
          <span className="w-l">{timing}</span>
        </button>
      )) : <><p className="pc-lead">Reserved for guests of the house.</p><p className="sec-text pc-text">Private evenings, guest invitations and news from {world.property} open after your stay.</p></>}
    </article>
  );
}

function PropertyImage({ world, wide = false }: { world: HospitalityWorld; wide?: boolean }) {
  return (
    <div className={`pimg${wide ? " wide" : ""}`} style={{ "--h": (world.n * 37) % 360 } as React.CSSProperties} role="img" aria-label={`${world.property} — image placeholder`}>
      <svg viewBox="0 0 400 240" aria-hidden="true">
        <path d="M40 200 L360 200" /><path d="M150 200 L150 120 A50 50 0 0 1 250 120 L250 200" /><path d="M175 200 L175 132 A25 25 0 0 1 225 132 L225 200" opacity=".6" /><circle cx="300" cy="70" r="14" opacity=".7" />
      </svg>
      <span className="pimg-cap">{world.property} · {world.country}</span>
    </div>
  );
}

function CommunityGlobe() {
  const dots = [[160,170,3.2],[240,120,3],[350,145,3.5],[440,180,3],[190,250,2.8],[310,275,4],[420,260,3.2],[150,370,3],[250,390,3.5],[390,380,4],[470,330,2.8],[210,470,3.2],[330,460,3.5],[430,440,3.2],[285,325,5],[365,220,3],[115,310,2.8],[500,290,3.2],[375,500,3],[490,430,3.5],[275,180,3],[455,235,3.2]];
  return (
    <svg className="community-globe" viewBox="0 0 620 620" aria-hidden="true">
      <g className="ggrid"><circle className="gouter" cx="310" cy="310" r="260" /><ellipse cx="310" cy="310" rx="260" ry="60" /><ellipse cx="310" cy="310" rx="260" ry="130" /><ellipse cx="310" cy="310" rx="260" ry="200" /><ellipse cx="310" cy="310" rx="60" ry="260" /><ellipse cx="310" cy="310" rx="130" ry="260" /><ellipse cx="310" cy="310" rx="200" ry="260" /><line x1="310" y1="50" x2="310" y2="570" /><line x1="50" y1="310" x2="570" y2="310" /></g>
      {dots.map(([cx, cy, radius], index) => <circle key={index} className="gdot" cx={cx} cy={cy} r={radius} style={{ "--tw": `${3.4 + (index % 5) * .45}s` } as React.CSSProperties} />)}
    </svg>
  );
}

function ProfileModal({ modal, account, stays, state, world, onClose, onDelete }: { modal: ProfileMenu; account: AccountSummary; stays: ConnectedStay[]; state: SpaceState; world: HospitalityWorld; onClose: () => void; onDelete: () => void }) {
  if (!modal) return null;
  const title = { account: "My account", orders: "My orders", stays: "My stays", events: "My events", reminders: "Reminders", legal: "Terms & Privacy", delete: "Delete account" }[modal];
  return (
    <div className="jmodal open" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="jm-in glass" role="dialog" aria-modal="true" aria-label={title}>
        <h2 className="jm-title">{title}</h2>
        <div className="jm-text">
          {modal === "account" && <p>{account.fullName}<br />{account.email}</p>}
          {modal === "orders" && <p>{state.order ? `${state.order.property} · ${state.order.state}` : "No orders yet."}<br />Scented card status: {statusLabel(state.cardStatus || "none")}.</p>}
          {modal === "stays" && (stays.length ? stays.map((stay) => <p key={stay.id}><strong>{stay.property.name}</strong><br />{stay.checkIn || "Date pending"}{stay.checkOut ? ` — ${stay.checkOut}` : ""}</p>) : <p>{state.code ? `${world.property} is connected.` : "No activated stays yet."}</p>)}
          {modal === "events" && <p>{Object.values(state.rsvps || {}).some(Boolean) ? "You have accepted or reserved Property Circle items." : "No events yet."}</p>}
          {modal === "reminders" && <p>{state.reminder?.action ? `${state.reminder.action} · ${state.reminder.frequency}` : "No reminder set."}</p>}
          {modal === "legal" && <p>Jardin du Désert uses the information needed to provide your account, activated stays, and private Space experience.</p>}
          {modal === "delete" && <><p>Delete your account and private Space data?</p><button className="tlink danger" type="button" onClick={onDelete}>Continue</button></>}
        </div>
        <p className="links small"><button className="tlink" type="button" onClick={onClose}>Close</button></p>
      </section>
    </div>
  );
}

function FlowModal({ flow, world, guestName, state, orderStep, circleDetail, onCircleDetail, onStep, onClose, onSave }: { flow: Flow; world: HospitalityWorld; guestName: string; state: SpaceState; orderStep: number; circleDetail: string | null; onCircleDetail: (value: string | null) => void; onStep: (step: number) => void; onClose: () => void; onSave: (next: SpaceState) => void }) {
  const [action, setAction] = useState(state.reminder?.action || "");
  const [frequency, setFrequency] = useState<"off" | "once" | "daily">(state.reminder?.frequency || "off");
  if (!flow) return null;

  function completeOrder() {
    onSave({ ...state, cardStatus: "preparing", order: { property: world.property, state: world.state, recipient: guestName, address: "Demo address", payment: "Card" } });
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
    <div className="jmodal open" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className="jm-in glass flow-modal" role="dialog" aria-modal="true" aria-label="Space flow">
        {flow === "order" && <>
          <p className="g-label">Scented card order · {orderStep} of 4</p>
          {orderStep === 1 && <><h2 className="jm-title">Your scented card.</h2><div className="order-card dash-card" style={{ "--h": (world.n * 37) % 360 } as React.CSSProperties}><span className="d-card-t">{world.property}</span><span className="d-card-s">{world.state}</span><span className="oc-name">For {guestName}</span></div><button className="btn primary" onClick={() => onStep(2)}>Continue</button></>}
          {orderStep === 2 && <><h2 className="jm-title">Delivery details.</h2><div className="field"><input aria-label="Full name" placeholder="Full name" defaultValue={guestName} /></div><div className="field"><input aria-label="Address" placeholder="Address" /></div><button className="btn primary" onClick={() => onStep(3)}>Review</button></>}
          {orderStep === 3 && <><h2 className="jm-title">Payment.</h2><div className="field"><input aria-label="Card number" placeholder="4242 4242 4242 4242" inputMode="numeric" /></div><div className="pay-row"><div className="field"><input aria-label="Expiry" placeholder="MM / YY" /></div><div className="field"><input aria-label="Security code" placeholder="CVC" /></div></div><button className="btn primary" onClick={() => onStep(4)}>Continue</button></>}
          {orderStep === 4 && <><h2 className="jm-title">Review order.</h2><p>{world.property} · {world.state}<br />Total · demo payment</p><button className="btn primary" onClick={completeOrder}>Place order</button></>}
        </>}
        {flow === "ritual" && <RitualContent state={state} onAction={() => onSave({ ...state, reminder: { action: state.reminder?.action || "One quiet action today", frequency: state.reminder?.frequency || "once" } })} />}
        {flow === "oil" && <><p className="g-label">Perfume oil ritual</p><h2 className="jm-title">Your State, on skin.</h2><ol className="rit-preview"><li><span>01</span>Remember. Recall your intention.</li><li><span>02</span>Apply. Place the oil on pulse points.</li><li><span>03</span>Return. Let the scent bring you back to your State.</li></ol><p className="sec-text">Wear alone, layer beneath your favourite perfume, or combine oils collected from different hospitality worlds.</p></>}
        {flow === "action" && <><p className="g-label">Reminder</p><h2 className="jm-title">Choose one action.</h2><div className="field"><input value={action} onChange={(event) => setAction(event.target.value)} placeholder="One action that supports your intention" /></div><div className="seg"><button className={frequency === "off" ? "sel" : ""} onClick={() => setFrequency("off")}>Off</button><button className={frequency === "once" ? "sel" : ""} onClick={() => setFrequency("once")}>Once</button><button className={frequency === "daily" ? "sel" : ""} onClick={() => setFrequency("daily")}>Daily</button></div><button className="btn primary" onClick={() => { onSave({ ...state, reminder: { action: action || "One quiet action today", frequency } }); onClose(); }}>Save</button></>}
        {flow === "circle" && <><p className="g-label">Property Circle · {world.property}</p>{detail ? <><h2 className="jm-title">{detail.title}</h2><p className="country">{detail.when}</p><p className="jm-text">{detail.body}</p><button className="btn primary" onClick={() => rsvp(detail.key)}>{state.rsvps?.[detail.key] ? "Saved" : detail.action}</button><p className="links"><button className="tlink" onClick={() => onCircleDetail(null)}>Back</button></p></> : <div className="circle-list">{circleItems.map((item) => <button key={item.key} className="circle-item" onClick={() => onCircleDetail(item.key)}><span>{item.label}</span><strong>{item.title}</strong><em>{state.rsvps?.[item.key] ? "Saved" : item.when}</em></button>)}</div>}</>}
        {flow === "delete" && <><p className="g-label">Delete account</p><h2 className="jm-title">Delete your Space?</h2><p className="jm-text">This removes your local demo Space, intention, State, orders and linked stays.</p><button className="btn primary danger" onClick={() => { localStorage.clear(); window.location.assign("/"); }}>Delete my account</button></>}
        <p className="links small"><button className="tlink" type="button" onClick={onClose}>Close</button></p>
      </section>
    </div>
  );
}

function RitualContent({ state, onAction }: { state: SpaceState; onAction: () => void }) {
  return <><p className="g-label">Your Scent Invitation</p><h2 className="jm-title">Your invitation ritual.</h2><ol className="rit-preview"><li><span>01</span>Pause. Read your intention. {state.intention}</li><li><span>02</span>Remember who you are becoming.</li><li><span>03</span>Breathe in the scent of your card.</li><li><span>04</span>Act. Choose one action that supports your intention.</li></ol><button className="btn primary" onClick={onAction}>Use this action</button></>;
}

function statusLabel(status: NonNullable<SpaceState["cardStatus"]> | "none") {
  return ({ none: "No card ordered", preparing: "Preparing", sent: "Sent", delivered: "Delivered", received: "Received" } as const)[status];
}
