"use client";

import { FormEvent, useState } from "react";
import { EyeIcon, EyeOffIcon } from "../icons/AccountIcons";
import { friendlyAuthError } from "../../lib/auth-errors";
import { createClient } from "../../lib/supabase/client";

export default function ResetPasswordForm() {
  const [passwordStep, setPasswordStep] = useState<"new" | "confirm">("new");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [saving, setSaving] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState("");

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (transitioning) return;
    setError("");

    if (passwordStep === "new") {
      if (password.length < 8) {
        setError("Password must contain at least 8 characters.");
        return;
      }

      setTransitioning(true);
      const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220;
      window.setTimeout(() => {
        setPasswordStep("confirm");
        setTransitioning(false);
      }, delay);
      return;
    }

    if (password !== confirmation) {
      setError("The passwords do not match.");
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });

    if (updateError) {
      setSaving(false);
      setError(friendlyAuthError(updateError, "We could not update your password. Please request a new recovery link and try again."));
      return;
    }

    await supabase.auth.signOut({ scope: "global" });
    window.location.assign("/sign-in?reset=success");
  }

  return (
    <section className="auth-view" aria-label="Choose a new password">
      <p className="eyebrow">Account recovery</p>
      <h1 className="title">Choose a new <em className="cu">password</em>.</h1>
      <p className="body recovery-copy">Use at least eight characters. You’ll sign in again after saving it.</p>
      <form className="email-auth-form reset-password-form" onSubmit={updatePassword}>
        <div className={`credential-question reset-password-question ${transitioning ? "leaving" : ""}`} key={passwordStep}>
          {passwordStep === "new"
            ? <RecoveryPasswordField id="new-password" label="New password" value={password} visible={showPassword} onChange={setPassword} onToggle={() => setShowPassword((value) => !value)} autoFocus />
            : <RecoveryPasswordField id="confirm-password" label="Confirm new password" value={confirmation} visible={showConfirmation} onChange={setConfirmation} onToggle={() => setShowConfirmation((value) => !value)} autoFocus />}
        </div>
        <button className="btn primary" type="submit" disabled={saving || transitioning}>{saving ? "Updating…" : passwordStep === "new" ? "Next" : "Update password"}</button>
      </form>
      <p className={`err ${error ? "show" : ""}`} role="alert">{error}</p>
    </section>
  );
}

function RecoveryPasswordField({ id, label, value, visible, onChange, onToggle, autoFocus = false }: {
  id: string;
  label: string;
  value: string;
  visible: boolean;
  onChange: (value: string) => void;
  onToggle: () => void;
  autoFocus?: boolean;
}) {
  return (
    <div className="field recovery-password-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} type={visible ? "text" : "password"} autoComplete="new-password" value={value} onChange={(event) => onChange(event.target.value)} minLength={8} required autoFocus={autoFocus} />
      <button type="button" onClick={onToggle} aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible}>
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
