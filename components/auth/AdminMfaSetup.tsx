"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type Mode = "password" | "checking" | "enroll" | "challenge" | "ready";

export default function AdminMfaSetup({ requirePassword = false }: { requirePassword?: boolean }) {
  const [mode, setMode] = useState<Mode>(requirePassword ? "password" : "checking");
  const [passwordStep, setPasswordStep] = useState<"new" | "confirm">("new");
  const [passwordTransitioning, setPasswordTransitioning] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [factorId, setFactorId] = useState("");
  const [qrCode, setQrCode] = useState("");
  const [secret, setSecret] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (!requirePassword && !started.current) {
      started.current = true;
      void beginMfa();
    }
  }, [requirePassword]);

  async function beginMfa() {
    setMode("checking");
    setError("");
    const supabase = createClient();
    const [{ data: assurance, error: assuranceError }, { data: factors, error: factorsError }] = await Promise.all([
      supabase.auth.mfa.getAuthenticatorAssuranceLevel(),
      supabase.auth.mfa.listFactors(),
    ]);
    if (assuranceError || factorsError) {
      setError(assuranceError?.message || factorsError?.message || "Unable to check two-step verification.");
      return;
    }
    if (assurance.currentLevel === "aal2") {
      setMode("ready");
      return;
    }

    const verified = factors.totp.find((factor) => factor.status === "verified");
    if (verified) {
      setFactorId(verified.id);
      setMode("challenge");
      return;
    }

    for (const factor of factors.all.filter((item) => item.factor_type === "totp" && item.status !== "verified")) {
      await supabase.auth.mfa.unenroll({ factorId: factor.id });
    }
    const { data: enrollment, error: enrollmentError } = await supabase.auth.mfa.enroll({
      factorType: "totp",
      friendlyName: "Jardin du Désert administration",
    });
    if (enrollmentError) {
      setError(enrollmentError.message);
      return;
    }
    setFactorId(enrollment.id);
    setQrCode(enrollment.totp.qr_code);
    setSecret(enrollment.totp.secret);
    setMode("enroll");
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (passwordTransitioning) return;
    setError("");

    if (passwordStep === "new") {
      if (password.length < 12) {
        setError("Use at least 12 characters for the administrative password.");
        return;
      }
      setPasswordTransitioning(true);
      const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220;
      window.setTimeout(() => {
        setPasswordStep("confirm");
        setPasswordTransitioning(false);
      }, delay);
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match.");
      return;
    }
    const supabase = createClient();
    const { error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError) {
      setError(updateError.message);
      return;
    }
    started.current = true;
    await beginMfa();
  }

  async function verifyCode(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const supabase = createClient();
    const { data: challenge, error: challengeError } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeError) {
      setError(challengeError.message);
      return;
    }
    const { error: verifyError } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code: code.trim() });
    if (verifyError) {
      setError("That authenticator code was not accepted. Wait for a new code and try again.");
      return;
    }
    setMode("ready");
  }

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.assign("/admin/sign-in");
  }

  if (mode === "checking") {
    return <section className="admin-security-card"><p>Preparing two-step verification…</p>{error && <p className="admin-security-error">{error}</p>}</section>;
  }

  if (mode === "ready") {
    return <section className="admin-security-card"><p className="admin-kicker">Verification complete</p><h1>Your account is protected.</h1><p>Your current session now satisfies the required two-step verification policy.</p><button className="admin-security-primary" type="button" onClick={() => window.location.assign("/admin")}>Open administration</button></section>;
  }

  if (mode === "password") {
    return <section className="admin-security-card"><p className="admin-kicker">Accept your invitation</p><h1>{passwordStep === "new" ? "Create your password." : "Confirm your password."}</h1><p>This account cannot self-register. It was invited and assigned by Jardin du Désert.</p><form onSubmit={savePassword}><div className={`credential-question ${passwordTransitioning ? "leaving" : ""}`} key={passwordStep}><label>{passwordStep === "new" ? "New password" : "Confirm password"}<input type="password" autoComplete="new-password" minLength={12} value={passwordStep === "new" ? password : confirmPassword} onChange={(event) => passwordStep === "new" ? setPassword(event.target.value) : setConfirmPassword(event.target.value)} required autoFocus /></label></div>{passwordStep === "confirm" && <button className="admin-security-form-link" type="button" onClick={() => { setConfirmPassword(""); setError(""); setPasswordStep("new"); }}>Choose a different password</button>}<button className="admin-security-primary" type="submit" disabled={passwordTransitioning}>{passwordStep === "new" ? "Next" : "Save password and continue"}</button></form>{error && <p className="admin-security-error">{error}</p>}<button className="admin-security-link" type="button" onClick={signOut}>Sign out</button></section>;
  }

  return (
    <section className="admin-security-card">
      <p className="admin-kicker">Required security step</p>
      <h1>{mode === "enroll" ? "Set up your authenticator." : "Enter your authenticator code."}</h1>
      {mode === "enroll" ? <><p>Scan this QR code with Google Authenticator, 1Password, Authy, or another TOTP application.</p>{qrCode && <img className="admin-security-qr" src={qrCode} alt="Authenticator setup QR code" />}<details><summary>Enter the setup key manually</summary><code>{secret}</code></details></> : <p>Open your authenticator application and enter its current six-digit code.</p>}
      <form onSubmit={verifyCode}><label>Authenticator code<input inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6}" maxLength={6} value={code} onChange={(event) => setCode(event.target.value.replace(/\D/g, ""))} placeholder="000000" required autoFocus={mode === "challenge"} /></label><button className="admin-security-primary" type="submit">Verify and continue</button></form>
      {error && <p className="admin-security-error">{error}</p>}
      <button className="admin-security-link" type="button" onClick={signOut}>Sign out</button>
    </section>
  );
}
