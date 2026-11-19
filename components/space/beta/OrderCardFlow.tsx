"use client";

import { FormEvent, useState } from "react";
import AuthShell from "../../auth/AuthShell";
import type { SpaceState } from "../../../lib/space-state";
import type { HospitalityWorld } from "../../../lib/worlds";
import "./order-card-flow.css";

type Step = "delivery" | "review" | "confirmed";

type Delivery = {
  recipient: string;
  address: string;
  city: string;
  postal: string;
  country: string;
};

type PayFields = {
  number: string;
  name: string;
  exp: string;
  cvc: string;
};

function formatShippingAddress(delivery: Delivery) {
  return `${delivery.address.trim()}, ${delivery.city.trim()} ${delivery.postal.trim()}, ${delivery.country.trim()}`;
}

function formatCardNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 16);
  return digits.replace(/(\d{4})(?=\d)/g, "$1 ");
}

function formatExp(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 4);
  return digits.length > 2 ? `${digits.slice(0, 2)} / ${digits.slice(2)}` : digits;
}

function stepLabel(step: Step) {
  if (step === "delivery") return "1 of 2";
  if (step === "review") return "2 of 2";
  return null;
}

export default function OrderCardFlow({
  world,
  guestName,
  activeStayId,
  state,
  onSave,
  onClose,
}: {
  world: HospitalityWorld;
  guestName: string;
  activeStayId?: string;
  state: SpaceState;
  onSave: (next: SpaceState) => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("delivery");
  const [delivery, setDelivery] = useState<Delivery>({
    recipient: guestName,
    address: "",
    city: "",
    postal: "",
    country: "",
  });
  const [pay, setPay] = useState<PayFields>({ number: "", name: "", exp: "", cvc: "" });
  const [payOpen, setPayOpen] = useState(false);
  const [deliveryError, setDeliveryError] = useState(false);
  const [payError, setPayError] = useState(false);
  const [orderError, setOrderError] = useState("");
  const [ordering, setOrdering] = useState(false);

  const topCenterLabel = stepLabel(step);

  function goBack() {
    if (step === "review") {
      setStep("delivery");
      return;
    }
    onClose();
  }

  function updateDelivery<K extends keyof Delivery>(key: K, value: Delivery[K]) {
    setDelivery((current) => ({ ...current, [key]: value }));
  }

  function submitDelivery(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const ok = (["recipient", "address", "city", "postal", "country"] as const).every(
      (key) => delivery[key].trim().length > 0,
    );
    setDeliveryError(!ok);
    if (!ok) return;
    setOrderError("");
    setStep("review");
  }

  function fillDemoPay() {
    setPay({
      number: "4242 4242 4242 4242",
      name: guestName || "Demo Guest",
      exp: "12 / 34",
      cvc: "123",
    });
    setPayOpen(true);
    setPayError(false);
  }

  async function placeOrder() {
    if (ordering) return;
    const payOk = (["number", "name", "exp", "cvc"] as const).every((key) => pay[key].trim().length > 0);
    setPayError(!payOk);
    if (!payOk) {
      setPayOpen(true);
      return;
    }

    const recipientName = delivery.recipient.trim();
    const shippingAddress = formatShippingAddress(delivery);
    setOrdering(true);
    setOrderError("");

    if (activeStayId) {
      const response = await fetch("/api/card-orders", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ stayId: activeStayId, recipientName, shippingAddress }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        setOrderError(result.error || "The order request could not be saved.");
        setOrdering(false);
        return;
      }
    }

    onSave({
      ...state,
      cardStatus: "preparing",
      order: {
        property: world.property,
        state: world.state,
        recipient: recipientName,
        address: shippingAddress,
        payment: "Card",
      },
    });
    setPay({ number: "", name: "", exp: "", cvc: "" });
    setPayOpen(false);
    setOrdering(false);
    setStep("confirmed");
  }

  return (
    <div className="beta-order-overlay">
      <AuthShell
        className="beta-order-shell"
        topStart={
          <button className="demo-restart" type="button" onClick={goBack}>
            Back
          </button>
        }
        topCenter={
          topCenterLabel ? (
            <p className="beta-order-step-label">{topCenterLabel}</p>
          ) : undefined
        }
      >
        {step === "delivery" && (
          <section className="beta-order-view" aria-label="Delivery">
            <h1 className="title">
              Where should it <em className="cu">arrive</em>?
            </h1>
            <form className="dform" onSubmit={submitDelivery} noValidate>
              <div className="field">
                <label htmlFor="order-d-name">Recipient</label>
                <input
                  id="order-d-name"
                  autoComplete="name"
                  value={delivery.recipient}
                  onChange={(event) => updateDelivery("recipient", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="order-d-addr">Address</label>
                <input
                  id="order-d-addr"
                  autoComplete="street-address"
                  value={delivery.address}
                  onChange={(event) => updateDelivery("address", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="order-d-city">City</label>
                <input
                  id="order-d-city"
                  autoComplete="address-level2"
                  value={delivery.city}
                  onChange={(event) => updateDelivery("city", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="order-d-zip">Postal code</label>
                <input
                  id="order-d-zip"
                  autoComplete="postal-code"
                  value={delivery.postal}
                  onChange={(event) => updateDelivery("postal", event.target.value)}
                />
              </div>
              <div className="field">
                <label htmlFor="order-d-country">Country</label>
                <input
                  id="order-d-country"
                  autoComplete="country-name"
                  value={delivery.country}
                  onChange={(event) => updateDelivery("country", event.target.value)}
                />
              </div>
              {deliveryError && <p className="err show" role="alert">Please complete every field.</p>}
              <div className="stay-actions">
                <button className="tlink" type="submit">Continue</button>
              </div>
            </form>
            <p className="links small">
              <button className="tlink" type="button" onClick={onClose}>Cancel</button>
            </p>
          </section>
        )}

        {step === "review" && (
          <section className="beta-order-view" aria-label="Review">
            <h1 className="title">
              Review your <em className="cu">order</em>.
            </h1>
            <dl className="review">
              <div>
                <dt>Card</dt>
                <dd>Scent Invitation</dd>
              </div>
              <div>
                <dt>Property</dt>
                <dd>{world.property}</dd>
              </div>
              <div>
                <dt>State</dt>
                <dd>{world.state}</dd>
              </div>
              <div>
                <dt>Recipient</dt>
                <dd>{delivery.recipient.trim()}</dd>
              </div>
              <div>
                <dt>Deliver to</dt>
                <dd>{formatShippingAddress(delivery)}</dd>
              </div>
            </dl>
            <p className="price-line total-line">Total: $</p>

            <div className={`pay3${payOpen ? " open" : ""}`}>
              <p className="eyebrow pay3-eye">Payment details</p>
              <p className="pay3-demo">
                <button className="tlink" type="button" onClick={fillDemoPay}>
                  Use demo card details
                </button>
              </p>
              <form
                className="dform pay3-form"
                noValidate
                autoComplete="off"
                onSubmit={(event) => {
                  event.preventDefault();
                  void placeOrder();
                }}
              >
                <div className="field">
                  <label htmlFor="order-p-num">Card number</label>
                  <input
                    id="order-p-num"
                    inputMode="numeric"
                    autoComplete="off"
                    maxLength={19}
                    placeholder="0000 0000 0000 0000"
                    value={pay.number}
                    onChange={(event) => {
                      const next = formatCardNumber(event.target.value);
                      setPay((current) => ({ ...current, number: next }));
                      if (/\d/.test(event.target.value)) setPayOpen(true);
                    }}
                  />
                </div>
                <div className="field pay3-more">
                  <label htmlFor="order-p-name">Name on card</label>
                  <input
                    id="order-p-name"
                    autoComplete="off"
                    value={pay.name}
                    onChange={(event) => setPay((current) => ({ ...current, name: event.target.value }))}
                  />
                </div>
                <div className="pay3-row pay3-more">
                  <div className="field">
                    <label htmlFor="order-p-exp">Expiration date</label>
                    <input
                      id="order-p-exp"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={7}
                      placeholder="MM / YY"
                      value={pay.exp}
                      onChange={(event) => setPay((current) => ({ ...current, exp: formatExp(event.target.value) }))}
                    />
                  </div>
                  <div className="field">
                    <label htmlFor="order-p-cvc">CVC</label>
                    <input
                      id="order-p-cvc"
                      inputMode="numeric"
                      autoComplete="off"
                      maxLength={4}
                      placeholder="CVC"
                      value={pay.cvc}
                      onChange={(event) =>
                        setPay((current) => ({
                          ...current,
                          cvc: event.target.value.replace(/\D/g, "").slice(0, 4),
                        }))
                      }
                    />
                  </div>
                </div>
                {payError && <p className="err show" role="alert">Please complete the payment details.</p>}
              </form>
              <p className="pay3-note">Demo only — use test details. No payment will be made.</p>
            </div>

            <div className="stay-actions">
              <button className="tlink" type="button" disabled={ordering} onClick={() => void placeOrder()}>
                {ordering ? "Saving…" : "Place demo order"}
              </button>
            </div>
            {orderError && <p className="err show" role="alert">{orderError}</p>}
            <p className="links small">
              <button className="tlink" type="button" onClick={onClose}>Cancel</button>
            </p>
          </section>
        )}

        {step === "confirmed" && (
          <section className="beta-order-view beta-order-confirmed" aria-label="Order confirmed">
            <h1 className="title">
              Your demo card order is <em className="cu">confirmed</em>.
            </h1>
            <p className="body dob-intro">Status: Preparing. No real shipment will be made.</p>
            <div className="stay-actions">
              <button className="tlink" type="button" onClick={onClose}>
                Return to My Space
              </button>
            </div>
          </section>
        )}
      </AuthShell>
    </div>
  );
}
