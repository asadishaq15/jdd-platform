"use server";

import { revalidatePath } from "next/cache";
import {
  canOperateProperty,
  recordAdminAudit,
  requireAdmin,
} from "./admin-auth";
import { sendGuestInvitationEmail } from "./email/guest-invitation";
import { createAdminClient } from "./supabase/admin";

export type InviteCandidate = {
  stayId: string;
  guestId: string;
  guestName: string | null;
  guestEmail: string;
  checkIn: string | null;
  checkOut: string | null;
};

export type EventInviteeView = {
  id: string;
  stayId: string;
  guestId: string;
  guestName: string | null;
  guestEmail: string;
  invitedAt: string;
  emailSentAt: string | null;
  emailWarning: string | null;
  accepted: boolean;
};

export type CommunityInviteActionState = {
  error?: string;
  success?: string;
};

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function loadInviteCandidates(propertyId: string): Promise<InviteCandidate[]> {
  if (!UUID_PATTERN.test(propertyId)) return [];

  const context = await requireAdmin();
  if (!context.properties.some((property) => property.id === propertyId)) {
    return [];
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from("stays")
    .select("id, guest_id, guest_name, guest_email, check_in, check_out")
    .eq("property_id", propertyId)
    .not("guest_id", "is", null)
    .not("activated_at", "is", null)
    .order("check_in", { ascending: false });

  if (error) throw new Error(`Unable to load invite candidates: ${error.message}`);

  return ((data || []) as Array<{
    id: string;
    guest_id: string | null;
    guest_name: string | null;
    guest_email: string | null;
    check_in: string | null;
    check_out: string | null;
  }>)
    .filter((row) => row.guest_id && row.guest_email && EMAIL_PATTERN.test(row.guest_email.trim()))
    .map((row) => ({
      stayId: row.id,
      guestId: row.guest_id!,
      guestName: row.guest_name,
      guestEmail: row.guest_email!.trim().toLowerCase(),
      checkIn: row.check_in,
      checkOut: row.check_out,
    }));
}

export async function loadEventInvitees(eventId: string): Promise<EventInviteeView[]> {
  if (!UUID_PATTERN.test(eventId)) return [];

  const context = await requireAdmin();
  const admin = createAdminClient();

  const { data: event, error: eventError } = await admin
    .from("community_events")
    .select("id, property_id, category")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError || !event) return [];
  if (event.category !== "invite") return [];
  if (!context.properties.some((property) => property.id === event.property_id)) return [];

  const { data: inviteeRows, error: inviteeError } = await admin
    .from("community_event_invitees")
    .select("id, stay_id, guest_id, guest_email, invited_at, email_sent_at, email_warning")
    .eq("event_id", eventId)
    .order("invited_at", { ascending: false });

  if (inviteeError) throw new Error(`Unable to load invitees: ${inviteeError.message}`);

  const rows = (inviteeRows || []) as Array<{
    id: string;
    stay_id: string;
    guest_id: string;
    guest_email: string;
    invited_at: string;
    email_sent_at: string | null;
    email_warning: string | null;
  }>;

  if (!rows.length) return [];

  const stayIds = rows.map((row) => row.stay_id);
  const guestIds = rows.map((row) => row.guest_id);

  const [{ data: stayRows }, { data: rsvpRows }] = await Promise.all([
    admin.from("stays").select("id, guest_name").in("id", stayIds),
    admin.from("community_event_rsvps").select("guest_id").eq("event_id", eventId).in("guest_id", guestIds),
  ]);

  const names = new Map(
    ((stayRows || []) as Array<{ id: string; guest_name: string | null }>).map((row) => [row.id, row.guest_name]),
  );
  const accepted = new Set(
    ((rsvpRows || []) as Array<{ guest_id: string }>).map((row) => row.guest_id),
  );

  return rows.map((row) => ({
    id: row.id,
    stayId: row.stay_id,
    guestId: row.guest_id,
    guestName: names.get(row.stay_id) || null,
    guestEmail: row.guest_email,
    invitedAt: row.invited_at,
    emailSentAt: row.email_sent_at,
    emailWarning: row.email_warning,
    accepted: accepted.has(row.guest_id),
  }));
}

