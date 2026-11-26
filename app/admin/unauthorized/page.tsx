import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell from "../../../components/auth/AuthShell";
import { createClient } from "../../../lib/supabase/server";
import "../../../components/auth/auth.css";
import "../admin.css";

type UnauthorizedPageProps = {
  searchParams: Promise<{ reason?: string }>;
};

function copyForReason(reason?: string, signedIn?: boolean) {
  const accountClause = signedIn
    ? "Your account is signed in, but it"
    : "This account";
  if (reason === "property") {
    return {
      titleLead: "Property access",
      titleAccent: "denied.",
      body: `${accountClause} does not have access to this property. Ask a super administrator to grant membership for the correct house.`,
    };
  }
  if (reason === "role") {
    return {
      titleLead: "This action is",
      titleAccent: "not permitted.",
      body: `${accountClause} does not allow this action. Ask a super administrator to assign the appropriate role.`,
    };
  }
  return {
    titleLead: "Access is not",
    titleAccent: "assigned.",
    body: `${accountClause} does not have an active administrative membership. Ask a super administrator to assign the appropriate property and role.`,
  };
}

export default async function AdminUnauthorizedPage({ searchParams }: UnauthorizedPageProps) {
  const params = await searchParams;

  const sessionClient = await createClient();
  const { data: userData } = await sessionClient.auth.getUser();
  const signedInUser = userData.user;
  const copy = copyForReason(params.reason, Boolean(signedInUser));

  async function useAnotherAccount() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/admin/sign-in");
  }

  return (
    <AuthShell className="admin-auth">
      <section className="auth-view admin-access-view" aria-label="Administration access denied">
        <p className="eyebrow">Administration</p>
        <h1 className="title admin-access-title">
          <span className="admin-access-title-line">{copy.titleLead}</span>{" "}
          <em className="cu">{copy.titleAccent}</em>
        </h1>
        <p className="body admin-access-body">{copy.body}</p>

        {signedInUser ? (
          <div className="admin-access-identity">
            <span>Signed in as</span>
            <strong>{signedInUser.email || "Email unavailable"}</strong>
            <small>Account reference · {signedInUser.id.slice(-8)}</small>
          </div>
        ) : null}

        <div className="admin-access-actions">
          <form action={useAnotherAccount}>
            <button className="admin-security-primary" type="submit">
              Use another account
            </button>
          </form>
          <Link className="admin-access-secondary" href="/space">
            Return to My Space
          </Link>
        </div>
      </section>
    </AuthShell>
  );
}
