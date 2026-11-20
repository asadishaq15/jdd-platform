"use client";

import { useEffect, useState } from "react";
import GradientDefs from "../../layout/GradientDefs";
import type { CardOrder } from "../../../lib/space-data";
import type { SpaceUiVersion } from "../../../lib/space-ui-version";
import { getWorld } from "../../../lib/worlds";
import { loadSpaceState, saveSpaceState, type SpaceState } from "../../../lib/space-state";
import { createClient } from "../../../lib/supabase/client";
import AccountSettings from "../AccountSettings";
import DeleteAccountDialog from "../DeleteAccountDialog";
import type { SpaceEntryProps } from "../SpaceEntry";
import BetaAccessCodeFlow from "./BetaAccessCodeFlow";
import type { BetaFlow } from "./BetaFlowModal";
import StatesExplorePage from "../StatesExplorePage";
import InvitationRitualFlow from "./InvitationRitualFlow";
import LegalSheet from "./LegalSheet";
import MyJourneyPage from "./MyJourneyPage";
import OrderCardFlow from "./OrderCardFlow";
import PerfumeOilFlow from "./PerfumeOilFlow";
import SpaceBetaHeader, { type SpaceProfileAction } from "./SpaceBetaHeader";
import SpaceDeck from "./SpaceDeck";
import SpaceEventsDrawer from "./SpaceEventsDrawer";
import SpaceRemindersModal from "./SpaceRemindersModal";
import BetaCircleDetail from "./BetaCircleDetail";
import ChosenWorldSlide from "./slides/ChosenWorldSlide";
import CommunitySlide, { DEMO_COMMUNITY_EVENTS } from "./slides/CommunitySlide";
import IdentitySlide from "./slides/IdentitySlide";
import IntentionSlide from "./slides/IntentionSlide";
import RitualSlide from "./slides/RitualSlide";
import ScentInvitationSlide from "./slides/ScentInvitationSlide";
import { SPACE_SLIDES } from "./slides";
import "./space-entry-beta.css";

type ProfilePanel = "account" | "orders" | "stays" | "reminders" | "delete" | null;

const SCENT_SLIDE_INDEX = SPACE_SLIDES.findIndex((slide) => slide.id === "scent");
const RITUAL_SLIDE_INDEX = SPACE_SLIDES.findIndex((slide) => slide.id === "ritual");
const INTENTION_SLIDE_INDEX = SPACE_SLIDES.findIndex((slide) => slide.id === "intention");

type SpaceEntryBetaProps = SpaceEntryProps & {
  uiVersion: SpaceUiVersion;
  onUiVersionChange: (version: SpaceUiVersion) => void;
};

function orderStatusForSpace(status: CardOrder["status"]): NonNullable<SpaceState["cardStatus"]> {
  if (status === "requested") return "preparing";
  if (status === "cancelled") return "none";
  return status;
}

