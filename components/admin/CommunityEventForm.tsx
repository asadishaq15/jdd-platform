"use client";

import { FormEvent, useActionState, useEffect, useState } from "react";
import {
  deleteCommunityEvent,
  upsertCommunityEvent,
  type CommunityEventActionState,
  type CommunityEventCategory,
  type CommunityEventView,
} from "../../lib/community-events";
import type { EventInviteeView, InviteCandidate } from "../../lib/community-invitees";
import {
  assertCommunityThumbnail,
  communityThumbnailHelpText,
  COMMUNITY_THUMBNAIL_TYPES,
} from "../../lib/community-thumbnail";
import CommunityInviteesPanel from "./CommunityInviteesPanel";

const initialState: CommunityEventActionState = {};

const CATEGORY_LABELS: Record<CommunityEventCategory, string> = {
  event: "Event",
  invite: "Guest invitation",
  news: "News",
};

const CATEGORY_HINTS: Record<CommunityEventCategory, string> = {
  event: "One private evening or gathering for all activated guests of the house.",
  invite: "Private invitation. Only guests you invite can see it in Space.",
  news: "One news note for guests connected to this property.",
};

const ACCEPT = COMMUNITY_THUMBNAIL_TYPES.join(",");

export default function CommunityEventForm({
  propertyId,
  category,
  event,
  canManage,
  inviteCandidates = [],
  invitees = [],
}: {
  propertyId: string;
  category: CommunityEventCategory;
  event: CommunityEventView | null;
  canManage: boolean;
  inviteCandidates?: InviteCandidate[];
  invitees?: EventInviteeView[];
}) {
  const [saveState, saveAction, savePending] = useActionState(upsertCommunityEvent, initialState);
  const [clearState, clearAction, clearPending] = useActionState(deleteCommunityEvent, initialState);
  const [previewUrl, setPreviewUrl] = useState<string | null>(event?.thumbnailUrl || null);
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [removeThumbnail, setRemoveThumbnail] = useState(false);
  const [thumbnailError, setThumbnailError] = useState("");
  const [fileInputKey, setFileInputKey] = useState(0);
  const [inviteModalOpen, setInviteModalOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  function clearChosenFile() {
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    setObjectUrl(null);
    setFileInputKey((value) => value + 1);
  }

  function onThumbnailChange(file: File | null) {
    setThumbnailError("");
    if (!file) {
      clearChosenFile();
      setPreviewUrl(removeThumbnail ? null : event?.thumbnailUrl || null);
      return;
    }
    const error = assertCommunityThumbnail(file);
    if (error) {
      setThumbnailError(error);
      clearChosenFile();
      setPreviewUrl(removeThumbnail ? null : event?.thumbnailUrl || null);
      return;
    }
    if (objectUrl) URL.revokeObjectURL(objectUrl);
    const nextUrl = URL.createObjectURL(file);
    setObjectUrl(nextUrl);
    setPreviewUrl(nextUrl);
    setRemoveThumbnail(false);
  }

  function removeCurrentThumbnail() {
    setThumbnailError("");
    clearChosenFile();
    setPreviewUrl(null);
    setRemoveThumbnail(true);
  }

  function onSubmit(eventSubmit: FormEvent<HTMLFormElement>) {
    const form = eventSubmit.currentTarget;
    const fileInput = form.elements.namedItem("thumbnail");
    const file = fileInput instanceof HTMLInputElement ? fileInput.files?.[0] || null : null;
    if (!file) return;
    const error = assertCommunityThumbnail(file);
    if (error) {
      eventSubmit.preventDefault();
      setThumbnailError(error);
    }
  }

  return (
    <article className="admin-community-card">
      <div className="admin-community-card-head">
        <div>
          <p className="admin-kicker">{CATEGORY_LABELS[category]}</p>
          <h2>{event?.title || `Add ${CATEGORY_LABELS[category].toLowerCase()}`}</h2>
          <p>{CATEGORY_HINTS[category]}</p>
        </div>
        <div className="admin-community-status">
          <span className={`admin-status ${event ? (event.isPublished ? "success" : "pending") : "neutral"}`}>
            {event ? (event.isPublished ? "Published" : "Draft") : "Empty"}
          </span>
          {event && (
            <small className="admin-muted">
              {category === "invite"
                ? `${event.inviteeCount} invited · ${event.acceptedCount} accepted`
                : `${event.rsvpCount} RSVP${event.rsvpCount === 1 ? "" : "s"}`}
            </small>
          )}
        </div>
      </div>

      {canManage ? (
        <>
          <form className="admin-community-form" action={saveAction} onSubmit={onSubmit}>
            <input type="hidden" name="propertyId" value={propertyId} />
            <input type="hidden" name="category" value={category} />
            {removeThumbnail && <input type="hidden" name="removeThumbnail" value="true" />}
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

            <div className="admin-community-upload">
              <span className="admin-community-upload-label">Thumbnail (optional)</span>
              {previewUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="admin-community-thumb" src={previewUrl} alt="" />
              )}
              <label className="admin-community-file">
                <span>{previewUrl ? "Replace image" : "Upload image"}</span>
                <input
                  key={fileInputKey}
                  name="thumbnail"
                  type="file"
                  accept={ACCEPT}
                  onChange={(changeEvent) => onThumbnailChange(changeEvent.target.files?.[0] || null)}
                />
              </label>
              <p className="admin-muted">{communityThumbnailHelpText()}</p>
              {(previewUrl || event?.thumbnailUrl) && !removeThumbnail && (
                <button className="admin-danger-link" type="button" onClick={removeCurrentThumbnail}>
                  Remove thumbnail
                </button>
              )}
              {removeThumbnail && !objectUrl && (
                <p className="admin-muted">Thumbnail will be removed when you save.</p>
              )}
              {thumbnailError && <p className="admin-action-error" role="alert">{thumbnailError}</p>}
            </div>

            <label className="admin-community-check">
              <input
                type="checkbox"
                name="isPublished"
                value="true"
                defaultChecked={event?.isPublished ?? true}
              />
              <span>Published</span>
            </label>
            <button type="submit" disabled={savePending || Boolean(thumbnailError)}>
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
              {event.thumbnailUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img className="admin-community-thumb" src={event.thumbnailUrl} alt="" />
              )}
              <p><strong>{event.title}</strong></p>
              <p className="admin-muted">{event.timing}</p>
              <p>{event.body}</p>
            </>
          ) : (
            <p className="admin-muted">No {CATEGORY_LABELS[category].toLowerCase()} yet.</p>
          )}
        </div>
      )}

      {category === "invite" && event && (
        <div className="admin-invite-trigger">
          <p className="admin-muted">
            {event.inviteeCount} invited · {event.acceptedCount} accepted
          </p>
          <button
            className="admin-invite-open"
            type="button"
            onClick={() => setInviteModalOpen(true)}
          >
            Invite guests
          </button>
        </div>
      )}

      {category === "invite" && event && inviteModalOpen && (
        <div
          className="admin-modal open"
          role="presentation"
          onMouseDown={(mouseEvent) => {
            if (mouseEvent.target === mouseEvent.currentTarget) setInviteModalOpen(false);
          }}
        >
          <section
            className="admin-modal-in"
            role="dialog"
            aria-modal="true"
            aria-label="Invite guests"
          >
            <div className="admin-modal-scroll">
              <CommunityInviteesPanel
                eventId={event.id}
                candidates={inviteCandidates}
                invitees={invitees}
                canManage={canManage}
                isPublished={event.isPublished}
              />
            </div>
            <p className="admin-modal-close">
              <button className="admin-danger-link" type="button" onClick={() => setInviteModalOpen(false)}>
                Close
              </button>
            </p>
          </section>
        </div>
      )}
    </article>
  );
}
