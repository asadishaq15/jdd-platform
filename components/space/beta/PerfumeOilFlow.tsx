"use client";

import { useState } from "react";
import AuthShell from "../../auth/AuthShell";
import type { SpaceState } from "../../../lib/space-state";
import type { HospitalityWorld } from "../../../lib/worlds";
import "./perfume-oil-flow.css";

type Step = "intro" | "ritual";

function pointOfSaleLabel(property: string) {
  return /Retreat|Sanctuary|Springs/.test(property) ? "the spa" : "the boutique";
}

export default function PerfumeOilFlow({
  world,
  state,
  onClose,
}: {
  world: HospitalityWorld;
  state: SpaceState;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("intro");
  const [buyOpen, setBuyOpen] = useState(false);

  function goBack() {
    if (buyOpen) {
      setBuyOpen(false);
      return;
    }
    if (step === "ritual") {
      setStep("intro");
      return;
    }
    onClose();
  }

  return (
    <div className="beta-oil-overlay">
      <AuthShell
        wide
        className="beta-oil-shell"
        topStart={
          <button className="oil-top-back" type="button" onClick={goBack}>
            Back
          </button>
        }
      >
        {step === "intro" && (
          <section className="beta-oil-view intro" aria-label="Your State, on skin">
            <p className="eyebrow">Your State, on skin</p>
            <div className="oil-p1">
              <h1 className="title sc-title">
                Create your personal <em className="cu">scent</em>.
              </h1>
              <p className="body dob-intro bn-lines">
                <span>Wear alone, layer beneath your favourite perfume, or explore</span>
                <span>combining oils collected from different hospitality worlds.</span>
              </p>
              <span className="stay-rule" aria-hidden="true" />
              <p className="brand-note bn-lines">
                <span>Inspired by the tradition of anointing guests with</span>
                <span>perfumed oils as a gesture of hospitality and honor.</span>
              </p>
              <p className="brand-note bn-lines">
                <span>Created in dialogue with the property’s signature scent, this</span>
                <span>perfume oil carries its olfactory identity from place to skin.</span>
              </p>
              <p className="line-s close-line">
                Apply with intention. Return to your State.
              </p>
            </div>
            <div className="stay-actions">
              <button className="tlink" type="button" onClick={() => setStep("ritual")}>
                Continue
              </button>
            </div>
            <p className="links small">
              <button className="tlink bottom-back" type="button" onClick={onClose}>Back</button>
            </p>
          </section>
        )}

        {step === "ritual" && (
          <section className="beta-oil-view" aria-label="Your perfume oil ritual">
            <h1 className="title rit-top">
              Your perfume oil <em className="cu">ritual</em>.
            </h1>
            <ol className="rit ritv">
              <li>
                <span className="rit-n">01</span>
                <span className="rit-h">Remember.</span>
                <span className="rit-t">Pause. Recall your intention.</span>
                {state.intention?.trim() ? (
                  <span className="rit-q">{state.intention.trim()}</span>
                ) : null}
              </li>
              <li>
                <span className="rit-n">02</span>
                <span className="rit-h">Become.</span>
                <span className="rit-t">
                  Close your eyes. Imagine the qualities and habits you chose are already part of
                  you.
                </span>
                {state.becoming?.trim() ? (
                  <span className="rit-q">{state.becoming.trim()}</span>
                ) : null}
              </li>
              <li>
                <span className="rit-n">03</span>
                <span className="rit-h">Breathe.</span>
                <span className="rit-t">
                  Use the applicator to place oil onto your palms. Rub them together, bring them
                  towards your nose, and breathe in the scent.
                </span>
              </li>
              <li>
                <span className="rit-n">04</span>
                <span className="rit-h">Apply.</span>
                <span className="rit-t">
                  Lightly press your palms onto your clothes, skin, or hair.
                </span>
              </li>
              <li>
                <span className="rit-n">05</span>
                <span className="rit-h">Continue.</span>
                <span className="rit-t">
                  Carry this State into your day. Let the scent remind you.
                </span>
              </li>
            </ol>
            <div className="stay-actions">
              <button className="tlink" type="button" onClick={() => setBuyOpen(true)}>
                Where to buy your perfume oil
              </button>
            </div>
            <p className="links small">
              <button className="tlink bottom-back" type="button" onClick={() => setStep("intro")}>
                Back
              </button>
            </p>
          </section>
        )}
      </AuthShell>

      {buyOpen ? (
        <div
          className="jmodal open"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setBuyOpen(false);
          }}
        >
          <section
            className="jm-in glass"
            role="dialog"
            aria-modal="true"
            aria-label="Where to buy"
          >
            <p className="ret-pos">
              Available exclusively at {pointOfSaleLabel(world.property)} at {world.property}.
            </p>
            <p className="ret-note">Space offers scented cards only.</p>
            <p className="jm-text bn-lines oil-live">
              <span>In the live platform, this opens directions</span>
              <span>to the point of sale at {world.property}.</span>
            </p>
            <p className="links small">
              <button className="tlink" type="button" onClick={() => setBuyOpen(false)}>
                Close
              </button>
            </p>
          </section>
        </div>
      ) : null}
    </div>
  );
}
