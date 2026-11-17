"use client";

import BetaLoopVideo from "../BetaLoopVideo";

const RITUAL_SRC = "/assets/bg-05-my-ritual-breathing-star-loop-12s.mp4";
const RITUAL_POSTER = "/assets/bg-05-my-ritual-breathing-star-poster.jpg";

export default function RitualSlide({
  active,
  onRitual,
  onOil,
}: {
  active: boolean;
  onRitual: () => void;
  onOil: () => void;
}) {
  return (
    <article className="beta-ritual" aria-label="My ritual">
      <div className="beta-ritual-video-wrap" aria-hidden="true">
        <BetaLoopVideo
          className="beta-ritual-video"
          src={RITUAL_SRC}
          poster={RITUAL_POSTER}
        />
      </div>

      <div className="beta-ritual-shell">
        <div className="beta-ritual-block">
          <p className="beta-ritual-lead">
            {active
              ? "Pause · Scent · Reflect · Act"
              : "Your invitation ritual begins when your card arrives."}
          </p>
          <button className="beta-text-link" type="button" onClick={onRitual}>
            {active ? "Open my invitation ritual" : "Read the steps"}
          </button>
        </div>

        <div className="beta-ritual-star-gap" aria-hidden="true" />

        <div className="beta-ritual-block">
          <h2 className="beta-ritual-title">
            Your State, on <em className="cu">skin.</em>
          </h2>
          <p className="beta-ritual-body">
            A perfume oil to wear alone or layer with your favourite fragrance.
          </p>
          <button className="beta-text-link" type="button" onClick={onOil}>
            Open my perfume oil ritual
          </button>
        </div>
      </div>
    </article>
  );
}
