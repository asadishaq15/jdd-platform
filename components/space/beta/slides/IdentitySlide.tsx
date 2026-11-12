"use client";

import type { AccountSummary } from "../../../../lib/space-data";
import type { HospitalityWorld } from "../../../../lib/worlds";
import { zodiacFromDateOfBirth } from "../../../../lib/zodiac";

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
          <span className="beta-member-pill">Member</span>
        </div>
      </div>

      <div className="beta-identity-state">
        <svg className="beta-wave" viewBox="0 0 640 120" aria-hidden="true" preserveAspectRatio="none">
          <path d="M0 70 C80 20 140 110 220 60 C300 10 360 100 440 55 C520 15 580 90 640 45" />
          <path d="M0 85 C90 40 150 115 240 75 C330 35 390 110 470 70 C540 40 590 95 640 65" opacity=".45" />
        </svg>
        <p className="beta-label">Your State</p>
        <p className="beta-state-name cu">{world.state}</p>
        <p className="beta-label">Your mantra</p>
        <p className="beta-mantra">{world.mantra}</p>
      </div>

      <dl className="beta-identity-meta">
        <div>
          <dt>Birth date</dt>
          <dd>{birthDate || "—"}</dd>
        </div>
        <div>
          <dt>Zodiac</dt>
          <dd>{zodiac || "—"}</dd>
        </div>
        <div>
          <dt>Based in</dt>
          <dd>{basedIn || "—"}</dd>
        </div>
      </dl>
    </article>
  );
}
