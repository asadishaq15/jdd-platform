"use client";

import { FormEvent, useState } from "react";
import type { AccountSummary } from "../../lib/space-data";
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
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
    const { error } = await supabase.auth.updateUser(
      { email: nextEmail },
      { emailRedirectTo: `${window.location.origin}/space` },
    );
    setSaving(false);
    if (error) return setNotice({ kind: "error", text: error.message });

    setEditor(null);
    setNotice({ kind: "success", text: `Confirmation sent to ${nextEmail}. Your current email remains active until you confirm the change.` });
  }

  async function savePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (password.length < 8) return setNotice({ kind: "error", text: "Use at least eight characters for your new password." });
    if (password !== passwordConfirmation) return setNotice({ kind: "error", text: "The passwords do not match." });

    setSaving(true);
    setNotice(null);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return setNotice({ kind: "error", text: error.message });

    setPassword("");
    setPasswordConfirmation("");
    setEditor(null);
    setNotice({ kind: "success", text: "Your password has been updated." });
  }

  return (
    <div className="account-settings">
      <AccountRow label="Name" value={account.fullName} onEdit={() => openEditor("name")} />
      {editor === "name" && <form className="account-form" onSubmit={saveName}>
        <label htmlFor="account-name">Your name</label>
        <input id="account-name" value={name} onChange={(event) => setName(event.target.value)} autoComplete="name" maxLength={100} required autoFocus />
        <FormActions saving={saving} onCancel={() => setEditor(null)} />
      </form>}

      <AccountRow label="Email" value={account.email} onEdit={() => openEditor("email")} />
      {editor === "email" && <form className="account-form" onSubmit={saveEmail}>
        <label htmlFor="account-email">New email address</label>
        <input id="account-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required autoFocus />
        <FormActions saving={saving} onCancel={() => setEditor(null)} />
      </form>}

      <AccountRow label="Password" value="••••••••" onEdit={() => openEditor("password")} />
      {editor === "password" && <form className="account-form" onSubmit={savePassword}>
        <PasswordField id="account-password" label="New password" value={password} visible={showPassword} onChange={setPassword} onToggle={() => setShowPassword((value) => !value)} autoFocus />
        <PasswordField id="account-password-confirm" label="Confirm password" value={passwordConfirmation} visible={showConfirmation} onChange={setPasswordConfirmation} onToggle={() => setShowConfirmation((value) => !value)} />
        <FormActions saving={saving} onCancel={() => setEditor(null)} />
      </form>}

      {notice && <p className={`account-notice ${notice.kind}`} role="status" aria-live="polite">{notice.text}</p>}
    </div>
  );
}

function AccountRow({ label, value, onEdit }: { label: string; value: string; onEdit: () => void }) {
  return <div className="account-row"><div><span>{label}</span><strong>{value}</strong></div><button className="account-edit" type="button" onClick={onEdit} aria-label={`Edit ${label.toLowerCase()}`}><PencilIcon /></button></div>;
}

function PasswordField({ id, label, value, visible, onChange, onToggle, autoFocus = false }: {
  id: string; label: string; value: string; visible: boolean; onChange: (value: string) => void; onToggle: () => void; autoFocus?: boolean;
}) {
  return <div className="password-field"><label htmlFor={id}>{label}</label><input id={id} type={visible ? "text" : "password"} value={value} onChange={(event) => onChange(event.target.value)} autoComplete="new-password" minLength={8} required autoFocus={autoFocus} /><button type="button" onClick={onToggle} aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible}>{visible ? <EyeOffIcon /> : <EyeIcon />}</button></div>;
}

function FormActions({ saving, onCancel }: { saving: boolean; onCancel: () => void }) {
  return <div className="account-actions"><button type="button" onClick={onCancel} disabled={saving}>Cancel</button><button className="save" type="submit" disabled={saving}>{saving ? "Saving…" : "Save"}</button></div>;
}
