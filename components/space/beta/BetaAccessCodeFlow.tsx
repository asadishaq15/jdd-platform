"use client";

import { FormEvent, useState, type CSSProperties } from "react";
import AuthShell from "../../auth/AuthShell";
import {
  demoCodes,
  getWorld,
  normalizeAccessCode,
  type HospitalityWorld,
} from "../../../lib/worlds";
import "../../discovery/discovery.css";
import "./beta-access-flow.css";

type AccessStep = "codewarn" | "code" | "stay" | "intent" | "becoming";

const DEMO_CODE_OPTIONS = [
  { code: "SRNK-KYOT-2026", label: "Serein Kyoto" },
  { code: "LIOR-AEST-2026", label: "Liora Estate" },
  { code: "SIER-RARE-2026", label: "Sierra Reserve" },
] as const;

export type AccessCodeResult = {
  code: string;
  visited: number;
  intention?: string;
  becoming?: string;
};

export default function BetaAccessCodeFlow({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (result: AccessCodeResult) => void;
}) {
  const [step, setStep] = useState<AccessStep>("codewarn");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [previewWorld, setPreviewWorld] = useState<HospitalityWorld | null>(null);
  const [resolvedCode, setResolvedCode] = useState("");
  const [intention, setIntention] = useState("");
  const [becoming, setBecoming] = useState("");

  function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = normalizeAccessCode(code);
    if (!raw) {
      setError("Please enter your access code.");
      return;
    }
    if (raw.length < 12) {
      setError("Please enter the full 12-character code.");
      return;
    }
    const visited = demoCodes[raw] || 9;
    setResolvedCode(raw);
    setPreviewWorld(getWorld(visited));
    setError("");
    setStep("stay");
  }

  function finish(nextIntention = intention, nextBecoming = becoming) {
    if (!previewWorld || !resolvedCode) return;
    onComplete({
      code: resolvedCode,
      visited: previewWorld.n,
      intention: nextIntention.trim() || undefined,
      becoming: nextBecoming.trim() || undefined,
    });
  }

  function submitIntention(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!intention.trim()) {
      setError("Please write your intention, or skip for now.");
      return;
    }
    setError("");
    setStep("becoming");
  }

  function submitBecoming(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!becoming.trim()) {
      setError("Please write your answer, or skip for now.");
      return;
    }
    setError("");
    finish(intention, becoming);
  }

  return (
    <div className="beta-access-overlay">
      <AuthShell
        className="beta-access-shell"
        topStart={
          <button className="demo-restart" type="button" onClick={onClose}>
            Restart demo
          </button>
        }
      >
        {step === "codewarn" && (
          <section className="view-card beta-access-view" aria-label="Before you add a new stay">
            <p className="eyebrow">Before you add a new stay</p>
            <h1 className="title">
              One State at a <em className="cu">time</em>.
            </h1>
            <p className="body dob-intro">
              Every code opens its own world — its own scent, its own circle, its own intention.
            </p>
            <span className="stay-rule" aria-hidden="true" />
            <p className="brand-note">
              A new code starts a new commitment. Your current intention, who you are becoming and
              your action will be cleared. My Space will show only the new property and its circle.
            </p>
            <p className="line-s close-line">Stay with one world. Let it change you.</p>
            <div className="stay-actions">
              <button className="tlink" type="button" onClick={() => setStep("code")}>
                Continue with a new code
              </button>
            </div>
            <p className="links small">
              <button className="tlink" type="button" onClick={onClose}>
                Keep my current world
              </button>
            </p>
          </section>
        )}

        {step === "code" && (
          <section className="view-card beta-access-view" aria-label="Continue your stay">
            <h1 className="title">
              Continue your <em className="cu">stay</em>.
            </h1>
            <p className="body code-intro">Enter the access code you received at your hotel.</p>
            <form className="code-form" onSubmit={submitCode} noValidate>
              <div className="field">
                <input
                  className="code-input"
                  type="text"
                  value={code}
                  placeholder="XXXX-XXXX-XXXX"
                  aria-label="Access code"
                  autoCapitalize="characters"
                  autoFocus
                  spellCheck={false}
                  maxLength={14}
                  onChange={(event) => {
                    const raw = normalizeAccessCode(event.target.value);
                    setCode(raw.match(/.{1,4}/g)?.join("-") || "");
                    setError("");
                  }}
                />
              </div>
              {error && (
                <p className="err show" role="alert">
                  {error}
                </p>
              )}
              <div className="stay-actions">
                <button className="tlink" type="submit">
                  Continue
                </button>
              </div>
            </form>
            <div className="demo-codes">
              <p className="demo-code">Demo codes</p>
              {DEMO_CODE_OPTIONS.map((option) => (
                <p className="demo-code" key={option.code}>
                  <button
                    className="tlink"
                    type="button"
                    onClick={() => {
                      setCode(option.code);
                      setError("");
                    }}
                  >
                    {option.code}
                  </button>{" "}
                  <span className="dc-p">{option.label}</span>
                </p>
              ))}
            </div>
            <p className="links small">
              <button className="tlink" type="button" onClick={() => setStep("codewarn")}>
                Back
              </button>
            </p>
          </section>
        )}

        {step === "stay" && previewWorld && (
          <section className="view-card beta-access-view" aria-label="Your stay">
            <p className="eyebrow">Your stay</p>
            <StayPropertyImage world={previewWorld} />
            <h1 className="title stay-name">{previewWorld.property}</h1>
            <p className="country">{previewWorld.country}</p>
            <span className="stay-rule" aria-hidden="true" />
            <p className="stay-state">
              <em className="cu">{previewWorld.state}</em>
            </p>
            <p className="body result-desc">{previewWorld.desc}</p>
            <p className="line-s stay-line">Continue the feeling of your stay.</p>
            <div className="stay-actions">
              <button
                className="tlink"
                type="button"
                onClick={() => {
                  setIntention("");
                  setBecoming("");
                  setError("");
                  setStep("intent");
                }}
              >
                Continue
              </button>
            </div>
            <p className="links small">
              <button className="tlink" type="button" onClick={() => setStep("code")}>
                Back
              </button>
            </p>
          </section>
        )}

        {step === "intent" && previewWorld && (
          <section className="view-card beta-access-view" aria-label="Your intention">
            <p className="eyebrow">
              {previewWorld.state} · {previewWorld.property}
            </p>
            <h1 className="title">
              Your <em className="cu">intention</em>.
            </h1>
            <p className="body dob-intro">What intention did you write on your card?</p>
            <form onSubmit={submitIntention} noValidate>
              <div className="field textarea-field">
                <textarea
                  className="free"
                  rows={2}
                  maxLength={220}
                  aria-label="Your intention"
                  placeholder="In your own words"
                  value={intention}
                  autoFocus
                  onChange={(event) => {
                    setIntention(event.target.value);
                    setError("");
                  }}
                />
              </div>
              {error && (
                <p className="err show" role="alert">
                  {error}
                </p>
              )}
              <div className="stay-actions">
                <button className="tlink" type="submit">
                  Continue
                </button>
              </div>
            </form>
            <p className="links small">
              <button
                className="tlink"
                type="button"
                onClick={() => {
                  setError("");
                  setStep("becoming");
                }}
              >
                Skip for now
              </button>
              <span className="sep">·</span>
              <button className="tlink" type="button" onClick={() => setStep("stay")}>
                Back
              </button>
            </p>
          </section>
        )}

        {step === "becoming" && previewWorld && (
          <section className="view-card beta-access-view" aria-label="Who you are becoming">
            {intention.trim() && <p className="saved-intent">{intention.trim()}</p>}
            <h1 className="title beta-access-become-title">
              <span className="bl">Who do you</span>
              <span className="bl">
                need to <em className="cu">become</em>
              </span>
              <span className="bl">to welcome this</span>
              <span className="bl">into your life</span>
              <span className="bl">and sustain it?</span>
            </h1>
            <p className="body dob-intro">Think of the qualities and habits you want to develop.</p>
            <form onSubmit={submitBecoming} noValidate>
              <div className="field textarea-field">
                <textarea
                  className="free"
                  rows={2}
                  maxLength={260}
                  aria-label="Who you need to become"
                  placeholder="In your own words"
                  value={becoming}
                  autoFocus
                  onChange={(event) => {
                    setBecoming(event.target.value);
                    setError("");
                  }}
                />
              </div>
              {error && (
                <p className="err show" role="alert">
                  {error}
                </p>
              )}
              <div className="stay-actions">
                <button className="tlink" type="submit">
                  Save and continue
                </button>
              </div>
            </form>
            <p className="links small">
              <button className="tlink" type="button" onClick={() => finish(intention, "")}>
                Skip for now
              </button>
              <span className="sep">·</span>
              <button className="tlink" type="button" onClick={() => setStep("intent")}>
                Back
              </button>
            </p>
          </section>
        )}
      </AuthShell>
    </div>
  );
}

function StayPropertyImage({ world }: { world: HospitalityWorld }) {
  return (
    <div className="pimg-wrap">
      <div
        className="pimg"
        style={{ "--h": (world.n * 37) % 360 } as CSSProperties}
        role="img"
        aria-label={`${world.property} image placeholder`}
      >
        <svg viewBox="0 0 400 240" aria-hidden="true">
          <path d="M40 200 L360 200" />
          <path d="M150 200 L150 120 A50 50 0 0 1 250 120 L250 200" />
          <path d="M175 200 L175 132 A25 25 0 0 1 225 132 L225 200" opacity=".6" />
          <circle cx="300" cy="70" r="14" opacity=".7" />
        </svg>
        <span className="pimg-cap">
          {world.property} · {world.country}
        </span>
      </div>
    </div>
  );
}
