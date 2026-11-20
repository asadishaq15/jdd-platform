import type { SpaceState } from "./space-state";
import { isGuestSpace } from "./space-active-world";
import { worldNumberForDemoCode } from "./worlds";

export type SpacePropertySnapshot = {
  cardStatus?: SpaceState["cardStatus"];
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
    cardStatus: state.cardStatus,
    order: state.order,
    rsvps: state.rsvps ? { ...state.rsvps } : {},
  };
}

function emptySnapshot(): SpacePropertySnapshot {
  return { cardStatus: "none", rsvps: {} };
}

function resetCommitmentPatch(): Partial<SpaceState> {
  return {
    intention: undefined,
    becoming: undefined,
    action: undefined,
    reminder: undefined,
    intentPrompt: false,
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
    order: loaded.order,
    rsvps: loaded.rsvps ? { ...loaded.rsvps } : {},
    ...(resetCommitment ? resetCommitmentPatch() : {}),
  };
}

/** Ensure demo stay list includes the active code stay (HTML migration on load). */
export function migrateStaysFromCode(state: SpaceState): SpaceState {
  const n = worldNumberForDemoCode(state.code);
  if (!n || !state.code) return state;
  const stays = [...(state.stays || [])];
  if (stays.some((stay) => stay.n === n)) return state;
  return { ...state, stays: [...stays, { n, code: state.code }] };
}