export type HospitalityWorld = {
  n: number;
  state: string;
  mantra: string;
  desc: string;
  property: string;
  country: string;
};

export const worlds: HospitalityWorld[] = [
  { n: 1, state: "Creation", mantra: "I can act.", desc: "You belong among people who turn ideas into action and invisible possibilities into form — connected by initiative, authorship, practical intelligence and the desire to create something real.", property: "Forma House", country: "Italy" },
  { n: 2, state: "Inner Knowing", mantra: "I hear inner knowledge.", desc: "You belong among people who trust what they perceive beneath the visible surface — connected by intuition, observation, subtle intelligence and an understanding that does not require immediate explanation.", property: "Veil Retreat", country: "Bhutan" },
  { n: 3, state: "Nurturing", mantra: "I give form to what is born in me.", desc: "You belong among people who create the conditions in which life, beauty and ideas can flourish — connected by care, creativity, receptivity and the desire to support meaningful growth.", property: "Willow Estate", country: "England" },
  { n: 4, state: "Stability", mantra: "I set boundaries and create support.", desc: "You belong among people who take responsibility, create structure and provide security for others — connected by leadership, ownership, clear boundaries and the commitment to build foundations that last.", property: "Sierra Reserve", country: "Switzerland" },
  { n: 5, state: "Wisdom", mantra: "I realize what I believe in.", desc: "You belong among people who live according to their principles and preserve knowledge worth carrying forward — connected by learning, ethics, tradition and the transmission of experience between generations.", property: "Cedar House", country: "Japan" },
  { n: 6, state: "Connection", mantra: "I choose what is mine.", desc: "You belong among people who form relationships through genuine recognition and mutual choice — connected by shared values, emotional honesty, attraction and the freedom to choose what truly aligns.", property: "Liora Estate", country: "Portugal" },
  { n: 7, state: "Direction", mantra: "I follow my chosen direction.", desc: "You belong among people who move decisively toward what they have chosen — connected by momentum, focus, discipline, independence and the determination to reach a meaningful destination.", property: "Coyote Lodge", country: "United States" },
  { n: 8, state: "Balance", mantra: "I take responsibility for my choice.", desc: "You belong among people who consider the consequences of their decisions and stand behind what they choose — connected by fairness, truth, accountability and agreements that apply equally to everyone.", property: "Equa Retreat", country: "Sweden" },
  { n: 9, state: "Stillness", mantra: "I step back to hear my own voice.", desc: "You belong among people who withdraw from noise in order to listen and understand more deeply — connected by solitude, mastery, independent thought and meaningful conversation.", property: "Serein Kyoto", country: "Japan" },
  { n: 10, state: "Renewal", mantra: "I accept change while staying connected to myself.", desc: "You belong among people who recognize when life is opening a new cycle — connected by adaptability, timing, reinvention and the ability to move with change without losing themselves.", property: "Alba Springs", country: "Iceland" },
  { n: 11, state: "Vitality", mantra: "I direct my power.", desc: "You belong among people who cultivate strength through movement, discipline and physical presence — connected by endurance, courage and the conscious direction of personal power.", property: "Brio Lodge", country: "Costa Rica" },
  { n: 12, state: "Perspective", mantra: "I see otherwise.", desc: "You belong among people who are willing to see what others overlook — connected by unconventional perception, creative solitude, experimentation and the ability to transform limitation into a new point of view.", property: "Oblique House", country: "Denmark" },
  { n: 13, state: "Release", mantra: "I allow the old to end.", desc: "You belong among people who understand that transformation sometimes requires an ending — connected by honesty, surrender, recovery and the courage to release what no longer belongs to the future.", property: "Ebb Sanctuary", country: "Indonesia" },
  { n: 14, state: "Harmony", mantra: "I live in harmony.", desc: "You belong among people who bring different forces into a balanced relationship — connected by moderation, restoration, cooperation and the subtle adjustment of one element in relation to another.", property: "Cala Retreat", country: "Greece" },
  { n: 15, state: "Desire", mantra: "I reclaim my will.", desc: "You belong among people who acknowledge desire and take responsibility for the power it carries — connected by ambition, intensity, material intelligence and the ability to direct desire without becoming controlled by it.", property: "Ember Palace", country: "Morocco" },
  { n: 16, state: "Liberation", mantra: "I free myself from false foundations.", desc: "You belong among people who confront what is false, unstable or restrictive — connected by radical honesty, courageous disruption and the freedom created by dismantling structures that no longer work.", property: "Wildrock Lodge", country: "Namibia" },
  { n: 17, state: "Inspiration", mantra: "I shine from my essence.", desc: "You belong among people whose individuality allows others to imagine a different future — connected by originality, visibility, vision and the courage to express what others are not yet able to see.", property: "Aster House", country: "France" },
  { n: 18, state: "Intuition", mantra: "I trust my inner night.", desc: "You belong among people who are sensitive to atmosphere, symbolism and what cannot always be explained logically — connected by imagination, emotional depth, mystery and trust in the unseen.", property: "Nocturne Retreat", country: "Oman" },
  { n: 19, state: "Clarity", mantra: "I live openly.", desc: "You belong among people whose presence creates confidence, warmth and possibility around them — connected by honest expression, radiance, visible achievement and the ability to celebrate one another without rivalry.", property: "Lucent Estate", country: "Spain" },
  { n: 20, state: "Awakening", mantra: "I answer my calling.", desc: "You belong among people who recognize when life is asking them to serve something greater — connected by purpose, responsibility, legacy and the understanding that personal experience can benefit others.", property: "Aurora Reserve", country: "Norway" },
  { n: 21, state: "Wholeness", mantra: "I complete and begin anew.", desc: "You belong among people who move between different worlds without losing their distinct identity — connected by integration, global perspective, cultural intelligence and a sense of belonging within the whole.", property: "Terra Estate", country: "New Zealand" },
  { n: 22, state: "Wonder", mantra: "I open to the unknown.", desc: "You belong among people who are willing to begin without requiring a guaranteed outcome — connected by curiosity, freedom, experimentation, play and the possibility of discovering an entirely new way to live.", property: "Nomad Lodge", country: "Chile" },
];

export const demoCodes: Record<string, number> = {
  SRNKKYOT2026: 9,
  LIORAEST2026: 6,
  SIERRARE2026: 4,
};

export function getWorld(n: number) {
  return worlds.find((world) => world.n === n) ?? worlds[8];
}

export function numberFromDob(day: number, month: number, year: number) {
  let n = `${day}${month}${year}`.split("").reduce((sum, digit) => sum + Number(digit), 0);
  while (n > 22) n = String(n).split("").reduce((sum, digit) => sum + Number(digit), 0);
  return n || 22;
}

export function normalizeAccessCode(code: string) {
  return code.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
}
