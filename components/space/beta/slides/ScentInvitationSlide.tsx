"use client";

import type { SpaceState } from "../../../../lib/space-state";
import type { HospitalityWorld } from "../../../../lib/worlds";

type CardStatus = NonNullable<SpaceState["cardStatus"]>;

const TRACK: CardStatus[] = ["preparing", "sent", "delivered"];

function statusLabel(status: CardStatus | "none" | "received") {
  return ({
    none: "Not ordered",
    preparing: "Preparing",
    sent: "Sent",
    delivered: "Delivered",
    received: "Received",
  } as const)[status];
}

export default function ScentInvitationSlide({
  world,
  guest,
  guestName,
  state,
  canOrder,
  onOrder,
  onSimulateDelivery,
  onMarkReceived,
}: {
  world: HospitalityWorld;
  guest: boolean;
  guestName: string;
  state: SpaceState;
  canOrder: boolean;
  onOrder: () => void;
  onSimulateDelivery: () => void;
  onMarkReceived: () => void;
}) {
  const hasOrder = Boolean(state.order);
  const status = state.cardStatus || "none";
  const guestReceived = guest && !hasOrder && status === "received";
  const guestBedside = guest && !hasOrder && status !== "received";
  const memberNotOrdered = !guest && !hasOrder && (status === "none" || !status);
  const showPostalReceived = hasOrder && status === "received";
  /* New UI screen 03: track + simulate sit under Order my card (DESIGN_SYSTEM 4.13). */
  const showDeliveryUi = !guest && status !== "received";
  const canSimulate = status === "none" || status === "preparing" || status === "sent";
  const showMarkPostal = status === "delivered";
  const showMarkBedside = guestBedside;
  /* Design mock shows PREPARING as the current step before/at first order. */
  const activeIndex =
    status === "none" || status === "preparing"
      ? 0
      : status === "sent"
        ? 1
        : status === "delivered"
          ? 2
          : -1;

  // HTML: Order my card only when there is no order yet (no “Order another”).
  const showOrderCta = canOrder && memberNotOrdered;

  return (
    <article className="beta-split beta-scent" aria-label="Scent Invitation">
      <div className="beta-split-media">
        <div className="beta-invite-visual">
          <img
            className="beta-scene-img beta-scene-night"
            src="/assets/bg-03-scent-invitation-card-scene.jpg"
            alt={`Scented invitation card for ${guestName} at ${world.property}`}
          />
          <img
            className="beta-scene-img beta-scene-light"
            src="/assets/bg-03-scent-invitation-card-scene_light.png"
            alt={`Scented invitation card for ${guestName} at ${world.property}`}
          />
        </div>
      </div>

      <div className="beta-split-copy">
        <p className="beta-eyebrow">Scent Invitation</p>
        <h2 className="beta-scent-title">
          Your scented <em>card.</em>
        </h2>

        {guestBedside || guestReceived ? (
          <>
            <p className="beta-scent-body">
              Your card is waiting for you on the bedside table in your room. It carries the
              signature aroma of {world.property} and introduces the atmosphere of this world.
            </p>
            <p className={`beta-rcv${guestReceived ? " on" : ""}`}>
              <span className="beta-rcv-dot" aria-hidden="true" />
              Received
            </p>
          </>
        ) : null}

        {!guest && !showPostalReceived ? (
          <p className="beta-scent-body">
            A personalized card that captures the signature aroma of <em>{world.property}</em> and
            introduces the atmosphere of this hospitality world.
          </p>
        ) : null}

        {showPostalReceived ? (
          <p className="beta-d-saved beta-d-recv">
            Received<span className="cu">.</span>
          </p>
        ) : null}

        {showOrderCta ? (
          <div className="beta-scent-actions">
            <button className="beta-cta" type="button" onClick={onOrder}>
              Order my card <span aria-hidden="true">→</span>
            </button>
          </div>
        ) : null}

        {showDeliveryUi ? (
          <div className={`beta-scent-order-status${showOrderCta ? " with-cta" : ""}`}>
            <ol className="beta-track" aria-label="Card delivery status">
              {TRACK.map((step, index) => (
                <li key={step} className={index <= activeIndex ? "done" : ""}>
                  {statusLabel(step)}
                </li>
              ))}
            </ol>
            {canSimulate ? (
              <p className="beta-scent-demo-ctl">
                <button className="beta-text-link" type="button" onClick={onSimulateDelivery}>
                  Simulate card delivery
                </button>
              </p>
            ) : null}
            {showMarkPostal ? (
              <p className="beta-scent-demo-ctl">
                <button className="beta-text-link" type="button" onClick={onMarkReceived}>
                  I received my card
                </button>
              </p>
            ) : null}
          </div>
        ) : null}

        {showMarkBedside ? (
          <div className="beta-scent-actions">
            <button className="beta-text-link" type="button" onClick={onMarkReceived}>
              Mark as received
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
