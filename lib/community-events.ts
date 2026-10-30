"use server";

import { revalidatePath } from "next/cache";
import {
  canOperateProperty,
  recordAdminAudit,
  requireAdmin,
  type AdminContext,
  type AdminProperty,
} from "./admin-auth";
import { createAdminClient } from "./supabase/admin";

export type CommunityEventCategory = "event" | "invite" | "news";

export type CommunityEventView = {
  id: string;
  propertyId: string;
  category: CommunityEventCategory;
  title: string;
  timing: string;
  body: string;
  isPublished: boolean;
  updatedAt: string;
};

export type CommunityPropertyBoard = {
  property: AdminProperty;
  events: Partial<Record<CommunityEventCategory, CommunityEventView>>;
  canManage: boolean;
};

export type CommunityEventActionState = {
  error?: string;
  success?: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const CATEGORIES = ["event", "invite", "news"] as const;

type CommunityEventRow = {
  id: string;
  property_id: string;
  category: CommunityEventCategory;
  title: string;
  timing: string;
  body: string;
  is_published: boolean;
  updated_at: string;
};

function isCategory(value: string): value is CommunityEventCategory {
  return (CATEGORIES as readonly string[]).includes(value);
}

function mapEvent(row: CommunityEventRow): CommunityEventView {
  return {
    id: row.id,
    propertyId: row.property_id,
    category: row.category,
    title: row.title,
    timing: row.timing,
    body: row.body,
    isPublished: row.is_published,
    updatedAt: row.updated_at,
  };
}

function canManageCommunity(context: AdminContext, propertyId: string) {
  return canOperateProperty(context, propertyId);
}

export async function loadCommunityBoards(
  context: AdminContext,
  propertyFilter?: string | null,
): Promise<CommunityPropertyBoard[]> {
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
    .from("community_events")
    .select("id, property_id, category, title, timing, body, is_published, updated_at")
    .in("property_id", propertyIds)
    .order("updated_at", { ascending: false });

  if (error) throw new Error(`Unable to load community events: ${error.message}`);

  const byProperty = new Map<string, Partial<Record<CommunityEventCategory, CommunityEventView>>>();
  for (const row of (data || []) as CommunityEventRow[]) {
    const bucket = byProperty.get(row.property_id) || {};
    bucket[row.category] = mapEvent(row);
    byProperty.set(row.property_id, bucket);
  }

  return properties.map((property) => ({
    property,
    events: byProperty.get(property.id) || {},
    canManage: canManageCommunity(context, property.id),
  }));
}

export async function upsertCommunityEvent(
  _previousState: CommunityEventActionState,
  formData: FormData,
): Promise<CommunityEventActionState> {
  const context = await requireAdmin();
  const propertyId = String(formData.get("propertyId") || "");
  const categoryRaw = String(formData.get("category") || "").trim().toLowerCase();
  const title = String(formData.get("title") || "").trim();
  const timing = String(formData.get("timing") || "").trim();
  const body = String(formData.get("body") || "").trim();
  const isPublished = String(formData.get("isPublished") || "") === "on"
    || String(formData.get("isPublished") || "") === "true";

  if (!UUID_PATTERN.test(propertyId)) return { error: "Invalid property." };
  if (!canManageCommunity(context, propertyId)) {
    return { error: "You do not have permission to manage community events for this property." };
  }
  if (!isCategory(categoryRaw)) return { error: "Choose Event, Guest invitation, or News." };
  if (title.length < 2 || title.length > 160) return { error: "Title must be between 2 and 160 characters." };
  if (timing.length < 1 || timing.length > 120) return { error: "Enter timing or schedule text." };
  if (body.length < 1 || body.length > 2000) return { error: "Body must be between 1 and 2000 characters." };

  const admin = createAdminClient();
  const { data: existing, error: loadError } = await admin
    .from("community_events")
    .select("id")
    .eq("property_id", propertyId)
    .eq("category", categoryRaw)
    .maybeSingle();

  if (loadError) return { error: loadError.message };

  let eventId = existing?.id as string | undefined;
  if (existing) {
    const { error } = await admin
      .from("community_events")
      .update({ title, timing, body, is_published: isPublished })
      .eq("id", existing.id);
    if (error) return { error: error.message || "Unable to update community event." };
  } else {
    const { data, error } = await admin
      .from("community_events")
      .insert({
        property_id: propertyId,
        category: categoryRaw,
        title,
        timing,
        body,
        is_published: isPublished,
        created_by: context.user.id,
      })
      .select("id")
      .maybeSingle();
    if (error) return { error: error.message || "Unable to create community event." };
    eventId = data?.id;
  }

  await recordAdminAudit({
    action: "community_event.upserted",
    resourceType: "community_event",
    resourceId: eventId,
    propertyId,
    metadata: { category: categoryRaw, is_published: isPublished },
  });

  revalidatePath("/admin/community");
  return { success: "Community event saved." };
}

export async function deleteCommunityEvent(
  _previousState: CommunityEventActionState,
  formData: FormData,
): Promise<CommunityEventActionState> {
  const context = await requireAdmin();
  const propertyId = String(formData.get("propertyId") || "");
  const categoryRaw = String(formData.get("category") || "").trim().toLowerCase();

  if (!UUID_PATTERN.test(propertyId)) return { error: "Invalid property." };
  if (!canManageCommunity(context, propertyId)) {
    return { error: "You do not have permission to manage community events for this property." };
  }
  if (!isCategory(categoryRaw)) return { error: "Invalid category." };

  const admin = createAdminClient();
  const { data: existing, error: loadError } = await admin
    .from("community_events")
    .select("id")
    .eq("property_id", propertyId)
    .eq("category", categoryRaw)
    .maybeSingle();

  if (loadError) return { error: loadError.message };
  if (!existing) return { error: "No event found for this category." };

  const { error } = await admin
    .from("community_events")
    .delete()
    .eq("property_id", propertyId)
    .eq("category", categoryRaw);

  if (error) return { error: error.message || "Unable to clear community event." };

  await recordAdminAudit({
    action: "community_event.deleted",
    resourceType: "community_event",
    resourceId: existing.id,
    propertyId,
    metadata: { category: categoryRaw },
  });

  revalidatePath("/admin/community");
  return { success: "Community event cleared." };
}
