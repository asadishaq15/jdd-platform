"use client";

import { useState } from "react";
import { SPACE_STATE_KEY } from "../../lib/space-state";
import { createClient } from "../../lib/supabase/client";

export default function DeleteAccountDialog() {
  const [confirmation, setConfirmation] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  async function deleteAccount() {
    if (confirmation !== "DELETE" || deleting) return;
    setDeleting(true);
    setError("");

    try {
      const response = await fetch("/api/account", { method: "DELETE" });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || "We could not delete your account.");

      localStorage.removeItem(SPACE_STATE_KEY);
      localStorage.removeItem("jdd-onboarded");
      await createClient().auth.signOut({ scope: "local" });
      window.location.assign("/sign-in?deleted=1");
    } catch (caughtError) {
      setDeleting(false);
      setError(caughtError instanceof Error ? caughtError.message : "We could not delete your account.");
    }
  }

  return <>
    <p className="g-label">Delete account</p>
    <h2 className="jm-title">Delete your Space?</h2>
    <p className="jm-text">This permanently deletes your account and profile. Your connected stays will be detached from the account.</p>
    <div className="delete-confirm">
      <label htmlFor="delete-confirmation">Type <strong>DELETE</strong> to confirm</label>
      <input id="delete-confirmation" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} autoComplete="off" disabled={deleting} />
    </div>
    {error && <p className="account-notice error" role="alert">{error}</p>}
    <button className="btn primary danger delete-account-button" type="button" onClick={deleteAccount} disabled={confirmation !== "DELETE" || deleting}>{deleting ? "Deleting…" : "Delete my account"}</button>
  </>;
}
