import type { SpaceState } from "./space-state";
import { isGuestSpace } from "./space-active-world";
import { worldNumberForDemoCode } from "./worlds";

export type SpacePropertySnapshot = {
  cardStatus?: SpaceState["cardStatus"];
  /** Explicit null = no postal order for this property (survives JSON persist). */
  order?: SpaceState["order"];
  rsvps?: Record<string, boolean>;
};

export const ACCT_PROP_KEY = "acct";

export function propKeyForWorld(n: number) {
  return String(n);
}

export function snapshotFromState(
  state: Pick<SpaceState, "cardStatus" | "order" | "rsvps">,
): SpacePropertySnapshot {
  return {
    cardStatus: state.cardStatus ?? "none",
    order: state.order ?? null,
    rsvps: state.rsvps ? { ...state.rsvps } : {},
  };
}

function emptySnapshot(): SpacePropertySnapshot {
  return { cardStatus: "none", order: null, rsvps: {} };
}

function resetCommitmentPatch(): Partial<SpaceState> {
  return {
    intention: undefined,
    becoming: undefined,
    action: undefined,
    reminder: undefined,
    intentPrompt: false,
    intentionLocked: false,
  };
}

/** HTML hasCommitment — intention, becoming, or any card progress. */
export function hasSpaceCommitment(state: SpaceState): boolean {
  const status = state.cardStatus;
  const hasCard = Boolean(status && status !== "none");
  return Boolean(state.intention?.trim() || state.becoming?.trim()) || hasCard;
}

/**
 * HTML leaveStay — leave guest view when choosing a world.
 * Saves stay card progress under byProp[visited]; restores acct snapshot into active card.
 * Code/visited stay on the account (stays[]) and can be reopened via access code.
 */
export function leaveStay(state: SpaceState): SpaceState {
  if (!isGuestSpace(state)) return state;

  const byProp: Record<string, SpacePropertySnapshot> = { ...(state.byProp || {}) };
  if (state.visited != null) {
    byProp[propKeyForWorld(state.visited)] = snapshotFromState(state);
  }
  const acct = byProp[ACCT_PROP_KEY];

  return {
    ...state,
    byProp,
    code: undefined,
    visited: undefined,
    cardStatus: acct?.cardStatus ?? "none",
    order: acct?.order ?? null,
    rsvps: acct?.rsvps ? { ...acct.rsvps } : {},
  };
}

/**
 * HTML choose / worldwarn-go when changesActive.
 * Leaves guest stay, sets chosen world, forces a fresh card, clears commitment.
 */
export function chooseWorldAsActive(state: SpaceState, n: number): SpaceState {
  const left = leaveStay(state);
  const byProp: Record<string, SpacePropertySnapshot> = { ...(left.byProp || {}) };
  // Persist prior chosen-world (acct) progress before wiping active card for the new world.
  if (!isGuestSpace(state)) {
    byProp[ACCT_PROP_KEY] = snapshotFromState(state);
  }

  return {
    ...left,
    byProp,
    chosen: n,
    entryMode: "chosen",
    cardStatus: "none",
    order: null,
    rsvps: {},
    ...resetCommitmentPatch(),
  };
}

/** Attach a demo access code and swap card/RSVP storage per property (HTML switchStay / attachWithCommitment). */
export function attachDemoCode(state: SpaceState, code: string, visited: number): SpaceState {
  const fromGuest = isGuestSpace(state);
  const openStay = fromGuest ? state.visited ?? null : null;
  const sameStay = fromGuest && openStay === visited;

  const stays = [...(state.stays || [])];
  if (!stays.some((stay) => stay.n === visited)) {
    stays.push({ n: visited, code });
  }
  const resolvedCode = stays.find((stay) => stay.n === visited)?.code ?? code;

  const byProp: Record<string, SpacePropertySnapshot> = { ...(state.byProp || {}) };
  let loaded: SpacePropertySnapshot;

  if (!sameStay) {
    const fromKey =
      fromGuest && state.visited != null ? propKeyForWorld(state.visited) : ACCT_PROP_KEY;
    byProp[fromKey] = snapshotFromState(state);
    loaded = byProp[propKeyForWorld(visited)] ?? emptySnapshot();
  } else {
    loaded = snapshotFromState(state);
  }

  const resetCommitment = !sameStay && visited !== openStay;

  return {
    ...state,
    byProp,
    stays,
    code: resolvedCode,
    visited,
    entryMode: "code",
    cardStatus: loaded.cardStatus ?? "none",
    order: loaded.order ?? null,
    rsvps: loaded.rsvps ? { ...loaded.rsvps } : {},
    ...(resetCommitment ? resetCommitmentPatch() : {}),
  };
}

/** True when attachDemoCode will open a different stay than the one currently active. */
export function isAccessCodeStayChange(state: SpaceState, visited: number): boolean {
  const fromGuest = isGuestSpace(state);
  const openStay = fromGuest ? state.visited ?? null : null;
  if (!fromGuest) return true;
  return openStay !== visited;
}

/** Ensure demo stay list includes the active code stay (HTML migration on load). */
export function migrateStaysFromCode(state: SpaceState): SpaceState {
  const n = worldNumberForDemoCode(state.code);
  if (!n || !state.code) return state;
  const stays = [...(state.stays || [])];
  if (stays.some((stay) => stay.n === n)) return state;
  return { ...state, stays: [...stays, { n, code: state.code }] };
}
