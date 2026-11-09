export type WorldCardColour = { light: string; main: string; dark: string; hue: number };

export type WorldDemoData = {
  cardColour: WorldCardColour;
  perfumeOilSoldAt: string;
  propertyCircle: string[];
};

export const worldDemoData: Record<number, WorldDemoData> = {
  1: {
    cardColour: { light: "#EAE6E1", main: "#C5BFB5", dark: "#ACA59A", hue: 37 },
    perfumeOilSoldAt: "Boutique of the property",
    propertyCircle: ["Event — A creation supper (Breakfast at a long table where ideas are sketched) · Thursday, 22 October · 8 pm"],
  },
  2: {
    cardColour: { light: "#E8EAE1", main: "#C1C5B5", dark: "#A8AC9A", hue: 74 },
    perfumeOilSoldAt: "Spa of the property",
    propertyCircle: ["Guest invitation — An hour with the house (A silent walk at first light) · Sunday, 8 November · 9 am", "News — From the house at Veil Retreat (A day without screens or schedule) · New this season"],
  },
  3: {
    cardColour: { light: "#E3EAE1", main: "#B7C5B5", dark: "#9DAC9A", hue: 111 },
    perfumeOilSoldAt: "Boutique of the property",
    propertyCircle: ["Event — A gathering for Nurturing (Tending the orchard with the head gardener) · Wednesday, 4 November · 7.30 pm", "News — This month at Willow Estate (Afternoon tea beside the willow pond) · This week"],
  },
  4: {
    cardColour: { light: "#E1EAE5", main: "#B5C5BC", dark: "#9AACA3", hue: 148 },
    perfumeOilSoldAt: "Boutique of the property",
    propertyCircle: ["Guest invitation — An invitation at dawn (A guided ridge walk at first light) · Sunday, 25 October · 7 am"],
  },
  5: {
    cardColour: { light: "#E1E9EA", main: "#B5C3C5", dark: "#9AABAC", hue: 185 },
    perfumeOilSoldAt: "Boutique of the property",
    propertyCircle: ["Event — An evening of Wisdom (A reading hour in the archive room) · Thursday, 22 October · 8 pm", "Guest invitation — A quiet afternoon (A tea ceremony with a master) · Tuesday, 3 November · 4 pm"],
  },
  6: {
    cardColour: { light: "#E1E4EA", main: "#B5BAC5", dark: "#9AA0AC", hue: 222 },
    perfumeOilSoldAt: "Boutique of the property",
    propertyCircle: ["News — From the house at Liora Estate (Cooking with the family who runs the estate) · This week", "Event — A connection supper (A sunset sail for two) · Saturday, 31 October · 6 pm"],
  },
  7: {
    cardColour: { light: "#E4E1EA", main: "#BAB5C5", dark: "#A09AAC", hue: 259 },
    perfumeOilSoldAt: "Boutique of the property",
    propertyCircle: ["Guest invitation — An hour with the house (A sunrise ride across open land) · Saturday, 17 October · 8 am", "Event — Direction after dark (A solo trail with a map and a destination) · Wednesday, 4 November · 7.30 pm", "News — This month at Coyote Lodge (An evening under the stars to name your next step) · This month"],
  },
  8: {
    cardColour: { light: "#E9E1EA", main: "#C4B5C5", dark: "#AB9AAC", hue: 296 },
    perfumeOilSoldAt: "Spa of the property",
    propertyCircle: ["Event — A gathering for Balance (A shared table where everyone serves) · Friday, 16 October · 7 pm", "Guest invitation — A private morning (A sauna and cold-lake ritual) · Sunday, 25 October · 7 am"],
  },
  9: {
    cardColour: { light: "#EAE1E5", main: "#C5B5BC", dark: "#AC9AA2", hue: 333 },
    perfumeOilSoldAt: "Boutique of the property",
    propertyCircle: ["Event — A long table of Stillness (A silent kaiseki dinner) · Thursday, 22 October · 8 pm", "Guest invitation — An invitation at dawn (Moss-garden contemplation at dawn) · Tuesday, 3 November · 4 pm", "News — Now open at Serein Kyoto (Private meditation in the tea house) · This week"],
  },
  10: {
    cardColour: { light: "#EAE3E1", main: "#C5B7B5", dark: "#AC9D9A", hue: 10 },
    perfumeOilSoldAt: "Spa of the property",
    propertyCircle: ["Event — An evening of Renewal (A walk to the edge of the glacier) · Saturday, 31 October · 6 pm"],
  },
  11: {
    cardColour: { light: "#EAE8E1", main: "#C5C1B5", dark: "#ACA89A", hue: 47 },
    perfumeOilSoldAt: "Boutique of the property",
    propertyCircle: ["Guest invitation — A guest-only hour (A guided trail run through the forest) · Saturday, 17 October · 8 am", "News — This month at Brio Lodge (An open-air movement class) · New this season"],
  },
  12: {
    cardColour: { light: "#E6EAE1", main: "#BEC5B5", dark: "#A5AC9A", hue: 84 },
    perfumeOilSoldAt: "Boutique of the property",
    propertyCircle: ["Event — Perspective after dark (A room designed without straight lines) · Friday, 16 October · 7 pm", "News — A new season at Oblique House (A night walk along the dunes) · This week"],
  },
  13: {
    cardColour: { light: "#E1EAE2", main: "#B5C5B5", dark: "#9AAC9A", hue: 121 },
    perfumeOilSoldAt: "Spa of the property",
    propertyCircle: ["Guest invitation — A private morning (A water ritual at the river) · Tuesday, 3 November · 4 pm"],
  },
  14: {
    cardColour: { light: "#E1EAE7", main: "#B5C5BF", dark: "#9AACA6", hue: 158 },
    perfumeOilSoldAt: "Spa of the property",
    propertyCircle: ["Event — A long table of Harmony (An herbal workshop with the island gardener) · Saturday, 31 October · 6 pm", "Guest invitation — An invitation at dawn (A swim in a quiet cove) · Sunday, 8 November · 9 am"],
  },
  15: {
    cardColour: { light: "#E1E8EA", main: "#B5C1C5", dark: "#9AA8AC", hue: 195 },
    perfumeOilSoldAt: "Boutique of the property",
    propertyCircle: ["News — This month at Ember Palace (A spice-market walk with the chef) · This week", "Event — An evening of Desire (A candlelit dinner in the inner courtyard) · Wednesday, 4 November · 7.30 pm"],
  },
  16: {
    cardColour: { light: "#E1E3EA", main: "#B5B7C5", dark: "#9A9CAC", hue: 232 },
    perfumeOilSoldAt: "Boutique of the property",
    propertyCircle: ["Guest invitation — A guest-only hour (A night drive under open skies) · Sunday, 25 October · 7 am", "Event — A liberation supper (A dune climb at sunrise) · Friday, 16 October · 7 pm", "News — A new season at Wildrock Lodge (A sleep-out on the rock platform) · This month"],
  },
  17: {
    cardColour: { light: "#E5E1EA", main: "#BCB5C5", dark: "#A39AAC", hue: 269 },
    perfumeOilSoldAt: "Boutique of the property",
    propertyCircle: ["Event — Inspiration after dark (An evening salon with guest artists) · Thursday, 22 October · 8 pm", "Guest invitation — An hour with the house (Painting in the garden atelier) · Tuesday, 3 November · 4 pm"],
  },
  18: {
    cardColour: { light: "#EAE1E9", main: "#C5B5C3", dark: "#AC9AAB", hue: 306 },
    perfumeOilSoldAt: "Spa of the property",
    propertyCircle: ["Event — A gathering for Intuition (A silent dune walk at moonrise) · Saturday, 31 October · 6 pm", "Guest invitation — A private morning (A night with a stargazer in the desert) · Sunday, 8 November · 9 am", "News — From the house at Nocturne Retreat (A frankincense ceremony) · This week"],
  },
  19: {
    cardColour: { light: "#EAE1E4", main: "#C5B5B9", dark: "#AC9A9F", hue: 343 },
    perfumeOilSoldAt: "Boutique of the property",
    propertyCircle: ["Event — A long table of Clarity (A celebration dinner with the house) · Wednesday, 4 November · 7.30 pm"],
  },
  20: {
    cardColour: { light: "#EAE4E1", main: "#C5BAB5", dark: "#ACA09A", hue: 20 },
    perfumeOilSoldAt: "Boutique of the property",
    propertyCircle: ["Guest invitation — A quiet afternoon (A northern-lights watch with a guide) · Sunday, 25 October · 7 am", "News — A new season at Aurora Reserve (A day given to the local community) · New this season"],
  },
  21: {
    cardColour: { light: "#EAE9E1", main: "#C5C4B5", dark: "#ACAB9A", hue: 57 },
    perfumeOilSoldAt: "Boutique of the property",
    propertyCircle: ["Event — A wholeness supper (A shared harvest dinner) · Thursday, 22 October · 8 pm", "News — Now open at Terra Estate (A coast-to-mountain day) · This week"],
  },
  22: {
    cardColour: { light: "#E5EAE1", main: "#BCC5B5", dark: "#A2AC9A", hue: 94 },
    perfumeOilSoldAt: "Boutique of the property",
    propertyCircle: ["Guest invitation — An hour with the house (Stargazing in one of the clearest skies on earth) · Sunday, 8 November · 9 am"],
  },
};

export function getWorldDemoData(n: number): WorldDemoData {
  return worldDemoData[n] || worldDemoData[7];
}
