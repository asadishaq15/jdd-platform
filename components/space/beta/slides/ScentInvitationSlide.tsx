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
}: {
  world: HospitalityWorld;
  guest: boolean;
  guestName: string;
  state: SpaceState;
  canOrder: boolean;
  onOrder: () => void;
  onSimulateDelivery: () => void;
}) {
  // Only treat as received when state says so (or a real stay guest with no local status yet).
  const status = state.cardStatus || (guest && state.order ? "received" : "none");
  const activeIndex = status === "received" ? 3 : status === "none" ? -1 : TRACK.indexOf(status as CardStatus);
  const orderLabel = status === "received" || Boolean(state.order) ? "Order another card" : "Order my card";
  const canSimulate = status !== "received";

  return (
    <article className="beta-split beta-scent" aria-label="Scent invitation">
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
        <p className="beta-eyebrow">Scent invitation</p>
        <h2 className="beta-scent-title">
          Your scented <em>card.</em>
        </h2>
        <p className="beta-scent-body">
          A personalized card that captures the signature aroma of{" "}
          <em>{world.property}</em> and introduces the atmosphere of this hospitality world.
        </p>

        {guest && status === "received" && !state.order && (
          <p className="beta-muted">Received during your stay.</p>
        )}

        <div className="beta-scent-actions">
          <button className="beta-cta" type="button" onClick={onOrder} disabled={!canOrder}>
            {orderLabel} <span aria-hidden="true">→</span>
          </button>

          <ol className="beta-track">
            {TRACK.map((step, index) => (
              <li key={step} className={index <= activeIndex ? "done" : ""}>
                {statusLabel(step)}
              </li>
            ))}
          </ol>

          {canSimulate && (
            <button className="beta-text-link" type="button" onClick={onSimulateDelivery}>
              Simulate card delivery
            </button>
          )}
        </div>
      </div>
    </article>
  );
}
