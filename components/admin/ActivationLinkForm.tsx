"use client";

import { useActionState, useEffect, useState } from "react";
import { createActivationLink, type ActivationActionState } from "../../lib/admin-operations";

const initialState: ActivationActionState = {};

export default function ActivationLinkForm({ stayId }: { stayId: string }) {
  const [state, action, pending] = useActionState(createActivationLink, initialState);
  const [copied, setCopied] = useState(false);

  useEffect(() => setCopied(false), [state.activationUrl]);

  async function copyLink() {
    if (!state.activationUrl) return;
    await navigator.clipboard.writeText(state.activationUrl);
    setCopied(true);
  }

  if (state.activationUrl) {
    return (
      <div className="admin-generated-link" role="status">
        <p>Activation link created. It is shown only in this response.</p>
        <code>{state.activationUrl}</code>
        <button type="button" onClick={copyLink}>{copied ? "Copied" : "Copy link"}</button>
      </div>
    );
  }

  return (
    <form className="admin-inline-form" action={action}>
      <input type="hidden" name="stayId" value={stayId} />
      <label>
        <span>Expires</span>
        <select name="expiryDays" defaultValue="7">
          <option value="3">3 days</option>
          <option value="7">7 days</option>
          <option value="14">14 days</option>
          <option value="30">30 days</option>
        </select>
      </label>
      <button type="submit" disabled={pending}>{pending ? "Generating…" : "Generate link"}</button>
      {state.error && <p className="admin-action-error" role="alert">{state.error}</p>}
    </form>
  );
}
