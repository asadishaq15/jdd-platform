import type { SpacePropertySnapshot } from "./space-property-snapshot";
import { migrateStaysFromCode } from "./space-property-snapshot";
import { createClient } from "./supabase/client";
import type { CardOrder, ConnectedStay } from "./space-data";
import type { SpaceState } from "./space-state";
import { loadSpaceState, saveSpaceState } from "./space-state";
import { getWorld, worldNumberForDemoCode } from "./worlds";

export type ProfileWorldColumns = {
  recommended?: number | null;
  chosen?: number | null;
};

export type PrivateSpaceSnapshot = Pick<
  SpaceState,
  | "recommended"
  | "chosen"
  | "visited"
  | "dateOfBirth"
  | "basedIn"
  | "country"
  | "city"
  | "code"
  | "intention"
  | "becoming"
  | "entryMode"
  | "cardStatus"
  | "order"
  | "reminder"
  | "rsvps"
  | "stays"
  | "intentPrompt"
  | "action"
  | "byProp"
>;

const SYNC_FIELDS: (keyof PrivateSpaceSnapshot)[] = [
  "recommended",
  "chosen",
  "visited",
  "dateOfBirth",
  "basedIn",
  "country",
  "city",
  "code",
  "intention",
  "becoming",
  "entryMode",
  "cardStatus",
  "order",
  "reminder",
  "rsvps",
  "stays",
  "intentPrompt",
  "action",
  "byProp",
];

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/** Strip SpaceState to fields we store in profiles.private_space. */
export function spaceStateToSnapshot(state: SpaceState): PrivateSpaceSnapshot {
  const snapshot: PrivateSpaceSnapshot = {};
  for (const key of SYNC_FIELDS) {
    const value = state[key];
    if (value === undefined) continue;
    if (key === "stays" && Array.isArray(value)) {
      snapshot.stays = value.map((stay) => ({ ...stay }));
      continue;
    }
    if (key === "rsvps" && isPlainObject(value)) {
      snapshot.rsvps = { ...value } as Record<string, boolean>;
      continue;
    }
    if (key === "byProp" && isPlainObject(value)) {
      const byProp: Record<string, SpacePropertySnapshot> = {};
      for (const [propKey, raw] of Object.entries(value)) {
        if (!isPlainObject(raw)) continue;
        byProp[propKey] = {
          cardStatus: raw.cardStatus as SpacePropertySnapshot["cardStatus"],
          order: raw.order as SpacePropertySnapshot["order"],
          rsvps: isPlainObject(raw.rsvps)
            ? { ...(raw.rsvps as Record<string, boolean>) }
            : {},
        };
      }
      snapshot.byProp = byProp;
      continue;
    }
    if (key === "order" && isPlainObject(value)) {
      snapshot.order = { ...(value as NonNullable<SpaceState["order"]>) };
      continue;
    }
    if (key === "reminder" && isPlainObject(value)) {
      snapshot.reminder = { ...(value as NonNullable<SpaceState["reminder"]>) };
      continue;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (snapshot as any)[key] = value;
  }
  return snapshot;
}

function mergeStays(
  a: SpaceState["stays"] = [],
  b: SpaceState["stays"] = [],
): SpaceState["stays"] {
  const map = new Map<number, { n: number; code: string }>();
  for (const stay of [...a, ...b]) {
    if (!stay?.n) continue;
    const existing = map.get(stay.n);
    if (!existing || stay.code) map.set(stay.n, { n: stay.n, code: stay.code || existing?.code || "" });
  }
  return [...map.values()];
}

function mergeByProp(
  a: SpaceState["byProp"],
  b: SpaceState["byProp"],
): SpaceState["byProp"] | undefined {
  if (!a && !b) return undefined;
  return { ...(a || {}), ...(b || {}) };
}

function mergeRsvps(
  a: SpaceState["rsvps"],
  b: SpaceState["rsvps"],
): SpaceState["rsvps"] | undefined {
  if (!a && !b) return undefined;
  return { ...(a || {}), ...(b || {}) };
}

function preferString(a?: string, b?: string) {
  const left = a?.trim();
  const right = b?.trim();
  return left || right;
}

/** Merge profile columns, server snapshot, and local cache into one SpaceState. */
export function mergeSpaceState(
  parts: {
    profile?: ProfileWorldColumns;
    snapshot?: PrivateSpaceSnapshot | null;
    local?: SpaceState;
  },
): SpaceState {
  const profile: SpaceState = {
    ...(parts.profile?.recommended ? { recommended: parts.profile.recommended } : {}),
    ...(parts.profile?.chosen ? { chosen: parts.profile.chosen } : {}),
  };
  const snapshot = parts.snapshot || {};
  const local = parts.local || {};

  const merged: SpaceState = {
    ...local,
    ...snapshot,
    ...profile,
    stays: mergeStays(local.stays, snapshot.stays),
    byProp: mergeByProp(local.byProp, snapshot.byProp),
    rsvps: mergeRsvps(local.rsvps, snapshot.rsvps),
    intention: preferString(snapshot.intention, local.intention),
    becoming: preferString(snapshot.becoming, local.becoming),
    action: preferString(snapshot.action, local.action),
  };

  if (local.code || snapshot.code) merged.code = local.code || snapshot.code;
  if (local.visited != null || snapshot.visited != null) {
    merged.visited = local.visited ?? snapshot.visited;
  }
  if (local.chosen != null || snapshot.chosen != null || profile.chosen != null) {
    merged.chosen = profile.chosen ?? local.chosen ?? snapshot.chosen;
  }
  if (local.recommended != null || snapshot.recommended != null || profile.recommended != null) {
    merged.recommended = profile.recommended ?? local.recommended ?? snapshot.recommended;
  }
  if (local.cardStatus && snapshot.cardStatus) {
    merged.cardStatus = snapshot.cardStatus;
  } else if (local.cardStatus || snapshot.cardStatus) {
    merged.cardStatus = local.cardStatus || snapshot.cardStatus;
  }
  if (local.order || snapshot.order) {
    merged.order = {
      ...(snapshot.order || {}),
      ...(local.order || {}),
    } as NonNullable<SpaceState["order"]>;
  }
  if (local.reminder || snapshot.reminder) {
    merged.reminder = snapshot.reminder || local.reminder;
  }

  return merged;
}

export function parsePrivateSpaceSnapshot(raw: unknown): PrivateSpaceSnapshot | null {
  if (!isPlainObject(raw)) return null;
  return spaceStateToSnapshot(raw as SpaceState);
}

let debounceTimer: ReturnType<typeof setTimeout> | null = null;
let pendingState: SpaceState | null = null;
let inflight: Promise<void> | null = null;

async function pushToApi(state: SpaceState): Promise<void> {
  const response = await fetch("/api/space-state", {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ state: spaceStateToSnapshot(state) }),
  });
  if (!response.ok && response.status !== 401) {
    console.warn("Space state sync failed", response.status);
  }
}

