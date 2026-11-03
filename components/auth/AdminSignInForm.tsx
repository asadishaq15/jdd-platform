"use client";

import { FormEvent, useEffect, useState } from "react";
import { EyeIcon, EyeOffIcon } from "../icons/AccountIcons";
import { friendlyAuthError } from "../../lib/auth-errors";
import { usePasswordVisibility } from "../../lib/password-visibility";
import { createClient } from "../../lib/supabase/client";
import LoadingView from "./LoadingView";

type AdminSignInFormProps = {
  audience: "staff" | "property";
};

type Step = "entry" | "loading" | "forgot-password" | "recovery-sent";

export default function AdminSignInForm({ audience }: AdminSignInFormProps) {
  const [step, setStep] = useState<Step>("entry");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const passwordField = usePasswordVisibility(password, setPassword);
  const [credentialStep, setCredentialStep] = useState<"email" | "password">("email");
  const [questionTransitioning, setQuestionTransitioning] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const label = audience === "staff" ? "Internal staff" : "Property partner";
  const portalHome = audience === "staff" ? "/staff/sign-in" : "/property/sign-in";

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const message = search.get("error");
    if (message) setError(message);
    if (search.get("reset") === "success") setNotice("Your password has been updated. Sign in with your new password.");
  }, []);

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (questionTransitioning) return;

    if (credentialStep === "email") {
      setError("");
      transitionToPassword();
      return;
    }

    const nextPassword = passwordField.readValue();
    setPassword(nextPassword);
    setError("");
    setNotice("");
    setSubmitting(true);
    const supabase = createClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password: nextPassword });
    if (signInError) {
      setError("Email or password is incorrect, or this invitation has not been accepted.");
      setSubmitting(false);
      return;
    }
    const { data: memberships, error: membershipError } = await supabase.from("admin_memberships").select("role").eq("user_id", signInData.user.id).eq("is_active", true);
    const allowed = audience === "staff"
      ? memberships?.some((membership) => membership.role === "super_admin")
      : memberships?.some((membership) => membership.role !== "super_admin");
    if (membershipError || !allowed) {
      await supabase.auth.signOut();
      setError(`This account does not have access to the ${audience === "staff" ? "internal staff" : "property partner"} portal.`);
      setSubmitting(false);
      return;
    }
    window.location.assign("/admin");
  }

  function transitionToPassword() {
    setQuestionTransitioning(true);
    const delay = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : 220;
    window.setTimeout(() => {
      setCredentialStep("password");
      passwordField.resetVisible();
      setQuestionTransitioning(false);
    }, delay);
  }

  function returnToEmail() {
    if (questionTransitioning || submitting) return;
    setPassword("");
    passwordField.resetVisible();
    setError("");
    setCredentialStep("email");
  }

  async function requestPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setStep("loading");

    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", `/reset-password?returnTo=${portalHome}`);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: callback.toString(),
    });

    if (resetError) {
      setError(friendlyAuthError(resetError, "We could not send the recovery email. Please try again."));
      setStep("forgot-password");
      return;
    }

    setStep("recovery-sent");
  }

  function backToEntry() {
    setError("");
    setStep("entry");
  }

  if (step === "loading") return <LoadingView title="Preparing your recovery link." />;

  if (step === "forgot-password") {
    return (
      <section className="auth-view" aria-label="Reset your password">
        <p className="eyebrow">Account recovery</p>
        <h1 className="title">Reset your <em className="cu">password</em>.</h1>
        <p className="body recovery-copy">Enter your email address and we’ll send you a secure recovery link.</p>
        <form className="email-auth-form recovery-form" onSubmit={requestPasswordReset}>
          <div className="field">
            <input name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" required autoFocus />
          </div>
          <button className="btn primary" type="submit">Send recovery link</button>
        </form>
        <p className={`err ${error ? "show" : ""}`} role="alert">{error}</p>
        <p className="links small"><button className="tlink" type="button" onClick={backToEntry}>Back to sign in</button></p>
      </section>
    );
  }

  if (step === "recovery-sent") {
    return (
      <section className="auth-view" aria-label="Check your email">
        <p className="eyebrow">Check your email</p>
        <h1 className="title">Recovery is on its <em className="cu">way</em>.</h1>
        <p className="body verify-copy">If an account exists for <span className="to">{email}</span>, we sent a secure password-reset link.</p>
        <p className="links small"><button className="tlink" type="button" onClick={backToEntry}>Back to sign in</button></p>
      </section>
    );
  }

  return (
    <section className="auth-view" aria-label={`${label} sign in`}>
      <p className="eyebrow">{label} access</p>
      <h1 className="title">Enter the <em className="cu">administration</em>.</h1>
      <p className="body">Use the account invited by Jardin du Désert.</p>
      <form className="email-auth-form recovery-form" onSubmit={signIn}>
        {/* Keep username in the DOM on the password step so password managers can autofill correctly. */}
        {credentialStep === "password" && (
          <input className="autofill-username" type="email" name="username" autoComplete="username" value={email} readOnly tabIndex={-1} aria-hidden="true" />
        )}
        <div className={`credential-question ${questionTransitioning ? "leaving" : ""}`} key={credentialStep}>
          <p className="credential-step-label">{credentialStep === "email" ? "Your email" : "Your password"}</p>
          <div className={`field${credentialStep === "password" ? " recovery-password-field" : ""}`}>
            {credentialStep === "email" ? (
              <input type="email" name="username" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" required autoFocus />
            ) : (
              <>
                <input
                  {...passwordField.inputProps}
                  name="password"
                  autoComplete="current-password"
                  placeholder="Password"
                  minLength={8}
                  required
                  autoFocus
                />
                <button
                  type="button"
                  onClick={passwordField.toggleVisible}
                  aria-label={passwordField.visible ? "Hide password" : "Show password"}
                  aria-pressed={passwordField.visible}
                >
                  {passwordField.visible ? <EyeOffIcon /> : <EyeIcon />}
                </button>
              </>
            )}
          </div>
        </div>
        <div className={`forgot-row credential-helper-slot${credentialStep === "password" ? " credential-helper-enter" : ""}`}>
          {credentialStep === "password" && (
            <>
              <button type="button" onClick={returnToEmail}>Use a different email</button>
              <button type="button" onClick={() => { setError(""); setNotice(""); setStep("forgot-password"); }}>Forgot password?</button>
            </>
          )}
        </div>
        <button className="btn primary" type="submit" disabled={submitting || questionTransitioning}>{submitting ? "Signing in…" : credentialStep === "email" ? "Next" : "Continue"}</button>
      </form>
      <p className={`auth-notice ${notice ? "show" : ""}`} role="status">{notice}</p>
      <p className={`err ${error ? "show" : ""}`} role="alert">{error}</p>
    </section>
  );
}
