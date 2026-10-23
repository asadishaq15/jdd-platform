import { revokeActivationLink } from "../../../../lib/admin-operations";
import { canOperateProperty, requireAdmin } from "../../../../lib/admin-auth";
import { createAdminClient } from "../../../../lib/supabase/admin";

type ActivationsPageProps = { searchParams: Promise<{ property?: string; status?: string }> };

type ActivationRow = {
  id: string;
  stay_id: string;
  expires_at: string;
  consumed_at: string | null;
  revoked_at: string | null;
  created_at: string;
};

type StayLookup = {
  id: string;
  property_id: string;
  guest_name: string | null;
  guest_email: string | null;
  external_reference: string | null;
  property: { name: string } | null;
};

export default async function AdminActivationsPage({ searchParams }: ActivationsPageProps) {
  const context = await requireAdmin();
  const params = await searchParams;
  const selectedProperty = params.property && context.properties.some((property) => property.id === params.property)
    ? params.property
    : null;
  const propertyIds = selectedProperty ? [selectedProperty] : context.properties.map((property) => property.id);
  const admin = createAdminClient();
  const { data: stayData, error: stayError } = await admin
    .from("stays")
    .select("id, property_id, guest_name, guest_email, external_reference, property:properties(name)")
    .in("property_id", propertyIds)
    .limit(1000);
  if (stayError) throw new Error(`Unable to load activation stays: ${stayError.message}`);

  const stays = (stayData || []) as unknown as StayLookup[];
  const stayMap = new Map(stays.map((stay) => [stay.id, stay]));
  const stayIds = stays.map((stay) => stay.id);
  let activations: ActivationRow[] = [];

  if (stayIds.length) {
    const { data, error } = await admin
      .from("guest_activation_links")
      .select("id, stay_id, expires_at, consumed_at, revoked_at, created_at")
      .in("stay_id", stayIds)
      .order("created_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(`Unable to load activations: ${error.message}`);
    activations = (data || []) as ActivationRow[];
  }

  const now = Date.now();
  const filtered = activations.filter((activation) => {
    if (!params.status || params.status === "all") return true;
    return activationStatus(activation, now) === params.status;
  });

  return (
    <section>
      <div className="admin-page-heading">
        <div><p className="admin-kicker">Operations</p><h1>Activations</h1><p>Review invitation lifecycle and revoke unused links when access should no longer be available.</p></div>
        <span className="admin-access-badge">{filtered.length} links</span>
      </div>

      <form className="admin-filterbar compact" method="get">
        {params.property && <input type="hidden" name="property" value={params.property} />}
        <select name="status" defaultValue={params.status || "all"} aria-label="Link status">
          <option value="all">All link statuses</option>
          <option value="pending">Pending</option>
          <option value="consumed">Consumed</option>
          <option value="expired">Expired</option>
          <option value="revoked">Revoked</option>
        </select>
        <button type="submit">Apply filter</button>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Guest</th><th>Property</th><th>Created</th><th>Expires</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            {filtered.map((activation) => {
              const stay = stayMap.get(activation.stay_id);
              const status = activationStatus(activation, now);
              return (
                <tr key={activation.id}>
                  <td><strong>{stay?.guest_name || "Guest"}</strong><small>{stay?.guest_email || stay?.external_reference || "—"}</small></td>
                  <td>{stay?.property?.name || "Unknown property"}</td>
                  <td>{formatTimestamp(activation.created_at)}</td>
                  <td>{formatTimestamp(activation.expires_at)}</td>
                  <td><span className={`admin-status ${status}`}>{status}</span></td>
                  <td>{status === "pending" && stay && canOperateProperty(context, stay.property_id) ? <form action={revokeActivationLink}><input type="hidden" name="activationId" value={activation.id} /><button className="admin-danger-link" type="submit">Revoke</button></form> : <span className="admin-muted">—</span>}</td>
                </tr>
              );
            })}
            {!filtered.length && <tr><td colSpan={6} className="admin-empty">No activation links match this filter.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function activationStatus(activation: ActivationRow, now: number) {
  if (activation.consumed_at) return "consumed";
  if (activation.revoked_at) return "revoked";
  if (new Date(activation.expires_at).getTime() <= now) return "expired";
  return "pending";
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}
