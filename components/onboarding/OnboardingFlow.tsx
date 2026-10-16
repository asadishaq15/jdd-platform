"use client";

import { useRouter } from "next/navigation";
import { Fragment } from "react";
import { useState } from "react";
import BrandMark from "../brand/BrandMark";
import GradientDefs from "../layout/GradientDefs";
import ThemeToggle from "../layout/ThemeToggle";

const screens = [
  {
    eyebrow: "State-Based Hospitality",
    body: <>Discover the luxury hospitality world aligned with your inner<br />direction through self-knowledge, intention and sensory science.</>,
    cta: "Continue",
  },
  {
    eyebrow: "The neuroscience of scent",
    body: <>Scent connects place, emotion and memory. Your scented card<br />or perfume oil becomes part of a personal ritual — a reminder<br />of your intention, before or after your stay.</>,
    cta: "Continue",
  },
  {
    eyebrow: "",
    body: <>22 States. 22 hospitality worlds.<br />Each hospitality world expresses a State through its<br />spaces, experiences and rituals.<br />Discover the one you want to experience.</>,
    cta: "Enter your Space",
  },
];

export default function OnboardingFlow() {
  const [index, setIndex] = useState(0);
  const router = useRouter();

  function enter() {
    try {
      localStorage.setItem("jdd-onboarded", "1");
    } catch {}
    router.push("/sign-in");
  }

  return (
    <main className="onboarding-app">
      <GradientDefs />
      <header className="top">
        <button className={`back ${index > 0 ? "show" : ""}`} type="button" onClick={() => setIndex((value) => Math.max(0, value - 1))}>
          Back
        </button>
        <BrandMark />
        <div className="top-r">
          <ThemeToggle />
        </div>
      </header>

      <div className="progress" aria-hidden="true">
        {screens.map((_, i) => (
          <i key={i} className={i === index ? "on" : i < index ? "done" : ""} />
        ))}
      </div>

      <div className="screens">
        {screens.map((screen, screenIndex) => (
          <section
            key={screenIndex}
            className={`scr onboarding-screen ${screenIndex === index ? "on" : ""} ${screenIndex < index ? "left" : ""}`}
            aria-label={`Onboarding ${screenIndex + 1} of ${screens.length}`}
          >
            <div className="copy copy-top">
              {screen.eyebrow && <p className="eyebrow fade" style={{ "--d": ".2s" } as React.CSSProperties}>{screen.eyebrow}</p>}
              <h1 className={`title ${screenIndex === 1 ? "t2" : ""}`} data-type="">
                <AnimatedTitle screen={screenIndex} />
              </h1>
            </div>
            <div className="scene">
              <OnboardingScene index={screenIndex} active={screenIndex === index} />
            </div>
            <div className="copy copy-bottom">
              <p className="body fade two-lines" style={{ "--d": screenIndex === 2 ? "2.2s" : "2.6s" } as React.CSSProperties}>{screen.body}</p>
              {screenIndex === 2 && (
                <>
                  <p className="line one-line fade" style={{ "--d": "2.9s" } as React.CSSProperties}>By Jardin du Désert</p>
                  <p className="house fade" style={{ "--d": "3.1s" } as React.CSSProperties}>Private Intellectual Fragrance House</p>
                </>
              )}
            </div>
            <div className="actions fade" style={{ "--d": "3.2s" } as React.CSSProperties}>
              <button className="tlink" type="button" onClick={screenIndex === screens.length - 1 ? enter : () => setIndex((value) => value + 1)}>
                {screen.cta}
              </button>
            </div>
            {screenIndex < 2 && (
              <p className="skip-row fade" style={{ "--d": "3.1s" } as React.CSSProperties}>
                <button className="tlink skip-l" type="button" onClick={enter} aria-label="Skip onboarding">Skip</button>
              </p>
            )}
          </section>
        ))}
      </div>
    </main>
  );
}

function AnimatedTitle({ screen }: { screen: number }) {
  const titles: Array<Array<{ text: string; copper?: boolean; punctuation?: boolean }>> = [
    [{ text: "Choose" }, { text: "your" }, { text: "stay" }, { text: "by" }, { text: "State", copper: true }, { text: "—" }, { text: "not" }, { text: "status." }],
    [{ text: "A" }, { text: "scent" }, { text: "becomes" }, { text: "your" }, { text: "anchor", copper: true }, { text: ".", punctuation: true }],
    [{ text: "Belong" }, { text: "to" }, { text: "a" }, { text: "world" }, { text: "aligned" }, { text: "with" }, { text: "yours", copper: true }, { text: ".", punctuation: true }],
  ];
  const chunks = titles[screen];
  let animatedIndex = 0;

  return chunks.map((token, i) => {
    const delayIndex = token.punctuation ? Math.max(0, animatedIndex - 1) : animatedIndex++;
    const next = chunks[i + 1];
    const needsSpace = Boolean(next && !next.punctuation);
    return (
      <Fragment key={`${token.text}-${i}`}>
        <span className={token.punctuation ? "title-punctuation" : "w"} style={{ "--type-delay": `${350 + delayIndex * 170 + (token.copper ? 200 : 0)}ms` } as React.CSSProperties}>
          {token.copper ? <em className="cu">{token.text}</em> : token.text}
        </span>
        {needsSpace ? " " : null}
      </Fragment>
    );
  });
}

