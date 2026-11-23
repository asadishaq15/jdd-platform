"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import BrandMark from "../brand/BrandMark";
import GradientDefs from "../layout/GradientDefs";
import ThemeToggle from "../layout/ThemeToggle";
import VisitorAuthPanel from "../auth/VisitorAuthPanel";
import LocationSuggestField from "./LocationSuggestField";
import { persistDiscoveryProfile } from "../../lib/discovery-persist";
import { createClient } from "../../lib/supabase/client";
import { formatDateOfBirth } from "../../lib/zodiac";
import { stateImageSrc } from "../../lib/state-images";
import {
  DEMO_CODE_OPTIONS,
  demoCodes,
  getWorld,
  normalizeAccessCode,
  numberFromDob,
  worlds,
} from "../../lib/worlds";
import { loadSpaceState, saveSpaceState, type SpaceState } from "../../lib/space-state";
import {
  CITIES,
  COUNTRIES,
  foldLocationQuery,
  type CityEntry,
} from "../../lib/world-cities";
import StateArchPanel from "../space/StateArchPanel";
import "./visitor-onboarding.css";

/** Matches HTML layout script: content in `.stage`, fixed action line below. */
function SceneCol({ children, actions }: { children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="col">
      <div className="stage">{children}</div>
      {actions}
    </div>
  );
}

type Scene =
  | "onb1"
  | "dob"
  | "onb2"
  | "result"
  | "states"
  | "prop"
  | "onb3"
  | "login"
  | "code"
  | "stay";

type Guest = { n: number; code: string };

function DoorwayScene() {
  return (
    <div className="scene-box">
      <svg viewBox="0 0 800 560" aria-hidden="true">
        <circle className="sun fade" style={{ "--d": ".2s" } as CSSProperties} cx="470" cy="330" r="190" />
        <path className="ln" pathLength="1" style={{ "--d": ".1s", "--dur": "1.4s" } as CSSProperties} d="M 120 500 L 700 500" />
        <path className="ln" pathLength="1" style={{ "--d": ".6s", "--dur": "2s" } as CSSProperties} d="M 360 500 L 360 250 A 130 130 0 0 1 620 250 L 620 500" />
        <path className="ln" pathLength="1" style={{ "--d": "1.2s" } as CSSProperties} d="M 410 500 L 410 290 A 80 80 0 0 1 570 290 L 570 500" />
        <path className="ln" pathLength="1" style={{ "--d": "1.6s", "--dur": "2.4s" } as CSSProperties} d="M 252.1 500.0 L 252.1 294.0 C 252.1 247.8 248.2 193.9 244.4 170.8 C 240.5 151.6 227.1 149.6 221.3 149.6 C 207.8 149.6 198.2 155.4 196.2 170.8 C 194.3 209.3 189.3 294.0 189.3 363.3 C 189.3 401.8 192.4 421.1 200.1 421.8 C 205.9 422.6 207.8 413.4 207.0 394.1" />
        <path className="ln" pathLength="1" style={{ "--d": "2.1s", "--dur": "2.2s" } as CSSProperties} d="M 207.0 394.1 C 203.9 363.3 188.6 324.8 169.3 297.9 C 153.9 276.7 138.5 265.1 128.9 265.1 C 119.2 265.1 115.4 278.6 117.3 294.0 C 121.2 332.5 146.2 378.7 173.2 413.4 C 192.4 436.5 203.9 451.9 215.5 453.8 C 220.1 454.2 222.4 455.7 222.4 459.6 L 222.4 500.0" />
        <path className="ln" pathLength="1" style={{ "--d": "2.5s", "--dur": "2.2s" } as CSSProperties} d="M 211.7 378.7 C 211.7 347.9 230.9 317.1 254.0 278.6 C 273.2 244.0 304.1 217.0 329.1 214.7 C 346.4 213.2 349.5 228.6 337.9 239.4 C 315.6 259.4 277.1 282.5 254.0 297.9 C 240.5 307.5 236.7 317.1 236.7 332.5 L 236.7 432.6 C 236.7 444.2 230.9 451.9 222.4 455.7" />
        <path className="ln" pathLength="1" style={{ "--d": "3.4s", "--dur": "1.6s" } as CSSProperties} d="M 490 440 C 490 490 520 540 600 540 L 760 540" />
        <circle className="pt" style={{ "--d": "4.6s" } as CSSProperties} cx="760" cy="540" r="7" />
      </svg>
      <div className="threshold" aria-hidden="true" />
    </div>
  );
}

