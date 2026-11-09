"use client";

import { ChangeEvent, FormEvent, InputHTMLAttributes, Ref, useRef, useState } from "react";
import { avatarHelpText, isCustomAvatarUrl } from "../../lib/avatar";
import { deleteAvatarByUrl, uploadAvatar } from "../../lib/avatar-upload";
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
  const [photoSaving, setPhotoSaving] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasCustomPhoto = isCustomAvatarUrl(account.avatarUrl);
  const initial = account.fullName.trim().charAt(0).toUpperCase() || "G";

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

  async function persistAvatarUrl(avatarUrl: string | null) {
    const supabase = createClient();
    const { error: profileError } = await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", account.id);
    if (profileError) return { error: "We could not update your photo. Please try again." };

    const { error: metadataError } = await supabase.auth.updateUser({ data: { avatar_url: avatarUrl } });
    if (metadataError) {
      return { error: "Your photo was saved, but account metadata could not be synchronized." };
    }
    return {};
  }

  async function onPhotoSelected(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    setPhotoSaving(true);
    setNotice(null);
    const supabase = createClient();
    const uploaded = await uploadAvatar({
      supabase,
      userId: account.id,
      file,
      previousUrl: account.avatarUrl,
    });
    if (uploaded.error || !uploaded.url) {
      setPhotoSaving(false);
      return setNotice({ kind: "error", text: uploaded.error || "Unable to upload photo." });
    }

    const persisted = await persistAvatarUrl(uploaded.url);
    setPhotoSaving(false);
    if (persisted.error) return setNotice({ kind: "error", text: persisted.error });

    onAccountChange({ ...account, avatarUrl: uploaded.url });
    setNotice({ kind: "success", text: "Your photo has been updated." });
  }

  async function removePhoto() {
    if (!hasCustomPhoto) return;
    setPhotoSaving(true);
    setNotice(null);
    const supabase = createClient();
    await deleteAvatarByUrl(supabase, account.avatarUrl);
    const fallback = account.providerAvatarUrl || null;

    const { error: profileError } = await supabase.from("profiles").update({ avatar_url: null }).eq("id", account.id);
    if (profileError) {
      setPhotoSaving(false);
      return setNotice({ kind: "error", text: "We could not remove your photo. Please try again." });
    }

    const { error: metadataError } = await supabase.auth.updateUser({ data: { avatar_url: fallback } });
    setPhotoSaving(false);
    if (metadataError) {
      return setNotice({ kind: "error", text: "Your photo was removed, but account metadata could not be synchronized." });
    }

    onAccountChange({ ...account, avatarUrl: fallback });
    setNotice({
      kind: "success",
      text: fallback ? "Custom photo removed. Your Google photo is showing again." : "Your photo has been removed.",
    });
  }

  return (
    <div className="account-settings">
      <div className="account-section account-photo-section">
        <div className="account-photo">
          <div className="account-photo-preview" aria-hidden="true">
            {account.avatarUrl
              ? <img src={account.avatarUrl} alt="" referrerPolicy="no-referrer" />
              : <span>{initial}</span>}
          </div>
          <div className="account-photo-actions">
            <span className="account-photo-label">Photo</span>
            <button
              type="button"
              className="account-photo-edit"
              disabled={photoSaving}
              onClick={() => fileInputRef.current?.click()}
            >
              {photoSaving ? "Saving…" : account.avatarUrl ? "Edit photo" : "Add photo"}
            </button>
            {hasCustomPhoto && (
              <button type="button" className="account-photo-remove" disabled={photoSaving} onClick={removePhoto}>
                Remove photo
              </button>
            )}
            <p className="account-photo-help">{avatarHelpText()}</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            hidden
            onChange={onPhotoSelected}
          />
        </div>
      </div>

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
