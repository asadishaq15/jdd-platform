"use client";

import { FormEvent, InputHTMLAttributes, Ref, useState } from "react";
import { EyeIcon, EyeOffIcon } from "../icons/AccountIcons";
import { friendlyAuthError } from "../../lib/auth-errors";
import { PasswordResetReturnTo } from "../../lib/password-reset";
import { usePasswordVisibility } from "../../lib/password-visibility";
import { createClient } from "../../lib/supabase/client";
import AuthenticatorHelpNote from "./AuthenticatorHelpNote";

type ResetPasswordFormProps = {
  returnTo?: PasswordResetReturnTo;
};

type PasswordStep = "new" | "confirm" | "mfa";

export default function ResetPasswordForm({ returnTo = "/sign-in" }: ResetPasswordFormProps) {
  const [passwordStep, setPasswordStep] = useState<PasswordStep>("new");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const passwordField = usePasswordVisibility(password, setPassword);
  const confirmationField = usePasswordVisibility(confirmation, setConfirmation);
  const [mfaCode, setMfaCode] = useState("");
  const [factorId, setFactorId] = useState("");
  const [saving, setSaving] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [error, setError] = useState("");

  async function updatePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (transitioning || saving) return;
    setError("");

    if (passwordStep === "new") {
      const nextPassword = passwordField.readValue();
      setPassword(nextPassword);
      if (nextPassword.length < 8) {
        setError("Password must contain at least 8 characters.");
        return;
      }

      setTransitioning(true);
      const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220;
      window.setTimeout(() => {
        setPasswordStep("confirm");
        confirmationField.resetVisible();
        setTransitioning(false);
      }, delay);
      return;
    }

    if (passwordStep === "confirm") {
      const nextPassword = passwordField.readValue() || password;
      const nextConfirmation = confirmationField.readValue();
      setConfirmation(nextConfirmation);
      if (nextPassword !== nextConfirmation) {
        setError("The passwords do not match.");
        return;
      }

      setSaving(true);
      const supabase = createClient();
      const needsMfa = await sessionNeedsMfaStepUp(supabase);
      if (needsMfa.error) {
        setSaving(false);
        setError(needsMfa.error);
        return;
      }

      if (needsMfa.factorId) {
        setFactorId(needsMfa.factorId);
        setSaving(false);
        setTransitioning(true);
        const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220;
        window.setTimeout(() => {
          setPasswordStep("mfa");
          setTransitioning(false);
        }, delay);
        return;
      }

      await commitPassword(supabase, nextPassword);
      return;
    }

    setSaving(true);
    const supabase = createClient();
    const elevated = await elevateSessionWithMfa(supabase, factorId, mfaCode);
    if (elevated.error) {
      setSaving(false);
      setError(elevated.error);
      return;
    }

    await commitPassword(supabase, passwordField.readValue() || password);
  }

  async function commitPassword(supabase: ReturnType<typeof createClient>, nextPassword: string) {
    const { error: updateError } = await supabase.auth.updateUser({ password: nextPassword });

    if (updateError) {
      setSaving(false);
      setError(friendlyAuthError(updateError, "We could not update your password. Please request a new recovery link and try again."));
      return;
    }

    await supabase.auth.signOut({ scope: "global" });
    window.location.assign(`${returnTo}?reset=success`);
  }

  const stepCopy = passwordStep === "mfa"
    ? {
      title: <>Confirm with your <em className="cu">authenticator</em>.</>,
      body: "This account is protected with a phone app. Enter the current 6-digit code to finish resetting your password.",
      submit: saving ? "Updating…" : "Verify and update password",
    }
    : {
      title: <>Choose a new <em className="cu">password</em>.</>,
      body: "Use at least eight characters. You’ll sign in again after saving it.",
      submit: saving ? "Updating…" : passwordStep === "new" ? "Next" : "Update password",
    };

  return (
    <section className="auth-view" aria-label="Choose a new password">
      <p className="eyebrow">Account recovery</p>
      <h1 className="title">{stepCopy.title}</h1>
      <p className="body recovery-copy">{stepCopy.body}</p>
      {passwordStep === "mfa" && <AuthenticatorHelpNote variant="verify" />}
      <form className="email-auth-form reset-password-form" onSubmit={updatePassword}>
        <div className={`credential-question reset-password-question ${transitioning ? "leaving" : ""}`} key={passwordStep}>
          {passwordStep === "new" && (
            <RecoveryPasswordField
              id="new-password"
              label="New password"
              visible={passwordField.visible}
              onToggle={passwordField.toggleVisible}
              inputProps={{ ...passwordField.inputProps, autoComplete: "new-password", minLength: 8, required: true, autoFocus: true }}
            />
          )}
          {passwordStep === "confirm" && (
            <RecoveryPasswordField
              id="confirm-password"
              label="Confirm new password"
              visible={confirmationField.visible}
              onToggle={confirmationField.toggleVisible}
              inputProps={{ ...confirmationField.inputProps, autoComplete: "new-password", minLength: 8, required: true, autoFocus: true }}
            />
          )}
          {passwordStep === "mfa" && (
            <div className="field">
              <label htmlFor="recovery-mfa-code">6-digit code from your phone</label>
              <input
                id="recovery-mfa-code"
                inputMode="numeric"
                autoComplete="one-time-code"
                pattern="[0-9]{6}"
                maxLength={6}
                value={mfaCode}
                onChange={(event) => setMfaCode(event.target.value.replace(/\D/g, ""))}
                placeholder="000000"
                required
                autoFocus
              />
            </div>
          )}
        </div>
        <button className="btn primary" type="submit" disabled={saving || transitioning}>{stepCopy.submit}</button>
      </form>
      <p className={`err ${error ? "show" : ""}`} role="alert">{error}</p>
    </section>
  );
}

async function sessionNeedsMfaStepUp(supabase: ReturnType<typeof createClient>) {
  const [{ data: assurance, error: assuranceError }, { data: factors, error: factorsError }] = await Promise.all([
    supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
    supabase.auth.mfa.listFactors(),
  ]);

  if (assuranceError || factorsError) {
    return { factorId: "", error: assuranceError?.message || factorsError?.message || "Unable to check two-step verification." };
  }

  if (assurance.currentLevel === "aal2" || assurance.nextLevel !== "aal2") {
    return { factorId: "", error: "" };
  }

  const verified = factors.totp.find((factor) => factor.status === "verified");
  if (!verified) {
    return { factorId: "", error: "Two-step verification is required, but no authenticator is enrolled on this account." };
  }

  return { factorId: verified.id, error: "" };
}

async function elevateSessionWithMfa(supabase: ReturnType<typeof createClient>, factorId: string, code: string) {
  if (code.trim().length !== 6) {
    return { error: "Enter the six-digit code from your authenticator." };
  }

  const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
  if (challengeError) {
    return { error: friendlyAuthError(challengeError, "We could not start authenticator verification. Please try again.") };
  }

  const { error: verifyError } = await supabase.auth.mfa.verify({
    factorId,
    challengeId: challenge.id,
    code: code.trim(),
  });

  if (verifyError) {
    return { error: "That authenticator code was not accepted. Wait for a new code and try again." };
  }

  return { error: "" };
}

function RecoveryPasswordField({ id, label, visible, onToggle, inputProps }: {
  id: string;
  label: string;
  visible: boolean;
  onToggle: () => void;
  inputProps: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> };
}) {
  return (
    <div className="field recovery-password-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...inputProps} />
      <button type="button" onClick={onToggle} aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible}>
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}
