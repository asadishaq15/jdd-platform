"use server";

import { revalidatePath } from "next/cache";
import { canOperateProperty, getAdminContext, recordAdminAudit, requireAdmin, requireAdminRole } from "./admin-auth";
import { sendGuestActivationEmail } from "./email/guest-activation";
import { createAdminClient } from "./supabase/admin";

export type ActivationActionState = {
  error?: string;
  activationUrl?: string;
  expiresAt?: string;
  guestEmail?: string;
  emailSent?: boolean;
  emailWarning?: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export type AdminInviteActionState = { error?: string; success?: string };

export type ManualStayActionState = { error?: string; success?: string };

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

async function getAuthorizedStay(stayId: string) {
  if (!UUID_PATTERN.test(stayId)) return { error: "Invalid stay identifier." } as const;

  const context = await requireAdmin();

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

  const guestEmail = authorized.stay.guest_email?.trim().toLowerCase() || "";
  if (!EMAIL_PATTERN.test(guestEmail)) {
    return { error: "Add a guest email on this stay before generating an invitation." };
  }

  const { data: property } = await authorized.admin
    .from("properties")
    .select("name")
    .eq("id", authorized.stay.property_id)
    .maybeSingle();

  const expiresAt = new Date(Date.now() + expiryDays * 86_400_000).toISOString();
  const { data, error } = await authorized.admin.rpc("create_guest_activation", {
    p_stay_id: stayId,
    p_expires_at: expiresAt,
  });

  if (error || !data?.[0]?.token) {
    return { error: error?.message || "Supabase did not return an activation link." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const activationUrl = new URL(`/activate/${data[0].token}`, siteUrl).toString();
  const emailResult = await sendGuestActivationEmail({
    to: guestEmail,
    guestName: authorized.stay.guest_name,
    propertyName: property?.name || "your property",
    activationUrl,
    expiresAt: data[0].expires_at || expiresAt,
  });

  await recordAdminAudit({
    action: "activation.created",
    resourceType: "stay",
    resourceId: stayId,
    propertyId: authorized.stay.property_id,
    metadata: {
      expires_at: data[0].expires_at,
      expiry_days: expiryDays,
      guest_email: guestEmail,
      email_sent: emailResult.sent,
    },
  });

  revalidatePath("/admin/stays");
  revalidatePath("/admin/activations");

  return {
    activationUrl,
    expiresAt: data[0].expires_at,
    guestEmail,
    emailSent: emailResult.sent,
    emailWarning: emailResult.sent ? undefined : emailResult.warning,
  };
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

export async function createManualStay(
  _previousState: ManualStayActionState,
  formData: FormData,
): Promise<ManualStayActionState> {
  const context = await requireAdmin();
  const propertyId = String(formData.get("propertyId") || "");
  const guestName = String(formData.get("guestName") || "").trim();
  const guestEmail = String(formData.get("guestEmail") || "").trim().toLowerCase();
  const checkIn = String(formData.get("checkIn") || "").trim();
  const checkOut = String(formData.get("checkOut") || "").trim();

  if (!UUID_PATTERN.test(propertyId)) return { error: "Choose a property." };
  if (!canOperateProperty(context, propertyId)) {
    return { error: "You do not have permission to manage this property." };
  }
  if (guestName.length < 2 || guestName.length > 120) {
    return { error: "Enter the guest’s full name." };
  }
  if (!EMAIL_PATTERN.test(guestEmail) || guestEmail.length > 254) {
    return { error: "Enter a valid guest email." };
  }
  if (!DATE_PATTERN.test(checkIn) || !DATE_PATTERN.test(checkOut)) {
    return { error: "Enter valid check-in and check-out dates." };
  }
  if (checkOut < checkIn) {
    return { error: "Check-out must be on or after check-in." };
  }

  const admin = createAdminClient();
  const { data: property, error: propertyError } = await admin
    .from("properties")
    .select("id, name")
    .eq("id", propertyId)
    .maybeSingle();
  if (propertyError || !property) return { error: "The selected property was not found." };

  const { data: stay, error } = await admin
    .from("stays")
    .insert({
      property_id: propertyId,
      guest_name: guestName,
      guest_email: guestEmail,
      check_in: checkIn,
      check_out: checkOut,
    })
    .select("id")
    .maybeSingle();

  if (error || !stay) {
    return { error: error?.message || "Unable to create the guest stay." };
  }

  await recordAdminAudit({
    action: "stay.manual_created",
    resourceType: "stay",
    resourceId: stay.id,
    propertyId,
    metadata: {
      guest_email: guestEmail,
      check_in: checkIn,
      check_out: checkOut,
      source: "manual",
    },
  });

  revalidatePath("/admin/stays");
  revalidatePath("/admin/overview");
  return {
    success: `Stay created for ${guestName} at ${property.name}. Generate an activation link from the list below.`,
  };
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
  if (accountType === "property" && !UUID_PATTERN.test(propertyId)) return { error: "Choose a State." };

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
  revalidatePath("/admin/invite");
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
  revalidatePath("/admin/invite");
}

export async function updateCardOrderStatus(formData: FormData) {
  const context = await getAdminContext();
  if (!context) return;
  // TODO: re-enable MFA check before production partner rollout.
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
