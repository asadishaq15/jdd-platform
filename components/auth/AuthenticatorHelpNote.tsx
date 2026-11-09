"use client";

import { useId, useState } from "react";

type AuthenticatorHelpVariant = "enroll" | "verify";

const COPY: Record<AuthenticatorHelpVariant, { title: string; steps: string[] }> = {
  enroll: {
    title: "How to set this up on your phone",
    steps: [
      "Install a free authenticator app (Google Authenticator, Microsoft Authenticator, or Authy).",
      "Open the app, tap Add or +, then choose Scan a QR code.",
      "Point your camera at the QR code below, then type the 6-digit code the app shows.",
    ],
  },
  verify: {
    title: "Where to find your code",
    steps: [
      "Open the same authenticator app you used when setting up this account.",
      "Find Jardin du Désert and type the current 6-digit code here.",
      "Codes refresh about every 30 seconds — if one fails, wait for the next.",
    ],
  },
};

export default function AuthenticatorHelpNote({
  variant,
  className = "authenticator-help",
}: {
  variant: AuthenticatorHelpVariant;
  className?: string;
}) {
  const copy = COPY[variant];
  const panelId = useId();
  const [open, setOpen] = useState(false);

  return (
    <div className="authenticator-help-wrap">
      <button
        type="button"
        className="authenticator-help-trigger"
        aria-label={copy.title}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((current) => !current)}
      >
        ?
      </button>
      {open && (
        <aside id={panelId} className={className} aria-label={copy.title}>
          <p className="authenticator-help-title">{copy.title}</p>
          <ol>
            {copy.steps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
        </aside>
      )}
    </div>
  );
}
