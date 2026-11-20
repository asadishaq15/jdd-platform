import { foldLocationQuery } from "./world-cities";

/** HTML suggest ranking: main prefix → word prefix → any-token prefix; max 6. */
export function rankLocationItems<T>(
  query: string,
  items: T[],
  getMain: (item: T) => string,
  getAll: (item: T) => string,
): T[] {
  const q = foldLocationQuery(query);
  if (!q) return [];

  const rank: T[][] = [[], [], []];
  for (const item of items) {
    const main = foldLocationQuery(getMain(item));
    const all = foldLocationQuery(getAll(item));
    if (main.startsWith(q)) rank[0].push(item);
    else if (main.split(/[\s-]+/).some((w) => w.startsWith(q))) rank[1].push(item);
    else if (all.split(/[\s-]+/).some((w) => w.startsWith(q))) rank[2].push(item);
  }
  return rank.flat().slice(0, 6);
}

export type SuggestPlacement = {
  up: boolean;
  maxHeight: number;
};

/** Match HTML place(): keep clear of header and Continue actions. */
export function measureSuggestPlacement(
  input: HTMLElement,
  scrollHeight: number,
  actionsEl: Element | null,
): SuggestPlacement {
  const r = input.getBoundingClientRect();
  const limit = actionsEl
    ? actionsEl.getBoundingClientRect().top - 12
    : window.innerHeight - 12;
  const below = limit - (r.bottom + 8);
  const above = r.top - 8 - 76;
  const want = Math.min(scrollHeight, 300);

  if (want <= below) return { up: false, maxHeight: below };
  if (above >= below) return { up: true, maxHeight: Math.min(300, above) };
  return { up: false, maxHeight: Math.max(below, 90) };
}
