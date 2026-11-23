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
import {
  DEMO_CODE_OPTIONS,
  getWorld,
  worldNumberForDemoCode,
  type HospitalityWorld,
} from "../../../lib/worlds";
import StateArchPanel from "../StateArchPanel";
import "../../onboarding/visitor-onboarding.css";
import "./beta-access-flow.css";

type AccessStep = "code" | "stay";

export type AccessCodeResult = {
  code: string;
  visited: number;
};

function SceneCol({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="col">
      <div className="stage">{children}</div>
      {actions}
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
    const visited = worldNumberForDemoCode(code);
    if (!visited) {
      setError("Choose one of the demo codes.");
      return;
    }
    setResolvedCode(code);
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
                  inputMode="none"
                  autoComplete="off"
                  spellCheck={false}
                  readOnly
                  placeholder="XXXX-XXXX-XXXX"
                  aria-label="Access code"
                  aria-readonly="true"
                  value={code}
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
            <SceneCol>
              {previewWorld ? (
                <StateArchPanel
                  world={previewWorld}
                  label="Your stay"
                  imageFailed={imageFailed}
                  onImageError={() => setImageFailed(true)}
                  actions={(
                    <button className="tlink bp" type="button" onClick={finish}>
                      Continue
                    </button>
                  )}
                />
              ) : null}
            </SceneCol>
          </section>
        </div>
      </main>
    </div>
  );
}
