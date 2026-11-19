export type JourneyStay = { from: string; to: string };

export type JourneyAction = {
  id: string;
  text: string;
  schedule: string;
  acted: number;
};

export type JourneyReflection = {
  choice: string;
  note: string;
};

export type JourneyWorldStatus = "chosen" | "in-stay" | "past";

export type JourneyWorld = {
  id: string;
  state: string;
  hotel: string;
  country: string;
  image: string;
  status: JourneyWorldStatus;
  chosenSince?: string;
  stays: JourneyStay[];
  current?: boolean;
  intention: string;
  becoming: string;
  actions: JourneyAction[];
  moments: string[];
  reflection: JourneyReflection | null;
};

export type JourneyNotification = {
  id: string;
  type: "action";
  worldId: string;
  actionId: string;
  when: string;
  answered?: string;
};

export type JourneyEventStatus = "reserved" | "to-confirm" | "attended";

export type JourneyEvent = {
  id: string;
  status: JourneyEventStatus;
  title: string;
  hotel: string;
  date: string;
  url?: string;
  photo: string | null;
  worldId?: string;
  cancelled?: boolean;
  answered?: string | null;
};

/** Demo data from public/prototype/my-journey-v6.html */
export const JOURNEY_DEMO_WORLDS: JourneyWorld[] = [
  {
    id: "direction",
    state: "Direction",
    hotel: "Coyote Lodge",
    country: "United States",
    image: "/images/journey/direction.jpg",
    status: "chosen",
    chosenSince: "2026-11-03",
    stays: [],
    current: true,
    intention: "Money",
    becoming: "someone who is patient",
    actions: [
      { id: "a1", text: "Go to the martial arts class", schedule: "Sundays", acted: 4 },
      { id: "a2", text: "Water the flowers", schedule: "Wednesdays", acted: 2 },
      { id: "a3", text: "Put 10% aside before spending", schedule: "Every 25th", acted: 3 },
      { id: "a8", text: "Call one potential client", schedule: "Weekdays", acted: 9 },
    ],
    moments: [],
    reflection: null,
  },
  {
    id: "stillness",
    state: "Stillness",
    hotel: "Serein Kyoto",
    country: "Japan",
    image: "/images/journey/stillness.jpg",
    status: "past",
    stays: [{ from: "2026-10-14", to: "2026-10-19" }],
    intention: "More at peace with myself",
    becoming: "a more present version of myself",
    actions: [{ id: "a4", text: "Read before sleep", schedule: "Daily", acted: 9 }],
    moments: ["A Tea Ceremony at Dawn"],
    reflection: { choice: "Some parts felt right.", note: "" },
  },
  {
    id: "perspective",
    state: "Perspective",
    hotel: "Oblique House",
    country: "Denmark",
    image: "/images/journey/perspective.jpg",
    status: "past",
    stays: [
      { from: "2026-09-02", to: "2026-09-06" },
      { from: "2026-06-02", to: "2026-06-07" },
      { from: "2026-02-10", to: "2026-02-14" },
      { from: "2025-11-20", to: "2025-11-23" },
      { from: "2025-08-01", to: "2025-08-05" },
      { from: "2025-05-12", to: "2025-05-15" },
      { from: "2025-01-03", to: "2025-01-06" },
      { from: "2024-10-09", to: "2024-10-13" },
      { from: "2024-07-18", to: "2024-07-21" },
      { from: "2024-06-01", to: "2024-06-04" },
    ],
    intention: "To see my work with new eyes",
    becoming: "someone who trusts her own perception",
    actions: [
      { id: "a5", text: "Draw for ten minutes", schedule: "Daily", acted: 31 },
      { id: "a6", text: "Visit a gallery", schedule: "Once a month", acted: 4 },
    ],
    moments: ["An Evening by the North Sea", "A Morning at Oblique House"],
    reflection: { choice: "I felt at home.", note: "I left with a notebook full of drawings." },
  },
  {
    id: "connection",
    state: "Connection",
    hotel: "Liora Estate",
    country: "Portugal",
    image: "/images/journey/connection.jpg",
    status: "past",
    stays: [{ from: "2025-10-11", to: "2025-10-15" }],
    intention: "To reconnect with my sister",
    becoming: "a warmer, more open version of myself",
    actions: [{ id: "a7", text: "Call my sister", schedule: "Sundays", acted: 3 }],
    moments: [],
    reflection: { choice: "It wasn’t for me.", note: "" },
  },
];

export const JOURNEY_DEMO_NOTIFICATIONS: JourneyNotification[] = [
  { id: "n0", type: "action", worldId: "direction", actionId: "a1", when: "Today" },
  { id: "n1", type: "action", worldId: "direction", actionId: "a3", when: "Today" },
  { id: "n2", type: "action", worldId: "direction", actionId: "a8", when: "Today" },
];

export const JOURNEY_DEMO_EVENTS: JourneyEvent[] = [
  {
    id: "e1",
    status: "reserved",
    title: "A connection supper",
    hotel: "Liora Estate",
    date: "Sat 31 Oct · 6 PM",
    url: "/events/connection-supper",
    photo: "/images/journey/supper.jpg",
  },
  {
    id: "e3",
    status: "reserved",
    title: "Morning tea in the moss garden",
    hotel: "Serein Kyoto",
    date: "Thu 5 Nov · 7 AM",
    url: "/events/moss-garden-tea",
    photo: "/images/journey/moss_tea.jpg",
  },
  {
    id: "e2",
    status: "to-confirm",
    worldId: "perspective",
    title: "A Sunrise Swim",
    hotel: "Oblique House",
    date: "Yesterday",
    photo: "/images/journey/sunrise_swim.jpg",
  },
  {
    id: "e4",
    status: "attended",
    title: "A Tea Ceremony at Dawn",
    hotel: "Serein Kyoto",
    date: "16 Oct 2026",
    photo: "/images/journey/tea_ceremony.jpg",
  },
  {
    id: "e5",
    status: "attended",
    title: "An Evening by the North Sea",
    hotel: "Oblique House",
    date: "4 Sep 2026",
    photo: "/images/journey/north_sea.jpg",
  },
];