function AlignedScene() {
  return (
    <svg viewBox="0 0 900 400" aria-hidden="true" className="aligned">
      <circle className="sun fade" style={{ "--d": "1.4s" } as CSSProperties} cx="720" cy="200" r="120" />
      <path className="ln" pathLength="1" style={{ "--d": ".2s", "--dur": "3.4s" } as CSSProperties} d="M 60 150 L 380 150 C 560 150 600 200 720 200" />
      <path className="ln guest" pathLength="1" style={{ "--d": ".2s", "--dur": "3.4s" } as CSSProperties} d="M 60 250 L 380 250 C 560 250 600 200 720 200" />
      <circle className="pt" style={{ "--d": "3.5s" } as CSSProperties} cx="720" cy="200" r="3.6" />
    </svg>
  );
}

function ScentScene() {
  return (
    <svg viewBox="0 0 800 560" aria-hidden="true">
      <circle className="sun fade" style={{ "--d": ".2s" } as CSSProperties} cx="400" cy="330" r="170" />
      <path className="ln" pathLength="1" style={{ "--d": ".1s", "--dur": "1.8s" } as CSSProperties} d="M 140 420 C 270 378 530 378 660 420" />
      <path className="ln" pathLength="1" style={{ "--d": ".4s", "--dur": "1.8s", opacity: 0.55 } as CSSProperties} d="M 170 462 C 290 432 510 432 630 462" />
      <circle className="ln" pathLength="1" style={{ "--d": "1.1s", "--dur": ".9s" } as CSSProperties} cx="400" cy="96" r="9" />
      <path className="ln" pathLength="1" style={{ "--d": "1.7s", "--dur": "1.7s" } as CSSProperties} d="M 400 105 L 400 386" />
      <circle className="pt" style={{ "--d": "3.3s" } as CSSProperties} cx="400" cy="392" r="5" />
      <ellipse className="ln" pathLength="1" style={{ "--d": "3.6s", "--dur": "1.1s" } as CSSProperties} cx="400" cy="394" rx="42" ry="10" />
      <ellipse className="ln" pathLength="1" style={{ "--d": "4.3s", "--dur": "1.2s" } as CSSProperties} cx="400" cy="394" rx="88" ry="21" />
      <ellipse className="ln" pathLength="1" style={{ "--d": "5s", "--dur": "1.3s" } as CSSProperties} cx="400" cy="394" rx="136" ry="32" />
      <ellipse className="ripple" cx="400" cy="394" rx="136" ry="32" />
      <text className="alabel fade" style={{ "--d": "3.9s" } as CSSProperties} x="268" y="530" textAnchor="middle">SCENT</text>
      <text className="alabel fade" style={{ "--d": "4.6s" } as CSSProperties} x="400" y="530" textAnchor="middle">INTENTION</text>
      <text className="alabel fade" style={{ "--d": "5.3s" } as CSSProperties} x="540" y="530" textAnchor="middle">REPETITION</text>
    </svg>
  );
}

function formatCodeDisplay(raw: string) {
  const normalized = normalizeAccessCode(raw);
  return normalized.match(/.{1,4}/g)?.join("-") || "";
}

