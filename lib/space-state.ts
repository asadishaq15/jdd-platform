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
    frequency: "off" | "once" | "daily" | "weekly";
    date?: string;
    time?: string;
    tz?: string;
  };
  rsvps?: Record<string, boolean>;
};

export const SPACE_STATE_KEY = "jdd-space-react-v1";

export function saveSpaceState(state: SpaceState) {
  try {
    localStorage.setItem(SPACE_STATE_KEY, JSON.stringify(state));
  } catch {}
}

export function loadSpaceState(): SpaceState {
  try {
    const raw = localStorage.getItem(SPACE_STATE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}
