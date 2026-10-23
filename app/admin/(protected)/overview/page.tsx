import Link from "next/link";
import { requireAdmin } from "../../../../lib/admin-auth";
import { getOverviewRange, loadOverviewAnalytics, type OverviewMetric } from "../../../../lib/admin-analytics";

type OverviewPageProps = { searchParams: Promise<{ property?: string; range?: string }> };

export default async function AdminOverviewPage({ searchParams }: OverviewPageProps) {
  const context = await requireAdmin();
  const params = await searchParams;
  const range = getOverviewRange(params.range);
  const analytics = await loadOverviewAnalytics(context, range, params.property);
  const propertyName = params.property ? context.properties.find((property) => property.id === params.property)?.name : null;

  return (
    <section className="admin-overview">
      <div className="admin-page-heading">
        <div><p className="admin-kicker">Administration</p><h1>Overview</h1><p>{propertyName || (context.isSuperAdmin ? "All properties" : "Your assigned properties")} · {range.label}</p></div>
        <form className="admin-range-filter" method="get">
          {params.property && <input type="hidden" name="property" value={params.property} />}
          <label><span>Period</span><select name="range" defaultValue={range.key}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 12 months</option></select></label>
          <button type="submit">Apply</button>
        </form>
      </div>

      <div className="admin-metric-grid">
        <MetricCard label="Users" metric={analytics.users} description="Guest accounts within this administrative scope" />
        <MetricCard label="New users" metric={analytics.newUsers} description="Guest accounts created during this period" />
        <MetricCard label="Stays activated" metric={analytics.activatedStays} description="Invited stays connected to guest accounts" href={withProperty("/admin/stays?status=activated", params.property)} />
        <MetricCard label="Card orders" metric={analytics.cardOrders} description="Scented-card requests created in this period" href={withProperty("/admin/orders", params.property)} />
        <MetricCard label="Users connected" metric={analytics.connectedGuests} description="Unique accounts connected within the checkout cohort" href={withProperty("/admin/stays?status=activated", params.property)} />
        <MetricCard label="How guests felt" metric={analytics.positiveSentiment} suffix="%" description="Responses that felt at home or partly right" href={withProperty("/admin/feedback", params.property)} percentage />
      </div>

      <div className="admin-analytics-grid">
        <article className="admin-chart-card">
          <div className="admin-card-heading"><div><p className="admin-kicker">Conversion</p><h2>Guest activation funnel</h2></div><span>Checkout cohort</span></div>
          <div className="admin-funnel">
            {[["Checked out", analytics.funnel.checkedOut], ["Invitation issued", analytics.funnel.invited], ["Stay activated", analytics.funnel.activated], ["Discovery completed", analytics.funnel.discoveryCompleted]].map(([label, value], _index, items) => {
              const base = Number(items[0][1]) || 0;
              const width = base ? Math.max(8, Math.round((Number(value) / base) * 100)) : 0;
              return <div className="admin-funnel-row" key={String(label)}><div><span>{label}</span><strong>{value}</strong></div><div className="admin-funnel-track"><span style={{ width: `${width}%` }} /></div></div>;
            })}
          </div>
          <p className="admin-definition">An invitation is counted when a stay has at least one activation link. Discovery is counted for connected accounts with a completion timestamp.</p>
        </article>

        <article className="admin-chart-card">
          <div className="admin-card-heading"><div><p className="admin-kicker">Trend</p><h2>Checkouts and activations</h2></div><div className="admin-legend"><span className="checkouts">Checkouts</span><span className="activated">Activated</span></div></div>
          <TrendChart trend={analytics.trend} />
          <p className="admin-definition">Bars are grouped evenly across the selected checkout period. Activation follows the stay cohort, regardless of the day activation occurred.</p>
        </article>
      </div>

      <article className="admin-comparison-card">
        <div className="admin-card-heading"><div><p className="admin-kicker">Performance</p><h2>Property comparison</h2></div><span>Discovery completion · {analytics.discoveryRate.value}%</span></div>
        <div className="admin-table-wrap borderless"><table className="admin-table"><thead><tr><th>Property</th><th>Checkouts</th><th>Invited</th><th>Activated</th><th>Activation rate</th><th>Connected guests</th></tr></thead><tbody>
          {analytics.properties.map((property) => <tr key={property.id}><td><strong>{property.name}</strong></td><td>{property.checkouts}</td><td>{property.invited}</td><td>{property.activated}</td><td>{property.activationRate}%</td><td>{property.connectedGuests}</td></tr>)}
          {!analytics.properties.length && <tr><td className="admin-empty" colSpan={6}>No checkout activity exists for this period.</td></tr>}
        </tbody></table></div>
      </article>
    </section>
  );
}

function MetricCard({ label, metric, suffix = "", description, href, percentage = false }: { label: string; metric: OverviewMetric; suffix?: string; description: string; href?: string; percentage?: boolean }) {
  const change = percentage ? metric.value - metric.previous : metric.previous ? Math.round(((metric.value - metric.previous) / metric.previous) * 100) : metric.value ? 100 : 0;
  return <article className="admin-metric-card"><span>{label}</span><strong>{metric.value.toLocaleString()}{suffix}</strong><p>{description}</p><footer><em className={change > 0 ? "up" : change < 0 ? "down" : "flat"}>{change > 0 ? "+" : ""}{change}{percentage ? " pp" : "%"}</em><span>vs previous period</span>{href && <Link href={href}>View records</Link>}</footer></article>;
}

function TrendChart({ trend }: { trend: Array<{ label: string; checkouts: number; activated: number }> }) {
  const max = Math.max(1, ...trend.map((item) => item.checkouts));
  return <div className="admin-trend-chart">{trend.map((item) => <div className="admin-trend-column" key={item.label}><div className="admin-trend-bars"><span className="checkouts" style={{ height: `${Math.max(item.checkouts ? 5 : 0, (item.checkouts / max) * 100)}%` }} title={`${item.checkouts} checkouts`} /><span className="activated" style={{ height: `${Math.max(item.activated ? 5 : 0, (item.activated / max) * 100)}%` }} title={`${item.activated} activated`} /></div><small>{item.label}</small></div>)}</div>;
}

function withProperty(path: string, property?: string) {
  if (!property) return path;
  return `${path}${path.includes("?") ? "&" : "?"}property=${encodeURIComponent(property)}`;
}
