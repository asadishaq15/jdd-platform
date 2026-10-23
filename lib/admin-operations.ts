"use server";

import { revalidatePath } from "next/cache";
import { canOperateProperty, getAdminContext, recordAdminAudit, requireAdminRole } from "./admin-auth";
import { createAdminClient } from "./supabase/admin";
import { createClient } from "./supabase/server";

export type ActivationActionState = {
  error?: string;
  activationUrl?: string;
  expiresAt?: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AdminInviteActionState = { error?: string; success?: string };

async function getAuthorizedStay(stayId: string) {
  if (!UUID_PATTERN.test(stayId)) return { error: "Invalid stay identifier." } as const;

  const context = await getAdminContext();
  if (!context) return { error: "Administrator access is required." } as const;

  const admin = createAdminClient();
  const { data: stay, error } = await admin
    .from("stays")
    .select("id, property_id, guest_name, guest_email")
    .eq("id", stayId)
    .maybeSingle();

  if (error || !stay) return { error: "Stay not found." } as const;
  if (!canOperateProperty(context, stay.property_id)) {
    return { error: "You do not have permission to manage this property." } as const;
  }

  return { context, admin, stay } as const;
}

export async function createActivationLink(
  _previousState: ActivationActionState,
  formData: FormData,
): Promise<ActivationActionState> {
  const stayId = String(formData.get("stayId") || "");
  const expiryDays = Number(formData.get("expiryDays") || 7);
  if (!Number.isInteger(expiryDays) || expiryDays < 1 || expiryDays > 30) {
    return { error: "Expiry must be between 1 and 30 days." };
  }

  const authorized = await getAuthorizedStay(stayId);
  if ("error" in authorized) return { error: authorized.error };

  const expiresAt = new Date(Date.now() + expiryDays * 86_400_000).toISOString();
  const { data, error } = await authorized.admin.rpc("create_guest_activation", {
    p_stay_id: stayId,
    p_expires_at: expiresAt,
  });

  if (error || !data?.[0]?.token) {
    return { error: error?.message || "Supabase did not return an activation link." };
  }

  await recordAdminAudit({
    action: "activation.created",
    resourceType: "stay",
    resourceId: stayId,
    propertyId: authorized.stay.property_id,
    metadata: { expires_at: data[0].expires_at, expiry_days: expiryDays },
  });

  revalidatePath("/admin/stays");
  revalidatePath("/admin/activations");

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const activationUrl = new URL(`/activate/${data[0].token}`, siteUrl).toString();
  return { activationUrl, expiresAt: data[0].expires_at };
}

export async function revokeActivationLink(formData: FormData) {
  const activationId = String(formData.get("activationId") || "");
  if (!UUID_PATTERN.test(activationId)) return;

  const admin = createAdminClient();
  const { data: activation } = await admin
    .from("guest_activation_links")
    .select("id, stay_id, consumed_at, revoked_at")
    .eq("id", activationId)
    .maybeSingle();

  if (!activation || activation.consumed_at || activation.revoked_at) return;
  const authorized = await getAuthorizedStay(activation.stay_id);
  if ("error" in authorized) return;

  const { error } = await admin
    .from("guest_activation_links")
    .update({ revoked_at: new Date().toISOString() })
    .eq("id", activationId)
    .is("consumed_at", null)
    .is("revoked_at", null);

  if (error) throw new Error(`Unable to revoke activation: ${error.message}`);

  await recordAdminAudit({
    action: "activation.revoked",
    resourceType: "guest_activation_link",
    resourceId: activationId,
    propertyId: authorized.stay.property_id,
    metadata: { stay_id: activation.stay_id },
  });

  revalidatePath("/admin/stays");
  revalidatePath("/admin/activations");
}

export async function inviteAdminAccount(
  _previousState: AdminInviteActionState,
  formData: FormData,
): Promise<AdminInviteActionState> {
  const context = await requireAdminRole(["super_admin"]);
  const accountType = String(formData.get("accountType") || "property");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const fullName = String(formData.get("fullName") || "").trim();
  const propertyId = String(formData.get("propertyId") || "");

  if (!EMAIL_PATTERN.test(email)) return { error: "Enter a valid email address." };
  if (fullName.length < 2) return { error: "Enter the account holder's full name." };
  if (accountType !== "staff" && accountType !== "property") return { error: "Choose a valid account type." };
  if (accountType === "property" && !UUID_PATTERN.test(propertyId)) return { error: "Choose a property." };

  const admin = createAdminClient();
  let propertyName = "all properties";
  if (accountType === "property") {
    const { data: property, error: propertyError } = await admin.from("properties").select("id, name").eq("id", propertyId).maybeSingle();
    if (propertyError || !property) return { error: "The selected property was not found." };
    propertyName = property.name;
    const { data: assigned, error: assignedError } = await admin.from("admin_memberships").select("id").eq("property_id", propertyId).eq("is_active", true).maybeSingle();
    if (assignedError) return { error: assignedError.message };
    if (assigned) return { error: `${property.name} already has an active account. Revoke it before inviting a replacement.` };
  }

  const existingUser = await findAuthUserByEmail(admin, email);
  if (existingUser) return { error: "That email already belongs to an account. Use a new property email address." };

  const callback = new URL("/auth/callback", process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000");
  callback.searchParams.set("next", "/admin/security?welcome=1");
  const { data: invitation, error: inviteError } = await admin.auth.admin.inviteUserByEmail(email, {
    redirectTo: callback.toString(),
    data: { full_name: fullName, account_type: accountType, property_id: accountType === "property" ? propertyId : null },
  });
  if (inviteError || !invitation.user) return { error: inviteError?.message || "Supabase did not create the invited account." };

  const { error: membershipError } = await admin.from("admin_memberships").insert({
    user_id: invitation.user.id,
    property_id: accountType === "property" ? propertyId : null,
    role: accountType === "property" ? "property_admin" : "super_admin",
    created_by: context.user.id,
  });
  if (membershipError) {
    await admin.auth.admin.deleteUser(invitation.user.id);
    return { error: membershipError.message };
  }

  await recordAdminAudit({
    action: "admin.invited",
    resourceType: "admin_membership",
    resourceId: invitation.user.id,
    propertyId: accountType === "property" ? propertyId : undefined,
    metadata: { account_type: accountType, email },
  });
  revalidatePath("/admin/access");
  return { success: `Invitation sent to ${email} for ${propertyName}.` };
}

export async function revokeAdminAccount(formData: FormData) {
  await requireAdminRole(["super_admin"]);
  const membershipId = String(formData.get("membershipId") || "");
  if (!UUID_PATTERN.test(membershipId)) return;
  const admin = createAdminClient();
  const { data: membership } = await admin.from("admin_memberships").select("id, user_id, property_id, role").eq("id", membershipId).maybeSingle();
  if (!membership || membership.role === "super_admin") return;
  const { error } = await admin.from("admin_memberships").update({ is_active: false }).eq("id", membershipId);
  if (error) throw new Error(`Unable to revoke the property account: ${error.message}`);
  await recordAdminAudit({ action: "admin.revoked", resourceType: "admin_membership", resourceId: membershipId, propertyId: membership.property_id || undefined, metadata: { user_id: membership.user_id } });
  revalidatePath("/admin/access");
}

export async function updateCardOrderStatus(formData: FormData) {
  const context = await getAdminContext();
  if (!context) return;
  const supabase = await createClient();
  const { data: assurance } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
  if (assurance?.currentLevel !== "aal2") return;
  const orderId = String(formData.get("orderId") || "");
  const status = String(formData.get("status") || "");
  if (!UUID_PATTERN.test(orderId) || !["requested", "preparing", "sent", "delivered", "received", "cancelled"].includes(status)) return;
  const admin = createAdminClient();
  const { data: order } = await admin.from("card_orders").select("id, property_id").eq("id", orderId).maybeSingle();
  if (!order || !canOperateProperty(context, order.property_id)) return;
  const { error } = await admin.from("card_orders").update({ status }).eq("id", orderId);
  if (error) throw new Error(`Unable to update the order: ${error.message}`);
  await recordAdminAudit({ action: "card_order.status_updated", resourceType: "card_order", resourceId: orderId, propertyId: order.property_id, metadata: { status } });
  revalidatePath("/admin/orders");
  revalidatePath("/admin/overview");
}

async function findAuthUserByEmail(admin: ReturnType<typeof createAdminClient>, email: string) {
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    const match = data.users.find((user) => user.email?.toLowerCase() === email);
    if (match) return match;
    if (data.users.length < 1000) return null;
    page += 1;
  }
}
