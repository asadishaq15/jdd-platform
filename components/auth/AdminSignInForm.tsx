"use client";

import { FormEvent, useState } from "react";
import { createClient } from "../../lib/supabase/client";

type AdminSignInFormProps = {
  audience: "staff" | "property";
};

export default function AdminSignInForm({ audience }: AdminSignInFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [credentialStep, setCredentialStep] = useState<"email" | "password">("email");
  const [questionTransitioning, setQuestionTransitioning] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const label = audience === "staff" ? "Internal staff" : "Property partner";

  async function signIn(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (questionTransitioning) return;

    if (credentialStep === "email") {
      setError("");
      transitionToPassword();
      return;
    }

    setError("");
    setSubmitting(true);
    const supabase = createClient();
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
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
      setQuestionTransitioning(false);
    }, delay);
  }

  function returnToEmail() {
    if (questionTransitioning || submitting) return;
    setPassword("");
    setError("");
    setCredentialStep("email");
  }

  return (
    <section className="auth-view" aria-label={`${label} sign in`}>
      <p className="eyebrow">{label} access</p>
      <h1 className="title">Enter the <em className="cu">administration</em>.</h1>
      <p className="body">Use the account invited by Jardin du Désert. Administrative access requires an authenticator code after your password.</p>
      <form className="email-auth-form recovery-form" onSubmit={signIn}>
        <div className={`credential-question ${questionTransitioning ? "leaving" : ""}`} key={credentialStep}>
          <p className="credential-step-label">{credentialStep === "email" ? "Your email" : "Your password"}</p>
          <div className="field">
            {credentialStep === "email"
              ? <input type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" required autoFocus />
              : <input type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Password" minLength={8} required autoFocus />}
          </div>
        </div>
        <div className="forgot-row credential-helper-slot">
          {credentialStep === "password" && <button type="button" onClick={returnToEmail}>Use a different email</button>}
        </div>
        <button className="btn primary" type="submit" disabled={submitting || questionTransitioning}>{submitting ? "Signing in…" : credentialStep === "email" ? "Next" : "Continue"}</button>
      </form>
      <p className={`err ${error ? "show" : ""}`} role="alert">{error}</p>
    </section>
  );
}
