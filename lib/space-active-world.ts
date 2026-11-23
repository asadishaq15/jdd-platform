import type { SpaceState } from "./space-state";
import { worldNumberForDemoCode } from "./worlds";

/** HTML isGuest() → active demo access code on the dashboard. */
export function isGuestSpace(state: Pick<SpaceState, "code">): boolean {
  return Boolean(worldNumberForDemoCode(state.code));
}

/** HTML curN() / activeN() → code ? visited : chosen (with discovery fallbacks). */
export function activeWorldNumber(
  state: Pick<SpaceState, "code" | "visited" | "chosen" | "recommended">,
): number | undefined {
  if (isGuestSpace(state)) {
    return state.visited ?? worldNumberForDemoCode(state.code) ?? undefined;
  }
  return state.chosen ?? state.recommended;
}

/**
 * World shown on the dashboard deck. An explicit Explore “Choose this world”
 * (entryMode === "chosen") wins over stay/visited so slide 2 updates immediately.
 */
export function dashboardWorldNumber(
  state: Pick<SpaceState, "code" | "visited" | "chosen" | "recommended" | "entryMode">,
  fallback?: number,
): number {
  if (state.entryMode === "chosen" && state.chosen != null) {
    return state.chosen;
  }
  return activeWorldNumber(state) ?? fallback ?? 9;
}