export default function OnboardingFlow() {
  const router = useRouter();
  const [scene, setScene] = useState<Scene>("onb1");
  const [stack, setStack] = useState<Scene[]>([]);
  const [state, setState] = useState<SpaceState>(() => {
    if (typeof window === "undefined") return {};
    return loadSpaceState();
  });
  const [dob, setDob] = useState({ day: "", month: "", year: "" });
  const [country, setCountry] = useState("");
  const [city, setCity] = useState("");
  const [dobError, setDobError] = useState(false);
  const [locError, setLocError] = useState(false);
  const [preview, setPreview] = useState<number | null>(null);
  const [failedImages, setFailedImages] = useState<Record<number, boolean>>({});
  const [guest, setGuest] = useState<Guest | null>(null);
  const [accessCode, setAccessCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [enteringSpace, setEnteringSpace] = useState(false);
  const [enterError, setEnterError] = useState("");
  const cityInputRef = useRef<HTMLInputElement>(null);
  const dobNextRef = useRef<HTMLButtonElement>(null);
  const dobDayRef = useRef<HTMLInputElement>(null);
  const dobMonthRef = useRef<HTMLInputElement>(null);
  const dobYearRef = useRef<HTMLInputElement>(null);

  const recommended = state.recommended || 9;
  const recommendedWorld = useMemo(() => getWorld(recommended), [recommended]);
  const previewWorld = useMemo(() => getWorld(preview || recommended), [preview, recommended]);
  const guestWorld = useMemo(() => (guest ? getWorld(guest.n) : null), [guest]);
  const wide = scene === "states";

  const citySuggestItems = useMemo(() => {
    const key = foldLocationQuery(country);
    if (!key) return CITIES;
    const scoped = CITIES.filter((entry) => foldLocationQuery(entry.k) === key);
    return scoped.length ? scoped : CITIES;
  }, [country]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const param = new URLSearchParams(window.location.search).get("scene");
    if (param === "code") {
      setGuest(null);
      setScene("code");
      setStack([]);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function checkSession() {
      const supabase = createClient();
      const { data: userData } = await supabase.auth.getUser();
      if (cancelled) return;
      if (!userData.user) {
        setSignedIn(false);
        return;
      }
      setSignedIn(true);

      const [{ data: profile }, { data: stays }] = await Promise.all([
        supabase
          .from("profiles")
          .select("discovery_completed_at")
          .eq("id", userData.user.id)
          .maybeSingle(),
        supabase.from("stays").select("id").eq("guest_id", userData.user.id).limit(1),
      ]);
      if (cancelled) return;
      if (profile?.discovery_completed_at || stays?.length) {
        router.replace("/space");
      }
    }

    void checkSession();
    return () => {
      cancelled = true;
    };
  }, [router]);

  function go(next: Scene) {
    if (next === "login" && signedIn) {
      void enterSpace();
      return;
    }
    setStack((items) => [...items, scene]);
    if (next === "code") setGuest(null);
    setScene(next);
  }

  function goBack() {
    setStack((items) => {
      if (!items.length) return items;
      const prev = items[items.length - 1];
      setScene(prev);
      return items.slice(0, -1);
    });
  }

  function persist(next: SpaceState) {
    setState(next);
    saveSpaceState(next);
  }

  function onDobPartChange(part: "day" | "month" | "year", raw: string) {
    const max = part === "year" ? 4 : 2;
    const digits = raw.replace(/\D/g, "").slice(0, max);
    setDob((value) => ({ ...value, [part]: digits }));
    setDobError(false);
    if (part === "day" && digits.length === 2) {
      dobMonthRef.current?.focus();
      dobMonthRef.current?.select();
    } else if (part === "month" && digits.length === 2) {
      dobYearRef.current?.focus();
      dobYearRef.current?.select();
    }
  }

  function submitDob() {
    const day = Number(dob.day);
    const month = Number(dob.month);
    let year = Number(dob.year);
    if (dob.year.length === 2) {
      const now2 = new Date().getFullYear() % 100;
      year = (year <= now2 ? 2000 : 1900) + year;
      setDob((value) => ({ ...value, year: String(year) }));
    }
    const date = new Date(year, month - 1, day);
    const dobOk = year >= 1900
      && dob.year.length >= 2
      && date.getFullYear() === year
      && date.getMonth() === month - 1
      && date.getDate() === day
      && date < new Date();
    const locOk = Boolean(country.trim() && city.trim());
    setDobError(!dobOk);
    setLocError(!locOk);
    if (!dobOk || !locOk) return;

    const nextRecommended = numberFromDob(day, month, year);
    const dateOfBirth = formatDateOfBirth(day, month, year);
    const nextState: SpaceState = {
      ...state,
      recommended: nextRecommended,
      dateOfBirth,
      country: country.trim(),
      city: city.trim(),
      basedIn: `${city.trim()}, ${country.trim()}`,
    };
    if (guest) {
      nextState.visited = guest.n;
      nextState.chosen = guest.n;
      nextState.code = guest.code;
      nextState.entryMode = "code";
    }
    persist(nextState);
    go(guest ? "onb3" : "onb2");
  }

  function chooseWorld(n: number, mode: "recommended" | "chosen") {
    persist({
      ...state,
      chosen: n,
      entryMode: mode,
    });
    go("onb3");
  }

  async function enterSpace() {
    if (enteringSpace) return;
    setEnteringSpace(true);
    setEnterError("");
    const draft: SpaceState = {
      ...state,
      chosen: state.chosen || state.visited || state.recommended,
      entryMode: state.entryMode || (state.chosen ? "chosen" : "recommended"),
    };
    persist(draft);
    const message = await persistDiscoveryProfile(draft);
    if (message) {
      setEnterError(message);
      setEnteringSpace(false);
      return;
    }
    router.replace("/space");
  }

  function enterSpaceOrLogin() {
    if (signedIn) {
      void enterSpace();
      return;
    }
    go("login");
  }

  function submitCode(event?: FormEvent) {
    event?.preventDefault();
    const raw = normalizeAccessCode(accessCode);
    if (!raw) {
      setCodeError("Please enter your access code.");
      return;
    }
    if (raw.length < 12) {
      setCodeError("Please enter the full 12-character code.");
      return;
    }
    const n = demoCodes[raw] || 9;
    const nextGuest = { n, code: raw };
    setGuest(nextGuest);
    setCodeError("");
    persist({
      ...state,
      visited: n,
      chosen: n,
      code: raw,
      entryMode: "code",
    });
    go("onb1");
  }

  function showBack() {
    if (scene === "onb1" && !guest) return stack.length > 0;
    if (scene === "login") return stack.length > 0;
    return scene !== "onb1" || stack.length > 0;
  }

  return (
    <main className={`visitor-app${wide ? " wide" : ""}`}>
      <GradientDefs />
      <header className="top">
        <button
          className={`back${showBack() ? " show" : ""}`}
          type="button"
          onClick={goBack}
        >
          Back
        </button>
        <BrandMark className="mark" />
        <div className="top-r">
          <ThemeToggle />
        </div>
      </header>

      <div className="screens">
        <section className={`scr${scene === "onb1" ? " on" : ""}`} data-name="onb1" aria-label="Onboarding 1 of 3">
          <SceneCol
            actions={(
              <div className="actions fade" style={{ "--d": "3.1s" } as CSSProperties}>
                <button
                  className="tlink bp"
                  type="button"
                  onClick={() => go(guest ? "stay" : "dob")}
                >
                  {guest ? "Continue" : "Find where to begin"}
                </button>
                {!guest && !signedIn ? (
                  <p className="have-acct">
                    <button className="top-signin" type="button" onClick={() => go("login")}>Have an account?</button>
                  </p>
                ) : null}
              </div>
            )}
          >
            <div className="copy">
              <p className="eyebrow fade" style={{ "--d": ".2s" } as CSSProperties}>State-Based Hospitality</p>
              <h1 className="title" data-type="">
                {guest ? (
                  <>Experience your stay by <em className="cu">State</em>, not status.</>
                ) : (
                  <>Choose your stay by <em className="cu">State</em>, not status.</>
                )}
              </h1>
            </div>
            <div className="scene"><DoorwayScene /></div>
            <div className="copy">
              <p className="body lines fade" style={{ "--d": "2.6s" } as CSSProperties}>
                {guest && guestWorld ? (
                  <>
                    <span>Discover the world of <span className="hn">{guestWorld.property}</span> and the</span>
                    <span>community that reflect who you are, through</span>
                    <span>self-knowledge, intention and sensory science.</span>
                  </>
                ) : (
                  <>
                    <span>Discover the luxury hospitality world and the</span>
                    <span>community that reflect who you are, through</span>
                    <span>self-knowledge, intention and sensory science.</span>
                  </>
                )}
              </p>
            </div>
          </SceneCol>
        </section>

        <section className={`scr${scene === "code" ? " on" : ""}`} data-name="code" aria-label="Continue your stay">
          <SceneCol
            actions={(
              <div className="actions fade" style={{ "--d": "1.2s" } as CSSProperties}>
                <button className="tlink bp" type="button" onClick={() => submitCode()}>Continue</button>
              </div>
            )}
          >
            <h1 className="title" data-type="">
              Continue your <em className="cu">stay</em>.
            </h1>
            <p className="lede fade" style={{ "--d": ".9s" } as CSSProperties}>
              Enter the access code you received at your hotel.
            </p>
            <form className="fgroup fade" style={{ "--d": "1.2s" } as CSSProperties} onSubmit={submitCode}>
              <input
                className={`code-input${codeError ? " bad" : ""}`}
                type="text"
                inputMode="text"
                autoCapitalize="characters"
                autoComplete="off"
                spellCheck={false}
                maxLength={14}
                placeholder="XXXX-XXXX-XXXX"
                aria-label="Access code"
                value={accessCode}
                onChange={(event) => {
                  setAccessCode(formatCodeDisplay(event.target.value));
                  setCodeError("");
                }}
              />
              <p className={`err${codeError ? " show" : ""}`} role="alert">{codeError || "Please enter your access code."}</p>
            </form>
            <div className="demo-codes fade" style={{ "--d": "1.5s" } as CSSProperties}>
              <p className="demo-eye">Demo codes</p>
              {DEMO_CODE_OPTIONS.map((option) => (
                <p key={option.code}>
                  <button
                    className="tlink tl dc"
                    type="button"
                    onClick={() => {
                      setAccessCode(option.code);
                      setCodeError("");
                    }}
                  >
                    {option.code}
                  </button>
                  <span>{option.label}</span>
                </p>
              ))}
            </div>
          </SceneCol>
        </section>

        <section className={`scr${scene === "stay" ? " on" : ""}`} data-name="stay" aria-label="Your stay">
          <SceneCol>
            {guestWorld ? (
              <StateArchPanel
                world={guestWorld}
                label="Your stay"
                imageFailed={failedImages[guestWorld.n]}
                onImageError={() => setFailedImages((prev) => ({ ...prev, [guestWorld.n]: true }))}
                actions={(
                  <button className="tlink bp" type="button" onClick={() => go("onb2")}>
                    Continue
                  </button>
                )}
              />
            ) : null}
          </SceneCol>
        </section>

        <section className={`scr${scene === "dob" ? " on" : ""}`} data-name="dob" aria-label="Discover your State">
          <SceneCol
            actions={(
              <div className="actions fade" style={{ "--d": "1.6s" } as CSSProperties}>
                <button ref={dobNextRef} className="tlink bp" type="button" onClick={submitDob}>Continue</button>
              </div>
            )}
          >
            <h1 className="title" data-type="">
              {guest ? (
                <>Complete your <em className="cu">profile</em>.</>
              ) : (
                <>Discover your <em className="cu">State</em>.</>
              )}
            </h1>
            <p className="lede two fade" style={{ "--d": ".9s" } as CSSProperties}>
              {guest ? (
                <>
                  <span>Your date of birth and where you’re from</span>
                  <span>personalise your Space and your rituals.</span>
                </>
              ) : (
                <>
                  <span>Your date of birth and where you’re from</span>
                  <span>offer a starting point for your discovery.</span>
                </>
              )}
            </p>
            <div className="fgroup fade" style={{ "--d": "1.2s" } as CSSProperties}>
              <p className="flabel" id="dobLabel">Date of birth</p>
              <div className={`dob${dobError ? " bad" : ""}`} role="group" aria-labelledby="dobLabel">
                <input
                  ref={dobDayRef}
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="DD"
                  aria-label="Day"
                  autoComplete="bday-day"
                  value={dob.day}
                  onChange={(e) => onDobPartChange("day", e.target.value)}
                />
                <span className="slash">/</span>
                <input
                  ref={dobMonthRef}
                  inputMode="numeric"
                  maxLength={2}
                  placeholder="MM"
                  aria-label="Month"
                  autoComplete="bday-month"
                  value={dob.month}
                  onChange={(e) => onDobPartChange("month", e.target.value)}
                />
                <span className="slash">/</span>
                <input
                  ref={dobYearRef}
                  className="yyyy"
                  inputMode="numeric"
                  maxLength={4}
                  placeholder="YYYY"
                  aria-label="Year"
                  autoComplete="bday-year"
                  value={dob.year}
                  onChange={(e) => onDobPartChange("year", e.target.value)}
                />
              </div>
              <p className={`err${dobError ? " show" : ""}`} role="alert">Please enter a valid date of birth.</p>
            </div>
            <div className="fgroup fade" style={{ "--d": "1.4s" } as CSSProperties}>
              <p className="flabel loc-label" id="locLabel">Where you are from</p>
              <div className={`loc${locError ? " bad" : ""}`} role="group" aria-labelledby="locLabel">
                <LocationSuggestField
                  value={country}
                  onChange={setCountry}
                  items={COUNTRIES}
                  getMain={(item) => item}
                  getAll={(item) => item}
                  renderOption={(item) => <span className="sg-c">{item}</span>}
                  placeholder="COUNTRY"
                  aria-label="Country"
                  onPick={(item) => {
                    const changed = country !== item;
                    setCountry(item);
                    if (changed) setCity("");
                    setLocError(false);
                    cityInputRef.current?.focus({ preventScroll: true });
                  }}
                />
                <LocationSuggestField
                  value={city}
                  onChange={setCity}
                  items={citySuggestItems}
                  getMain={(item: CityEntry) => item.c}
                  getAll={(item: CityEntry) => `${item.c} ${item.k}`}
                  renderOption={(item: CityEntry) => (
                    <>
                      <span className="sg-c">{item.c}</span>
                      <span className="sg-k">{item.k}</span>
                    </>
                  )}
                  placeholder="CITY"
                  aria-label="City"
                  inputRef={cityInputRef}
                  onPick={(item) => {
                    setCity(item.c);
                    setCountry(item.k);
                    setLocError(false);
                    dobNextRef.current?.focus({ preventScroll: true });
                  }}
                />
              </div>
              <p className={`err${locError ? " show" : ""}`} role="alert">Please enter your country and city.</p>
            </div>
          </SceneCol>
        </section>

        <section className={`scr${scene === "onb2" ? " on" : ""}`} data-name="onb2" aria-label="Onboarding 2 of 3">
          <SceneCol
            actions={(
              <div className="actions fade" style={{ "--d": "3.5s" } as CSSProperties}>
                <button
                  className="tlink bp"
                  type="button"
                  onClick={() => go(guest ? "dob" : "result")}
                >
                  {guest ? "Continue" : "Reveal my world"}
                </button>
              </div>
            )}
          >
            <div className="copy">
              <h1 className="title" data-type="">
                Belong to a world aligned with <em className="cu">yours</em>.
              </h1>
            </div>
            <div className="scene"><AlignedScene /></div>
            <div className="copy">
              <p className="body lines fade" style={{ "--d": "2.2s" } as CSSProperties}>
                {guest && guestWorld ? (
                  <>
                    <span><span className="hn">{guestWorld.property}</span> is one of 22 worlds. It expresses</span>
                    <span>its State through its space, experience and scent.</span>
                    <span>Discover it during your stay.</span>
                  </>
                ) : (
                  <>
                    <span>22 States. 22 hospitality worlds. Each one</span>
                    <span>expresses a State through its space, experience</span>
                    <span>and scent. Find the one you want to step into.</span>
                  </>
                )}
              </p>
              <p className="line fade" style={{ "--d": "2.9s" } as CSSProperties}>By Jardin du Désert</p>
              <p className="house fade" style={{ "--d": "3.1s" } as CSSProperties}>Private Intellectual Fragrance House</p>
            </div>
          </SceneCol>
        </section>

        <section className={`scr${scene === "result" ? " on" : ""}`} data-name="result" aria-label="Your recommended world">
          <SceneCol>
            <StateArchPanel
              world={recommendedWorld}
              label="Your recommended world"
              imageFailed={failedImages[recommendedWorld.n]}
              onImageError={() => setFailedImages((prev) => ({ ...prev, [recommendedWorld.n]: true }))}
              actions={(
                <>
                  <button className="tlink bp" type="button" onClick={() => chooseWorld(recommended, "recommended")}>
                    Choose this world
                  </button>
                  <button className="tlink tl cg" type="button" onClick={() => go("states")}>
                    Let me explore all States
                  </button>
                </>
              )}
            />
          </SceneCol>
        </section>

        <section className={`scr${scene === "states" ? " on" : ""}`} data-name="states" aria-label="All States">
          <SceneCol>
            <p className="eyebrow fade" style={{ "--d": ".2s" } as CSSProperties}>22 States · 22 hospitality worlds</p>
            <h1 className="title" data-type="">
              Explore the <em className="cu">States</em>.
            </h1>
            <div className="states-grid fade" style={{ "--d": ".9s" } as CSSProperties}>
              {worlds.map((world) => {
                const image = stateImageSrc(world);
                const rec = world.n === state.recommended;
                const chosen = world.n === state.chosen;
                const stay = guest?.n === world.n || state.visited === world.n;
                const cls = stay ? "stay" : chosen ? "chosen" : rec ? "rec" : "";
                const tag = stay
                  ? "Your stay"
                  : chosen
                    ? "Your chosen world"
                    : rec
                      ? "Your recommended world"
                      : "";
                return (
                  <button
                    key={world.n}
                    type="button"
                    className={`st-cell ${cls}`.trim()}
                    onClick={() => {
                      setPreview(world.n);
                      go("prop");
                    }}
                  >
                    {tag ? (
                      <span className="c-beacon" aria-hidden="true">
                        <span className="cb-tag">{tag}</span>
                        <span className="cb-line" />
                        <span className="cb-dot" />
                      </span>
                    ) : null}
                    <span className={`c-img${failedImages[world.n] ? " noimg" : ""}`}>
                      <img
                        src={image}
                        alt=""
                        loading="lazy"
                        onError={() => setFailedImages((prev) => ({ ...prev, [world.n]: true }))}
                      />
                    </span>
                    <span className="c-txt">
                      <span className="c-h">{world.state}</span>
                      <span className="c-l">{world.property} · {world.country}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </SceneCol>
        </section>

        <section className={`scr${scene === "prop" ? " on" : ""}`} data-name="prop" aria-label="Hospitality world">
          <SceneCol>
            <StateArchPanel
              world={previewWorld}
              imageFailed={failedImages[previewWorld.n]}
              onImageError={() => setFailedImages((prev) => ({ ...prev, [previewWorld.n]: true }))}
              actions={(
                <>
                  <button className="tlink bp" type="button" onClick={() => chooseWorld(previewWorld.n, "chosen")}>
                    Choose this world
                  </button>
                  <button className="tlink tl cg" type="button" onClick={goBack}>
                    Back to all States
                  </button>
                </>
              )}
            />
          </SceneCol>
        </section>

        <section className={`scr${scene === "onb3" ? " on" : ""}`} data-name="onb3" aria-label="Onboarding 3 of 3">
          <SceneCol
            actions={(
              <div className="actions fade" style={{ "--d": "3.2s" } as CSSProperties}>
                <button
                  className="tlink bp"
                  type="button"
                  disabled={enteringSpace}
                  onClick={enterSpaceOrLogin}
                >
                  {enteringSpace ? "Entering…" : "Enter your Space"}
                </button>
                {enterError ? (
                  <p className="err show" role="alert">{enterError}</p>
                ) : null}
              </div>
            )}
          >
            <div className="copy">
              <p className="eyebrow fade" style={{ "--d": ".2s" } as CSSProperties}>The neuroscience of scent</p>
              <h1 className="title" data-type="">
                A scent becomes your <em className="cu">anchor</em>.
              </h1>
            </div>
            <div className="scene"><ScentScene /></div>
            <div className="copy">
              <p className="body lines fade" style={{ "--d": "2.6s" } as CSSProperties}>
                <span>Scent connects place, emotion and memory. Your scented</span>
                <span>card becomes part of a personal ritual, a reminder</span>
                <span>of your intention before, during and after your stay.</span>
              </p>
            </div>
          </SceneCol>
        </section>

        {!signedIn ? (
          <section className={`scr${scene === "login" ? " on" : ""}`} data-name="login" aria-label="Enter your private space">
            <VisitorAuthPanel
              nextPath="/auth/complete"
              onCode={() => go("code")}
              hideCodeRow={Boolean(guest)}
            />
          </section>
        ) : null}
      </div>
    </main>
  );
}
