import "server-only";

import { redirect } from "next/navigation";
import { createAdminClient } from "./supabase/admin";
import { createClient } from "./supabase/server";

export const ADMIN_ROLES = [
  "super_admin",
  "property_admin",
  "property_staff",
  "analyst",
] as const;

export type AdminRole = (typeof ADMIN_ROLES)[number];

export type AdminProperty = {
  id: string;
  slug: string;
  name: string;
  country: string | null;
  worldNumber: number;
  isActive: boolean;
};

export type AdminMembership = {
  id: string;
  propertyId: string | null;
  role: AdminRole;
};

export type AdminContext = {
  user: {
    id: string;
    email: string;
    fullName: string;
  };
  memberships: AdminMembership[];
  properties: AdminProperty[];
  isSuperAdmin: boolean;
};

type MembershipRow = {
  id: string;
  property_id: string | null;
  role: AdminRole;
};

type PropertyRow = {
  id: string;
  slug: string;
  name: string;
  country: string | null;
  world_number: number;
  is_active: boolean;
};

export async function getAdminContext(): Promise<AdminContext | null> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData.user) return null;

  // Authorization is resolved on the server against the verified session user.
  // The admin client avoids turning an RLS/configuration error into a false
  // "membership not assigned" result while the user_id filter keeps the lookup
  // strictly scoped to the current account.
  const admin = createAdminClient();
  const { data: membershipRows, error: membershipError } = await admin
    .from("admin_memberships")
    .select("id, property_id, role")
    .eq("user_id", userData.user.id)
    .eq("is_active", true);

  if (membershipError) {
    throw new Error(`Unable to verify admin membership: ${membershipError.message}`);
  }

  if (!membershipRows?.length) return null;

  const memberships = (membershipRows as MembershipRow[]).map((membership) => ({
    id: membership.id,
    propertyId: membership.property_id,
    role: membership.role,
  }));
  const isSuperAdmin = memberships.some((membership) => membership.role === "super_admin");
  const propertyIds = memberships
    .map((membership) => membership.propertyId)
    .filter((id): id is string => Boolean(id));

  let propertyQuery = admin
    .from("properties")
    .select("id, slug, name, country, world_number, is_active")
    .order("world_number");

  if (!isSuperAdmin) propertyQuery = propertyQuery.in("id", propertyIds);

  const { data: propertyRows, error: propertyError } = await propertyQuery;
  if (propertyError) throw new Error(`Unable to load admin properties: ${propertyError.message}`);

  return {
    user: {
      id: userData.user.id,
      email: userData.user.email || "",
      fullName: userData.user.user_metadata.full_name
        || userData.user.user_metadata.name
        || userData.user.email
        || "Administrator",
    },
    memberships,
    properties: ((propertyRows || []) as PropertyRow[]).map((property) => ({
      id: property.id,
      slug: property.slug,
      name: property.name,
      country: property.country,
      worldNumber: property.world_number,
      isActive: property.is_active,
    })),
    isSuperAdmin,
  };
}

export async function requireAdmin(options: { requireMfa?: boolean } = {}) {
  const context = await getAdminContext();
  if (!context) redirect("/admin/unauthorized");

  if (options.requireMfa !== false) {
    const supabase = await createClient();
    const { data: assurance, error } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (error || assurance.currentLevel !== "aal2") redirect("/admin/security");
  }

  return context;
}

export async function requirePropertyAccess(propertyId: string) {
  const context = await requireAdmin();
  if (!context.isSuperAdmin && !context.properties.some((property) => property.id === propertyId)) {
    redirect("/admin/unauthorized?reason=property");
  }
  return context;
}

export async function requireAdminRole(roles: readonly AdminRole[]) {
  const context = await requireAdmin();
  const allowed = context.memberships.some((membership) => roles.includes(membership.role));
  if (!allowed) redirect("/admin/unauthorized?reason=role");
  return context;
}

export function canOperateProperty(context: AdminContext, propertyId: string) {
  if (context.isSuperAdmin) return true;
  return context.memberships.some((membership) =>
    membership.propertyId === propertyId
    && (membership.role === "property_admin" || membership.role === "property_staff"),
  );
}

export async function recordAdminAudit(input: {
  action: string;
  resourceType: string;
  resourceId?: string;
  propertyId?: string;
  metadata?: Record<string, unknown>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("record_admin_audit", {
    p_action: input.action,
    p_resource_type: input.resourceType,
    p_resource_id: input.resourceId || null,
    p_property_id: input.propertyId || null,
    p_metadata: input.metadata || {},
  });

  if (error) throw new Error(`Unable to record admin audit event: ${error.message}`);
  return data as number;
}
