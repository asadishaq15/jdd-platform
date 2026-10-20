"use client";

import { FormEvent, useEffect, useState } from "react";
import { GoogleIcon } from "../icons/AuthIcons";
import { createClient } from "../../lib/supabase/client";
import LegalModal from "./LegalModal";
import LoadingView from "./LoadingView";

type Step = "entry" | "loading" | "confirmation" | "forgot-password" | "recovery-sent";
type EmailMode = "sign-in" | "sign-up";
type CredentialStep = "name" | "email" | "password";

function requestedDestination() {
  const value = new URLSearchParams(window.location.search).get("next");
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/auth/continue";
}

export default function AuthFlow() {
  const [step, setStep] = useState<Step>("entry");
  const [mode, setMode] = useState<EmailMode>("sign-in");
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [credentialStep, setCredentialStep] = useState<CredentialStep>("email");
  const [legal, setLegal] = useState<"terms" | "privacy" | null>(null);
  const [notice, setNotice] = useState("");
  const [loadingTitle, setLoadingTitle] = useState("Preparing your private space.");

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const message = search.get("error");
    if (message) setError(message);
    if (search.get("reset") === "success") setNotice("Your password has been updated. Sign in with your new password.");
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
    setLoadingTitle("Preparing your private space.");
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

    if (credentialStep === "email") {
      setError("");
      setCredentialStep("password");
      return;
    }

    if (credentialStep === "password") {
      if (password.length < 8) {
        setError("Password must contain at least 8 characters.");
        return;
      }
      if (mode === "sign-up") {
        setError("");
        setCredentialStep("name");
        return;
      }
    }

    if (credentialStep === "name" && fullName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!requireTerms()) return;

    setLoadingTitle("Preparing your private space.");
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

  function selectMode(nextMode: EmailMode) {
    setMode(nextMode);
    setCredentialStep("email");
    setPassword("");
    setError("");
    setNotice("");
  }

  async function requestPasswordReset(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setNotice("");
    setLoadingTitle("Preparing your recovery link.");
    setStep("loading");

    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", "/reset-password");
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: callback.toString(),
    });

    if (resetError) {
      setError(resetError.message);
      setStep("forgot-password");
      return;
    }

    setStep("recovery-sent");
  }

  if (step === "loading") return <LoadingView title={loadingTitle} />;

  if (step === "forgot-password") {
    return (
      <section className="auth-view" aria-label="Reset your password">
        <p className="eyebrow">Account recovery</p>
        <h1 className="title">Reset your <em className="cu">password</em>.</h1>
        <p className="body recovery-copy">Enter your email address and we’ll send you a secure recovery link.</p>
        <form className="email-auth-form recovery-form" onSubmit={requestPasswordReset}>
          <div className="field"><input name="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Email address" required autoFocus /></div>
          <button className="btn primary" type="submit">Send recovery link</button>
        </form>
        <p className={`err ${error ? "show" : ""}`} role="alert">{error}</p>
        <p className="links small"><button className="tlink" type="button" onClick={() => { setError(""); setStep("entry"); }}>Back to sign in</button></p>
      </section>
    );
  }

  if (step === "recovery-sent") {
    return (
      <section className="auth-view" aria-label="Check your email">
        <p className="eyebrow">Check your email</p>
        <h1 className="title">Recovery is on its <em className="cu">way</em>.</h1>
        <p className="body verify-copy">If an account exists for <span className="to">{email}</span>, we sent a secure password-reset link.</p>
        <p className="links small"><button className="tlink" type="button" onClick={() => { selectMode("sign-in"); setStep("entry"); }}>Back to sign in</button></p>
      </section>
    );
  }

  if (step === "confirmation") {
    return (
      <section className="auth-view" aria-label="Confirm your email">
        <p className="eyebrow">Check your email</p>
        <h1 className="title">Confirm your <em className="cu">account</em>.</h1>
        <p className="body verify-copy">We sent a secure confirmation link to <span className="to">{email}</span>.</p>
        <p className="links small"><button className="tlink" type="button" onClick={() => { selectMode("sign-in"); setStep("entry"); }}>Back to sign in</button></p>
      </section>
    );
  }

  return (
    <>
      <section className="auth-view" aria-label="Enter your private space">
        <h1 className="title">Enter your <em className="cu">private space</em>.</h1>

        <div className="auth-modes" role="group" aria-label="Email authentication mode">
          <button type="button" className={mode === "sign-in" ? "active" : ""} onClick={() => selectMode("sign-in")}>Sign in</button>
          <button type="button" className={mode === "sign-up" ? "active" : ""} onClick={() => selectMode("sign-up")}>Create account</button>
        </div>

        <form className="email-auth-form" onSubmit={continueWithEmail}>
          <div className="credential-question" key={`${mode}-${credentialStep}`}>
            <p className="credential-step-label">{credentialStep === "name" ? "Your name" : credentialStep === "email" ? "Your email" : "Your password"}</p>
            <div className="field credential-field">
              <input
                name={credentialStep === "name" ? "fullName" : credentialStep}
                type={credentialStep === "email" ? "email" : credentialStep === "password" ? "password" : "text"}
                autoComplete={credentialStep === "name" ? "name" : credentialStep === "email" ? "email" : mode === "sign-up" ? "new-password" : "current-password"}
                value={credentialStep === "name" ? fullName : credentialStep === "email" ? email : password}
                onChange={(event) => credentialStep === "name" ? setFullName(event.target.value) : credentialStep === "email" ? setEmail(event.target.value) : setPassword(event.target.value)}
                placeholder={credentialStep === "name" ? "Full name" : credentialStep === "email" ? "Email address" : "Password"}
                minLength={credentialStep === "password" ? 8 : undefined}
                required
                autoFocus
              />
            </div>
          </div>
          <div className="forgot-row credential-helper-slot">
            {mode === "sign-in" && credentialStep === "password" && <button type="button" onClick={() => { setError(""); setNotice(""); setStep("forgot-password"); }}>Forgot password?</button>}
          </div>
          <button className="btn primary" type="submit">
            {mode === "sign-up" && credentialStep === "name" ? "Create my account" : mode === "sign-in" && credentialStep === "password" ? "Continue" : "Next"}
          </button>
        </form>

        <div className="auth-divider"><span>or</span></div>

        <div className="providers entry-providers google-only">
          <button className="btn" type="button" onClick={continueWithGoogle}><GoogleIcon />Continue with Google</button>
        </div>

        <label className="agree">
          <input type="checkbox" checked={accepted} onChange={(event) => { setAccepted(event.target.checked); if (event.target.checked) setError(""); }} />
          <span className="box" aria-hidden="true" />
          <span className="agree-t">
            I agree to the <button className="doc-link" type="button" onClick={() => setLegal("terms")}>Terms of Use</button> and acknowledge the <button className="doc-link" type="button" onClick={() => setLegal("privacy")}>Privacy Policy</button>.
          </span>
        </label>
        <p className={`auth-notice ${notice ? "show" : ""}`} role="status">{notice}</p>
        <p className={`err ${error ? "show" : ""}`} role="alert">{error}</p>
      </section>

      <LegalModal kind={legal} onClose={() => setLegal(null)} />
    </>
  );
}