export function scheduleSpaceStateSync(state: SpaceState) {
  pendingState = state;
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    debounceTimer = null;
    const next = pendingState;
    pendingState = null;
    if (!next) return;
    inflight = pushToApi(next).finally(() => {
      inflight = null;
    });
  }, 650);
}

export async function flushSpaceStateSync(): Promise<void> {
  if (debounceTimer) {
    clearTimeout(debounceTimer);
    debounceTimer = null;
  }
  const next = pendingState;
  pendingState = null;
  if (inflight) await inflight;
  if (next) await pushToApi(next);
}

export async function pullSpaceSnapshotFromClient(): Promise<PrivateSpaceSnapshot | null> {
  const response = await fetch("/api/space-state", { method: "GET" });
  if (response.status === 401) return null;
  if (!response.ok) return null;
  const body = (await response.json()) as { state?: unknown };
  return parsePrivateSpaceSnapshot(body.state);
}

export async function hydrateLocalSpaceFromServer(profile?: ProfileWorldColumns) {
  const local = loadSpaceState();
  const snapshot = await pullSpaceSnapshotFromClient();
  const merged = mergeSpaceState({ profile, snapshot, local });
  saveSpaceState(merged);
  return merged;
}

export async function signOutToLogin() {
  await flushSpaceStateSync();
  const supabase = createClient();
  await supabase.auth.signOut();
  window.location.assign("/sign-in");
}

function orderStatusForSpace(status: CardOrder["status"]): NonNullable<SpaceState["cardStatus"]> {
  if (status === "requested") return "preparing";
  if (status === "cancelled") return "none";
  return status;
}

/** Hydrate dashboard SpaceState from profile, server snapshot, localStorage, and DB rows. */
export function buildDashboardSpaceState(args: {
  initialState: Pick<SpaceState, "recommended" | "chosen" | "dateOfBirth">;
  initialSpaceSnapshot?: PrivateSpaceSnapshot | null;
  initialRsvps: Record<string, boolean>;
  initialOrders: CardOrder[];
  stays: ConnectedStay[];
  activeStayId?: string;
}): SpaceState {
  const local = migrateStaysFromCode(loadSpaceState());
  let synced = mergeSpaceState({
    profile: {
      recommended: args.initialState.recommended ?? null,
      chosen: args.initialState.chosen ?? null,
    },
    snapshot: args.initialSpaceSnapshot,
    local,
  });
  synced = {
    ...synced,
    ...(args.initialState.dateOfBirth ? { dateOfBirth: args.initialState.dateOfBirth } : {}),
    rsvps: { ...(synced.rsvps || {}), ...args.initialRsvps },
  };

  const hasDemoCode = Boolean(worldNumberForDemoCode(synced.code));
  const connected = args.stays.find((stay) => stay.id === args.activeStayId) || args.stays[0];
  const latestOrder = args.initialOrders[0];
  const persistedOrder = latestOrder
    ? {
        cardStatus: orderStatusForSpace(latestOrder.status),
        order: {
          property: latestOrder.propertyName,
          state: getWorld(
            connected?.property.worldNumber || synced.chosen || synced.recommended || 9,
          ).state,
          recipient: latestOrder.recipientName,
        },
      }
    : {};

  const next = hasDemoCode
    ? { ...synced, ...persistedOrder }
    : connected
      ? { ...synced, ...persistedOrder, visited: connected.property.worldNumber }
      : { ...synced, ...persistedOrder };

  return migrateStaysFromCode(next);
}