"use client";

import { useMemo, useState } from "react";
import type { SpaceState } from "../../../lib/space-state";
import "./space-drawer.css";

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
    list = ["UTC", "Europe/London", "Europe/Paris", "Asia/Karachi", "America/New_York", "America/Los_Angeles"];
  }
  if (preferred && !list.includes(preferred)) list = [preferred, ...list];
  return list;
}

function blankReminder(): ReminderDraft {
  return { action: "", frequency: "off", date: "", time: "09:00", tz: userTimeZone() };
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

export default function SpaceRemindersModal({
  state,
  onClose,
  onSave,
}: {
  state: SpaceState;
  onClose: () => void;
  onSave: (next: SpaceState) => void;
}) {
  const [draft, setDraft] = useState<ReminderDraft>(() => reminderFromState(state));
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
    onSave({
      ...state,
      reminder: {
        action: next.action,
        frequency: next.frequency,
        date: next.date || undefined,
        time: next.time || undefined,
        tz: next.tz || undefined,
      },
    });
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
      <section className="jm-in glass space-reminders" role="dialog" aria-modal="true" aria-label="Reminders">
        <h2 className="jm-title">Reminders</h2>
        <div className="ae">
          <label className="ae-l" htmlFor="space-reminder-action">My action</label>
          <input
            id="space-reminder-action"
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
                <input type="date" className="ae-in" value={draft.date} onChange={(e) => setDraft((p) => ({ ...p, date: e.target.value }))} />
              </label>
              <label className="ae-sub">
                Time
                <input type="time" className="ae-in" value={draft.time} onChange={(e) => setDraft((p) => ({ ...p, time: e.target.value }))} />
              </label>
            </div>
          ) : null}
          {draft.frequency === "daily" ? (
            <div className="ae-row">
              <label className="ae-sub">
                Time
                <input type="time" className="ae-in" value={draft.time} onChange={(e) => setDraft((p) => ({ ...p, time: e.target.value }))} />
              </label>
            </div>
          ) : null}
          {draft.frequency !== "off" ? (
            <label className="ae-sub ae-tz">
              Timezone
              <select className="ae-in" value={draft.tz} onChange={(e) => setDraft((p) => ({ ...p, tz: e.target.value }))}>
                {zones.map((zone) => (
                  <option key={zone} value={zone}>{zone}</option>
                ))}
              </select>
            </label>
          ) : null}
          <div className="ae-save">
            <button className="tlink" type="button" onClick={save}>Save</button>
          </div>
          {note ? <p className="ae-note">{note}</p> : null}
          <p className="ae-demo">Demo — no email or notification will be sent.</p>
          <button className="tlink" type="button" onClick={() => setPreviewOpen((v) => !v)}>Preview reminder</button>
          {previewOpen ? (
            <div className="ae-prev">
              {draft.action.trim() ? (
                <>
                  <p className="ae-prev-t">{draft.action.trim()}</p>
                  <p>{nextReminderText(draft)}</p>
                </>
              ) : (
                <p>Have you acted today as the person you want to become?</p>
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
