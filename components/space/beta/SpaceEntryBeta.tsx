"use client";

import { useEffect, useState } from "react";
import GradientDefs from "../../layout/GradientDefs";
import type { CardOrder } from "../../../lib/space-data";
import type { SpaceUiVersion } from "../../../lib/space-ui-version";
import { communityCircleForWorld } from "../../../lib/community-circle";
import { getWorld, worldNumberForDemoCode } from "../../../lib/worlds";
import { activeWorldNumber, isGuestSpace } from "../../../lib/space-active-world";
import { attachDemoCode, migrateStaysFromCode } from "../../../lib/space-property-snapshot";
import { persistSpaceState, type SpaceState } from "../../../lib/space-state";
import { buildDashboardSpaceState, signOutToLogin } from "../../../lib/space-state-sync";
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
import { BetaSlideLayer } from "./BetaSlideLayer";
import SpaceDeck from "./SpaceDeck";
import SpaceEventsDrawer from "./SpaceEventsDrawer";
import SpaceRemindersModal from "./SpaceRemindersModal";
import BetaCircleDetail from "./BetaCircleDetail";
import ChosenWorldSlide from "./slides/ChosenWorldSlide";
import CommunitySlide from "./slides/CommunitySlide";
import IdentitySlide from "./slides/IdentitySlide";
import IntentionSlide from "./slides/IntentionSlide";
import RitualSlide from "./slides/RitualSlide";
import ScentInvitationSlide from "./slides/ScentInvitationSlide";
import { SPACE_SLIDES } from "./slides";
import "./space-entry-beta.css";

type ProfilePanel = "account" | "orders" | "stays" | "reminders" | "delete" | null;

const IDENTITY_SLIDE_INDEX = SPACE_SLIDES.findIndex((slide) => slide.id === "identity");
const SCENT_SLIDE_INDEX = SPACE_SLIDES.findIndex((slide) => slide.id === "scent");
const RITUAL_SLIDE_INDEX = SPACE_SLIDES.findIndex((slide) => slide.id === "ritual");
const INTENTION_SLIDE_INDEX = SPACE_SLIDES.findIndex((slide) => slide.id === "intention");

type SpaceEntryBetaProps = SpaceEntryProps & {
  uiVersion: SpaceUiVersion;
  onUiVersionChange: (version: SpaceUiVersion) => void;
};

