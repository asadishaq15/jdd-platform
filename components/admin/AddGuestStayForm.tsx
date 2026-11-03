"use client";

import { useActionState } from "react";
import type { AdminProperty } from "../../lib/admin-auth";
import { createManualStay, type ManualStayActionState } from "../../lib/admin-operations";
import { getWorld } from "../../lib/worlds";

const initialState: ManualStayActionState = {};

export default function AddGuestStayForm({
  properties,
  defaultPropertyId,
}: {
  properties: AdminProperty[];
  defaultPropertyId?: string | null;
}) {
  const [state, action, pending] = useActionState(createManualStay, initialState);
  if (!properties.length) return null;

  const sorted = [...properties].sort((a, b) => a.worldNumber - b.worldNumber);
  const preferred = defaultPropertyId && sorted.some((property) => property.id === defaultPropertyId)
    ? defaultPropertyId
    : sorted[0].id;
  const singleProperty = sorted.length === 1;

  return (
    <article className="admin-add-guest">
      <div>
        <p className="admin-kicker">Manual stay</p>
        <h2>Add guest</h2>
        <p>
          Creates a stay so you can generate an activation link.
          PMS sync will fill this automatically later.
        </p>
      </div>
      <form className="admin-access-form admin-add-guest-form" action={action}>
        {singleProperty ? (
          <input type="hidden" name="propertyId" value={sorted[0].id} />
        ) : (
          <label>
            Property / State
            <select name="propertyId" defaultValue={preferred} required>
              {sorted.map((property) => (
                <option key={property.id} value={property.id}>
                  {getWorld(property.worldNumber).state} — {property.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <label>
          Guest name
          <input name="guestName" placeholder="Full name" minLength={2} maxLength={120} required />
        </label>
        <label>
          Guest email
          <input name="guestEmail" type="email" placeholder="guest@email.com" required />
        </label>
        <label>
          Check-in
          <input name="checkIn" type="date" required />
        </label>
        <label>
          Check-out
          <input name="checkOut" type="date" required />
        </label>
        <button type="submit" disabled={pending}>
          {pending ? "Adding guest…" : "Add guest"}
        </button>
        {state.error && <p className="admin-action-error" role="alert">{state.error}</p>}
        {state.success && <p className="admin-action-success" role="status">{state.success}</p>}
      </form>
    </article>
  );
}
