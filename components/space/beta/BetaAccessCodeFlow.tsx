"use client";

import {
  FormEvent,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import BrandMark from "../../brand/BrandMark";
import GradientDefs from "../../layout/GradientDefs";
import ThemeToggle from "../../layout/ThemeToggle";
import { stateImageSrc } from "../../../lib/state-images";
import {
  DEMO_CODE_OPTIONS,
  demoCodes,
  getWorld,
  normalizeAccessCode,
  type HospitalityWorld,
} from "../../../lib/worlds";
import "../../onboarding/visitor-onboarding.css";
import "./beta-access-flow.css";

type AccessStep = "code" | "stay";

export type AccessCodeResult = {
  code: string;
  visited: number;
};

function formatCodeDisplay(raw: string) {
  const normalized = normalizeAccessCode(raw);
  return normalized.match(/.{1,4}/g)?.join("-") || "";
}

function SceneCol({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="col">
      <div className="stage">{children}</div>
      {actions}
    </div>
  );
}

function PinIcon() {
  return (
    <svg className="pin" viewBox="0 0 20 26" aria-hidden="true">
      <path d="M10 24.5 C10 24.5 2 15.5 2 9.5 A8 8 0 0 1 18 9.5 C18 15.5 10 24.5 10 24.5Z" />
      <circle cx="10" cy="9.5" r="3.2" />
    </svg>
  );
}

function ArchBlock({
  world,
  label,
  imageFailed,
  onImageError,
}: {
  world: HospitalityWorld;
  label?: string;
  imageFailed?: boolean;
  onImageError?: () => void;
}) {
  const image = stateImageSrc(world);
  return (
    <div className="copy">
      {label ? (
        <p className="arch-eye fade" style={{ "--d": ".2s" } as CSSProperties}>
          {label}
        </p>
      ) : null}
      <h1 className="title arch-state" data-type="">
        <em className="cu">{world.state}</em>
      </h1>
      <div className="arch-row fade" style={{ "--d": ".8s" } as CSSProperties}>
        <div className={`arch-img${imageFailed ? " noimg" : ""}`}>
          <img src={image} alt={world.property} onError={onImageError} />
        </div>
        <div className="arch-info">
          <p className="arch-prop">{world.property}</p>
          <p className="arch-loc">
            <PinIcon />
            <span>{world.country}</span>
          </p>
          <p className="arch-desc">{world.desc}</p>
          <p className="arch-line">Your State begins here.</p>
        </div>
      </div>
    </div>
  );
}

export default function BetaAccessCodeFlow({
  onClose,
  onComplete,
}: {
  onClose: () => void;
  onComplete: (result: AccessCodeResult) => void;
}) {
  const [step, setStep] = useState<AccessStep>("code");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [previewWorld, setPreviewWorld] = useState<HospitalityWorld | null>(null);
  const [resolvedCode, setResolvedCode] = useState("");
  const [imageFailed, setImageFailed] = useState(false);

  function submitCode(event?: FormEvent) {
    event?.preventDefault();
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
    setImageFailed(false);
    setError("");
    setStep("stay");
  }

  function finish() {
    if (!previewWorld || !resolvedCode) return;
    onComplete({
      code: resolvedCode,
      visited: previewWorld.n,
    });
  }

  function handleBack() {
    if (step === "stay") {
      setStep("code");
      return;
    }
    onClose();
  }

  return (
    <div className="beta-access-overlay">
      <main className="visitor-app">
        <GradientDefs />
        <header className="top">
          <button className="back show" type="button" onClick={handleBack}>
            Back
          </button>
          <BrandMark className="mark" />
          <div className="top-r">
            <ThemeToggle />
          </div>
        </header>

        <div className="screens">
          <section
            className={`scr${step === "code" ? " on" : ""}`}
            data-name="code"
            aria-label="Continue your stay"
            aria-hidden={step !== "code"}
          >
            <SceneCol
              actions={(
                <div className="actions fade" style={{ "--d": "1.2s" } as CSSProperties}>
                  <button className="tlink bp" type="button" onClick={() => submitCode()}>
                    Continue
                  </button>
                </div>
              )}
            >
              <h1 className="title" data-type="">
                Continue your <em className="cu">stay</em>.
              </h1>
              <p className="lede fade" style={{ "--d": ".9s" } as CSSProperties}>
                Enter the access code you received at your hotel.
              </p>
              <form
                className="fgroup fade"
                style={{ "--d": "1.2s" } as CSSProperties}
                onSubmit={submitCode}
                noValidate
              >
                <input
                  className={`code-input${error ? " bad" : ""}`}
                  type="text"
                  inputMode="text"
                  autoCapitalize="characters"
                  autoComplete="off"
                  spellCheck={false}
                  maxLength={14}
                  placeholder="XXXX-XXXX-XXXX"
                  aria-label="Access code"
                  value={code}
                  autoFocus={step === "code"}
                  onChange={(event) => {
                    setCode(formatCodeDisplay(event.target.value));
                    setError("");
                  }}
                />
                <p className={`err${error ? " show" : ""}`} role="alert">
                  {error || "Please enter your access code."}
                </p>
              </form>
              <div className="demo-codes fade" style={{ "--d": "1.5s" } as CSSProperties}>
                <p className="demo-eye">Demo codes</p>
                {DEMO_CODE_OPTIONS.map((option) => (
                  <p key={option.code}>
                    <button
                      className="tlink tl dc"
                      type="button"
                      onClick={() => {
                        setCode(option.code);
                        setError("");
                      }}
                    >
                      {option.code}
                    </button>
                    <span>{option.label}</span>
                  </p>
                ))}
              </div>
            </SceneCol>
          </section>

          <section
            className={`scr${step === "stay" ? " on" : ""}`}
            data-name="stay"
            aria-label="Your stay"
            aria-hidden={step !== "stay"}
          >
            <SceneCol
              actions={(
                <div className="actions fade" style={{ "--d": "1.8s" } as CSSProperties}>
                  <button className="tlink bp" type="button" onClick={finish}>
                    Continue
                  </button>
                </div>
              )}
            >
              {previewWorld ? (
                <ArchBlock
                  world={previewWorld}
                  label="Your stay"
                  imageFailed={imageFailed}
                  onImageError={() => setImageFailed(true)}
                />
              ) : null}
            </SceneCol>
          </section>
        </div>
      </main>
    </div>
  );
}