export default function SpaceEntryBeta({
  account: initialAccount,
  stays,
  activeStayId,
  initialOrders = [],
  circleEvents = [],
  initialRsvps = {},
  initialState = {},
  uiVersion,
  onUiVersionChange,
}: SpaceEntryBetaProps) {
  const [account, setAccount] = useState(initialAccount);
  const [state, setState] = useState<SpaceState>({});
  const [slideIndex, setSlideIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profilePanel, setProfilePanel] = useState<ProfilePanel>(null);
  const [journeyOpen, setJourneyOpen] = useState(false);
  const [eventsOpen, setEventsOpen] = useState(false);
  const [exploreOpen, setExploreOpen] = useState(false);
  const [legalOpen, setLegalOpen] = useState(false);
  const [flow, setFlow] = useState<BetaFlow | null>(null);
  const [circleDetailId, setCircleDetailId] = useState<string | null>(null);
  const [accessCodeOpen, setAccessCodeOpen] = useState(false);

  useEffect(() => {
    setAccount(initialAccount);
  }, [initialAccount]);

  useEffect(() => {
    const loaded = loadSpaceState();
    const synced = {
      ...loaded,
      ...(initialState.recommended ? { recommended: initialState.recommended } : {}),
      ...(initialState.chosen ? { chosen: initialState.chosen } : {}),
      ...(initialState.dateOfBirth ? { dateOfBirth: initialState.dateOfBirth } : {}),
      rsvps: { ...(loaded.rsvps || {}), ...initialRsvps },
    };
    const connected = stays.find((stay) => stay.id === activeStayId) || stays[0];
    const latestOrder = initialOrders[0];
    const persistedOrder = latestOrder
      ? {
          cardStatus: orderStatusForSpace(latestOrder.status),
          order: {
            property: latestOrder.propertyName,
            state: getWorld(connected?.property.worldNumber || synced.chosen || synced.recommended || 9).state,
            recipient: latestOrder.recipientName,
          },
        }
      : {};
    const next = connected
      ? { ...synced, ...persistedOrder, visited: connected.property.worldNumber }
      : { ...synced, ...persistedOrder };
    setState(next);
    saveSpaceState(next);
  }, [activeStayId, initialOrders, initialRsvps, initialState.chosen, initialState.dateOfBirth, initialState.recommended, stays]);

  const connectedStay = stays.find((stay) => stay.id === activeStayId) || stays[0];
  const activeNumber = connectedStay?.property.worldNumber || state.visited || state.chosen || state.recommended || 9;
  const baseWorld = getWorld(activeNumber);
  const world = connectedStay
    ? { ...baseWorld, property: connectedStay.property.name, country: connectedStay.property.country || baseWorld.country }
    : baseWorld;
  const guest = Boolean(connectedStay || (state.visited && state.code));
  const guestName = connectedStay?.guestName || account.fullName;
  // Show order CTA for discovery guests and inactive/no-stay members; API persists only when a stay exists.
  const canOrder = true;
  // HTML ritualActive: only once the card is marked received (guest bedside or postal)
  const ritualActive = state.cardStatus === "received";

  function updateState(next: SpaceState) {
    setState(next);
    saveSpaceState(next);
  }

  function simulateDelivery() {
    // HTML simulate: preparing → sent → delivered only (never jumps to received)
    const current = state.cardStatus || "none";
    const nextStatus =
      current === "preparing" ? "sent"
        : current === "sent" ? "delivered"
          : current;
    if (nextStatus === current) return;
    updateState({ ...state, cardStatus: nextStatus });
  }

  function markReceived() {
    // HTML mark-received / card-received → status received; scroll to intention
    updateState({ ...state, cardStatus: "received" });
    if (INTENTION_SLIDE_INDEX >= 0) setSlideIndex(INTENTION_SLIDE_INDEX);
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/sign-in");
  }

  const slide = SPACE_SLIDES[slideIndex] || SPACE_SLIDES[0];
  const activeCircleEvent = circleDetailId
    ? [...circleEvents, ...DEMO_COMMUNITY_EVENTS].find((event) => event.id === circleDetailId) || null
    : null;

  if (flow === "order") {
    return (
      <OrderCardFlow
        world={world}
        guestName={guestName}
        activeStayId={connectedStay?.id}
        state={state}
        onSave={updateState}
        onClose={() => {
          setFlow(null);
          if (SCENT_SLIDE_INDEX >= 0) setSlideIndex(SCENT_SLIDE_INDEX);
        }}
      />
    );
  }

  if (flow === "oil") {
    return (
      <PerfumeOilFlow
        world={world}
        state={state}
        onClose={() => {
          setFlow(null);
          if (RITUAL_SLIDE_INDEX >= 0) setSlideIndex(RITUAL_SLIDE_INDEX);
        }}
      />
    );
  }

  if (flow === "ritual") {
    return (
      <InvitationRitualFlow
        state={state}
        active={ritualActive}
        onSave={updateState}
        onClose={() => {
          setFlow(null);
          if (RITUAL_SLIDE_INDEX >= 0) setSlideIndex(RITUAL_SLIDE_INDEX);
        }}
        onEditIntention={() => {
          setFlow(null);
          if (INTENTION_SLIDE_INDEX >= 0) setSlideIndex(INTENTION_SLIDE_INDEX);
        }}
      />
    );
  }

  if (accessCodeOpen) {
    return (
      <BetaAccessCodeFlow
        onClose={() => setAccessCodeOpen(false)}
        onComplete={({ code, visited }) => {
          updateState({
            ...state,
            code,
            visited,
            entryMode: "code",
            intention: undefined,
            becoming: undefined,
            reminder: undefined,
          });
          setAccessCodeOpen(false);
        }}
      />
    );
  }

  function handleProfileAction(action: SpaceProfileAction) {
    if (action === "journey") {
      setJourneyOpen(true);
      return;
    }
    if (action === "events") {
      setEventsOpen(true);
      return;
    }
    if (action === "explore") {
      setExploreOpen(true);
      return;
    }
    if (action === "legal") {
      setLegalOpen(true);
      return;
    }
    setProfilePanel(action);
  }

  const cardStatusLabel = ({
    none: "No card ordered",
    preparing: "Preparing",
    sent: "Sent",
    delivered: "Delivered",
    received: "Received",
  } as const)[state.cardStatus || "none"];

  const profileBusy = Boolean(profilePanel || eventsOpen || exploreOpen || legalOpen);

  const profileOverlays = (
    <>
      {profilePanel === "account" && (
        <div
          className="jmodal open"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setProfilePanel(null);
          }}
        >
          <section className="jm-in glass" role="dialog" aria-modal="true" aria-label="My account">
            <h2 className="jm-title">My account</h2>
            <div className="jm-text">
              <AccountSettings account={account} onAccountChange={setAccount} />
            </div>
            <p className="links small">
              <button className="tlink" type="button" onClick={() => setProfilePanel(null)}>Close</button>
            </p>
          </section>
        </div>
      )}

      {profilePanel === "orders" && (
        <div
          className="jmodal open"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setProfilePanel(null);
          }}
        >
          <section className="jm-in glass" role="dialog" aria-modal="true" aria-label="My orders">
            <h2 className="jm-title">My orders</h2>
            <div className="jm-text">
              <p>
                {state.order ? `${state.order.property} · ${state.order.state}` : "No orders yet."}
                <br />
                Scented card status: {cardStatusLabel}.
              </p>
            </div>
            <p className="links small">
              <button className="tlink" type="button" onClick={() => setProfilePanel(null)}>Close</button>
            </p>
          </section>
        </div>
      )}

      {profilePanel === "stays" && (
        <div
          className="jmodal open"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setProfilePanel(null);
          }}
        >
          <section className="jm-in glass" role="dialog" aria-modal="true" aria-label="My stays">
            <h2 className="jm-title">My stays</h2>
            <div className="jm-text">
              {stays.length ? (
                stays.map((stay) => (
                  <p key={stay.id}>
                    <strong>{stay.property.name}</strong>
                    <br />
                    {stay.checkIn || "Date pending"}
                    {stay.checkOut ? ` — ${stay.checkOut}` : ""}
                  </p>
                ))
              ) : (
                <p>{state.code ? `${world.property} is connected.` : "No activated stays yet."}</p>
              )}
            </div>
            <p className="links small">
              <button className="tlink" type="button" onClick={() => setProfilePanel(null)}>Close</button>
            </p>
          </section>
        </div>
      )}

      {profilePanel === "reminders" && (
        <SpaceRemindersModal
          state={state}
          onClose={() => setProfilePanel(null)}
          onSave={updateState}
        />
      )}

      {profilePanel === "delete" && (
        <div
          className="jmodal open"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setProfilePanel(null);
          }}
        >
          <section className="jm-in glass" role="dialog" aria-modal="true" aria-label="Delete account">
            <DeleteAccountDialog />
            <p className="links small">
              <button className="tlink" type="button" onClick={() => setProfilePanel(null)}>Close</button>
            </p>
          </section>
        </div>
      )}

      <SpaceEventsDrawer open={eventsOpen} onClose={() => setEventsOpen(false)} />
      {exploreOpen ? <StatesExplorePage onClose={() => setExploreOpen(false)} /> : null}
      <LegalSheet open={legalOpen} onClose={() => setLegalOpen(false)} />
    </>
  );

  if (journeyOpen) {
    return (
      <>
        <MyJourneyPage
          account={account}
          onClose={() => setJourneyOpen(false)}
          onOpenAccount={() => setProfilePanel("account")}
          onOpenEvents={() => setEventsOpen(true)}
          onOpenExplore={() => setExploreOpen(true)}
          onOpenLegal={() => setLegalOpen(true)}
          onSignOut={signOut}
        />
        {profileOverlays}
      </>
    );
  }

  return (
    <main className="space-entry-beta">
      <GradientDefs />
      <SpaceBetaHeader
        account={account}
        menuOpen={menuOpen}
        uiVersion={uiVersion}
        onUiVersionChange={onUiVersionChange}
        onToggleMenu={() => setMenuOpen((value) => !value)}
        onCloseMenu={() => setMenuOpen(false)}
        onProfileAction={handleProfileAction}
        onSignOut={signOut}
        topStart={
          activeCircleEvent ? (
            <button
              className="beta-hback"
              type="button"
              onClick={() => setCircleDetailId(null)}
            >
              Back
            </button>
          ) : undefined
        }
      />

      {activeCircleEvent ? (
        <div className="beta-deck">
          <BetaCircleDetail
            world={world}
            event={activeCircleEvent}
            state={state}
            activeStayId={connectedStay?.id}
            onSave={updateState}
          />
        </div>
      ) : (
        <SpaceDeck
          index={slideIndex}
          onIndexChange={setSlideIndex}
          transitionEnabled={!flow && !profileBusy && !circleDetailId && !accessCodeOpen}
        >
          {slide.id === "identity" && <IdentitySlide account={account} world={world} />}
          {slide.id === "world" && <ChosenWorldSlide world={world} />}
          {slide.id === "scent" && (
            <ScentInvitationSlide
              world={world}
              guest={guest}
              guestName={guestName}
              state={state}
              canOrder={canOrder}
              onOrder={() => setFlow("order")}
              onSimulateDelivery={simulateDelivery}
              onMarkReceived={markReceived}
            />
          )}
          {slide.id === "intention" && (
            <IntentionSlide state={state} onSave={updateState} />
          )}
          {slide.id === "ritual" && (
            <RitualSlide
              active={ritualActive}
              onRitual={() => setFlow("ritual")}
              onOil={() => setFlow("oil")}
            />
          )}
          {slide.id === "community" && (
            <CommunitySlide
              world={world}
              guest={guest}
              state={state}
              circleEvents={circleEvents}
              onOpenEvent={setCircleDetailId}
              onRequestAccessCode={() => setAccessCodeOpen(true)}
            />
          )}
        </SpaceDeck>
      )}

      {profileOverlays}
    </main>
  );
}