export async function inviteGuestsToEvent(
  _previousState: CommunityInviteActionState,
  formData: FormData,
): Promise<CommunityInviteActionState> {
  const context = await requireAdmin();
  const eventId = String(formData.get("eventId") || "");
  const stayIds = formData.getAll("stayIds").map((value) => String(value)).filter((value) => UUID_PATTERN.test(value));

  if (!UUID_PATTERN.test(eventId)) return { error: "Invalid invitation." };
  if (!stayIds.length) return { error: "Select at least one guest to invite." };

  const admin = createAdminClient();
  const { data: event, error: eventError } = await admin
    .from("community_events")
    .select("id, property_id, category, title, timing, is_published")
    .eq("id", eventId)
    .maybeSingle();

  if (eventError || !event) return { error: "Guest invitation not found." };
  if (event.category !== "invite") return { error: "Invitees are only for Guest invitation slots." };
  if (!canOperateProperty(context, event.property_id)) {
    return { error: "You do not have permission to invite guests for this property." };
  }

  const { data: property } = await admin
    .from("properties")
    .select("name")
    .eq("id", event.property_id)
    .maybeSingle();

  const { data: stays, error: stayError } = await admin
    .from("stays")
    .select("id, guest_id, guest_name, guest_email, activated_at, property_id")
    .eq("property_id", event.property_id)
    .in("id", stayIds);

  if (stayError) return { error: stayError.message };
  const eligible = ((stays || []) as Array<{
    id: string;
    guest_id: string | null;
    guest_name: string | null;
    guest_email: string | null;
    activated_at: string | null;
    property_id: string;
  }>).filter((stay) =>
    stay.guest_id
    && stay.activated_at
    && stay.guest_email
    && EMAIL_PATTERN.test(stay.guest_email.trim()),
  );

  if (!eligible.length) {
    return { error: "Choose activated guests with an email address." };
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const spaceUrl = new URL("/space", siteUrl).toString();
  const propertyName = property?.name || "your property";

  let invited = 0;
  let emailed = 0;
  const warnings: string[] = [];

  for (const stay of eligible) {
    const guestEmail = stay.guest_email!.trim().toLowerCase();
    const emailResult = await sendGuestInvitationEmail({
      to: guestEmail,
      guestName: stay.guest_name,
      propertyName,
      eventTitle: event.title,
      eventTiming: event.timing,
      spaceUrl,
    });

    const { error: upsertError } = await admin
      .from("community_event_invitees")
      .upsert(
        {
          event_id: event.id,
          property_id: event.property_id,
          stay_id: stay.id,
          guest_id: stay.guest_id!,
          guest_email: guestEmail,
          invited_by: context.user.id,
          invited_at: new Date().toISOString(),
          email_sent_at: emailResult.sent ? new Date().toISOString() : null,
          email_warning: emailResult.sent ? null : emailResult.warning,
        },
        { onConflict: "event_id,guest_id" },
      );

    if (upsertError) {
      warnings.push(`${guestEmail}: ${upsertError.message}`);
      continue;
    }

    invited += 1;
    if (emailResult.sent) emailed += 1;
    else warnings.push(`${guestEmail}: ${emailResult.warning}`);
  }

  await recordAdminAudit({
    action: "community_event.invitees_added",
    resourceType: "community_event",
    resourceId: event.id,
    propertyId: event.property_id,
    metadata: {
      invited,
      emailed,
      stay_ids: eligible.map((stay) => stay.id),
    },
  });

  revalidatePath("/admin/community");
  revalidatePath("/space");

  if (!invited) {
    return { error: warnings[0] || "Unable to invite the selected guests." };
  }

  const base = `Invited ${invited} guest${invited === 1 ? "" : "s"}. ${emailed} email${emailed === 1 ? "" : "s"} sent.`;
  if (warnings.length) {
    return { success: `${base} Some emails need attention.` };
  }
  return { success: base };
}

export async function removeEventInvitee(
  _previousState: CommunityInviteActionState,
  formData: FormData,
): Promise<CommunityInviteActionState> {
  const context = await requireAdmin();
  const inviteeId = String(formData.get("inviteeId") || "");
  if (!UUID_PATTERN.test(inviteeId)) return { error: "Invalid invitee." };

  const admin = createAdminClient();
  const { data: invitee, error: loadError } = await admin
    .from("community_event_invitees")
    .select("id, event_id, property_id, guest_email")
    .eq("id", inviteeId)
    .maybeSingle();

  if (loadError || !invitee) return { error: "Invitee not found." };
  if (!canOperateProperty(context, invitee.property_id)) {
    return { error: "You do not have permission to manage invitees for this property." };
  }

  const { error } = await admin
    .from("community_event_invitees")
    .delete()
    .eq("id", inviteeId);

  if (error) return { error: error.message || "Unable to remove invitee." };

  await recordAdminAudit({
    action: "community_event.invitee_removed",
    resourceType: "community_event",
    resourceId: invitee.event_id,
    propertyId: invitee.property_id,
    metadata: { invitee_id: inviteeId, guest_email: invitee.guest_email },
  });

  revalidatePath("/admin/community");
  revalidatePath("/space");
  return { success: "Invitee removed. They will no longer see this invitation in Space." };
}
