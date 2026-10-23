import { redirect } from "next/navigation";
import ProductEvent from "../../../components/admin/ProductEvent";
import AuthShell from "../../../components/auth/AuthShell";
import { createAdminClient } from "../../../lib/supabase/admin";
import { createClient } from "../../../lib/supabase/server";
import "../../../components/auth/auth.css";

type ActivationPageProps = {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ error?: string }>;
};

export default async function ActivationPage({ params, searchParams }: ActivationPageProps) {
  const { token } = await params;
  const { error } = await searchParams;
  const validToken = /^[a-f0-9]{64}$/i.test(token);

  async function activateStay() {
    "use server";

    if (!validToken) {
      redirect(`/activate/${encodeURIComponent(token)}?error=invalid`);
    }

    const supabase = await createClient();
    const { data, error: activationError } = await supabase.rpc(
      "redeem_guest_activation",
      { p_token: token },
    );

    if (activationError?.message.includes("verified email address")) {
      redirect(`/activate/${encodeURIComponent(token)}?error=email_mismatch`);
    }

    if (activationError || !data?.length) {
      redirect(`/activate/${encodeURIComponent(token)}?error=unavailable`);
    }

    const { data: currentUserData } = await supabase.auth.getUser();
    if (currentUserData.user) {
      const admin = createAdminClient();
      const { data: membership } = await admin.from("admin_memberships").select("id").eq("user_id", currentUserData.user.id).eq("is_active", true).limit(1).maybeSingle();
      await admin.from("product_events").insert({
        event_name: "activation_completed",
        user_id: currentUserData.user.id,
        stay_id: data[0].stay_id,
        property_id: data[0].property_id,
        is_internal: Boolean(membership),
        metadata: {},
      });
    }

    redirect(`/space?stay=${data[0].stay_id}`);
  }

  async function signInWithAnotherAccount() {
    "use server";

    const supabase = await createClient();
    await supabase.auth.signOut();
    const next = `/activate/${encodeURIComponent(token)}`;
    redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  }

  return (
    <AuthShell>
      <ProductEvent name="activation_page_opened" dedupeKey="activation" />
      <section className="auth-view" aria-label="Activate your guest stay">
        <p className="eyebrow">Guest activation</p>
        <h1 className="title">Open your <em className="cu">private stay</em>.</h1>
        {error === "email_mismatch" ? (
          <>
            <p className="body verify-copy">Please sign in with the verified email address that received this invitation. The link has not been used.</p>
            <form action={signInWithAnotherAccount}>
              <button className="btn primary" type="submit">Sign in with another account</button>
            </form>
          </>
        ) : error || !validToken ? (
          <>
            <p className="body verify-copy">This activation link is invalid, expired, or has already been used.</p>
            <p className="links small"><a className="tlink" href="/space">Return to My Space</a></p>
          </>
        ) : (
          <>
            <p className="body verify-copy">Connect this invitation to your account. Each guest activation link can be used only once.</p>
            <form action={activateStay}>
              <button className="btn primary" type="submit">Activate my stay</button>
            </form>
          </>
        )}
      </section>
    </AuthShell>
  );
}

