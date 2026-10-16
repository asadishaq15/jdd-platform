export type SpaceState = {
  recommended?: number;
  chosen?: number;
  visited?: number;
  code?: string;
  intention?: string;
  becoming?: string;
  entryMode?: "recommended" | "chosen" | "code";
  cardStatus?: "none" | "preparing" | "sent" | "delivered" | "received";
  order?: {
    property: string;
    state: string;
    recipient: string;
    address?: string;
    payment?: string;
  };
  reminder?: {
    action: string;
    frequency: "off" | "once" | "daily";
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
