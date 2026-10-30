"use client";

import { useActionState } from "react";
import {
  deleteCommunityEvent,
  upsertCommunityEvent,
  type CommunityEventActionState,
  type CommunityEventCategory,
  type CommunityEventView,
} from "../../lib/community-events";

const initialState: CommunityEventActionState = {};

const CATEGORY_LABELS: Record<CommunityEventCategory, string> = {
  event: "Event",
  invite: "Guest invitation",
  news: "News",
};

const CATEGORY_HINTS: Record<CommunityEventCategory, string> = {
  event: "One private evening or gathering for guests of the house.",
  invite: "One guest-only invitation for this property.",
  news: "One news note for guests connected to this property.",
};

export default function CommunityEventForm({
  propertyId,
  category,
  event,
  canManage,
}: {
  propertyId: string;
  category: CommunityEventCategory;
  event: CommunityEventView | null;
  canManage: boolean;
}) {
  const [saveState, saveAction, savePending] = useActionState(upsertCommunityEvent, initialState);
  const [clearState, clearAction, clearPending] = useActionState(deleteCommunityEvent, initialState);

  return (
    <article className="admin-community-card">
      <div className="admin-community-card-head">
        <div>
          <p className="admin-kicker">{CATEGORY_LABELS[category]}</p>
          <h2>{event?.title || `Add ${CATEGORY_LABELS[category].toLowerCase()}`}</h2>
          <p>{CATEGORY_HINTS[category]}</p>
        </div>
        <span className={`admin-status ${event ? (event.isPublished ? "success" : "pending") : "neutral"}`}>
          {event ? (event.isPublished ? "Published" : "Draft") : "Empty"}
        </span>
      </div>

      {event?.thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img className="admin-community-thumb" src={event.thumbnailUrl} alt="" />
      )}

      {canManage ? (
        <>
          <form className="admin-community-form" action={saveAction}>
            <input type="hidden" name="propertyId" value={propertyId} />
            <input type="hidden" name="category" value={category} />
            <label>
              <span>Title</span>
              <input
                name="title"
                defaultValue={event?.title || ""}
                placeholder={category === "event" ? "Stillness Evening" : category === "invite" ? "Tea House Invitation" : "Seasonal fragrance note"}
                required
                maxLength={160}
              />
            </label>
            <label>
              <span>Timing</span>
              <input
                name="timing"
                defaultValue={event?.timing || ""}
                placeholder={category === "news" ? "Now open" : "Friday · 19:00"}
                required
                maxLength={120}
              />
            </label>
            <label className="admin-community-body">
              <span>Description</span>
              <textarea
                name="body"
                defaultValue={event?.body || ""}
                placeholder="Short description for guests"
                required
                maxLength={2000}
                rows={4}
              />
            </label>
            <label>
              <span>Thumbnail URL (optional)</span>
              <input
                name="thumbnailUrl"
                type="url"
                defaultValue={event?.thumbnailUrl || ""}
                placeholder="https://…"
                maxLength={2000}
              />
            </label>
            <label className="admin-community-check">
              <input
                type="checkbox"
                name="isPublished"
                value="true"
                defaultChecked={event?.isPublished ?? true}
              />
              <span>Published</span>
            </label>
            <button type="submit" disabled={savePending}>
              {savePending ? "Saving…" : event ? "Update" : "Create"}
            </button>
            {saveState.error && <p className="admin-action-error" role="alert">{saveState.error}</p>}
            {saveState.success && <p className="admin-action-success" role="status">{saveState.success}</p>}
          </form>

          {event && (
            <form action={clearAction}>
              <input type="hidden" name="propertyId" value={propertyId} />
              <input type="hidden" name="category" value={category} />
              <button className="admin-danger-link" type="submit" disabled={clearPending}>
                {clearPending ? "Clearing…" : "Clear slot"}
              </button>
              {clearState.error && <p className="admin-action-error" role="alert">{clearState.error}</p>}
              {clearState.success && <p className="admin-action-success" role="status">{clearState.success}</p>}
            </form>
          )}
        </>
      ) : (
        <div className="admin-community-readonly">
          {event ? (
            <>
              <p><strong>{event.title}</strong></p>
              <p className="admin-muted">{event.timing}</p>
              <p>{event.body}</p>
              {event.thumbnailUrl && <p className="admin-muted">Thumbnail set</p>}
            </>
          ) : (
            <p className="admin-muted">No {CATEGORY_LABELS[category].toLowerCase()} yet.</p>
          )}
        </div>
      )}
    </article>
  );
}