export default function SpaceEntryBeta({
  account: initialAccount,
  stays,
  activeStayId,
  initialOrders = [],
  circleEvents = [],
  initialRsvps = {},
  initialState = {},
  initialSpaceSnapshot = null,
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
    const next = buildDashboardSpaceState({
      initialState,
      initialSpaceSnapshot,
      initialRsvps,
      initialOrders,
      stays,
      activeStayId,
    });
    setState(next);
    persistSpaceState(next);
  }, [
    activeStayId,
    initialOrders,
    initialRsvps,
    initialSpaceSnapshot,
    initialState.chosen,
    initialState.dateOfBirth,
    initialState.recommended,
    stays,
  ]);

  const connectedStay = stays.find((stay) => stay.id === activeStayId) || stays[0];
  const guest = isGuestSpace(state);
  const activeNumber = activeWorldNumber(state) ?? connectedStay?.property.worldNumber ?? 9;
  const baseWorld = getWorld(activeNumber);
  const world =
    connectedStay && !guest
      ? { ...baseWorld, property: connectedStay.property.name, country: connectedStay.property.country || baseWorld.country }
      : baseWorld;
  const guestName = connectedStay?.guestName || account.fullName;
  // Show order CTA for discovery guests and inactive/no-stay members; API persists only when a stay exists.
  const canOrder = true;
  // HTML ritualActive: only once the card is marked received (guest bedside or postal)
  const ritualActive = state.cardStatus === "received";

  function updateState(next: SpaceState) {
    setState(next);
    persistSpaceState(next);
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
    // HTML card-received → received; members with intention get intentPrompt + scroll to intention
    updateState({
      ...state,
      cardStatus: "received",
      ...(!guest && state.intention?.trim() ? { intentPrompt: true } : {}),
    });
    if (INTENTION_SLIDE_INDEX >= 0) setSlideIndex(INTENTION_SLIDE_INDEX);
  }

  function signOut() {
    void signOutToLogin();
  }

  const activeCircleEvent = circleDetailId
    ? [...circleEvents, ...communityCircleForWorld(world)].find((event) => event.id === circleDetailId) || null
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
      />
    );
  }

  if (accessCodeOpen) {
    return (
      <BetaAccessCodeFlow
        onClose={() => setAccessCodeOpen(false)}
        onComplete={({ code, visited }) => {
          updateState(attachDemoCode(state, code, visited));
          setAccessCodeOpen(false);
          // HTML toSpace(): new code opens the first dashboard slide (My Space), not the previous one.
          if (IDENTITY_SLIDE_INDEX >= 0) setSlideIndex(IDENTITY_SLIDE_INDEX);
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
    none: "Not ordered",
    preparing: "Preparing",
    sent: "Sent",
    delivered: "Delivered",
    received: "Received",
  } as const)[state.cardStatus || "none"];

  function openOrderFromMenu() {
    setProfilePanel(null);
    setFlow("order");
  }

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
          <section className="jm-in glass beta-account-sheet" role="dialog" aria-modal="true" aria-label="My account">
            <h2 className="jm-title">My account</h2>
            <div className="jm-text">
              <AccountSettings account={account} onAccountChange={setAccount} />
            </div>
            <p className="links small">
              <button className="tlink" type="button" onClick={() => setProfilePanel(null)}>
                Close
              </button>
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
          <section className="jm-in glass beta-orders-sheet" role="dialog" aria-modal="true" aria-label="My orders">
            <h2 className="jm-title">My orders</h2>
            <div className="jm-text">
              {state.order ? (
                <div className="beta-orders-acc">
                  <p className="acc-l">Scented card</p>
                  <p className="acc-v">
                    {state.order.property} · {state.order.state}
                  </p>
                  <p className="acc-l">For</p>
                  <p className="acc-v">{state.order.recipient}</p>
                  {state.order.address || state.order.city ? (
                    <>
                      <p className="acc-l">Deliver to</p>
                      <p className="acc-v">
                        {[state.order.address, state.order.city, state.order.zip, state.order.country]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    </>
                  ) : null}
                  {state.order.price ? (
                    <>
                      <p className="acc-l">Price</p>
                      <p className="acc-v">{state.order.price}</p>
                    </>
                  ) : null}
                  {state.order.payment ? (
                    <>
                      <p className="acc-l">Payment method</p>
                      <p className="acc-v">{state.order.payment}</p>
                    </>
                  ) : null}
                  <p className="acc-l">Status</p>
                  <p className="acc-v">{cardStatusLabel}</p>
                </div>
              ) : (
                <>
                  <p>No orders yet.</p>
                  <div className="stay-actions">
                    <button className="beta-cta beta-orders-cta" type="button" onClick={openOrderFromMenu}>
                      Order my card <span aria-hidden="true">→</span>
                    </button>
                  </div>
                </>
              )}
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
              {(state.stays || []).length ? (
                <div className="beta-orders-acc">
                  <p className="acc-l">Your stays, connected to My Space.</p>
                  {state.stays!.map((stay) => {
                    const row = getWorld(stay.n);
                    return (
                      <div key={`${stay.n}-${stay.code}`}>
                        <p className="acc-v">{row.property}</p>
                        <p className="acc-l">{row.state}</p>
                      </div>
                    );
                  })}
                </div>
              ) : stays.length ? (
                stays.map((stay) => (
                  <p key={stay.id}>
                    <strong>{stay.property.name}</strong>
                    <br />
                    {stay.checkIn || "Date pending"}
                    {stay.checkOut ? ` — ${stay.checkOut}` : ""}
                  </p>
                ))
              ) : (
                <p>No activated stays yet.</p>
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
          <section className="jm-in glass beta-delete-sheet" role="dialog" aria-modal="true" aria-label="Delete account">
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

  return (
    <main className="space-entry-beta">
      {journeyOpen ? (
        <MyJourneyPage
          account={account}
          onClose={() => setJourneyOpen(false)}
          onProfileAction={handleProfileAction}
          onSignOut={signOut}
        />
      ) : (
        <>
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
          guest={guest}
          onIndexChange={setSlideIndex}
          transitionEnabled={!flow && !profileBusy && !circleDetailId && !accessCodeOpen}
        >
          {SPACE_SLIDES.map((def, i) => (
            <BetaSlideLayer key={def.id} index={i} slideId={def.id}>
              {def.id === "identity" && <IdentitySlide account={account} world={world} />}
              {def.id === "world" && <ChosenWorldSlide world={world} guest={guest} />}
              {def.id === "scent" && (
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
              {def.id === "intention" && (
                <IntentionSlide state={state} onSave={updateState} />
              )}
              {def.id === "ritual" && (
                <RitualSlide
                  active={ritualActive}
                  guest={guest}
                  onRitual={() => setFlow("ritual")}
                  onOil={() => setFlow("oil")}
                />
              )}
              {def.id === "community" && (
                <CommunitySlide
                  world={world}
                  guest={guest}
                  state={state}
                  circleEvents={circleEvents}
                  onOpenEvent={setCircleDetailId}
                  onRequestAccessCode={() => setAccessCodeOpen(true)}
                />
              )}
            </BetaSlideLayer>
          ))}
        </SpaceDeck>
      )}
        </>
      )}

      {profileOverlays}
    </main>
  );
}
