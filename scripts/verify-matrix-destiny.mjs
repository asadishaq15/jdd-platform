/**
 * Verifies Matrix of Destiny center (E) examples against lib/worlds.ts numberFromDob.
 * Keep these cases aligned with matrixDestinyExamples in lib/worlds.ts.
 */

function reduceArcana(value) {
  let n = Math.abs(Math.trunc(value));
  while (n > 22) {
    n = String(n).split("").reduce((sum, digit) => sum + Number(digit), 0);
  }
  return n || 22;
}

function numberFromDob(day, month, year) {
  const a = reduceArcana(day);
  const b = month;
  const c = reduceArcana(String(year).split("").reduce((sum, digit) => sum + Number(digit), 0));
  const d = reduceArcana(a + b + c);
  return reduceArcana(a + b + c + d);
}

const examples = [
  { day: 15, month: 3, year: 1990, e: 11, state: "Vitality", note: "plan example" },
  { day: 29, month: 5, year: 1990, e: 7, state: "Direction", note: "day ≥ 23 → A = 11" },
  { day: 15, month: 3, year: 1999, e: 11, state: "Vitality", note: "year digit sum > 22" },
  { day: 25, month: 11, year: 2002, e: 8, state: "Balance", note: "D = 22 preserved before E" },
];

let failed = 0;
for (const example of examples) {
  const a = reduceArcana(example.day);
  const b = example.month;
  const c = reduceArcana(String(example.year).split("").reduce((sum, digit) => sum + Number(digit), 0));
  const d = reduceArcana(a + b + c);
  const e = numberFromDob(example.day, example.month, example.year);
  const ok = e === example.e;
  if (!ok) failed += 1;
  console.log(
    `${ok ? "ok" : "FAIL"} ${String(example.day).padStart(2, "0")}/${String(example.month).padStart(2, "0")}/${example.year}`
      + ` → A=${a} B=${b} C=${c} D=${d} E=${e} (expected ${example.e} ${example.state}) — ${example.note}`,
  );
}

if (failed) {
  console.error(`\n${failed} Matrix of Destiny example(s) failed.`);
  process.exit(1);
}

console.log("\nAll Matrix of Destiny examples passed.");
