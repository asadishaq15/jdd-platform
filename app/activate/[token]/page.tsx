import Link from "next/link";
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
  const activatePath = `/activate/${encodeURIComponent(token)}`;

  const supabase = await createClient();
  const { data: userData } = await supabase.auth.getUser();
  const signedIn = Boolean(userData.user);
  const signedInEmail = userData.user?.email?.trim().toLowerCase() || "";

  async function activateStay() {
    "use server";

    if (!validToken) {
      redirect(`/activate/${encodeURIComponent(token)}?error=invalid`);
    }

    const sessionClient = await createClient();
    const { data: sessionUser } = await sessionClient.auth.getUser();
    if (!sessionUser.user) {
      redirect(`/sign-in?next=${encodeURIComponent(`/activate/${encodeURIComponent(token)}`)}`);
    }

    const { data, error: activationError } = await sessionClient.rpc(
      "redeem_guest_activation",
      { p_token: token },
    );

    if (activationError?.message.includes("verified email address")) {
      redirect(`/activate/${encodeURIComponent(token)}?error=email_mismatch`);
    }

    if (activationError || !data?.length) {
      redirect(`/activate/${encodeURIComponent(token)}?error=unavailable`);
    }

    const admin = createAdminClient();
    const { data: membership } = await admin
      .from("admin_memberships")
      .select("id")
      .eq("user_id", sessionUser.user.id)
      .eq("is_active", true)
      .limit(1)
      .maybeSingle();
    await admin.from("product_events").insert({
      event_name: "activation_completed",
      user_id: sessionUser.user.id,
      stay_id: data[0].stay_id,
      property_id: data[0].property_id,
      is_internal: Boolean(membership),
      metadata: {},
    });

    redirect(`/space?stay=${data[0].stay_id}`);
  }

  async function signInWithAnotherAccount() {
    "use server";

    const sessionClient = await createClient();
    await sessionClient.auth.signOut();
    const next = `/activate/${encodeURIComponent(token)}`;
    redirect(`/sign-in?next=${encodeURIComponent(next)}`);
  }

  const signUpHref = `/sign-in?mode=sign-up&next=${encodeURIComponent(activatePath)}`;
  const signInHref = `/sign-in?next=${encodeURIComponent(activatePath)}`;

  return (
    <AuthShell>
      <ProductEvent name="activation_page_opened" dedupeKey="activation" />
      <section className="auth-view" aria-label="Activate your guest stay">
        <p className="eyebrow">Guest activation</p>
        <h1 className="title">Open your <em className="cu">private stay</em>.</h1>
        {error === "email_mismatch" ? (
          <>
            <p className="body verify-copy">
              Please sign in with the verified email address that received this invitation.
              The link has not been used.
              {signedInEmail ? <> You are currently signed in as <span className="to">{signedInEmail}</span>.</> : null}
            </p>
            <form action={signInWithAnotherAccount}>
              <button className="btn primary" type="submit">Sign in with another account</button>
            </form>
          </>
        ) : error || !validToken ? (
          <>
            <p className="body verify-copy">This activation link is invalid, expired, or has already been used.</p>
            <p className="links small"><Link className="tlink" href="/space">Return to My Space</Link></p>
          </>
        ) : !signedIn ? (
          <>
            <p className="body verify-copy">
              Create an account or sign in with the email address that received this invitation,
              then return here to connect your stay. Each activation link can be used only once.
            </p>
            <p className="links" style={{ display: "grid", gap: 14, marginTop: 24 }}>
              <Link className="btn primary" href={signUpHref}>Create account</Link>
              <Link className="tlink" href={signInHref}>Sign in</Link>
            </p>
          </>
        ) : (
          <>
            <p className="body verify-copy">
              Connect this invitation to your account
              {signedInEmail ? <> (<span className="to">{signedInEmail}</span>)</> : null}.
              Each guest activation link can be used only once.
            </p>
            <form action={activateStay}>
              <button className="btn primary" type="submit">Activate my stay</button>
            </form>
            <form action={signInWithAnotherAccount}>
              <p className="links small">
                <button className="tlink" type="submit">Use a different account</button>
              </p>
            </form>
          </>
        )}
      </section>
    </AuthShell>
  );
}
