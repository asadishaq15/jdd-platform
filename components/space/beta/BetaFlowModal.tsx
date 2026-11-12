"use client";

import { useState } from "react";
import type { SpaceState } from "../../../lib/space-state";
import type { HospitalityWorld } from "../../../lib/worlds";

export type BetaFlow = "order" | "ritual" | "oil" | "action";

export default function BetaFlowModal({
  flow,
  world,
  guestName,
  activeStayId,
  state,
  orderStep,
  onStep,
  onClose,
  onSave,
  onOpenAction,
}: {
  flow: BetaFlow;
  world: HospitalityWorld;
  guestName: string;
  activeStayId?: string;
  state: SpaceState;
  orderStep: number;
  onStep: (step: number) => void;
  onClose: () => void;
  onSave: (next: SpaceState) => void;
  onOpenAction: () => void;
}) {
  const [action, setAction] = useState(state.reminder?.action || "");
  const [frequency, setFrequency] = useState<"off" | "once" | "daily">(state.reminder?.frequency || "off");
  const [recipientName, setRecipientName] = useState(guestName);
  const [shippingAddress, setShippingAddress] = useState("");
  const [orderError, setOrderError] = useState("");
  const [ordering, setOrdering] = useState(false);

  async function completeOrder() {
    if (!activeStayId) {
      setOrderError("Activate a stay before requesting a card.");
      return;
    }
    if (recipientName.trim().length < 2 || shippingAddress.trim().length < 8) {
      setOrderError("Enter the recipient and complete delivery address.");
      return;
    }
    setOrdering(true);
    setOrderError("");
    const response = await fetch("/api/card-orders", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ stayId: activeStayId, recipientName, shippingAddress }),
    });
    const result = await response.json();
    if (!response.ok) {
      setOrderError(result.error || "The order request could not be saved.");
      setOrdering(false);
      return;
    }
    onSave({
      ...state,
      cardStatus: "preparing",
      order: {
        property: world.property,
        state: world.state,
        recipient: recipientName.trim(),
        address: shippingAddress.trim(),
      },
    });
    setOrdering(false);
    onClose();
  }

  return (
    <div
      className="jmodal open"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="jm-in glass flow-modal" role="dialog" aria-modal="true" aria-label="Space flow">
        {flow === "order" && (
          <>
            <p className="g-label">Scented card request · {orderStep} of 3</p>
            {orderStep === 1 && (
              <>
                <h2 className="jm-title">Your scented card.</h2>
                <div className="order-card dash-card" style={{ "--h": (world.n * 37) % 360 } as React.CSSProperties}>
                  <span className="d-card-t">{world.property}</span>
                  <span className="d-card-s">{world.state}</span>
                  <span className="oc-name">For {guestName}</span>
                </div>
                <button className="btn primary" type="button" onClick={() => onStep(2)}>Continue</button>
              </>
            )}
            {orderStep === 2 && (
              <>
                <h2 className="jm-title">Delivery details.</h2>
                <div className="field">
                  <input aria-label="Full name" placeholder="Full name" value={recipientName} onChange={(event) => setRecipientName(event.target.value)} />
                </div>
                <div className="field">
                  <input aria-label="Address" placeholder="Complete delivery address" value={shippingAddress} onChange={(event) => setShippingAddress(event.target.value)} />
                </div>
                <button
                  className="btn primary"
                  type="button"
                  onClick={() => {
                    if (recipientName.trim().length >= 2 && shippingAddress.trim().length >= 8) {
                      setOrderError("");
                      onStep(3);
                    } else {
                      setOrderError("Enter the recipient and complete delivery address.");
                    }
                  }}
                >
                  Review
                </button>
              </>
            )}
            {orderStep === 3 && (
              <>
                <h2 className="jm-title">Review request.</h2>
                <p>
                  {world.property} · {world.state}
                  <br />
                  For {recipientName}
                  <br />
                  {shippingAddress}
                </p>
                <p className="sec-text">No payment details are collected. The property will manage fulfilment.</p>
                <button className="btn primary" type="button" disabled={ordering} onClick={() => void completeOrder()}>
                  {ordering ? "Saving…" : "Place request"}
                </button>
              </>
            )}
            {orderError && <p className="feedback-error" role="alert">{orderError}</p>}
          </>
        )}

        {flow === "ritual" && (
          <>
            <p className="g-label">Your Scent Invitation</p>
            <h2 className="jm-title">Your invitation ritual.</h2>
            <ol className="rit-preview">
              <li><span>01</span>Pause. Read your intention. {state.intention}</li>
              <li><span>02</span>Remember who you are becoming.</li>
              <li><span>03</span>Breathe in the scent of your card.</li>
              <li><span>04</span>Act. Choose one action that supports your intention.</li>
            </ol>
            <button className="btn primary" type="button" onClick={onOpenAction}>Use this action</button>
          </>
        )}

        {flow === "oil" && (
          <>
            <p className="g-label">Perfume oil ritual</p>
            <h2 className="jm-title">Your State, on skin.</h2>
            <ol className="rit-preview">
              <li><span>01</span>Remember. Recall your intention.</li>
              <li><span>02</span>Apply. Place the oil on pulse points.</li>
              <li><span>03</span>Return. Let the scent bring you back to your State.</li>
            </ol>
            <p className="sec-text">Wear alone, layer beneath your favourite perfume, or combine oils collected from different hospitality worlds.</p>
          </>
        )}

        {flow === "action" && (
          <>
            <p className="g-label">Reminder</p>
            <h2 className="jm-title">Choose one action.</h2>
            <div className="field">
              <input
                value={action}
                onChange={(event) => setAction(event.target.value)}
                placeholder="One action that supports your intention"
              />
            </div>
            <div className="seg">
              <button type="button" className={frequency === "off" ? "sel" : ""} onClick={() => setFrequency("off")}>Off</button>
              <button type="button" className={frequency === "once" ? "sel" : ""} onClick={() => setFrequency("once")}>Once</button>
              <button type="button" className={frequency === "daily" ? "sel" : ""} onClick={() => setFrequency("daily")}>Daily</button>
            </div>
            <button
              className="btn primary"
              type="button"
              onClick={() => {
                onSave({ ...state, reminder: { action: action || "One quiet action today", frequency } });
                onClose();
              }}
            >
              Save
            </button>
          </>
        )}

        <p className="links small">
          <button className="tlink" type="button" onClick={onClose}>Close</button>
        </p>
      </section>
    </div>
  );
}
