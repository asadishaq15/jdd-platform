import { updateCardOrderStatus } from "../../../../lib/admin-operations";
import { requireAdmin } from "../../../../lib/admin-auth";
import { createAdminClient } from "../../../../lib/supabase/admin";

type OrdersPageProps = { searchParams: Promise<{ property?: string; status?: string }> };

export default async function AdminOrdersPage({ searchParams }: OrdersPageProps) {
  const context = await requireAdmin();
  const params = await searchParams;
  const selectedProperty = params.property && context.properties.some((property) => property.id === params.property) ? params.property : null;
  const propertyIds = selectedProperty ? [selectedProperty] : context.properties.map((property) => property.id);
  const admin = createAdminClient();
  let query = admin.from("card_orders").select("id, recipient_name, shipping_address, status, created_at, property:properties(name)").in("property_id", propertyIds).order("created_at", { ascending: false }).limit(500);
  if (params.status && params.status !== "all") query = query.eq("status", params.status);
  const { data: orders, error } = await query;
  if (error) throw new Error(`Unable to load card orders: ${error.message}`);
  return <section><div className="admin-page-heading"><div><p className="admin-kicker">Fulfilment</p><h1>Card orders</h1><p>Property-scoped scented-card requests. Payment credentials are never collected or stored.</p></div><span className="admin-access-badge">{orders?.length || 0} orders</span></div>
    <form className="admin-filterbar compact" method="get">{params.property && <input type="hidden" name="property" value={params.property} />}<select name="status" defaultValue={params.status || "all"}><option value="all">All statuses</option><option value="requested">Requested</option><option value="preparing">Preparing</option><option value="sent">Sent</option><option value="delivered">Delivered</option><option value="received">Received</option><option value="cancelled">Cancelled</option></select><button type="submit">Apply filter</button></form>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Recipient</th><th>Property</th><th>Delivery address</th><th>Requested</th><th>Status</th></tr></thead><tbody>{(orders || []).map((order) => { const property = Array.isArray(order.property) ? order.property[0] : order.property; return <tr key={order.id}><td><strong>{order.recipient_name}</strong></td><td>{property?.name || "Unknown property"}</td><td>{order.shipping_address}</td><td>{formatDate(order.created_at)}</td><td><form className="admin-inline-form" action={updateCardOrderStatus}><input type="hidden" name="orderId" value={order.id} /><select name="status" defaultValue={order.status}><option value="requested">Requested</option><option value="preparing">Preparing</option><option value="sent">Sent</option><option value="delivered">Delivered</option><option value="received">Received</option><option value="cancelled">Cancelled</option></select><button type="submit">Update</button></form></td></tr>; })}{!orders?.length && <tr><td colSpan={5} className="admin-empty">No card orders match this filter.</td></tr>}</tbody></table></div>
  </section>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)); }
