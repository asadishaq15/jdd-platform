import PropertyWorldGrid from "../../../../components/admin/PropertyWorldGrid";
import { requireAdmin } from "../../../../lib/admin-auth";

export default async function AdminPropertiesPage() {
  const context = await requireAdmin();
  return (
    <section>
      <div className="admin-page-heading">
        <div>
          <p className="admin-kicker">Network</p>
          <h1>Properties</h1>
          <p>The hospitality worlds available within your administrative scope. Open a card to view State details.</p>
        </div>
        <span className="admin-access-badge">{context.properties.length} properties</span>
      </div>
      <PropertyWorldGrid properties={context.properties} />
    </section>
  );
}
