import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.trim().toLowerCase();
const role = process.argv[3] || "super_admin";
const propertySlug = process.argv[4] || null;
const roles = new Set(["super_admin", "property_admin", "property_staff", "analyst"]);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!email || !roles.has(role)) {
  throw new Error("Usage: npm run admin:grant -- <email> <super_admin|property_admin|property_staff|analyst> [property-slug]");
}

if (role === "super_admin" && propertySlug) {
  throw new Error("super_admin is global and must not include a property slug.");
}

if (role !== "super_admin" && !propertySlug) {
  throw new Error(`${role} requires a property slug.`);
}

if (!url || !secretKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required.");
}

const admin = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

let user = null;
let page = 1;
do {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  user = data.users.find((candidate) => candidate.email?.toLowerCase() === email) || null;
  if (user || data.users.length < 1000) break;
  page += 1;
} while (!user);

if (!user) throw new Error(`No Supabase user exists for ${email}. Ask them to create an account first.`);

let propertyId = null;
if (propertySlug) {
  const { data: property, error } = await admin
    .from("properties")
    .select("id")
    .eq("slug", propertySlug)
    .maybeSingle();
  if (error) throw error;
  if (!property) throw new Error(`Property not found: ${propertySlug}`);
  propertyId = property.id;
}

let existingQuery = admin
  .from("admin_memberships")
  .select("id")
  .eq("user_id", user.id);
existingQuery = propertyId
  ? existingQuery.eq("property_id", propertyId)
  : existingQuery.is("property_id", null);

const { data: existing, error: readError } = await existingQuery.maybeSingle();
if (readError) throw readError;

const query = existing
  ? admin.from("admin_memberships").update({ role, is_active: true }).eq("id", existing.id)
  : admin.from("admin_memberships").insert({ user_id: user.id, property_id: propertyId, role, is_active: true });
const { error: writeError } = await query;
if (writeError) throw writeError;

console.log(`Granted ${role} access to ${email}${propertySlug ? ` for ${propertySlug}` : " globally"}.`);
