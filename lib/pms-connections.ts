"use server";

import { revalidatePath } from "next/cache";
import {
  canManagePmsConnection,
  recordAdminAudit,
  requireAdmin,
  type AdminContext,
  type AdminProperty,
} from "./admin-auth";
import { createAdminClient } from "./supabase/admin";

const PMS_PROVIDERS = ["cloudbeds", "mews"] as const;
export type PmsProvider = (typeof PMS_PROVIDERS)[number];
export type PmsConnectionStatus = "connected" | "disconnected" | "error";

export type PmsConnectionView = {
  id: string;
  propertyId: string;
  provider: PmsProvider;
  externalPropertyId: string;
  tokenLastFour: string | null;
  status: PmsConnectionStatus;
  lastSyncAt: string | null;
  lastError: string | null;
  connectedAt: string | null;
};

export type PmsPropertyIntegration = {
  property: AdminProperty;
  connection: PmsConnectionView | null;
  canManage: boolean;
};

export type PmsConnectionActionState = {
  error?: string;
  success?: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type PmsConnectionRow = {
  id: string;
  property_id: string;
  provider: PmsProvider;
  external_property_id: string;
  token_last_four: string | null;
  status: PmsConnectionStatus;
  last_sync_at: string | null;
  last_error: string | null;
  connected_at: string | null;
};

function isPmsProvider(value: string): value is PmsProvider {
  return (PMS_PROVIDERS as readonly string[]).includes(value);
}

function tokenLastFour(token: string) {
  const trimmed = token.trim();
  if (trimmed.length >= 4) return trimmed.slice(-4);
  return trimmed.padStart(4, "•");
}

function mapConnection(row: PmsConnectionRow): PmsConnectionView {
  return {
    id: row.id,
    propertyId: row.property_id,
    provider: row.provider,
    externalPropertyId: row.external_property_id,
    tokenLastFour: row.token_last_four,
    status: row.status,
    lastSyncAt: row.last_sync_at,
    lastError: row.last_error,
    connectedAt: row.connected_at,
  };
}

function providerLabel(provider: PmsProvider) {
  return provider === "cloudbeds" ? "Cloudbeds" : "Mews";
}

export async function loadPmsIntegrations(
  context: AdminContext,
  propertyFilter?: string | null,
): Promise<PmsPropertyIntegration[]> {
  const selectedProperty = propertyFilter
    && context.properties.some((property) => property.id === propertyFilter)
    ? propertyFilter
    : null;
  const properties = selectedProperty
    ? context.properties.filter((property) => property.id === selectedProperty)
    : context.properties;

  if (!properties.length) return [];

  const propertyIds = properties.map((property) => property.id);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pms_connections")
    .select("id, property_id, provider, external_property_id, token_last_four, status, last_sync_at, last_error, connected_at")
    .in("property_id", propertyIds);

  if (error) throw new Error(`Unable to load PMS connections: ${error.message}`);

  const byProperty = new Map(
    ((data || []) as PmsConnectionRow[]).map((row) => [row.property_id, mapConnection(row)]),
  );

  return properties.map((property) => ({
    property,
    connection: byProperty.get(property.id) || null,
    canManage: canManagePmsConnection(context, property.id),
  }));
}

export async function countPmsConnections(
  context: AdminContext,
  propertyFilter?: string | null,
) {
  const integrations = await loadPmsIntegrations(context, propertyFilter);
  const connected = integrations.filter((item) => item.connection?.status === "connected").length;
  return {
    connected,
    total: integrations.length,
    notConnected: integrations.length - connected,
  };
}

export async function savePmsConnection(
  _previousState: PmsConnectionActionState,
  formData: FormData,
): Promise<PmsConnectionActionState> {
  const context = await requireAdmin();
  const propertyId = String(formData.get("propertyId") || "");
  const providerRaw = String(formData.get("provider") || "").trim().toLowerCase();
  const externalPropertyId = String(formData.get("externalPropertyId") || "").trim();
  const accessToken = String(formData.get("accessToken") || "").trim();

  if (!UUID_PATTERN.test(propertyId)) return { error: "Invalid property." };
  if (!canManagePmsConnection(context, propertyId)) {
    return { error: "You do not have permission to manage this PMS connection." };
  }
  if (!isPmsProvider(providerRaw)) return { error: "Choose Cloudbeds or Mews." };
  if (!externalPropertyId || externalPropertyId.length > 120) {
    return { error: "Enter a valid external property or enterprise ID." };
  }
  if (!accessToken || accessToken.length > 4000) {
    return { error: "Paste a valid access token." };
  }

  const now = new Date().toISOString();
  const lastFour = tokenLastFour(accessToken);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("pms_connections")
    .upsert(
      {
        property_id: propertyId,
        provider: providerRaw,
        external_property_id: externalPropertyId,
        access_token: accessToken,
        token_last_four: lastFour,
        status: "connected",
        last_error: null,
        connected_by: context.user.id,
        connected_at: now,
      },
      { onConflict: "property_id" },
    )
    .select("id")
    .maybeSingle();

  if (error) return { error: error.message || "Unable to save PMS connection." };

  await recordAdminAudit({
    action: "pms.connected",
    resourceType: "pms_connection",
    resourceId: data?.id,
    propertyId,
    metadata: {
      provider: providerRaw,
      external_property_id: externalPropertyId,
      token_last_four: lastFour,
    },
  });

  revalidatePath("/admin/integrations");
  revalidatePath("/admin/overview");
  return { success: `${providerLabel(providerRaw)} connected. Live sync is not enabled yet.` };
}

export async function disconnectPmsConnection(
  _previousState: PmsConnectionActionState,
  formData: FormData,
): Promise<PmsConnectionActionState> {
  const context = await requireAdmin();
  const propertyId = String(formData.get("propertyId") || "");

  if (!UUID_PATTERN.test(propertyId)) return { error: "Invalid property." };
  if (!canManagePmsConnection(context, propertyId)) {
    return { error: "You do not have permission to manage this PMS connection." };
  }

  const admin = createAdminClient();
  const { data: existing, error: loadError } = await admin
    .from("pms_connections")
    .select("id, provider")
    .eq("property_id", propertyId)
    .maybeSingle();

  if (loadError) return { error: loadError.message };
  if (!existing) return { error: "No PMS connection found for this property." };

  const { error } = await admin
    .from("pms_connections")
    .update({
      access_token: null,
      token_last_four: null,
      status: "disconnected",
      last_error: null,
    })
    .eq("property_id", propertyId);

  if (error) return { error: error.message || "Unable to disconnect PMS." };

  await recordAdminAudit({
    action: "pms.disconnected",
    resourceType: "pms_connection",
    resourceId: existing.id,
    propertyId,
    metadata: { provider: existing.provider },
  });

  revalidatePath("/admin/integrations");
  revalidatePath("/admin/overview");
  return { success: "PMS connection disconnected." };
}
