"use client";

import { useMemo, useState } from "react";
import AuthShell from "../../auth/AuthShell";
import {
  asRitualFrequency,
  type RitualReminderFrequency,
  type SpaceState,
} from "../../../lib/space-state";
import "./invitation-ritual-flow.css";

type Step = "intro" | "ritual";

type ReminderDraft = {
  action: string;
  frequency: RitualReminderFrequency;
  date: string;
  weekDay: string;
  time: string;
  tz: string;
};

const WEEK_DAYS = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
] as const;

function weekDayIn(tz: string) {
  try {
    const long = new Intl.DateTimeFormat("en-US", {
      timeZone: tz,
      weekday: "long",
    }).format(new Date());
    return long.toLowerCase();
  } catch {
    return "monday";
  }
}

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
    frequency: "once",
    date: dayIn(tz),
    weekDay: weekDayIn(tz),
    time: "09:00",
    tz,
  };
}

function reminderFromState(state: SpaceState): ReminderDraft {
  const base = blankReminder();
  const saved = state.reminder;
  if (!saved) return base;
  const frequency = asRitualFrequency(saved.frequency);
  const tz = saved.tz || base.tz;
  return {
    action: saved.action || "",
    frequency,
    date: saved.date || (frequency === "once" ? dayIn(tz) : ""),
    weekDay: saved.weekDay || weekDayIn(tz),
    time: saved.time || "09:00",
    tz,
  };
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
  const zones = useMemo(() => timezoneOptions(draft.tz), [draft.tz]);

  function setFrequency(frequency: RitualReminderFrequency) {
    setDraft((prev) => ({
      ...prev,
      frequency,
      date: frequency === "once" && !prev.date ? dayIn(prev.tz) : prev.date,
      weekDay:
        frequency === "weekly" && !prev.weekDay ? weekDayIn(prev.tz) : prev.weekDay,
    }));
    setNote("");
  }

  function save() {
    const tz = draft.tz || userTimeZone();
    const next: ReminderDraft = {
      ...draft,
      action: draft.action.trim(),
      frequency: draft.frequency,
      time: draft.time || "09:00",
      tz,
      date: draft.frequency === "once" ? draft.date || dayIn(tz) : "",
      weekDay:
        draft.frequency === "weekly"
          ? draft.weekDay || weekDayIn(tz)
          : draft.weekDay,
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
            className="ae-in ae-action"
            maxLength={140}
            placeholder="Write one action"
            value={draft.action}
            onChange={(event) => {
              setDraft((prev) => ({ ...prev, action: event.target.value }));
              setNote("");
            }}
          />

          <p className="ae-l">Reminder</p>
          <div className="ae-seg" role="radiogroup" aria-label="Reminder frequency">
            {([
              ["once", "Once"],
              ["daily", "Daily"],
              ["weekly", "Weekly"],
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
          {draft.frequency === "weekly" ? (
            <div className="ae-row">
              <label className="ae-sub">
                Day of the week
                <select
                  className="ae-in ae-select"
                  value={draft.weekDay}
                  onChange={(event) =>
                    setDraft((prev) => ({ ...prev, weekDay: event.target.value }))
                  }
                >
                  {WEEK_DAYS.map((day) => (
                    <option key={day.value} value={day.value}>
                      {day.label}
                    </option>
                  ))}
                </select>
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

          <div className="stay-actions ae-save">
            <button className="tlink" type="button" onClick={save}>Save</button>
          </div>
          {note ? <p className="ae-note">{note}</p> : null}
          <p className="ae-demo">Demo</p>
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
}: {
  state: SpaceState;
  active: boolean;
  onClose: () => void;
  onSave: (next: SpaceState) => void;
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
        wide
        className="beta-ritual-shell"
        topStart={
          <button className="ritual-top-back" type="button" onClick={goBack}>
            Back
          </button>
        }
      >
        {step === "intro" && (
          <section className="beta-ritual-view intro" aria-label="Your Scent Invitation">
            <p className="eyebrow">Your Scent Invitation</p>
            <div className="oil-p1">
              <h1 className="title sc-title">
                A scent to remember your <em className="cu">State</em>.
              </h1>
              <p className="body dob-intro">
                Discover whether this fragrance feels aligned with you.
              </p>
              <span className="stay-rule" aria-hidden="true" />
              <p className="brand-note bn-lines">
                <span>Begin the ritual in a quiet place, alone. Inspired by the connection</span>
                <span>between scent and memory, it invites you to link the qualities</span>
                <span>and habits you have chosen with the fragrance.</span>
              </p>
              <p className="brand-note bn-lines">
                <span>Keep your card close – in a pocket, bag, or your car –</span>
                <span>letting its scent appear quietly through the day.</span>
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
              <button className="tlink bottom-back" type="button" onClick={onClose}>Back</button>
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
                    {savedAction ? "Add new action" : "Write my action"}
                  </button>
                </span>
              </li>
            </ol>
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
                date: draft.frequency === "once" ? draft.date || undefined : undefined,
                weekDay:
                  draft.frequency === "weekly" ? draft.weekDay || undefined : undefined,
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
