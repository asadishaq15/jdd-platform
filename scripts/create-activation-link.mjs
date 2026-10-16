import { createClient } from "@supabase/supabase-js";

const stayId = process.argv[2];
const days = Number(process.argv[3] || 7);
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const secretKey = process.env.SUPABASE_SECRET_KEY;
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

if (!stayId) {
  throw new Error("Usage: npm run activation:create -- <stay-id> [days]");
}

if (!url || !secretKey) {
  throw new Error("NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY are required.");
}

if (!Number.isFinite(days) || days <= 0 || days > 30) {
  throw new Error("Expiry days must be between 1 and 30.");
}

const supabase = createClient(url, secretKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const expiresAt = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
const { data, error } = await supabase.rpc("create_guest_activation", {
  p_stay_id: stayId,
  p_expires_at: expiresAt,
});

if (error) throw error;
if (!data?.[0]?.token) throw new Error("Supabase did not return an activation token.");

const activationUrl = new URL(`/activate/${data[0].token}`, siteUrl);
console.log(`Activation link (shown once): ${activationUrl}`);
console.log(`Expires: ${data[0].expires_at}`);

