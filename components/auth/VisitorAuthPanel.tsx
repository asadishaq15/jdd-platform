"use client";

import { FormEvent, useEffect, useState } from "react";
import { friendlyAuthError } from "../../lib/auth-errors";
import { createClient } from "../../lib/supabase/client";
import LegalModal from "./LegalModal";

type EmailMode = "in" | "new";
type AuthField = "email" | "password" | "name";

function defaultNext() {
  if (typeof window === "undefined") return "/auth/complete";
  const value = new URLSearchParams(window.location.search).get("next");
  return value?.startsWith("/") && !value.startsWith("//") ? value : "/auth/complete";
}

export default function VisitorAuthPanel({
  onCode,
  nextPath,
}: {
  onCode?: () => void;
  nextPath?: string;
}) {
  const [mode, setMode] = useState<EmailMode>("in");
  const [field, setField] = useState<AuthField>("email");
  const [accepted, setAccepted] = useState(false);
  const [agreeNeed, setAgreeNeed] = useState(false);
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [legal, setLegal] = useState<"terms" | "privacy" | null>(null);
  const [phase, setPhase] = useState<"entry" | "loading" | "confirmation">("entry");
  const destination = nextPath || defaultNext();

  useEffect(() => {
    const search = new URLSearchParams(window.location.search);
    const message = search.get("error");
    if (message) setError(message);
    if (search.get("mode") === "sign-up") {
      setMode("new");
      setField("email");
    }
  }, []);

  function requireTerms() {
    if (!accepted) {
      setAgreeNeed(true);
      setError("Please accept the Terms of Use to continue.");
      return false;
    }
    setAgreeNeed(false);
    setError("");
    return true;
  }

  function selectTab(next: EmailMode) {
    setMode(next);
    setField("email");
    setPassword("");
    setShowPassword(false);
    setError("");
    setAgreeNeed(false);
  }

  async function continueWithGoogle() {
    if (!requireTerms()) return;
    setPhase("loading");
    const redirectTo = new URL("/auth/callback", window.location.origin);
    redirectTo.searchParams.set("next", destination);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: redirectTo.toString() },
    });
    if (authError) {
      setError(authError.message);
      setPhase("entry");
    }
  }

  async function continueWithEmail(event?: FormEvent) {
    event?.preventDefault();

    if (field === "email") {
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
      if (!ok) {
        setError("Please enter a valid email address.");
        return;
      }
      setError("");
      setField("password");
      return;
    }

    if (field === "password") {
      if (password.length < 6) {
        setError(mode === "new" ? "Use at least 6 characters." : "Please enter your password.");
        return;
      }
      if (mode === "new") {
        setError("");
        setField("name");
        return;
      }
    }

    if (field === "name" && fullName.trim().length < 2) {
      setError("Please enter your full name.");
      return;
    }
    if (!requireTerms()) return;

    setPhase("loading");
    const supabase = createClient();

    if (mode === "new") {
      const callback = new URL("/auth/callback", window.location.origin);
      callback.searchParams.set("next", destination);
      const { data, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: {
          emailRedirectTo: callback.toString(),
          data: { full_name: fullName.trim() },
        },
      });
      if (authError) {
        setError(friendlyAuthError(authError, "We could not create your account. Please try again."));
        setPhase("entry");
        return;
      }
      if (!data.session) {
        setPhase("confirmation");
        return;
      }
    } else {
      const { error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });
      if (authError) {
        setError("Email or password is incorrect.");
        setPhase("entry");
        return;
      }
    }

    window.location.assign(destination);
  }

  if (phase === "loading") {
    return (
      <div className="col">
        <div className="loader" aria-hidden="true">
          <svg viewBox="0 0 120 120">
            <circle className="ring" cx="60" cy="60" r="46" />
            <circle className="arc" cx="60" cy="60" r="46" pathLength="1" />
          </svg>
        </div>
        <p className="load-title">
          <span className="l1">One moment.</span>
          <span className="l2">Preparing your private space.</span>
        </p>
      </div>
    );
  }

  if (phase === "confirmation") {
    return (
      <div className="col">
        <h1 className="title">Confirm your <em className="cu">account</em>.</h1>
        <p className="lede fade" style={{ "--d": ".4s" } as React.CSSProperties}>
          We sent a secure confirmation link to {email}.
        </p>
        <div className="actions fade" style={{ "--d": ".8s" } as React.CSSProperties}>
          <button className="tlink bp" type="button" onClick={() => { selectTab("in"); setPhase("entry"); }}>
            Back to sign in
          </button>
        </div>
      </div>
    );
  }

  const primaryLabel = field === "name" ? "Create my account" : "Next";
  const passwordPlaceholder = mode === "new" ? "Create a password" : "Password";

  return (
    <>
      <div className="col">
        <h1 className="title">Enter your <em className="cu">private space</em>.</h1>
        <div className="actions login-act fade" style={{ "--d": "1.2s" } as React.CSSProperties}>
          <div className="auth-tabs" role="tablist">
            <button
              className={`atab${mode === "in" ? " on" : ""}`}
              type="button"
              role="tab"
              aria-selected={mode === "in"}
              onClick={() => selectTab("in")}
            >
              Sign in
            </button>
            <button
              className={`atab${mode === "new" ? " on" : ""}`}
              type="button"
              role="tab"
              aria-selected={mode === "new"}
              onClick={() => selectTab("new")}
            >
              Create account
            </button>
          </div>

          <form className="email-wrap" onSubmit={continueWithEmail}>
            {field === "email" ? (
              <input
                className="email-input"
                type="email"
                inputMode="email"
                autoComplete="email"
                spellCheck={false}
                placeholder="Email address"
                aria-label="Email address"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoFocus
              />
            ) : null}
            {field === "password" ? (
              <>
                <input
                  className="email-input"
                  type={showPassword ? "text" : "password"}
                  autoComplete={mode === "new" ? "new-password" : "current-password"}
                  placeholder={passwordPlaceholder}
                  aria-label="Password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoFocus
                />
                <button
                  type="button"
                  className={`pw-eye${showPassword ? " on" : ""}`}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  onClick={() => setShowPassword((value) => !value)}
                >
                  <svg viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </>
            ) : null}
            {field === "name" ? (
              <input
                className="email-input"
                type="text"
                autoComplete="name"
                placeholder="Full name"
                aria-label="Full name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                autoFocus
              />
            ) : null}
            <p className={`err${error && !agreeNeed ? " show" : ""}`} role="alert">{error && !agreeNeed ? error : ""}</p>
          </form>

          <div className="providers">
            <button className="btn primary" type="button" onClick={() => void continueWithEmail()}>
              {primaryLabel}
            </button>
            <p className="or" aria-hidden="true"><span>or</span></p>
            <button className="btn" type="button" onClick={() => void continueWithGoogle()}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path fill="#4285F4" d="M22.6 12.2c0-.8-.1-1.5-.2-2.2H12v4.2h5.9a5 5 0 0 1-2.2 3.3v2.7h3.6c2.1-1.9 3.3-4.8 3.3-8Z" />
                <path fill="#34A853" d="M12 23c3 0 5.5-1 7.3-2.7l-3.6-2.7c-1 .7-2.2 1.1-3.7 1.1-2.9 0-5.3-1.9-6.2-4.5H2.1v2.8A11 11 0 0 0 12 23Z" />
                <path fill="#FBBC05" d="M5.8 14.2a6.6 6.6 0 0 1 0-4.3V7.1H2.1a11 11 0 0 0 0 9.9l3.7-2.8Z" />
                <path fill="#EA4335" d="M12 5.4c1.6 0 3.1.6 4.2 1.7l3.2-3.2A11 11 0 0 0 2.1 7.1l3.7 2.8C6.7 7.3 9.1 5.4 12 5.4Z" />
              </svg>
              Continue with Google
            </button>
          </div>

          <label className={`agree${agreeNeed ? " need" : ""}`}>
            <input
              type="checkbox"
              checked={accepted}
              onChange={(event) => {
                setAccepted(event.target.checked);
                if (event.target.checked) {
                  setAgreeNeed(false);
                  setError("");
                }
              }}
            />
            <span className="box" aria-hidden="true" />
            <span>
              I am 18 or older, agree to the{" "}
              <button className="doc-link" type="button" onClick={() => setLegal("terms")}>Terms of Use</button>
              {" "}and acknowledge the{" "}
              <button className="doc-link" type="button" onClick={() => setLegal("privacy")}>Privacy Policy</button>.
            </span>
          </label>
          <p className={`err${agreeNeed ? " show" : ""}`} role="alert">{agreeNeed ? error : ""}</p>
        </div>

        <p className="code-row fade" style={{ "--d": "1.8s" } as React.CSSProperties}>
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <circle cx="8" cy="12" r="4" />
            <path d="M12 12h9M18 12v3M21 12v2" />
          </svg>
          <span>Have an access code from your hotel stay?</span>
          <button className="tlink tl" type="button" onClick={onCode}>
            Enter your code
          </button>
        </p>
      </div>
      <LegalModal kind={legal} onClose={() => setLegal(null)} />
    </>
  );
}
