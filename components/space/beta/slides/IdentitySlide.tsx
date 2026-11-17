"use client";

import type { AccountSummary } from "../../../../lib/space-data";
import {
  SPACE_ICON_CALENDAR,
  SPACE_ICON_PIN,
  zodiacIconSrc,
} from "../../../../lib/space-icons";
import type { HospitalityWorld } from "../../../../lib/worlds";
import { zodiacFromDateOfBirth } from "../../../../lib/zodiac";
import BetaLoopVideo from "../BetaLoopVideo";

const DUNES_SRC = "/assets/bg-01-my-space-dunes-loop-14s.mp4";
const DUNES_POSTER = "/assets/bg-01-my-space-dunes-poster.jpg";

function formatBirthDate(iso: string | null | undefined) {
  if (!iso) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso.trim());
  if (!match) return null;
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (Number.isNaN(date.getTime())) return null;
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

export default function IdentitySlide({
  account,
  world,
}: {
  account: AccountSummary;
  world: HospitalityWorld;
}) {
  const initial = account.fullName.trim().charAt(0).toUpperCase() || "G";
  const birthDate = formatBirthDate(account.dateOfBirth);
  const zodiac = zodiacFromDateOfBirth(account.dateOfBirth);
  const basedIn = account.basedIn?.trim() || null;

  return (
    <article className="beta-identity" aria-label="My Space identity">
      <div className="beta-identity-dunes" aria-hidden="true">
        <BetaLoopVideo
          className="beta-identity-dunes-video"
          src={DUNES_SRC}
          poster={DUNES_POSTER}
        />
      </div>

      <div className="beta-identity-shell">
        <div className="beta-identity-hero">
          <div className="beta-identity-photo-wrap">
            {account.avatarUrl ? (
              <img
                className="beta-identity-photo"
                src={account.avatarUrl}
                alt=""
                referrerPolicy="no-referrer"
              />
            ) : (
              <span className="beta-identity-photo fallback" aria-hidden="true">{initial}</span>
            )}
          </div>
          <div className="beta-identity-person">
            <h1 className="beta-identity-name">{account.fullName}</h1>
          </div>
        </div>

        <div className="beta-identity-state">
          <p className="beta-label">Your State</p>
          <p className="beta-state-name">{world.state}</p>
          <p className="beta-label">Your mantra</p>
          <p className="beta-mantra">{world.mantra}</p>
        </div>

        <dl className="beta-identity-meta">
          <div>
            <img className="beta-meta-icon" src={SPACE_ICON_CALENDAR} alt="" aria-hidden="true" />
            <dt>Birth date</dt>
            <dd>{birthDate || "—"}</dd>
          </div>
          <div>
            {zodiac ? (
              <img className="beta-meta-icon" src={zodiacIconSrc(zodiac)} alt="" aria-hidden="true" />
            ) : null}
            <dt>Zodiac</dt>
            <dd>{zodiac || "—"}</dd>
          </div>
          <div>
            <img className="beta-meta-icon" src={SPACE_ICON_PIN} alt="" aria-hidden="true" />
            <dt>Based in</dt>
            <dd>{basedIn || "—"}</dd>
          </div>
        </dl>
      </div>
    </article>
  );
}
