"use client";

import { useState } from "react";
import AuthShell from "../../auth/AuthShell";
import type { SpaceState } from "../../../lib/space-state";
import type { HospitalityWorld } from "../../../lib/worlds";
import "./perfume-oil-flow.css";

type Step = "intro" | "ritual";
type InfoKind = "buy" | "directions" | null;

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
  const [info, setInfo] = useState<InfoKind>(null);

  function goBack() {
    if (step === "ritual") {
      setStep("intro");
      setInfo(null);
      return;
    }
    onClose();
  }

  return (
    <div className="beta-oil-overlay">
      <AuthShell
        className="beta-oil-shell"
        topStart={
          <button className="oil-top-back" type="button" onClick={goBack}>
            Back
          </button>
        }
        topCenter={
          step === "ritual" ? <p className="beta-oil-step-label">2 of 2</p> : undefined
        }
      >
        {step === "intro" && (
          <section className="beta-oil-view" aria-label="Your State, on skin">
            <p className="eyebrow">Your State, on skin</p>
            <div className="oil-p1">
              <h1 className="title sc-title">
                Create your personal <em className="cu">scent</em>.
              </h1>
              <p className="body dob-intro">
                Wear alone, layer beneath your favourite perfume, or explore combining oils
                collected from different hospitality worlds.
              </p>
              <span className="stay-rule" aria-hidden="true" />
              <p className="brand-note">
                Inspired by the tradition of anointing guests with perfumed oils as a gesture of
                hospitality and honor.
              </p>
              <p className="brand-note">
                Created in dialogue with the property’s signature scent, this perfume oil carries
                its olfactory identity from place to skin.
              </p>
              <p className="line-s close-line">
                Apply with intention. Return to your <em className="cu">State</em>.
              </p>
            </div>
            <div className="stay-actions">
              <button className="tlink" type="button" onClick={() => setStep("ritual")}>
                Continue
              </button>
            </div>
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
              <button className="tlink" type="button" onClick={() => setInfo("buy")}>
                Where to buy your perfume oil
              </button>
            </div>
          </section>
        )}
      </AuthShell>

      {info && (
        <div
          className="jmodal open"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) setInfo(null);
          }}
        >
          <section
            className="jm-in glass"
            role="dialog"
            aria-modal="true"
            aria-label={info === "buy" ? "Where to buy" : "Get directions"}
          >
            {info === "buy" ? (
              <>
                <h2 className="jm-title">{world.property} Perfume Oil</h2>
                <p className="ret-pos">
                  Available exclusively at {pointOfSaleLabel(world.property)} at {world.property}.
                </p>
                <p className="ret-addr">
                  Retail address to be provided by the property
                  <br />
                  <span>{(world.country || "").toUpperCase()}</span>
                </p>
                <div className="stay-actions">
                  <button className="tlink" type="button" onClick={() => setInfo("directions")}>
                    Get directions
                  </button>
                </div>
                <p className="ret-note">Space offers scented cards only.</p>
              </>
            ) : (
              <>
                <h2 className="jm-title">Get directions</h2>
                <p className="jm-text">
                  In the live platform, this opens directions to the point of sale at{" "}
                  {world.property}. This is a fictional demo property, so no map or route is opened.
                </p>
              </>
            )}
            <p className="links small">
              <button className="tlink" type="button" onClick={() => setInfo(null)}>
                Close
              </button>
            </p>
          </section>
        </div>
      )}
    </div>
  );
}
