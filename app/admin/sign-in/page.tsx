import Link from "next/link";
import AuthShell from "../../../components/auth/AuthShell";
import "../../../components/auth/auth.css";

export default function AdminSignInPage() {
  return (
    <AuthShell>
      <section className="auth-view" aria-label="Choose an administration portal">
        <p className="eyebrow">Invitation-only access</p>
        <h1 className="title">Choose your <em className="cu">portal</em>.</h1>
        <p className="body">Administrative accounts are created by Jardin du Désert and protected with two-step verification.</p>
        <div className="providers entry-providers">
          <Link className="btn" href="/staff/sign-in">Internal staff</Link>
          <Link className="btn" href="/property/sign-in">Property or business</Link>
        </div>
        <p className="links small"><Link className="tlink" href="/sign-in">Guest sign in</Link></p>
      </section>
    </AuthShell>
  );
}
