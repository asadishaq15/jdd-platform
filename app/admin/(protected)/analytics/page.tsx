import { requireAdmin } from "../../../../lib/admin-auth";
import { getOverviewRange } from "../../../../lib/admin-analytics";
import { loadJourneyAnalytics } from "../../../../lib/journey-analytics";
import { getWorld } from "../../../../lib/worlds";

type AnalyticsPageProps = { searchParams: Promise<{ property?: string; range?: string; internal?: string }> };

export default async function AdminAnalyticsPage({ searchParams }: AnalyticsPageProps) {
  const context = await requireAdmin();
  const params = await searchParams;
  const range = getOverviewRange(params.range);
  const includeInternal = params.internal === "1";
  const analytics = await loadJourneyAnalytics(context, range, params.property, includeInternal);

  return <section>
    <div className="admin-page-heading">
      <div><p className="admin-kicker">Product journey</p><h1>Analytics</h1><p>Activation, discovery, exploration, and return engagement · {range.label}</p></div>
      <form className="admin-range-filter" method="get">
        {params.property && <input type="hidden" name="property" value={params.property} />}
        <label><span>Period</span><select name="range" defaultValue={range.key}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 12 months</option></select></label>
        <label className="admin-check"><input type="checkbox" name="internal" value="1" defaultChecked={includeInternal} /><span>Include internal</span></label>
        <button type="submit">Apply</button>
      </form>
    </div>

    <div className="admin-metric-grid journey">
      <JourneyMetric label="Unique guests" value={analytics.uniqueGuests} note={`${analytics.totalEvents} tracked events`} />
      <JourneyMetric label="Discovery abandonment" value={analytics.discoveryAbandonment} suffix="%" note="Started but not completed" />
      <JourneyMetric label="Recommended match" value={analytics.stateMatchRate} suffix="%" note="Recommended State was chosen" />
      <JourneyMetric label="7 / 30 day return" value={analytics.return7Rate} suffix={`% / ${analytics.return30Rate}%`} note="Returned after the first 24 hours" />
    </div>

    <div className="admin-analytics-grid">
      <article className="admin-chart-card"><div className="admin-card-heading"><div><p className="admin-kicker">Journey</p><h2>Guest funnel</h2></div><span>Unique guests</span></div><div className="admin-funnel">{analytics.funnel.map((step, index) => { const base = analytics.funnel[0]?.value || 0; const width = base ? Math.max(8, Math.round((step.value / base) * 100)) : 0; return <div className="admin-funnel-row" key={step.label}><div><span>{step.label}</span><strong>{step.value}</strong></div><div className="admin-funnel-track"><span style={{ width: `${width}%`, opacity: 1 - index * .1 }} /></div></div>; })}</div><p className="admin-definition">Property-filtered activation opens may be lower because an unopened invitation is not yet attached to a property event.</p></article>
      <article className="admin-chart-card"><div className="admin-card-heading"><div><p className="admin-kicker">Activity</p><h2>Tracked interactions</h2></div><span>Internal traffic {includeInternal ? "included" : "excluded"}</span></div><div className="admin-event-trend">{analytics.trend.map((bucket) => { const max = Math.max(1, ...analytics.trend.map((item) => item.value)); return <div key={bucket.label}><span style={{ height: `${Math.max(bucket.value ? 5 : 0, bucket.value / max * 100)}%` }} title={`${bucket.value} events`} /><small>{bucket.label}</small></div>; })}</div><p className="admin-definition">Only allow-listed interaction names and numeric State references are collected. Free-text guest reflections are excluded.</p></article>
    </div>

    <article className="admin-comparison-card"><div className="admin-card-heading"><div><p className="admin-kicker">Exploration</p><h2>Most viewed hospitality worlds</h2></div><span>World detail views</span></div><div className="admin-world-ranking">{analytics.worlds.map((item, index) => { const world = getWorld(item.worldNumber); return <div key={item.worldNumber}><span>{index + 1}</span><p><strong>{world.state}</strong><small>{world.property} · {world.country}</small></p><em>{item.views}</em></div>; })}{!analytics.worlds.length && <p className="admin-empty">No world exploration events exist for this period.</p>}</div></article>
  </section>;
}

function JourneyMetric({ label, value, suffix = "", note }: { label: string; value: number; suffix?: string; note: string }) {
  return <article className="admin-metric-card compact"><span>{label}</span><strong>{value}{suffix}</strong><p>{note}</p></article>;
}
