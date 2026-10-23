import Link from "next/link";
import { redirect } from "next/navigation";
import BrandMark from "../../../components/brand/BrandMark";
import { createClient } from "../../../lib/supabase/server";
import "../admin.css";

export default async function AdminUnauthorizedPage() {
  const sessionClient = await createClient();
  const { data: userData } = await sessionClient.auth.getUser();
  const signedInUser = userData.user;

  async function useAnotherAccount() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/admin/sign-in");
  }

  return (
    <main className="admin-access-page">
      <BrandMark className="admin-access-mark" />
      <p className="admin-kicker">Administration</p>
      <h1>Access is not assigned.</h1>
      <p>Your account is signed in, but it does not have an active administrative membership. Ask a super administrator to assign the appropriate property and role.</p>
      {signedInUser && (
        <div className="admin-access-identity">
          <span>Signed in as</span>
          <strong>{signedInUser.email || "Email unavailable"}</strong>
          <small>Account reference · {signedInUser.id.slice(-8)}</small>
        </div>
      )}
      <div className="admin-access-actions">
        <Link href="/space">Return to My Space</Link>
        <form action={useAnotherAccount}><button type="submit">Use another account</button></form>
      </div>
    </main>
  );
}
