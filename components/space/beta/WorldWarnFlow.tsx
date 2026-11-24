"use client";

import AuthShell from "../../auth/AuthShell";
import "./invitation-ritual-flow.css";

/** HTML #v-worldwarn — before changing active world when a commitment exists. */
export default function WorldWarnFlow({
  onContinue,
  onKeep,
}: {
  onContinue: () => void;
  onKeep: () => void;
}) {
  return (
    <div className="beta-ritual-overlay">
      <AuthShell
        wide
        className="beta-ritual-shell"
        topStart={
          <button className="ritual-top-back" type="button" onClick={onKeep}>
            Back
          </button>
        }
      >
        <section className="beta-ritual-view intro" aria-label="Before you change your world">
          <p className="eyebrow">Before you change your world</p>
          <div className="oil-p1">
            <h1 className="title sc-title">
              One State at a <em className="cu">time</em>.
            </h1>
            <p className="body dob-intro bn-lines">
              <span>Every world holds its own State –</span>
              <span>its own scent,</span>
              <span>its own ritual,</span>
              <span>its own intention.</span>
            </p>
            <span className="stay-rule" aria-hidden="true" />
            <p className="brand-note bn-lines">
              <span>A new world starts a new commitment. Your current intention,</span>
              <span>who you are becoming and your action will be cleared.</span>
              <span>My Space will show only your new world.</span>
            </p>
            <p className="line-s close-line">Stay with one world. Let it change you.</p>
          </div>
          <div className="stay-actions">
            <button className="tlink" type="button" onClick={onContinue}>
              Continue with the new State
            </button>
          </div>
          <p className="links small world-warn-keep">
            <button className="tlink" type="button" onClick={onKeep}>
              Keep my current world
            </button>
          </p>
        </section>
      </AuthShell>
    </div>
  );
}
