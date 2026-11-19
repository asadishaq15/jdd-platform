"use client";

import { useMemo, useState } from "react";
import AuthShell from "../../auth/AuthShell";
import type { SpaceState } from "../../../lib/space-state";
import "./invitation-ritual-flow.css";

type Step = "intro" | "ritual";
type Frequency = "off" | "once" | "daily";

type ReminderDraft = {
  action: string;
  frequency: Frequency;
  date: string;
  time: string;
  tz: string;
};

function userTimeZone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC";
  } catch {
    return "UTC";
  }
}

function dayIn(tz: string) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

function timezoneOptions(preferred: string) {
  let list: string[] = [];
  try {
    list = Intl.supportedValuesOf("timeZone");
  } catch {
    list = [];
  }
  if (!list.length) {
    list = [
      "UTC",
      "Europe/London",
      "Europe/Paris",
      "Europe/Zurich",
      "Asia/Tokyo",
      "Asia/Karachi",
      "America/New_York",
      "America/Los_Angeles",
      "Australia/Sydney",
    ];
  }
  if (preferred && !list.includes(preferred)) list = [preferred, ...list];
  return list;
}

function blankReminder(): ReminderDraft {
  const tz = userTimeZone();
  return {
    action: "",
    frequency: "off",
    date: "",
    time: "09:00",
    tz,
  };
}

function reminderFromState(state: SpaceState): ReminderDraft {
  const base = blankReminder();
  const saved = state.reminder;
  if (!saved) return base;
  return {
    action: saved.action || "",
    frequency: saved.frequency || "off",
    date: saved.date || "",
    time: saved.time || "09:00",
    tz: saved.tz || base.tz,
  };
}

function nextReminderText(draft: ReminderDraft) {
  if (!draft.action.trim() || draft.frequency === "off") return "Reminders are off.";
  if (draft.frequency === "once") {
    return draft.date
      ? `Reminder on ${draft.date} at ${draft.time} (${draft.tz}).`
      : "Choose a date for the reminder.";
  }
  return `Daily at ${draft.time} (${draft.tz}).`;
}

