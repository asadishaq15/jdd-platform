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

/**
 * Image set for arch left/right controls.
 * Extra paths can be listed per slug when more assets ship; today most worlds have one photo.
 */
const EXTRA_STATE_IMAGES: Partial<Record<string, string[]>> = {
  // e.g. "inner-knowing": ["/images/states/inner-knowing-2.jpg"],
};

export function stateImageGallery(world: Pick<HospitalityWorld, "state"> | string): string[] {
  const primary = stateImageSrc(world);
  const extras = EXTRA_STATE_IMAGES[stateSlug(world)] || [];
  return [primary, ...extras];
}
