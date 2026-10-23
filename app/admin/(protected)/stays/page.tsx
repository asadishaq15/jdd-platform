import Link from "next/link";
import ActivationLinkForm from "../../../../components/admin/ActivationLinkForm";
import { canOperateProperty, requireAdmin } from "../../../../lib/admin-auth";
import { createAdminClient } from "../../../../lib/supabase/admin";

type StaysPageProps = {
  searchParams: Promise<{ q?: string; property?: string; status?: string }>;
};

type StayRow = {
  id: string;
  property_id: string;
  guest_name: string | null;
  guest_email: string | null;
  external_reference: string | null;
  check_in: string | null;
  check_out: string | null;
  activated_at: string | null;
  property: { name: string; country: string | null } | null;
};

export default async function AdminStaysPage({ searchParams }: StaysPageProps) {
  const context = await requireAdmin();
  const params = await searchParams;
  const selectedProperty = params.property && context.properties.some((property) => property.id === params.property)
    ? params.property
    : null;
  const scopedPropertyIds = selectedProperty
    ? [selectedProperty]
    : context.properties.map((property) => property.id);

  const admin = createAdminClient();
  let query = admin
    .from("stays")
    .select("id, property_id, guest_name, guest_email, external_reference, check_in, check_out, activated_at, property:properties(name, country)")
    .in("property_id", scopedPropertyIds)
    .order("check_out", { ascending: false, nullsFirst: false })
    .limit(250);

  if (params.status === "activated") query = query.not("activated_at", "is", null);
  if (params.status === "not-activated") query = query.is("activated_at", null);

  const { data, error } = await query;
  if (error) throw new Error(`Unable to load stays: ${error.message}`);

  const search = params.q?.trim().toLowerCase() || "";
  const stays = ((data || []) as unknown as StayRow[]).filter((stay) => !search || [
    stay.guest_name,
    stay.guest_email,
    stay.external_reference,
    stay.property?.name,
  ].some((value) => value?.toLowerCase().includes(search)));

  return (
    <section>
      <div className="admin-page-heading">
        <div><p className="admin-kicker">Operations</p><h1>Stays</h1><p>Search PMS stays, inspect connection status, and create secure guest invitations.</p></div>
        <span className="admin-access-badge">{stays.length} shown</span>
      </div>

      <form className="admin-filterbar" method="get">
        {params.property && <input type="hidden" name="property" value={params.property} />}
        <input name="q" defaultValue={params.q} placeholder="Guest, email, reference, or property" aria-label="Search stays" />
        <select name="status" defaultValue={params.status || "all"} aria-label="Activation status">
          <option value="all">All statuses</option>
          <option value="activated">Activated</option>
          <option value="not-activated">Not activated</option>
        </select>
        <button type="submit">Apply filters</button>
        <Link href={params.property ? `/admin/stays?property=${params.property}` : "/admin/stays"}>Clear</Link>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead><tr><th>Guest</th><th>Property</th><th>Stay</th><th>PMS reference</th><th>Status</th><th>Invitation</th></tr></thead>
          <tbody>
            {stays.map((stay) => (
              <tr key={stay.id}>
                <td><strong>{stay.guest_name || "Guest name pending"}</strong><small>{stay.guest_email || "No email"}</small></td>
                <td>{stay.property?.name || "Unknown property"}<small>{stay.property?.country}</small></td>
                <td>{formatDate(stay.check_in)}<small>to {formatDate(stay.check_out)}</small></td>
                <td>{stay.external_reference || "—"}</td>
                <td><span className={`admin-status ${stay.activated_at ? "success" : "neutral"}`}>{stay.activated_at ? "Activated" : "Not activated"}</span></td>
                <td>{canOperateProperty(context, stay.property_id) && !stay.activated_at ? <ActivationLinkForm stayId={stay.id} /> : <span className="admin-muted">{stay.activated_at ? "Connected" : "Read only"}</span>}</td>
              </tr>
            ))}
            {!stays.length && <tr><td colSpan={6} className="admin-empty">No stays match these filters.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function formatDate(value: string | null) {
  if (!value) return "Date pending";
  return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }).format(new Date(`${value}T00:00:00Z`));
}
