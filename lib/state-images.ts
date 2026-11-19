import type { HospitalityWorld } from "./worlds";

/** Slug used by HTML `__JDD_IMG` / `assets/states/{slug}.jpg`. */
export function stateSlug(world: Pick<HospitalityWorld, "state"> | string) {
  const name = typeof world === "string" ? world : world.state;
  return name.toLowerCase().replace(/\s+/g, "-");
}

/** Public path for a State photo extracted from the HTML demo. */
export function stateImageSrc(world: Pick<HospitalityWorld, "state"> | string) {
  return `/images/states/${stateSlug(world)}.jpg`;
}