function RemindersModal({
  initial,
  onClose,
  onSave,
}: {
  initial: ReminderDraft;
  onClose: () => void;
  onSave: (draft: ReminderDraft) => void;
}) {
  const [draft, setDraft] = useState<ReminderDraft>(initial);
  const [note, setNote] = useState("");
  const [previewOpen, setPreviewOpen] = useState(false);
  const zones = useMemo(() => timezoneOptions(draft.tz), [draft.tz]);

  function setFrequency(frequency: Frequency) {
    setDraft((prev) => ({
      ...prev,
      frequency,
      date: frequency === "once" && !prev.date ? dayIn(prev.tz) : prev.date,
    }));
    setNote("");
  }

  function save() {
    const action = draft.action.trim();
    const next: ReminderDraft = {
      ...draft,
      action,
      frequency: action ? draft.frequency : "off",
      time: draft.time || "09:00",
      tz: draft.tz || userTimeZone(),
    };
    onSave(next);
    setDraft(next);
    setNote("Saved.");
  }

  return (
    <div
      className="jmodal open"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="jm-in glass" role="dialog" aria-modal="true" aria-label="Reminders">
        <h2 className="jm-title">Reminders</h2>
        <div className="ae">
          <label className="ae-l" htmlFor="ritual-action-text">My action</label>
          <input
            id="ritual-action-text"
            className="ae-in"
            maxLength={140}
            placeholder="Write one action — optional"
            value={draft.action}
            onChange={(event) => {
              setDraft((prev) => ({ ...prev, action: event.target.value }));
              setNote("");
            }}
          />

          <p className="ae-l">Reminder</p>
          <div className="ae-seg" role="radiogroup" aria-label="Reminder frequency">
            {([
              ["off", "Off"],
              ["once", "Once"],
              ["daily", "Daily"],
            ] as const).map(([value, label]) => (
              <button
                key={value}
                type="button"
                className={`seg-b${draft.frequency === value ? " on" : ""}`}
                role="radio"
                aria-checked={draft.frequency === value}
                onClick={() => setFrequency(value)}
              >
                {label}
              </button>
            ))}
          </div>

          {draft.frequency === "once" ? (
            <div className="ae-row">
              <label className="ae-sub">
                Date
                <input
                  type="date"
                  className="ae-in"
                  value={draft.date}
                  onChange={(event) => setDraft((prev) => ({ ...prev, date: event.target.value }))}
                />
              </label>
              <label className="ae-sub">
                Time
                <input
                  type="time"
                  className="ae-in"
                  value={draft.time}
                  onChange={(event) => setDraft((prev) => ({ ...prev, time: event.target.value }))}
                />
              </label>
            </div>
          ) : null}

          {draft.frequency === "daily" ? (
            <div className="ae-row">
              <label className="ae-sub">
                Time
                <input
                  type="time"
                  className="ae-in"
                  value={draft.time}
                  onChange={(event) => setDraft((prev) => ({ ...prev, time: event.target.value }))}
                />
              </label>
            </div>
          ) : null}

          {draft.frequency !== "off" ? (
            <label className="ae-sub ae-tz">
              Timezone
              <select
                className="ae-in"
                value={draft.tz}
                onChange={(event) => setDraft((prev) => ({ ...prev, tz: event.target.value }))}
              >
                {zones.map((zone) => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </label>
          ) : null}

          <div className="stay-actions ae-save">
            <button className="tlink" type="button" onClick={save}>Save</button>
          </div>
          {note ? <p className="ae-note">{note}</p> : null}
          <p className="ae-demo">Demo — no email or notification will be sent.</p>
          <button className="tlink ae-prev-b" type="button" onClick={() => setPreviewOpen((value) => !value)}>
            Preview reminder
          </button>
          {previewOpen ? (
            <div className="ae-prev">
              {draft.action.trim() ? (
                <>
                  <p className="ae-prev-t">{draft.action.trim()}</p>
                  <p className="ae-prev-q">Have you taken this step today?</p>
                  <p className="ae-note">{nextReminderText(draft)}</p>
                </>
              ) : (
                <p className="ae-prev-q">Have you acted today as the person you want to become?</p>
              )}
            </div>
          ) : null}
        </div>
        <p className="links small">
          <button className="tlink" type="button" onClick={onClose}>Close</button>
        </p>
      </section>
    </div>
  );
}

export default function InvitationRitualFlow({
  state,
  active,
  onClose,
  onSave,
  onEditIntention,
}: {
  state: SpaceState;
  active: boolean;
  onClose: () => void;
  onSave: (next: SpaceState) => void;
  onEditIntention: () => void;
}) {
  const [step, setStep] = useState<Step>("intro");
  const [remindersOpen, setRemindersOpen] = useState(false);
  const savedAction = state.reminder?.action?.trim() || "";

  function goBack() {
    if (remindersOpen) {
      setRemindersOpen(false);
      return;
    }
    if (step === "ritual") {
      setStep("intro");
      return;
    }
    onClose();
  }

  return (
    <div className="beta-ritual-overlay">
      <AuthShell
        className="beta-ritual-shell"
        topStart={
          <button className="ritual-top-back" type="button" onClick={goBack}>
            Back
          </button>
        }
        topCenter={
          step === "ritual" ? <p className="beta-ritual-step-label">2 of 2</p> : undefined
        }
      >
        {step === "intro" && (
          <section className="beta-ritual-view" aria-label="Your Scent Invitation">
            <p className="eyebrow">Your Scent Invitation</p>
            <div className="oil-p1">
              <h1 className="title sc-title">
                A scent to remember your <em className="cu">State</em>.
              </h1>
              <p className="body dob-intro">
                Discover whether this fragrance feels aligned with you.
              </p>
              <span className="stay-rule" aria-hidden="true" />
              <p className="brand-note">
                Begin the ritual in a quiet place, alone. Inspired by the connection between scent
                and memory, it invites you to link the qualities and habits you have chosen with the
                fragrance.
              </p>
              <p className="brand-note">
                Keep your card close — in a pocket, bag, or your car — letting its scent appear
                quietly through the day.
              </p>
              <p className="line-s close-line">
                Return to it as a reminder of how you choose to live.
              </p>
            </div>
            <div className="stay-actions">
              <button className="tlink" type="button" onClick={() => setStep("ritual")}>
                Continue
              </button>
            </div>
            <p className="links small">
              <button className="tlink" type="button" onClick={onClose}>Back</button>
            </p>
          </section>
        )}

        {step === "ritual" && (
          <section className="beta-ritual-view" aria-label="Your invitation ritual">
            <h1 className="title rit-top">
              Your invitation <em className="cu">ritual</em>.
            </h1>
            {!active ? (
              <p className="preview-note">
                Your invitation ritual begins when your card arrives. You can read the steps now.
              </p>
            ) : null}
            <ol className="rit ritv">
              <li>
                <span className="rit-n">01</span>
                <span className="rit-h">Pause.</span>
                <span className="rit-t">Read your intention.</span>
                {state.intention?.trim() ? (
                  <span className="rit-q">{state.intention.trim()}</span>
                ) : null}
              </li>
              <li>
                <span className="rit-n">02</span>
                <span className="rit-h">Reflect.</span>
                <span className="rit-t">Revisit your qualities and habits.</span>
                {state.becoming?.trim() ? (
                  <span className="rit-q">{state.becoming.trim()}</span>
                ) : null}
              </li>
              <li>
                <span className="rit-n">03</span>
                <span className="rit-h">Imagine.</span>
                <span className="rit-t">Feel as if they are already part of you.</span>
              </li>
              <li>
                <span className="rit-n">04</span>
                <span className="rit-h">Scent.</span>
                <span className="rit-t">Breathe in the scent of your card.</span>
              </li>
              <li>
                <span className="rit-n">05</span>
                <span className="rit-h">Act.</span>
                <span className="rit-t">Choose one action that supports your intention.</span>
                {savedAction ? <span className="rit-q">{savedAction}</span> : null}
                <span className="rit-link">
                  <button className="tlink" type="button" onClick={() => setRemindersOpen(true)}>
                    {savedAction ? "Edit my action" : "Write my action"}
                  </button>
                </span>
              </li>
            </ol>
            <p className="links small">
              <button className="tlink" type="button" onClick={onEditIntention}>
                Edit my intention
              </button>
              <span className="sep">·</span>
              <button className="tlink" type="button" onClick={() => setStep("intro")}>
                Back
              </button>
            </p>
          </section>
        )}
      </AuthShell>

      {remindersOpen ? (
        <RemindersModal
          initial={reminderFromState(state)}
          onClose={() => setRemindersOpen(false)}
          onSave={(draft) => {
            onSave({
              ...state,
              reminder: {
                action: draft.action,
                frequency: draft.frequency,
                date: draft.date || undefined,
                time: draft.time || undefined,
                tz: draft.tz || undefined,
              },
            });
          }}
        />
      ) : null}
    </div>
  );
}
