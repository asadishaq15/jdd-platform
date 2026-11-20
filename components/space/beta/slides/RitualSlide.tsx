"use client";

import BetaLoopVideo from "../BetaLoopVideo";

const RITUAL_SRC = "/assets/bg-05-my-ritual-breathing-star-loop-12s.mp4";
const RITUAL_LIGHT_SRC = "/assets/bg-05-my-ritual-breathing-star-loop-12s_light.mp4";
const RITUAL_POSTER = "/assets/bg-05-my-ritual-breathing-star-poster.jpg";

export default function RitualSlide({
  active,
  guest,
  onRitual,
  onOil,
}: {
  active: boolean;
  guest: boolean;
  onRitual: () => void;
  onOil: () => void;
}) {
  return (
    <article className="beta-ritual" aria-label="My ritual">
      <div className="beta-ritual-video-wrap" aria-hidden="true">
        <BetaLoopVideo
          className="beta-ritual-video"
          src={RITUAL_SRC}
          lightSrc={RITUAL_LIGHT_SRC}
          poster={RITUAL_POSTER}
        />
      </div>

      <div className="beta-ritual-shell">
        <div className="beta-ritual-block">
          {active ? (
            <>
              <p className="beta-ritual-lead">Pause · Scent · Reflect · Act</p>
              <p className="beta-ritual-status">Active</p>
            </>
          ) : (
            <p className="beta-ritual-lead beta-ritual-lead-preview">
              {guest ? (
                <>
                  Your ritual begins when
                  <br />
                  you arrive in your room.
                </>
              ) : (
                <>
                  Your invitation ritual begins
                  <br />
                  when your card arrives.
                </>
              )}
            </p>
          )}
          <button className="beta-text-link" type="button" onClick={onRitual}>
            {active ? "Open my invitation ritual" : "Read the steps"}
          </button>
        </div>

        <div className="beta-ritual-star-gap" aria-hidden="true" />

        <div className="beta-ritual-block">
          <h2 className="beta-ritual-title">
            Your State, on <em>skin.</em>
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
