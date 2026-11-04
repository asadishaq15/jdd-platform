import Link from "next/link";
import CommunityEventForm from "../../../../components/admin/CommunityEventForm";
import { requireAdmin } from "../../../../lib/admin-auth";
import {
  loadCommunityBoards,
  type CommunityEventCategory,
  type CommunityEventView,
} from "../../../../lib/community-events";
import {
  loadEventInvitees,
  loadInviteCandidates,
  type EventInviteeView,
  type InviteCandidate,
} from "../../../../lib/community-invitees";

type CommunityPageProps = {
  searchParams: Promise<{ property?: string }>;
};

const CATEGORIES: CommunityEventCategory[] = ["event", "invite", "news"];

export default async function AdminCommunityPage({ searchParams }: CommunityPageProps) {
  const context = await requireAdmin();
  const params = await searchParams;
  const boards = await loadCommunityBoards(context, params.property);
  const filled = boards.reduce(
    (count, board) => count + CATEGORIES.filter((category) => board.events[category]).length,
    0,
  );
  const singleBoard = boards.length === 1 ? boards[0] : null;

  let inviteCandidates: InviteCandidate[] = [];
  let invitees: EventInviteeView[] = [];
  if (singleBoard?.events.invite) {
    [inviteCandidates, invitees] = await Promise.all([
      loadInviteCandidates(singleBoard.property.id),
      loadEventInvitees(singleBoard.events.invite.id),
    ]);
  }

  return (
    <section>
      <div className="admin-page-heading">
        <div>
          <p className="admin-kicker">Property Circle</p>
          <h1>Community</h1>
          <p>
            Manage one Event, one Guest invitation, and one News item per property.
            Event and News appear for all activated guests when published.
            Guest invitation is private—only invited guests see it in Space.
          </p>
        </div>
        <span className="admin-access-badge">
          {filled} filled · {boards.length * 3 - filled} empty
        </span>
      </div>

      {singleBoard ? (
        <div className="admin-community-grid">
          {CATEGORIES.map((category) => (
            <CommunityEventForm
              key={category}
              propertyId={singleBoard.property.id}
              category={category}
              event={singleBoard.events[category] || null}
              canManage={singleBoard.canManage}
              inviteCandidates={category === "invite" ? inviteCandidates : []}
              invitees={category === "invite" ? invitees : []}
            />
          ))}
        </div>
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Event</th>
                <th>Guest invitation</th>
                <th>News</th>
                <th>Updated</th>
                <th>Manage</th>
              </tr>
            </thead>
            <tbody>
              {boards.map((board) => {
                const latest = latestUpdated(board.events);
                return (
                  <tr key={board.property.id}>
                    <td>
                      <strong>{board.property.name}</strong>
                      <small>World {board.property.worldNumber}</small>
                    </td>
                    {CATEGORIES.map((category) => (
                      <td key={category}>{slotCell(board.events[category])}</td>
                    ))}
                    <td>{latest ? formatUpdated(latest) : "—"}</td>
                    <td>
                      <Link
                        className="tlink"
                        href={`/admin/community?property=${encodeURIComponent(board.property.id)}`}
                      >
                        {board.canManage ? "Edit slots" : "View slots"}
                      </Link>
                    </td>
                  </tr>
                );
              })}
              {!boards.length && (
                <tr>
                  <td colSpan={6} className="admin-empty">
                    No properties are available in your administrative scope.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {singleBoard && params.property && context.properties.length > 1 && (
        <p className="admin-community-back">
          <Link href="/admin/community">Back to all properties</Link>
        </p>
      )}
    </section>
  );
}

function slotCell(event: CommunityEventView | undefined) {
  if (!event) return <span className="admin-muted">Empty</span>;
  const counts = event.category === "invite"
    ? `${event.inviteeCount} invited · ${event.acceptedCount} accepted`
    : `${event.rsvpCount} RSVP${event.rsvpCount === 1 ? "" : "s"}`;
  return (
    <>
      <strong>{event.title}</strong>
      <small>
        {event.timing}
        {event.isPublished ? "" : " · Draft"}
        {` · ${counts}`}
      </small>
    </>
  );
}

function latestUpdated(events: Partial<Record<CommunityEventCategory, CommunityEventView>>) {
  const dates = CATEGORIES
    .map((category) => events[category]?.updatedAt)
    .filter((value): value is string => Boolean(value))
    .sort()
    .reverse();
  return dates[0] || null;
}

function formatUpdated(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}
