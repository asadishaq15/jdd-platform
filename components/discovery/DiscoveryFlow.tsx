"use client";

import { useRouter } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";
import BrandMark from "../brand/BrandMark";
import GradientDefs from "../layout/GradientDefs";
import ThemeToggle from "../layout/ThemeToggle";
import { demoCodes, getWorld, normalizeAccessCode, numberFromDob, worlds } from "../../lib/worlds";
import { saveSpaceState, SpaceState } from "../../lib/space-state";

type Step = "dob" | "result" | "states" | "property" | "intent" | "becoming" | "codewarn" | "code" | "stay";

export default function DiscoveryFlow() {
  const [step, setStep] = useState<Step>("dob");
  const [stack, setStack] = useState<Step[]>([]);
  const [state, setState] = useState<SpaceState>({});
  const [preview, setPreview] = useState<number | null>(null);
  const [dob, setDob] = useState({ day: "", month: "", year: "" });
  const [intention, setIntention] = useState("");
  const [becoming, setBecoming] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const activeWorld = useMemo(() => getWorld(state.visited || state.chosen || state.recommended || preview || 9), [preview, state]);
  const recommendedWorld = getWorld(state.recommended || 9);

  function go(next: Step) {
    setStack((items) => [...items, step]);
    setError("");
    setStep(next);
  }

  function back() {
    const previous = stack.at(-1);
    if (!previous) return router.push("/sign-in");
    setStack((items) => items.slice(0, -1));
    setError("");
    setStep(previous);
  }

  function submitDob(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const day = Number(dob.day);
    const month = Number(dob.month);
    const year = Number(dob.year);
    const date = new Date(year, month - 1, day);
    const ok = year > 1900 && date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day && date < new Date();
    if (!ok) {
      setError("Please enter a valid date of birth.");
      return;
    }
    const recommended = numberFromDob(day, month, year);
    setState((value) => ({ ...value, recommended }));
    setError("");
    go("result");
  }

  function chooseWorld(n: number, mode: "recommended" | "chosen" = "chosen") {
    setState((value) => ({ ...value, chosen: n, entryMode: mode }));
    setPreview(n);
    go("intent");
  }

  function submitIntention(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!intention.trim()) {
      setError("Please write your intention, or skip for now.");
      return;
    }
    setState((value) => ({ ...value, intention: intention.trim() }));
    setError("");
    go("becoming");
  }

  function finish(nextBecoming = becoming) {
    const next = { ...state, intention: intention.trim(), becoming: nextBecoming.trim() };
    saveSpaceState(next);
    router.push("/space");
  }

  function submitBecoming(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!becoming.trim()) {
      setError("Please write your answer, or skip for now.");
      return;
    }
    finish(becoming);
  }

  function submitCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const raw = normalizeAccessCode(code);
    if (!raw) {
      setError("Please enter your access code.");
      return;
    }
    if (raw.length < 12) {
      setError("Please enter the full 12-character code.");
      return;
    }
    const visited = demoCodes[raw] || 9;
    setState({ visited, code: raw, entryMode: "code" });
    setPreview(visited);
    setError("");
    go("stay");
  }

  function continueStay() {
    setIntention("");
    setBecoming("");
    go("intent");
  }

  return (
    <main className="discover-shell">
      <GradientDefs />
      <header className="top">
        <button className="back show" type="button" onClick={back}>Back</button>
        <BrandMark />
        <ThemeToggle />
      </header>
      <div className="discover-stage">
        <div className={`discover-panel ${step === "states" || step === "property" ? "wide" : ""}`}>
          {step === "dob" && (
            <section className="view-card">
              <h1 className="title">Discover your <em className="cu">State</em>.</h1>
              <p className="body dob-intro one-line-fit">Your date of birth offers a starting point for your discovery.</p>
              <form onSubmit={submitDob} noValidate>
                <p className="flabel">Date of birth</p>
                <div className="dob">
                  <input inputMode="numeric" maxLength={2} placeholder="DD" aria-label="Day" value={dob.day} onChange={(e) => setDob((v) => ({ ...v, day: e.target.value.replace(/\D/g, "") }))} />
                  <span className="slash">/</span>
                  <input inputMode="numeric" maxLength={2} placeholder="MM" aria-label="Month" value={dob.month} onChange={(e) => setDob((v) => ({ ...v, month: e.target.value.replace(/\D/g, "") }))} />
                  <span className="slash">/</span>
                  <input className="yyyy" inputMode="numeric" maxLength={4} placeholder="YYYY" aria-label="Year" value={dob.year} onChange={(e) => setDob((v) => ({ ...v, year: e.target.value.replace(/\D/g, "") }))} />
                </div>
                <p className={`err ${error ? "show" : ""}`}>{error}</p>
                <button className="btn primary" type="submit">Continue</button>
              </form>
              <p className="links small"><button className="tlink" type="button" onClick={() => go("codewarn")}>I have an access code</button></p>
            </section>
          )}

          {step === "result" && (
            <section className="view-card">
              <p className="eyebrow">Your recommended world</p>
              <h1 className="title result-state"><em className="cu">{recommendedWorld.state}</em></h1>
              <PropertyImage n={recommendedWorld.n} />
              <p className="prop-name">{recommendedWorld.property}</p>
              <p className="country">{recommendedWorld.country}</p>
              <div className="stay-actions"><button className="tlink" type="button" onClick={() => chooseWorld(recommendedWorld.n, "recommended")}>Choose this world</button></div>
              <p className="links small"><button className="tlink" type="button" onClick={() => go("states")}>Explore other States</button></p>
            </section>
          )}

          {step === "states" && (
            <section className="view-card">
              <p className="eyebrow">22 States · 22 hospitality worlds</p>
              <h1 className="title">Explore the <em className="cu">States</em>.</h1>
              <div className="states-grid">
                {worlds.map((world) => (
                  <button className="state-cell" type="button" key={world.n} onClick={() => { setPreview(world.n); go("property"); }}>
                    <span className="c-num">{String(world.n).padStart(2, "0")}</span>
                    <span className="c-h">{world.state}</span>
                    <span className="c-p">{world.property}</span>
                  </button>
                ))}
              </div>
            </section>
          )}

          {step === "property" && (
            <section className="view-card property-view">
              <p className="eyebrow">{activeWorld.state}</p>
              <h1 className="title">{activeWorld.property}</h1>
              <PropertyImage n={activeWorld.n} />
              <p className="country">{activeWorld.country}</p>
              <p className="body result-desc">{activeWorld.desc}</p>
              <div className="stay-actions"><button className="tlink" type="button" onClick={() => chooseWorld(activeWorld.n)}>Choose this world</button></div>
            </section>
          )}

          {step === "intent" && (
            <section className="view-card">
              <p className="eyebrow">{state.visited ? `${activeWorld.state} · ${activeWorld.property}` : activeWorld.state}</p>
              <h1 className="title">Your <em className="cu">intention</em>.</h1>
              <p className="body dob-intro">{state.visited ? "What intention did you write on your card?" : "What would you like this experience to help you bring into your life?"}</p>
              <form onSubmit={submitIntention} noValidate>
                <div className="field textarea-field">
                  <textarea className="free" rows={2} maxLength={220} aria-label="Your intention" placeholder="In your own words" value={intention} onChange={(event) => { setIntention(event.target.value); setError(""); }} />
                </div>
                <p className={`err ${error ? "show" : ""}`}>{error}</p>
                <button className="btn primary" type="submit">Continue</button>
              </form>
              <p className="links small"><button className="tlink" type="button" onClick={() => finish("")}>Skip for now</button></p>
            </section>
          )}

          {step === "becoming" && (
            <section className="view-card">
              {intention && <p className="saved-intent">{intention}</p>}
              <h1 className="title small-t"><span className="bl">Who do you need to <em className="cu">become</em></span> <span className="bl">to welcome this into your life</span> <span className="bl">and sustain it?</span></h1>
              <p className="body dob-intro">Think of the qualities and habits you want to develop.</p>
              <form onSubmit={submitBecoming} noValidate>
                <div className="field textarea-field">
                  <textarea className="free" rows={2} maxLength={260} aria-label="Who you need to become" placeholder="In your own words" value={becoming} onChange={(event) => { setBecoming(event.target.value); setError(""); }} />
                </div>
                <p className={`err ${error ? "show" : ""}`}>{error}</p>
                <button className="btn primary" type="submit">Save and continue</button>
              </form>
              <p className="links small"><button className="tlink" type="button" onClick={() => finish("")}>Skip for now</button></p>
            </section>
          )}

          {step === "codewarn" && (
            <section className="view-card">
              <p className="eyebrow">Before you add a new stay</p>
              <h1 className="title">One State at a <em className="cu">time</em>.</h1>
              <p className="body dob-intro">Every code opens its own world — its own scent, its own circle, its own intention.</p>
              <span className="stay-rule" aria-hidden="true" />
              <p className="brand-note">A new code starts a new commitment. Your current intention, who you are becoming and your action will be cleared. My Space will show only the new property and its circle.</p>
              <p className="line-s close-line">Stay with one world. Let it change you.</p>
              <div className="stay-actions"><button className="tlink" type="button" onClick={() => go("code")}>Continue with a new code</button></div>
            </section>
          )}

          {step === "code" && (
            <section className="view-card">
              <h1 className="title">Continue your <em className="cu">stay</em>.</h1>
              <p className="body code-intro">Enter the access code you received at your hotel.</p>
              <form className="code-form" onSubmit={submitCode} noValidate>
                <div className="field"><input className="code-input" type="text" value={code} placeholder="XXXX-XXXX-XXXX" aria-label="Access code" onChange={(event) => { const raw = normalizeAccessCode(event.target.value); setCode(raw.match(/.{1,4}/g)?.join("-") || ""); setError(""); }} /></div>
                <p className={`err ${error ? "show" : ""}`}>{error}</p>
                <button className="btn primary" type="submit">Continue</button>
              </form>
              <div className="demo-codes">
                <p className="demo-code">Demo codes</p>
                <button className="tlink" type="button" onClick={() => setCode("SRNK-KYOT-2026")}>SRNK-KYOT-2026</button>
                <button className="tlink" type="button" onClick={() => setCode("LIOR-AEST-2026")}>LIOR-AEST-2026</button>
                <button className="tlink" type="button" onClick={() => setCode("SIER-RARE-2026")}>SIER-RARE-2026</button>
              </div>
            </section>
          )}

          {step === "stay" && (
            <section className="view-card">
              <p className="eyebrow">Your stay</p>
              <PropertyImage n={activeWorld.n} />
              <h1 className="title stay-name">{activeWorld.property}</h1>
              <p className="country">{activeWorld.country}</p>
              <span className="stay-rule" aria-hidden="true" />
              <p className="stay-state"><em className="cu">{activeWorld.state}</em></p>
              <p className="body result-desc">{activeWorld.desc}</p>
              <p className="line-s stay-line">Continue the feeling of your stay.</p>
              <div className="stay-actions"><button className="tlink" type="button" onClick={continueStay}>Continue</button></div>
            </section>
          )}
        </div>
      </div>
    </main>
  );
}

function PropertyImage({ n }: { n: number }) {
  const world = getWorld(n);
  return (
    <div className="pimg-wrap">
      <div className="pimg" style={{ "--h": (n * 37) % 360 } as React.CSSProperties} role="img" aria-label={`${world.property} image placeholder`}>
        <svg viewBox="0 0 400 240" aria-hidden="true">
          <path d="M40 200 L360 200" />
          <path d="M150 200 L150 120 A50 50 0 0 1 250 120 L250 200" />
          <path d="M175 200 L175 132 A25 25 0 0 1 225 132 L225 200" opacity=".6" />
          <circle cx="300" cy="70" r="14" opacity=".7" />
        </svg>
        <span className="pimg-cap">{world.property} · {world.country}</span>
      </div>
    </div>
  );
}
