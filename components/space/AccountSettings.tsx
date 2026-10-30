"use client";

import { FormEvent, InputHTMLAttributes, Ref, useState } from "react";
import type { AccountSummary } from "../../lib/space-data";
import { friendlyAuthError } from "../../lib/auth-errors";
import { usePasswordVisibility } from "../../lib/password-visibility";
import { createClient } from "../../lib/supabase/client";
import { EyeIcon, EyeOffIcon, PencilIcon } from "../icons/AccountIcons";

type Editor = "name" | "email" | "password" | null;
type Notice = { kind: "success" | "error"; text: string } | null;

export default function AccountSettings({ account, onAccountChange }: {
  account: AccountSummary;
  onAccountChange: (account: AccountSummary) => void;
}) {
  const [editor, setEditor] = useState<Editor>(null);
  const [name, setName] = useState(account.fullName);
  const [email, setEmail] = useState(account.email);
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const passwordField = usePasswordVisibility(password, setPassword);
  const confirmationField = usePasswordVisibility(passwordConfirmation, setPasswordConfirmation);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  function openEditor(next: Exclude<Editor, null>) {
    setEditor(next);
    setNotice(null);
    if (next === "name") setName(account.fullName);
    if (next === "email") setEmail(account.email);
    if (next === "password") {
      setPassword("");
      setPasswordConfirmation("");
    }
  }

  async function saveName(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const fullName = name.trim();
    if (fullName.length < 2) return setNotice({ kind: "error", text: "Please enter at least two characters." });

    setSaving(true);
    setNotice(null);
    const supabase = createClient();
    const { error: profileError } = await supabase.from("profiles").update({ full_name: fullName }).eq("id", account.id);
    if (profileError) {
      setSaving(false);
      return setNotice({ kind: "error", text: "We could not update your name. Please try again." });
    }

    const { error: metadataError } = await supabase.auth.updateUser({ data: { full_name: fullName } });
    setSaving(false);
    onAccountChange({ ...account, fullName });
    setEditor(null);
    setNotice({
      kind: metadataError ? "error" : "success",
      text: metadataError ? "Your displayed name was saved, but account metadata could not be synchronized." : "Your name has been updated.",
    });
  }

  async function saveEmail(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextEmail = email.trim().toLowerCase();
    if (nextEmail === account.email.toLowerCase()) return setNotice({ kind: "error", text: "Enter a different email address." });

    setSaving(true);
    setNotice(null);
    const supabase = createClient();
    const callback = new URL("/auth/callback", window.location.origin);
    callback.searchParams.set("next", "/space");
    const { data, error } = await supabase.auth.updateUser(
      { email: nextEmail },
      { emailRedirectTo: callback.toString() },
    );
    setSaving(false);
    if (error) return setNotice({ kind: "error", text: friendlyAuthError(error, "We could not update your email. Please try again.") });

    onAccountChange({ ...account, pendingEmail: data.user?.new_email || nextEmail });
    setEditor(null);
    setNotice({
      kind: "success",
      text: `Email change pending. Confirm the messages sent to both ${account.email} and ${nextEmail}. Your current email remains active until both confirmations are complete.`,
    });
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextPassword = passwordField.readValue();
    const nextConfirmation = confirmationField.readValue();
    setPassword(nextPassword);
    setPasswordConfirmation(nextConfirmation);
    if (nextPassword.length < 8) return setNotice({ kind: "error", text: "Use at least eight characters for your new password." });
    if (nextPassword !== nextConfirmation) return setNotice({ kind: "error", text: "The passwords do not match." });

    setSaving(true);
    setNotice(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password: nextPassword });
    setSaving(false);
    if (error) return setNotice({ kind: "error", text: friendlyAuthError(error, "We could not update your password. Please try again.") });

    setPassword("");
    setPasswordConfirmation("");
    passwordField.resetVisible();
    confirmationField.resetVisible();
    setEditor(null);
    setNotice({ kind: "success", text: "Your password has been updated." });
  }

  return (
    <div className="account-settings">
      <div className="account-section">
        {editor === "name" ? <form className="account-form" onSubmit={saveName}>
          <label htmlFor="account-name">Name</label>
          <input id="account-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={100} required autoFocus />
          <FormActions saving={saving} onCancel={() => setEditor(null)} />
        </form> : <AccountRow label="Name" value={account.fullName} onEdit={() => openEditor("name")} />}
      </div>

      <div className="account-section">
        {editor === "email" ? <form className="account-form" onSubmit={saveEmail}>
          <label htmlFor="account-email">Email</label>
          <input id="account-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required autoFocus />
          <FormActions saving={saving} onCancel={() => setEditor(null)} />
        </form> : <AccountRow label="Email" value={account.email} onEdit={() => openEditor("email")} />}
      </div>

      {account.pendingEmail && account.pendingEmail.toLowerCase() !== account.email.toLowerCase() && !notice && (
        <p className="account-notice pending" role="status">
          Email change pending to {account.pendingEmail}. Confirm the messages sent to both email addresses; until then, sign in with {account.email}.
        </p>
      )}

      <div className="account-section">
        {editor === "password" ? <form className="account-form" onSubmit={savePassword}>
          <PasswordField id="account-password" label="New password" visible={passwordField.visible} onToggle={passwordField.toggleVisible} inputProps={{ ...passwordField.inputProps, autoComplete: "new-password", minLength: 8, required: true, autoFocus: true }} />
          <PasswordField id="account-password-confirm" label="Confirm password" visible={confirmationField.visible} onToggle={confirmationField.toggleVisible} inputProps={{ ...confirmationField.inputProps, autoComplete: "new-password", minLength: 8, required: true }} />
          <FormActions saving={saving} onCancel={() => setEditor(null)} />
        </form> : <AccountRow label="Password" value="••••••••" onEdit={() => openEditor("password")} />}
      </div>

      {notice && <p className={`account-notice ${notice.kind}`} role="status" aria-live="polite">{notice.text}</p>}
    </div>
  );
}

function AccountRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return <button className="account-row" type="button" onClick={onEdit} aria-label={`Edit ${label.toLowerCase()}`}><span className="account-value"><span>{label}</span><strong>{value}</strong></span><span className="account-edit" aria-hidden="true"><PencilIcon /></span></button>;
}

function PasswordField({ id, label, visible, onToggle, inputProps }: {
  id: string;
  label: string;
  visible: boolean;
  onToggle: () => void;
  inputProps: InputHTMLAttributes<HTMLInputElement> & { ref?: Ref<HTMLInputElement> };
}) {
  return (
    <div className="password-field">
      <label htmlFor={id}>{label}</label>
      <input id={id} {...inputProps} />
      <button type="button" onClick={onToggle} aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible}>
        {visible ? <EyeOffIcon /> : <EyeIcon />}
      </button>
    </div>
  );
}

function FormActions({ saving, onCancel }: { saving: boolean; onCancel: () => void }) {
  return <div className="account-actions"><button type="button" onClick={onCancel} disabled={saving}>Cancel</button><button className="save" type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button></div>;
}
