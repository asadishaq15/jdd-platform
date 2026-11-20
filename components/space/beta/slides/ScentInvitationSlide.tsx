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
  const showTrack = hasOrder && status !== "none" && status !== "received";
  const showPostalReceived = hasOrder && status === "received";
  const canSimulate = status === "preparing" || status === "sent";
  const showMarkPostal = hasOrder && status === "delivered";
  const showMarkBedside = guestBedside;
  const activeIndex = status === "none" ? -1 : TRACK.indexOf(status as CardStatus);

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

        {memberNotOrdered ? (
          <p className="beta-scent-body">
            A personalized card that introduces the aroma of this hospitality world.
          </p>
        ) : null}

        {showTrack ? (
          <ol className="beta-track">
            {TRACK.map((step, index) => (
              <li key={step} className={index <= activeIndex ? "done" : ""}>
                {statusLabel(step)}
              </li>
            ))}
          </ol>
        ) : null}

        {showPostalReceived ? (
          <p className="beta-d-saved beta-d-recv">
            Received<span className="cu">.</span>
          </p>
        ) : null}

        <div className="beta-scent-actions">
          {showMarkBedside ? (
            <button className="beta-text-link" type="button" onClick={onMarkReceived}>
              Mark as received
            </button>
          ) : null}

          {showMarkPostal ? (
            <button className="beta-text-link" type="button" onClick={onMarkReceived}>
              I received my card
            </button>
          ) : null}

          {canSimulate ? (
            <button className="beta-text-link" type="button" onClick={onSimulateDelivery}>
              Simulate card delivery
            </button>
          ) : null}

          {showOrderCta ? (
            <button className="beta-cta" type="button" onClick={onOrder}>
              Order my card <span aria-hidden="true">→</span>
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