function OnboardingScene({ index, active }: { index: number; active: boolean }) {
  if (index === 1) {
    return (
      <svg viewBox="0 0 800 560" aria-hidden="true">
        <circle className="sun fade" style={{ "--d": ".2s" } as React.CSSProperties} cx="400" cy="330" r="170" />
        <path className="ln" pathLength="1" style={{ "--d": ".1s", "--dur": "1.8s" } as React.CSSProperties} d="M 140 420 C 270 378 530 378 660 420" />
        <path className="ln" pathLength="1" style={{ "--d": ".4s", "--dur": "1.8s", opacity: .55 } as React.CSSProperties} d="M 170 462 C 290 432 510 432 630 462" />
        <circle className="ln" pathLength="1" style={{ "--d": "1.1s", "--dur": ".9s" } as React.CSSProperties} cx="400" cy="96" r="9" />
        <path className="ln" pathLength="1" style={{ "--d": "1.7s", "--dur": "1.7s" } as React.CSSProperties} d="M 400 105 L 400 386" />
        <circle className="pt" style={{ "--d": "3.3s" } as React.CSSProperties} cx="400" cy="392" r="5" />
        <ellipse className="ln" pathLength="1" style={{ "--d": "3.6s", "--dur": "1.1s" } as React.CSSProperties} cx="400" cy="394" rx="42" ry="10" />
        <ellipse className="ln" pathLength="1" style={{ "--d": "4.3s", "--dur": "1.2s" } as React.CSSProperties} cx="400" cy="394" rx="88" ry="21" />
        <ellipse className="ln" pathLength="1" style={{ "--d": "5s", "--dur": "1.3s" } as React.CSSProperties} cx="400" cy="394" rx="136" ry="32" />
        <ellipse className="ripple" cx="400" cy="394" rx="136" ry="32" />
        <text className="alabel fade" style={{ "--d": "3.9s" } as React.CSSProperties} x="268" y="530" textAnchor="middle">SCENT</text>
        <text className="alabel fade" style={{ "--d": "4.6s" } as React.CSSProperties} x="400" y="530" textAnchor="middle">INTENTION</text>
        <text className="alabel fade" style={{ "--d": "5.3s" } as React.CSSProperties} x="540" y="530" textAnchor="middle">REPETITION</text>
      </svg>
    );
  }

  if (index === 2) {
    return (
      <svg viewBox="0 0 900 400" aria-hidden="true" className={`aligned ${active ? "scene-active" : ""}`}>
        <circle className="sun fade" style={{ "--d": "1.4s" } as React.CSSProperties} cx="720" cy="200" r="120" />
        <path className="ln" pathLength="1" style={{ "--d": ".2s", "--dur": "3.4s" } as React.CSSProperties} d="M 60 150 L 380 150 C 560 150 600 200 720 200" />
        <path className="ln guest" pathLength="1" style={{ "--d": ".2s", "--dur": "3.4s" } as React.CSSProperties} d="M 60 250 L 380 250 C 560 250 600 200 720 200" />
        <circle className="pt" style={{ "--d": "3.5s" } as React.CSSProperties} cx="720" cy="200" r="3.6" />
      </svg>
    );
  }

  return (
    <div className="scene-box">
      <svg viewBox="0 0 800 560" aria-hidden="true">
        <circle className="sun fade" style={{ "--d": ".2s" } as React.CSSProperties} cx="470" cy="330" r="190" />
        <path className="ln" pathLength="1" style={{ "--d": ".1s", "--dur": "1.4s" } as React.CSSProperties} d="M 120 500 L 700 500" />
        <path className="ln" pathLength="1" style={{ "--d": ".6s", "--dur": "2s" } as React.CSSProperties} d="M 360 500 L 360 250 A 130 130 0 0 1 620 250 L 620 500" />
        <path className="ln" pathLength="1" style={{ "--d": "1.2s" } as React.CSSProperties} d="M 410 500 L 410 290 A 80 80 0 0 1 570 290 L 570 500" />
        <path className="ln" pathLength="1" style={{ "--d": "1.6s", "--dur": "2.4s" } as React.CSSProperties} d="M 252.1 500.0 L 252.1 294.0 C 252.1 247.8 248.2 193.9 244.4 170.8 C 240.5 151.6 227.1 149.6 221.3 149.6 C 207.8 149.6 198.2 155.4 196.2 170.8 C 194.3 209.3 189.3 294.0 189.3 363.3 C 189.3 401.8 192.4 421.1 200.1 421.8 C 205.9 422.6 207.8 413.4 207.0 394.1" />
        <path className="ln" pathLength="1" style={{ "--d": "2.1s", "--dur": "2.2s" } as React.CSSProperties} d="M 207.0 394.1 C 203.9 363.3 188.6 324.8 169.3 297.9 C 153.9 276.7 138.5 265.1 128.9 265.1 C 119.2 265.1 115.4 278.6 117.3 294.0 C 121.2 332.5 146.2 378.7 173.2 413.4 C 192.4 436.5 203.9 451.9 215.5 453.8 C 220.1 454.2 222.4 455.7 222.4 459.6 L 222.4 500.0" />
        <path className="ln" pathLength="1" style={{ "--d": "2.5s", "--dur": "2.2s" } as React.CSSProperties} d="M 211.7 378.7 C 211.7 347.9 230.9 317.1 254.0 278.6 C 273.2 244.0 304.1 217.0 329.1 214.7 C 346.4 213.2 349.5 228.6 337.9 239.4 C 315.6 259.4 277.1 282.5 254.0 297.9 C 240.5 307.5 236.7 317.1 236.7 332.5 L 236.7 432.6 C 236.7 444.2 230.9 451.9 222.4 455.7" />
        <path className="ln" pathLength="1" style={{ "--d": "3.4s", "--dur": "1.6s" } as React.CSSProperties} d="M 490 440 C 490 490 520 540 600 540 L 760 540" />
        <circle className="pt" style={{ "--d": "4.6s" } as React.CSSProperties} cx="760" cy="540" r="7" />
      </svg>
      <span className="threshold" />
    </div>
  );
}
