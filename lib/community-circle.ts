import type { CommunityCircleEvent } from "./space-data";
import { stateImageSrc } from "./state-images";
import { worldDetails, type HospitalityWorld } from "./worlds";

const pick = <T,>(items: readonly T[], index: number) => items[index % items.length];

const SIERRA_RESERVE_WORLD = 4;
const SIERRA_COMMUNITY_PHOTOS = {
  event: "/assets/Golden Hour Gym Jump Rope.png",
  invite: "/assets/Candlelit Dusk Dinner Gathering.png",
  news: "/assets/Warm Bookshelf by the Fireplace.png",
} as const;

/** Keyword match from space (1).html `EVT_PHOTO`. */
const EVENT_PHOTOS = [
  ["kaiseki", "kaiseki"],
  ["moss", "moss"],
  ["tea house", "tea"],
  ["cooking", "cooking"],
  ["sail", "sail"],
  ["ridge", "ridge"],
] as const;

function eventPhoto(text: string, world: HospitalityWorld) {
  const haystack = text.toLowerCase();
  const match = EVENT_PHOTOS.find(([word]) => haystack.includes(word));
  return match ? `/assets/events/${match[1]}.jpg` : stateImageSrc(world);
}

/** Property Circle cards, same copy and photos as circleItem() in the HTML demo. */
export function communityCircleForWorld(world: HospitalityWorld): CommunityCircleEvent[] {
  const n = world.n;
  const experiences = worldDetails[n]?.experiences ?? ["", "", ""];
  const [inviteLine, eventLine, newsLine] = experiences;

  const eventTitle = pick(
    [
      `An evening of ${world.state}`,
      `A ${world.state.toLowerCase()} supper`,
      `${world.state} after dark`,
      `A gathering for ${world.state}`,
      `A long table of ${world.state}`,
    ],
    n,
  );
  const eventWhen = pick(
    [
      "Friday, 16 October · 7 pm",
      "Thursday, 22 October · 8 pm",
      "Saturday, 31 October · 6 pm",
      "Wednesday, 4 November · 7.30 pm",
    ],
    n,
  );
  const inviteTitle = pick(
    [
      "A private morning",
      "An invitation at dawn",
      "A quiet afternoon",
      "A guest-only hour",
      "An hour with the house",
    ],
    n + 2,
  );
  const inviteWhen = pick(
    [
      "Saturday, 17 October · 8 am",
      "Sunday, 25 October · 7 am",
      "Tuesday, 3 November · 4 pm",
      "Sunday, 8 November · 9 am",
    ],
    n + 1,
  );
  const newsTitle = pick(
    [
      `A new season at ${world.property}`,
      `Now open at ${world.property}`,
      `From the house at ${world.property}`,
      `This month at ${world.property}`,
    ],
    n,
  );
  const newsWhen = pick(["This week", "This month", "New this season"], n);

  const cards = [
    {
      category: "event" as const,
      title: eventTitle,
      timing: eventWhen,
      subtitle: eventLine,
      body: `${eventLine}. An evening for guests connected by ${world.state}.`,
    },
    {
      category: "invite" as const,
      title: inviteTitle,
      timing: inviteWhen,
      subtitle: inviteLine,
      body: `${inviteLine}. A quiet invitation for guests of ${world.property}.`,
    },
    {
      category: "news" as const,
      title: newsTitle,
      timing: newsWhen,
      subtitle: newsLine,
      body: `${newsLine} – now open to guests of ${world.property}.`,
    },
  ];

  return cards.map((card) => {
    let title = card.title;
    let body = card.body;
    let thumbnailUrl = eventPhoto(`${card.subtitle} ${card.body}`, world);

    if (n === SIERRA_RESERVE_WORLD) {
      if (card.category === "event") {
        title = "A Morning of Stability.";
        body = `${card.subtitle}. A morning for guests connected by ${world.state}.`;
        thumbnailUrl = SIERRA_COMMUNITY_PHOTOS.event;
      }
      if (card.category === "invite") {
        thumbnailUrl = SIERRA_COMMUNITY_PHOTOS.invite;
      }
      if (card.category === "news") {
        title = "A New Season at Sierra Reserve";
        thumbnailUrl = SIERRA_COMMUNITY_PHOTOS.news;
      }
    }

    return {
      id: `demo-${n}-${card.category}`,
      propertyId: "demo",
      category: card.category,
      title,
      timing: card.timing,
      subtitle: card.subtitle,
      body,
      thumbnailUrl,
    };
  });
}
