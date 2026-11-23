"use client";

import { useEffect, useState } from "react";
import type { SpaceState } from "../../../../lib/space-state";

export default function IntentionSlide({
  state,
  onSave,
}: {
  state: SpaceState;
  onSave: (next: SpaceState) => void;
}) {
  const [intention, setIntention] = useState(state.intention || "");
  const [becoming, setBecoming] = useState(state.becoming || "");
  const [keepError, setKeepError] = useState("");
  const locked = Boolean(state.intentionLocked);
  const intentionText = intention.trim();
  const becomingText = becoming.trim();
  const canKeep = Boolean(intentionText && becomingText);

  useEffect(() => {
    setIntention(state.intention || "");
    setBecoming(state.becoming || "");
  }, [state.intention, state.becoming]);

  function persist(nextIntention = intention, nextBecoming = becoming) {
    if (locked) return;
    onSave({
      ...state,
      intention: nextIntention.trim() || undefined,
      becoming: nextBecoming.trim() || undefined,
    });
  }

  function keepIntention() {
    if (!intentionText || !becomingText) {
      setKeepError(
        !intentionText && !becomingText
          ? "Write your intention and who you are becoming before keeping them."
          : !intentionText
            ? "Write your intention before keeping it."
            : "Write who you are becoming before keeping your intention.",
      );
      return;
    }
    setKeepError("");
    onSave({
      ...state,
      intention: intentionText,
      becoming: becomingText,
      intentPrompt: false,
      intentionLocked: true,
    });
  }

  return (
    <article className="beta-split beta-intention" aria-label="My intention">
      <div className="beta-split-media">
        <div className="beta-intention-preview">
          <div className="beta-intention-frame">
            <img
              className="beta-scene-img beta-scene-night"
              src="/assets/bg-04-my-intention-card-scene-no-text.jpg"
              alt=""
              aria-hidden="true"
            />
            <img
              className="beta-scene-img beta-scene-light"
              src="/assets/bg-04-my-intention-card-scene-no-text_light.png"
              alt=""
              aria-hidden="true"
            />
            <div className="beta-intention-card" aria-live="polite">
              <p className={`beta-preview-intent${intention.trim() ? "" : " empty"}`}>
                {intention.trim() || "Your intention will appear here."}
              </p>
              <p className="beta-preview-label">I am becoming</p>
              <p className={`beta-preview-becoming${becoming.trim() ? "" : " empty"}`}>
                {becoming.trim() || "Who you are becoming"}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="beta-split-copy">
        <p className="beta-eyebrow">My intention</p>
        <h2 className="beta-intention-title">
          Set your <em>intention.</em>
        </h2>

        <div className={`beta-field-shell${locked ? " is-locked" : ""}`}>
          <label className="beta-field-label" htmlFor="beta-intention">
            {locked ? "Intention" : "Edit intention"}
          </label>
          <textarea
            id="beta-intention"
            className="beta-field"
            rows={2}
            value={intention}
            readOnly={locked}
            onChange={(event) => {
              if (locked) return;
              setIntention(event.target.value);
              if (keepError) setKeepError("");
            }}
            onBlur={() => persist()}
            placeholder="More at peace with myself"
          />
        </div>

        <div className={`beta-field-shell${locked ? " is-locked" : ""}`}>
          <label className="beta-field-label" htmlFor="beta-becoming">
            {locked ? "I am becoming" : "Edit I am becoming"}
          </label>
          <textarea
            id="beta-becoming"
            className="beta-field"
            rows={2}
            value={becoming}
            readOnly={locked}
            onChange={(event) => {
              if (locked) return;
              setBecoming(event.target.value);
              if (keepError) setKeepError("");
            }}
            onBlur={() => persist()}
            placeholder="a more present version of myself"
          />
        </div>

        {state.intentPrompt && !locked ? (
          <div className="beta-intent-keep">
            <p className="beta-intent-prompt">
              Write your intention on your card, then keep the same words here.
            </p>
            {keepError ? (
              <p className="beta-intent-keep-error" role="alert">
                {keepError}
              </p>
            ) : null}
            <button
              className="beta-text-link"
              type="button"
              disabled={!canKeep}
              aria-disabled={!canKeep}
              onClick={keepIntention}
            >
              Keep my intention
            </button>
          </div>
        ) : null}
      </div>
    </article>
  );
}
