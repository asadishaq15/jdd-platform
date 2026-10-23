"use client";

import { useActionState, useState } from "react";
import { inviteAdminAccount, type AdminInviteActionState } from "../../lib/admin-operations";
import type { AdminProperty } from "../../lib/admin-auth";

const initialState: AdminInviteActionState = {};

export default function AdminInviteForm({ properties }: { properties: AdminProperty[] }) {
  const [state, action, pending] = useActionState(inviteAdminAccount, initialState);
  const [accountType, setAccountType] = useState("property");
  return <form className="admin-access-form" action={action}>
    <label>Account type<select name="accountType" value={accountType} onChange={(event) => setAccountType(event.target.value)}><option value="property">Property or business</option><option value="staff">Internal staff</option></select></label>
    {accountType === "property" && <label>Property<select name="propertyId" required><option value="">Choose property</option>{properties.map((property) => <option value={property.id} key={property.id}>{property.name}</option>)}</select></label>}
    <label>Account holder<input name="fullName" placeholder="Full name" minLength={2} required /></label>
    <label>Email address<input name="email" type="email" placeholder="name@property.com" required /></label>
    <button type="submit" disabled={pending}>{pending ? "Sending invitation…" : "Invite account"}</button>
    {state.error && <p className="admin-action-error" role="alert">{state.error}</p>}
    {state.success && <p className="admin-action-success" role="status">{state.success}</p>}
  </form>;
}
