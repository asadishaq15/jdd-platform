import type { SpacePropertySnapshot } from "./space-property-snapshot";

export type ReminderFrequency = "off" | "once" | "daily" | "weekly";
export type ProfileReminderFrequency = "off" | "once" | "daily";
export type RitualReminderFrequency = "once" | "daily" | "weekly";

export function asReminderFrequency(
  value?: string,
  fallback: ReminderFrequency = "off",
): ReminderFrequency {
  if (value === "off" || value === "once" || value === "daily" || value === "weekly") {
    return value;
  }
  return fallback;
}

/** Off / Once / Daily UIs — map weekly → daily so an “on” reminder stays on. */
export function asProfileReminderFrequency(value?: string): ProfileReminderFrequency {
  const frequency = asReminderFrequency(value);
  if (frequency === "once" || frequency === "daily") return frequency;
  if (frequency === "weekly") return "daily";
  return "off";
}

/** Ritual act UI — Once / Daily / Weekly; off → once. */
export function asRitualFrequency(value?: string): RitualReminderFrequency {
  const frequency = asReminderFrequency(value, "once");
  if (frequency === "once" || frequency === "daily" || frequency === "weekly") return frequency;
  return "once";
}

export type SpaceState = {
  recommended?: number;
  chosen?: number;
  visited?: number;
  /** ISO date `YYYY-MM-DD` captured during discovery DOB step. */
  dateOfBirth?: string;
  /** Profile location from visitor onboarding (country · city). */
  basedIn?: string;
  country?: string;
  city?: string;
  code?: string;
  intention?: string;
  becoming?: string;
  entryMode?: "recommended" | "chosen" | "code";
  cardStatus?: "none" | "preparing" | "sent" | "delivered" | "received";
  order?: {
    property: string;
    state: string;
    recipient: string;
    /** Street line; review still formats with city/zip/country. */
    address?: string;
    city?: string;
    zip?: string;
    country?: string;
    price?: string;
    payment?: string;
  };
  reminder?: {
    action: string;
    frequency: ReminderFrequency;
    date?: string;
    /** monday–sunday when frequency is weekly */
    weekDay?: string;
    time?: string;
    tz?: string;
  };
  rsvps?: Record<string, boolean>;
  /** Demo stays tied to access codes (HTML st.stays). */
  stays?: { n: number; code: string }[];
  /** After mark-received: invite keeping written intention on the card (HTML st.intentPrompt). */
  intentPrompt?: boolean;
  /** After Keep my intention: fields and card writing are read-only. */
  intentionLocked?: boolean;
  /** Ritual act text; cleared on resetCommitment when switching stay properties. */
  action?: string;
  /** Per-property card order + RSVP progress (HTML st.byProp); key `acct` = chosen-world, no code. */
  byProp?: Record<string, SpacePropertySnapshot>;
};

export const SPACE_STATE_KEY = "jdd-space-react-v1";

const LEGACY_SPACE_STATE_KEY = "jdd-space-demo-v2";
const ONBOARDED_KEY = "jdd-onboarded";
const PRODUCT_SESSION_KEY = "jdd-product-session";

/** Clear browser demo/onboarding progress (HTML acc-delete → index.html parity). */
export function clearSpaceLocalData() {
  try {
    localStorage.removeItem(SPACE_STATE_KEY);
    localStorage.removeItem(LEGACY_SPACE_STATE_KEY);
    localStorage.removeItem(ONBOARDED_KEY);
    sessionStorage.removeItem(PRODUCT_SESSION_KEY);
  } catch {
    // ignore storage errors
  }
}

export function saveSpaceState(state: SpaceState) {
  try {
    localStorage.setItem(SPACE_STATE_KEY, JSON.stringify(state));
  } catch {}
}

/** Save locally and debounce-sync to the server when authenticated (dashboard). */
export function persistSpaceState(state: SpaceState) {
  saveSpaceState(state);
  if (typeof window === "undefined") return;
  void import("./space-state-sync").then(({ scheduleSpaceStateSync }) => {
    scheduleSpaceStateSync(state);
  });
}

export function loadSpaceState(): SpaceState {
  try {
    const raw = localStorage.getItem(SPACE_STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
