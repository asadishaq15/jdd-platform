"use client";

import { FormEvent, useEffect, useState } from "react";
import { GoogleIcon } from "../icons/AuthIcons";
import { createClient } from "../../lib/supabase/client";
import LegalModal from "./LegalModal";
import LoadingView from "./LoadingView";

type Step = "entry" | "loading" | "confirmation";
type EmailMode = "sign-in" | "sign-up";

function requestedDestination() {
  const value = new URLSearchParams(window.location.search).get("next");
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/discover";
}

export default function AuthFlow() {
  const [step, setStep] = useState<Step>("entry");
  const [mode, setMode] = useState<EmailMode>("sign-in");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [legal, setLegal] = useState<"terms" | "privacy" | null>(null);

  useEffect(() => {
    const message = new URLSearchParams(window.location.search).get("error");
    if (message) setError(message);
  }, []);

  function requireTerms() {
    if (!accepted) {
      setError("Please accept the Terms of Use to continue.");
      return false;
    }
    setError("");
    return true;
  }

  async function continueWithGoogle() {
    if (!requireTerms()) return;
    setStep("loading");

    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", requestedDestination());
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo.toString() },
    });

    if (authError) {
      setError(authError.message);
      setStep("entry");
    }
  }

  async function continueWithEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!requireTerms()) return;

    const form = new FormData(event.currentTarget);
    const password = String(form.get("password") || "");
    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    setStep("loading");
    const supabase = createClient();

    if (mode === "sign-up") {
      if (!fullName.trim()) {
        setError("Please enter your full name.");
        setStep("entry");
        return;
      }

      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", requestedDestination());
      const { data, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: callback.toString(),
          data: { full_name: fullName.trim() },
        },
      });

      if (authError) {
        setError(authError.message);
        setStep("entry");
        return;
      }

      if (!data.session) {
        setStep("confirmation");
        return;
      }
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        setError("Email or password is incorrect.");
        setStep("entry");
        return;
      }
    }

    window.location.assign(requestedDestination());
  }

  if (step === "loading") return <LoadingView title="Preparing your private space." />;

  if (step === "confirmation") {
    return (
      <section className="auth-view" aria-label="Confirm your email">
        <p className="eyebrow">Check your email</p>
        <h1 className="title">Confirm your <em className="cu">account</em>.</h1>
        <p className="body verify-copy">We sent a secure confirmation link to <span className="to">{email}</span>.</p>
        <p className="links small"><button className="tlink" type="button" onClick={() => { setMode("sign-in"); setStep("entry"); }}>Back to sign in</button></p>
      </section>
    );
  }

  return (
    <>
      <section className="auth-view" aria-label="Enter your private space">
        <h1 className="title">Enter your <em className="cu">private space</em>.</h1>

        <div className="providers entry-providers google-only">
          <button className="btn" type="button" onClick={continueWithGoogle}><GoogleIcon />Continue with Google</button>
        </div>

        <div className="auth-divider"><span>or</span></div>

        <div className="auth-modes" role="group" aria-label="Email authentication mode">
          <button type="button" className={mode === "sign-in" ? "active" : ""} onClick={() => { setMode("sign-in"); setError(""); }}>Sign in</button>
          <button type="button" className={mode === "sign-up" ? "active" : ""} onClick={() => { setMode("sign-up"); setError(""); }}>Create account</button>
        </div>

        <form className="email-auth-form" onSubmit={continueWithEmail}>
          {mode === "sign-up" && <div className="field"><input name="fullName" type="text" autoComplete="name" value={fullName} onChange={(event) => setFullName(event.target.value)} placeholder="Full name" required /></div>}
          <div className="field"><input name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" required /></div>
          <div className="field"><input name="password" type="password" autoComplete={mode === "sign-up" ? "new-password" : "current-password"} placeholder="Password" minLength={8} required /></div>
          <button className="btn primary" type="submit">{mode === "sign-up" ? "Create my account" : "Continue"}</button>
        </form>

        <label className="agree">
          <input type="checkbox" checked={accepted} onChange={(event) => { setAccepted(event.target.checked); if (event.target.checked) setError(""); }} />
          <span className="box" aria-hidden="true" />
          <span className="agree-t">
            I agree to the <button className="doc-link" type="button" onClick={() => setLegal("terms")}>Terms of Use</button> and acknowledge the <button className="doc-link" type="button" onClick={() => setLegal("privacy")}>Privacy Policy</button>.
          </span>
        </label>
        <p className={`err ${error ? "show" : ""}`} role="alert">{error}</p>
      </section>

      <LegalModal kind={legal} onClose={() => setLegal(null)} />
    </>
  );
}

