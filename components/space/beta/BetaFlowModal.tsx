"use client";

import { useState } from "react";
import {
  asProfileReminderFrequency,
  type ProfileReminderFrequency,
  type SpaceState,
} from "../../../lib/space-state";

export type BetaFlow = "order" | "ritual" | "oil" | "action";

export default function BetaFlowModal({
  flow,
  state,
  onClose,
  onSave,
}: {
  flow: Exclude<BetaFlow, "order" | "oil" | "ritual">;
  state: SpaceState;
  onClose: () => void;
  onSave: (next: SpaceState) => void;
}) {
  const [action, setAction] = useState(state.reminder?.action || "");
  const [frequency, setFrequency] = useState<ProfileReminderFrequency>(
    asProfileReminderFrequency(state.reminder?.frequency),
  );

  return (
    <div
      className="jmodal open"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="jm-in glass flow-modal" role="dialog" aria-modal="true" aria-label="Space flow">
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
