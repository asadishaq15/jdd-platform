export type SpaceSlideId =
  | "identity"
  | "world"
  | "scent"
  | "intention"
  | "ritual"
  | "community";

export type SpaceSlideDef = {
  id: SpaceSlideId;
  title: string;
  stubNote: string;
};

export const SPACE_SLIDES: readonly SpaceSlideDef[] = [
  { id: "identity", title: "My Space", stubNote: "" },
  { id: "world", title: "Your chosen world", stubNote: "" },
  { id: "scent", title: "Scent invitation", stubNote: "" },
  { id: "intention", title: "My intention", stubNote: "" },
  { id: "ritual", title: "My ritual", stubNote: "" },
  { id: "community", title: "My community", stubNote: "" },
] as const;

export const SPACE_SLIDE_COUNT = SPACE_SLIDES.length;

export function padSlideIndex(index: number) {
  return String(index + 1).padStart(2, "0");
}
