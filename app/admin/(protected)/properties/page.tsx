import { requireAdmin } from "../../../../lib/admin-auth";

export default async function AdminPropertiesPage() {
  const context = await requireAdmin();
  return (
    <section>
      <div className="admin-page-heading">
        <div><p className="admin-kicker">Network</p><h1>Properties</h1><p>The hospitality properties available within your administrative scope.</p></div>
        <span className="admin-access-badge">{context.properties.length} properties</span>
      </div>
      <div className="admin-property-grid">
        {context.properties.map((property) => (
          <article key={property.id}>
            <span>World {property.worldNumber}</span>
            <h2>{property.name}</h2>
            <p>{property.country || "Country pending"}</p>
            <small className={`admin-status ${property.isActive ? "success" : "neutral"}`}>{property.isActive ? "Active" : "Inactive"}</small>
          </article>
        ))}
      </div>
    </section>
  );
}
