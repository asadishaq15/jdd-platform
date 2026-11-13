"use client";

import { useEffect, useState } from "react";
import GradientDefs from "../../layout/GradientDefs";
import type { CardOrder } from "../../../lib/space-data";
import type { SpaceUiVersion } from "../../../lib/space-ui-version";
import { getWorld } from "../../../lib/worlds";
import { loadSpaceState, saveSpaceState, type SpaceState } from "../../../lib/space-state";
import { createClient } from "../../../lib/supabase/client";
import AccountSettings from "../AccountSettings";
import type { SpaceEntryProps } from "../SpaceEntry";
import BetaFlowModal, { type BetaFlow } from "./BetaFlowModal";
import SpaceBetaHeader from "./SpaceBetaHeader";
import SpaceDeck from "./SpaceDeck";
import BetaCircleDetail from "./BetaCircleDetail";
import ChosenWorldSlide from "./slides/ChosenWorldSlide";
import CommunitySlide from "./slides/CommunitySlide";
import IdentitySlide from "./slides/IdentitySlide";
import IntentionSlide from "./slides/IntentionSlide";
import RitualSlide from "./slides/RitualSlide";
import ScentInvitationSlide from "./slides/ScentInvitationSlide";
import { SPACE_SLIDES } from "./slides";
import "./space-entry-beta.css";

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
  const [accountOpen, setAccountOpen] = useState(false);
  const [flow, setFlow] = useState<BetaFlow | null>(null);
  const [orderStep, setOrderStep] = useState(1);
  const [circleDetailId, setCircleDetailId] = useState<string | null>(null);

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
  const canOrder = Boolean(connectedStay);
  const ritualActive = Boolean(guest || state.cardStatus === "received");

  function updateState(next: SpaceState) {
    setState(next);
    saveSpaceState(next);
  }

  function simulateDelivery() {
    const current = state.cardStatus || "none";
    const nextStatus =
      current === "preparing" ? "sent"
        : current === "sent" ? "delivered"
          : current === "delivered" ? "received"
            : current;
    if (nextStatus === current) return;
    updateState({ ...state, cardStatus: nextStatus });
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/sign-in");
  }

  const slide = SPACE_SLIDES[slideIndex] || SPACE_SLIDES[0];
  const activeCircleEvent = circleDetailId
    ? circleEvents.find((event) => event.id === circleDetailId) || null
    : null;

  return (
    <main className="space-entry-beta">
      <GradientDefs />
      <SpaceBetaHeader
        account={account}
        menuOpen={menuOpen}
        uiVersion={uiVersion}
        onUiVersionChange={onUiVersionChange}
        onToggleMenu={() => setMenuOpen((value) => !value)}
        onOpenAccount={() => {
          setMenuOpen(false);
          setAccountOpen(true);
        }}
        onSignOut={signOut}
      />

      {activeCircleEvent ? (
        <div className="beta-deck">
          <BetaCircleDetail
            world={world}
            event={activeCircleEvent}
            state={state}
            activeStayId={connectedStay?.id}
            onSave={updateState}
            onBack={() => setCircleDetailId(null)}
          />
        </div>
      ) : (
        <SpaceDeck
          index={slideIndex}
          onIndexChange={setSlideIndex}
          transitionEnabled={!flow && !accountOpen && !circleDetailId}
        >
          {slide.id === "identity" && <IdentitySlide account={account} world={world} />}
          {slide.id === "world" && <ChosenWorldSlide world={world} guest={guest} />}
          {slide.id === "scent" && (
            <ScentInvitationSlide
              world={world}
              guest={guest}
              guestName={guestName}
              state={state}
              canOrder={canOrder}
              onOrder={() => {
                setOrderStep(1);
                setFlow("order");
              }}
              onSimulateDelivery={simulateDelivery}
            />
          )}
          {slide.id === "intention" && (
            <IntentionSlide world={world} state={state} onSave={updateState} />
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
              onUnlock={updateState}
            />
          )}
        </SpaceDeck>
      )}

      {accountOpen && (
        <div
          className="jmodal open"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setAccountOpen(false);
          }}
        >
          <section className="jm-in glass" role="dialog" aria-modal="true" aria-label="My account">
            <h2 className="jm-title">My account</h2>
            <div className="jm-text">
              <AccountSettings account={account} onAccountChange={setAccount} />
            </div>
            <p className="links small">
              <button className="tlink" type="button" onClick={() => setAccountOpen(false)}>Close</button>
            </p>
          </section>
        </div>
      )}

      {flow && (
        <BetaFlowModal
          flow={flow}
          world={world}
          guestName={guestName}
          activeStayId={connectedStay?.id}
          state={state}
          orderStep={orderStep}
          onStep={setOrderStep}
          onClose={() => setFlow(null)}
          onSave={updateState}
          onOpenAction={() => setFlow("action")}
        />
      )}
    </main>
  );
}
