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
  // HTML: guest && !o → bedside; else if !o → Order my card; else → track / Received.
  const memberNotOrdered = !guest && !hasOrder;
  const showPostalReceived = hasOrder && status === "received";
  const showDeliveryTrack = hasOrder && status !== "received";
  const canSimulate = status === "preparing" || status === "sent";
  const showMarkPostal = status === "delivered";
  const showMarkBedside = guestBedside;
  const activeIndex =
    status === "preparing"
      ? 0
      : status === "sent"
        ? 1
        : status === "delivered"
          ? 2
          : -1;

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
              signature aroma of <em>{world.property}</em> and introduces the atmosphere of this
              world.
            </p>
            <p className={`beta-rcv${guestReceived ? " on" : ""}`}>
              <span className="beta-rcv-dot" aria-hidden="true" />
              Received
            </p>
          </>
        ) : null}

        {showOrderCta ? (
          <>
            <p className="beta-scent-body">
              A personalised card that introduces the aroma of <em>{world.property}</em>. It arrives
              by post and becomes part of your ritual.
            </p>
            <div className="beta-scent-actions">
              <button className="beta-cta" type="button" onClick={onOrder}>
                Order my card <span aria-hidden="true">→</span>
              </button>
            </div>
          </>
        ) : null}

        {showPostalReceived ? (
          <p className="beta-d-saved beta-d-recv">
            Received<span className="cu">.</span>
          </p>
        ) : null}

        {showDeliveryTrack ? (
          <div className="beta-scent-order-status">
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
