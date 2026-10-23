import { requireAdmin } from "../../../../lib/admin-auth";
import { getOverviewRange } from "../../../../lib/admin-analytics";
import { loadFeedbackAnalytics } from "../../../../lib/feedback-analytics";

type FeedbackPageProps = { searchParams: Promise<{ property?: string; range?: string }> };

export default async function AdminFeedbackPage({ searchParams }: FeedbackPageProps) {
  const context = await requireAdmin();
  const params = await searchParams;
  const range = getOverviewRange(params.range);
  const analytics = await loadFeedbackAnalytics(context, range, params.property);

  return <section>
    <div className="admin-page-heading">
      <div><p className="admin-kicker">Guest voice</p><h1>Feedback</h1><p>Post-stay responses for checkout cohorts · {range.label}</p></div>
      <form className="admin-range-filter" method="get">{params.property && <input type="hidden" name="property" value={params.property} />}<label><span>Period</span><select name="range" defaultValue={range.key}><option value="7">Last 7 days</option><option value="30">Last 30 days</option><option value="90">Last 90 days</option><option value="365">Last 12 months</option></select></label><button type="submit">Apply</button></form>
    </div>

    <div className="admin-feedback-summary">
      <article><span>Response rate</span><strong>{analytics.responseRate}%</strong><p>{analytics.responses} responses from {analytics.eligibleStays} eligible stays</p></article>
      <article className="admin-sentiment-card"><div className="admin-card-heading"><div><p className="admin-kicker">Distribution</p><h2>How guests felt</h2></div><span>{analytics.responses} responses</span></div><div className="admin-sentiment-bar">{analytics.distribution.map((item) => <span className={item.sentiment} style={{ width: `${item.percentage}%` }} key={item.sentiment} title={`${item.label}: ${item.percentage}%`} />)}</div><div className="admin-sentiment-legend">{analytics.distribution.map((item) => <div key={item.sentiment}><i className={item.sentiment} /><span>{item.label}</span><strong>{item.percentage}%</strong><small>{item.count}</small></div>)}</div></article>
    </div>

    <article className="admin-comparison-card"><div className="admin-card-heading"><div><p className="admin-kicker">Properties</p><h2>Response comparison</h2></div><span>Positive = felt at home or some parts felt right</span></div><div className="admin-table-wrap borderless"><table className="admin-table"><thead><tr><th>Property</th><th>Eligible stays</th><th>Responses</th><th>Response rate</th><th>Positive sentiment</th></tr></thead><tbody>{analytics.properties.map((property) => <tr key={property.id}><td><strong>{property.name}</strong></td><td>{property.eligible}</td><td>{property.responses}</td><td>{property.responseRate}%</td><td>{property.positiveRate}%</td></tr>)}{!analytics.properties.length && <tr><td className="admin-empty" colSpan={5}>No eligible checkout stays exist for this period.</td></tr>}</tbody></table></div></article>

    <article className="admin-comments-card"><div className="admin-card-heading"><div><p className="admin-kicker">Optional reflections</p><h2>Anonymous comments</h2></div><span>Identity is never displayed</span></div>{analytics.commentsSuppressed ? <p className="admin-privacy-empty">Comments are hidden until this cohort has at least five responses.</p> : analytics.comments.length ? <div className="admin-comment-list">{analytics.comments.map((comment, index) => <blockquote key={`${comment.submittedAt}-${index}`}><p>“{comment.comment}”</p><footer>{comment.property} · {formatDate(comment.submittedAt)}</footer></blockquote>)}</div> : <p className="admin-privacy-empty">No optional comments were submitted in this period.</p>}</article>
  </section>;
}

function formatDate(value: string) { return new Intl.DateTimeFormat("en", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value)); }
