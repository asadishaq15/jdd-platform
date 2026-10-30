import PmsConnectionForm from "../../../../components/admin/PmsConnectionForm";
import { requireAdmin } from "../../../../lib/admin-auth";
import { loadPmsIntegrations } from "../../../../lib/pms-connections";

type IntegrationsPageProps = {
  searchParams: Promise<{ property?: string }>;
};

const PROVIDER_LABELS = {
  cloudbeds: "Cloudbeds",
  mews: "Mews",
} as const;

export default async function AdminIntegrationsPage({ searchParams }: IntegrationsPageProps) {
  const context = await requireAdmin();
  const params = await searchParams;
  const integrations = await loadPmsIntegrations(context, params.property);
  const connectedCount = integrations.filter((item) => item.connection?.status === "connected").length;
  const singleProperty = integrations.length === 1 ? integrations[0] : null;

  return (
    <section>
      <div className="admin-page-heading">
        <div>
          <p className="admin-kicker">Network</p>
          <h1>Integrations</h1>
          <p>
            Connect each property to Cloudbeds or Mews with a manual API token.
            Guest name, email, and checkout will sync here once live PMS adapters ship.
          </p>
        </div>
        <span className="admin-access-badge">
          {connectedCount} connected · {integrations.length - connectedCount} not connected
        </span>
      </div>

      {singleProperty ? (
        <PmsConnectionForm
          propertyId={singleProperty.property.id}
          propertyName={singleProperty.property.name}
          connection={singleProperty.connection}
          canManage={singleProperty.canManage}
        />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Provider</th>
                <th>External ID</th>
                <th>Status</th>
                <th>Last sync</th>
                <th>Connection</th>
              </tr>
            </thead>
            <tbody>
              {integrations.map((item) => {
                const connection = item.connection;
                const status = connection?.status || "disconnected";
                const statusClass = status === "connected"
                  ? "success"
                  : status === "error"
                    ? "expired"
                    : "neutral";

                return (
                  <tr key={item.property.id}>
                    <td>
                      <strong>{item.property.name}</strong>
                      <small>World {item.property.worldNumber}</small>
                    </td>
                    <td>{connection ? PROVIDER_LABELS[connection.provider] : "—"}</td>
                    <td>
                      {connection?.externalPropertyId || "—"}
                      {connection?.tokenLastFour && (
                        <small>Token ••••{connection.tokenLastFour}</small>
                      )}
                    </td>
                    <td>
                      <span className={`admin-status ${statusClass}`}>
                        {statusLabel(status)}
                      </span>
                    </td>
                    <td>{formatSync(connection?.lastSyncAt ?? null)}</td>
                    <td>
                      <PmsConnectionForm
                        propertyId={item.property.id}
                        propertyName={item.property.name}
                        connection={connection}
                        canManage={item.canManage}
                        compact
                      />
                    </td>
                  </tr>
                );
              })}
              {!integrations.length && (
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
    </section>
  );
}

function statusLabel(status: string) {
  if (status === "connected") return "Connected";
  if (status === "error") return "Error";
  return "Not connected";
}

function formatSync(value: string | null) {
  if (!value) return "Not synced yet";
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}
