"use client";

import { useEffect, useState } from "react";
import type { SpaceState } from "../../../../lib/space-state";
import type { HospitalityWorld } from "../../../../lib/worlds";

export default function IntentionSlide({
  world,
  state,
  onSave,
}: {
  world: HospitalityWorld;
  state: SpaceState;
  onSave: (next: SpaceState) => void;
}) {
  const [intention, setIntention] = useState(state.intention || "");
  const [becoming, setBecoming] = useState(state.becoming || "");
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    setIntention(state.intention || "");
    setBecoming(state.becoming || "");
  }, [state.intention, state.becoming]);

  function persist(nextIntention = intention, nextBecoming = becoming) {
    onSave({
      ...state,
      intention: nextIntention.trim() || undefined,
      becoming: nextBecoming.trim() || undefined,
    });
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1600);
  }

  return (
    <article className="beta-split beta-intention" aria-label="My intention">
      <div className="beta-split-media">
        <div className="beta-intention-preview">
          <img
            className="beta-scene-img"
            src="/assets/bg-04-my-intention-card-scene-no-text.jpg"
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
            <span className="beta-preview-cap">
              {world.property} · {world.country}
            </span>
          </div>
        </div>
      </div>

      <div className="beta-split-copy">
        <p className="beta-eyebrow">My intention</p>
        <h2 className="beta-intention-title">
          Set your <em className="cu">intention</em>.
        </h2>

        <label className="beta-field-label" htmlFor="beta-intention">Edit intention</label>
        <textarea
          id="beta-intention"
          className="beta-field"
          rows={3}
          value={intention}
          onChange={(event) => setIntention(event.target.value)}
          onBlur={() => persist()}
          placeholder="More at peace with myself"
        />

        <label className="beta-field-label" htmlFor="beta-becoming">Edit I am becoming</label>
        <textarea
          id="beta-becoming"
          className="beta-field"
          rows={3}
          value={becoming}
          onChange={(event) => setBecoming(event.target.value)}
          onBlur={() => persist()}
          placeholder="a more present version of myself"
        />

        <button
          className="beta-cta"
          type="button"
          onClick={() => persist()}
        >
          Save <span aria-hidden="true">→</span>
        </button>
        {savedFlash && <p className="beta-saved" role="status">Saved.</p>}
      </div>
    </article>
  );
}
