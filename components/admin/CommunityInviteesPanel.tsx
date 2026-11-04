"use client";

import { useActionState, useMemo, useState } from "react";
import {
  inviteGuestsToEvent,
  removeEventInvitee,
  type CommunityInviteActionState,
  type EventInviteeView,
  type InviteCandidate,
} from "../../lib/community-invitees";

const initialState: CommunityInviteActionState = {};

export default function CommunityInviteesPanel({
  eventId,
  candidates,
  invitees,
  canManage,
  isPublished,
}: {
  eventId: string;
  candidates: InviteCandidate[];
  invitees: EventInviteeView[];
  canManage: boolean;
  isPublished: boolean;
}) {
  const [inviteState, inviteAction, invitePending] = useActionState(inviteGuestsToEvent, initialState);
  const [removeState, removeAction, removePending] = useActionState(removeEventInvitee, initialState);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<string[]>([]);

  const invitedStayIds = useMemo(() => new Set(invitees.map((invitee) => invitee.stayId)), [invitees]);
  const available = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return candidates
      .filter((candidate) => !invitedStayIds.has(candidate.stayId))
      .filter((candidate) => {
        if (!needle) return true;
        return (
          candidate.guestEmail.includes(needle)
          || (candidate.guestName || "").toLowerCase().includes(needle)
        );
      });
  }, [candidates, invitedStayIds, query]);

  function toggleStay(stayId: string) {
    setSelected((current) => (
      current.includes(stayId)
        ? current.filter((id) => id !== stayId)
        : [...current, stayId]
    ));
  }

  function selectVisible() {
    setSelected(available.map((candidate) => candidate.stayId));
  }

  return (
    <div className="admin-invitees">
      <div className="admin-invitees-head">
        <div>
          <p className="admin-kicker">Invite guests</p>
          <h3>Private to invited guests</h3>
          <p>
            Only guests you invite here can see this Guest invitation in Space
            {isPublished ? "" : " once it is published"}.
            Inviting always sends an email.
          </p>
        </div>
        <small className="admin-muted">
          {invitees.length} invited · {invitees.filter((invitee) => invitee.accepted).length} accepted
        </small>
      </div>

      {canManage && (
        <form className="admin-invitees-picker" action={inviteAction} onSubmit={() => setSelected([])}>
          <input type="hidden" name="eventId" value={eventId} />
          {selected.map((stayId) => (
            <input key={stayId} type="hidden" name="stayIds" value={stayId} />
          ))}
          <label className="admin-invitees-search">
            <span>Find activated guests</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name or email"
            />
          </label>
          <div className="admin-invitees-actions">
            <button type="button" className="admin-danger-link" onClick={selectVisible} disabled={!available.length}>
              Select visible ({available.length})
            </button>
            <button type="button" className="admin-danger-link" onClick={() => setSelected([])} disabled={!selected.length}>
              Clear selection
            </button>
          </div>
          <ul className="admin-invitees-candidates">
            {available.map((candidate) => {
              const checked = selected.includes(candidate.stayId);
              return (
                <li key={candidate.stayId}>
                  <label>
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => toggleStay(candidate.stayId)}
                    />
                    <span>
                      <strong>{candidate.guestName || "Guest"}</strong>
                      <small>{candidate.guestEmail}</small>
                    </span>
                  </label>
                </li>
              );
            })}
            {!available.length && (
              <li className="admin-muted">
                {candidates.length
                  ? "All matching activated guests are already invited."
                  : "No activated guests with email on this property yet."}
              </li>
            )}
          </ul>
          <button type="submit" disabled={invitePending || !selected.length}>
            {invitePending ? "Inviting…" : `Invite${selected.length ? ` (${selected.length})` : ""} & email`}
          </button>
          {inviteState.error && <p className="admin-action-error" role="alert">{inviteState.error}</p>}
          {inviteState.success && <p className="admin-action-success" role="status">{inviteState.success}</p>}
        </form>
      )}

      <div className="admin-invitees-list">
        <p className="admin-invitees-list-label">Invitees</p>
        {invitees.length ? (
          <ul>
            {invitees.map((invitee) => (
              <li key={invitee.id}>
                <div>
                  <strong>{invitee.guestName || "Guest"}</strong>
                  <small>{invitee.guestEmail}</small>
                  <small>
                    Invited {formatDate(invitee.invitedAt)}
                    {" · "}
                    {invitee.emailSentAt ? "Email sent" : invitee.emailWarning || "Email pending"}
                    {" · "}
                    {invitee.accepted ? "Accepted" : "Pending"}
                  </small>
                </div>
                {canManage && (
                  <form action={removeAction}>
                    <input type="hidden" name="inviteeId" value={invitee.id} />
                    <button className="admin-danger-link" type="submit" disabled={removePending}>
                      Remove
                    </button>
                  </form>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="admin-muted">No guests invited yet.</p>
        )}
        {removeState.error && <p className="admin-action-error" role="alert">{removeState.error}</p>}
        {removeState.success && <p className="admin-action-success" role="status">{removeState.success}</p>}
      </div>
    </div>
  );
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
