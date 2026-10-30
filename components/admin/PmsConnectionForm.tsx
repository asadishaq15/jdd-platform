"use client";

import { useActionState } from "react";
import {
  disconnectPmsConnection,
  savePmsConnection,
  type PmsConnectionActionState,
  type PmsConnectionView,
  type PmsProvider,
} from "../../lib/pms-connections";

const initialState: PmsConnectionActionState = {};

const PROVIDER_LABELS: Record<PmsProvider, string> = {
  cloudbeds: "Cloudbeds",
  mews: "Mews",
};

export default function PmsConnectionForm({
  propertyId,
  propertyName,
  connection,
  canManage,
  compact = false,
}: {
  propertyId: string;
  propertyName: string;
  connection: PmsConnectionView | null;
  canManage: boolean;
  compact?: boolean;
}) {
  const isConnected = connection?.status === "connected";

  if (!canManage) {
    return (
      <div className={compact ? "admin-pms-readonly" : "admin-pms-card"}>
        {!compact && <PmsStatusSummary propertyName={propertyName} connection={connection} />}
        <span className="admin-muted">Read only</span>
      </div>
    );
  }

  return (
    <div className={compact ? "admin-pms-actions" : "admin-pms-card"}>
      {!compact && <PmsStatusSummary propertyName={propertyName} connection={connection} />}
      {isConnected ? (
        <ConnectedActions propertyId={propertyId} connection={connection!} compact={compact} />
      ) : (
        <ConnectForm propertyId={propertyId} connection={connection} compact={compact} />
      )}
    </div>
  );
}

function PmsStatusSummary({
  propertyName,
  connection,
}: {
  propertyName: string;
  connection: PmsConnectionView | null;
}) {
  const status = connection?.status || "disconnected";
  const statusClass = status === "connected"
    ? "success"
    : status === "error"
      ? "expired"
      : "neutral";

  return (
    <div className="admin-pms-summary">
      <div>
        <p className="admin-kicker">PMS connection</p>
        <h2>{propertyName}</h2>
        <p>
          We store credentials for guest name, email, and checkout.
          OAuth and live sync come later.
        </p>
      </div>
      <span className={`admin-status ${statusClass}`}>{statusLabel(status)}</span>
      {connection?.status === "connected" && (
        <dl className="admin-pms-meta">
          <div><dt>Provider</dt><dd>{PROVIDER_LABELS[connection.provider]}</dd></div>
          <div><dt>External ID</dt><dd>{connection.externalPropertyId}</dd></div>
          <div><dt>Token</dt><dd>••••{connection.tokenLastFour}</dd></div>
          <div><dt>Last sync</dt><dd>{formatSync(connection.lastSyncAt)}</dd></div>
        </dl>
      )}
      {connection?.lastError && (
        <p className="admin-action-error" role="alert">{connection.lastError}</p>
      )}
    </div>
  );
}

function ConnectForm({
  propertyId,
  connection,
  compact,
}: {
  propertyId: string;
  connection: PmsConnectionView | null;
  compact: boolean;
}) {
  const [state, action, pending] = useActionState(savePmsConnection, initialState);

  return (
    <form className={compact ? "admin-inline-form admin-pms-form" : "admin-pms-form"} action={action}>
      <input type="hidden" name="propertyId" value={propertyId} />
      <label>
        <span>Provider</span>
        <select name="provider" defaultValue={connection?.provider || "cloudbeds"} required>
          <option value="cloudbeds">Cloudbeds</option>
          <option value="mews">Mews</option>
        </select>
      </label>
      <label>
        <span>External property / enterprise ID</span>
        <input
          name="externalPropertyId"
          defaultValue={connection?.externalPropertyId || ""}
          placeholder="PMS property ID"
          required
          maxLength={120}
          autoComplete="off"
        />
      </label>
      <label>
        <span>Access token</span>
        <input
          name="accessToken"
          type="password"
          placeholder="Paste API token"
          required
          maxLength={4000}
          autoComplete="off"
        />
      </label>
      <button type="submit" disabled={pending}>
        {pending ? "Saving…" : connection ? "Reconnect" : "Connect"}
      </button>
      {state.error && <p className="admin-action-error" role="alert">{state.error}</p>}
      {state.success && <p className="admin-action-success" role="status">{state.success}</p>}
    </form>
  );
}

function ConnectedActions({
  propertyId,
  connection,
  compact,
}: {
  propertyId: string;
  connection: PmsConnectionView;
  compact: boolean;
}) {
  const [disconnectState, disconnectAction, disconnectPending] = useActionState(
    disconnectPmsConnection,
    initialState,
  );
  const [saveState, saveAction, savePending] = useActionState(savePmsConnection, initialState);

  return (
    <div className="admin-pms-connected-actions">
      {compact && (
        <p className="admin-muted">
          {PROVIDER_LABELS[connection.provider]} · ••••{connection.tokenLastFour}
        </p>
      )}
      <form action={disconnectAction}>
        <input type="hidden" name="propertyId" value={propertyId} />
        <button
          className="admin-danger-link"
          type="submit"
          disabled={disconnectPending}
        >
          {disconnectPending ? "Disconnecting…" : "Disconnect"}
        </button>
      </form>
      <details className="admin-pms-reconnect">
        <summary>Replace token</summary>
        <form className={compact ? "admin-inline-form admin-pms-form" : "admin-pms-form"} action={saveAction}>
          <input type="hidden" name="propertyId" value={propertyId} />
          <label>
            <span>Provider</span>
            <select name="provider" defaultValue={connection.provider} required>
              <option value="cloudbeds">Cloudbeds</option>
              <option value="mews">Mews</option>
            </select>
          </label>
          <label>
            <span>External property / enterprise ID</span>
            <input
              name="externalPropertyId"
              defaultValue={connection.externalPropertyId}
              required
              maxLength={120}
              autoComplete="off"
            />
          </label>
          <label>
            <span>Access token</span>
            <input
              name="accessToken"
              type="password"
              placeholder="Paste new API token"
              required
              maxLength={4000}
              autoComplete="off"
            />
          </label>
          <button type="submit" disabled={savePending}>
            {savePending ? "Saving…" : "Reconnect"}
          </button>
        </form>
      </details>
      {(disconnectState.error || saveState.error) && (
        <p className="admin-action-error" role="alert">
          {disconnectState.error || saveState.error}
        </p>
      )}
      {(disconnectState.success || saveState.success) && (
        <p className="admin-action-success" role="status">
          {disconnectState.success || saveState.success}
        </p>
      )}
    </div>
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
