import Link from "next/link";
import AuthShell from "../../../components/auth/AuthShell";
import "../../../components/auth/auth.css";

const PARTNER_ACCESS_EMAIL = "jdd@jardindudesert.com";
const PARTNER_ACCESS_SUBJECT = "Partner access request";

function partnerAccessMailto() {
  return `mailto:${PARTNER_ACCESS_EMAIL}?subject=${encodeURIComponent(PARTNER_ACCESS_SUBJECT)}`;
}

export default function AdminSignInPage() {
  return (
    <AuthShell>
      <section className="auth-view admin-portal" aria-label="Administration portal entry">
        <div className="admin-portal-main">
          <p className="eyebrow admin-portal-eyebrow">State-based hospitality system</p>
          <h1 className="title admin-portal-title">
            <span className="admin-portal-title-line">Experience Management</span>
            <em className="cu admin-portal-title-accent">Platform.</em>
          </h1>
          <p className="body admin-portal-body">
            The back of house of Space for partner properties – before, during and after the stay. Send guest
            invitations, publish updates to your community, and track engagement, retention and experience metrics.
          </p>
          <div className="providers entry-providers admin-portal-providers">
            <Link className="btn btn-portal-partner" href="/property/sign-in">
              Partner property
            </Link>
            <Link className="btn btn-portal-team" href="/staff/sign-in">
              Jardin du Désert team
            </Link>
          </div>
        </div>
        <footer className="admin-portal-foot">
          <p className="admin-portal-security">
            <svg className="admin-portal-lock" viewBox="0 0 20 20" aria-hidden="true">
              <rect x="4.5" y="9" width="11" height="8" rx="0.5" fill="none" stroke="currentColor" strokeWidth="1.1" />
              <path
                d="M6.5 9V6.5a3.5 3.5 0 0 1 7 0V9"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.1"
              />
            </svg>
            <span>
              Accounts are issued by Jardin du Désert. Two-step verification required.
            </span>
          </p>
          <p className="admin-portal-partner-line">
            Interested in partnering?{" "}
            <a className="admin-portal-request" href={partnerAccessMailto()}>
              Request access
            </a>
          </p>
        </footer>
      </section>
    </AuthShell>
  );
}