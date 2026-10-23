import { createClient } from "@supabase/supabase-js";

const email = process.argv[2]?.trim().toLowerCase();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;

if (!email) throw new Error("Usage: npm run admin:inspect -- <email>");
if (!url || !secretKey) throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required.");

const admin = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const matchingUsers = [];
let page = 1;
while (true) {
  const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
  if (error) throw error;
  matchingUsers.push(...data.users.filter((user) => user.email?.toLowerCase() === email));
  if (data.users.length < 1000) break;
  page += 1;
}

if (!matchingUsers.length) {
  console.log(`No authentication user found for ${email}.`);
  process.exit(0);
}

for (const user of matchingUsers) {
  const { data: memberships, error } = await admin
    .from("admin_memberships")
    .select("role, property_id, is_active")
    .eq("user_id", user.id);
  if (error) throw error;

  const providers = user.identities?.map((identity) => identity.provider).join(", ") || "unknown";
  console.log(`User ${user.id.slice(-8)} · providers: ${providers}`);
  console.log(memberships?.length
    ? `Memberships: ${memberships.map((membership) => `${membership.role} (${membership.is_active ? "active" : "inactive"})`).join(", ")}`
    : "Memberships: none");
}
