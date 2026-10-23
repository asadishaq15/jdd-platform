import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AdminPropertySelector from "../../../components/admin/AdminPropertySelector";
import BrandMark from "../../../components/brand/BrandMark";
import { requireAdmin } from "../../../lib/admin-auth";
import { createClient } from "../../../lib/supabase/server";
import "../admin.css";

const navigation = [
  { href: "/admin/overview", label: "Overview", enabled: true },
  { href: "/admin/stays", label: "Stays", enabled: true },
  { href: "/admin/activations", label: "Activations", enabled: true },
  { href: "/admin/orders", label: "Card orders", enabled: true },
  { href: "/admin/guests", label: "Guests", enabled: false },
  { href: "/admin/properties", label: "Properties", enabled: true },
  { href: "/admin/analytics", label: "Analytics", enabled: true },
  { href: "/admin/feedback", label: "Feedback", enabled: true },
  { href: "/admin/access", label: "Access", enabled: true, superAdminOnly: true },
];

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const context = await requireAdmin();

  async function signOut() {
    "use server";
    const supabase = await createClient();
    await supabase.auth.signOut();
    redirect("/admin/sign-in");
  }

  const roleLabel = context.isSuperAdmin
    ? "Super administrator"
    : context.memberships.some((membership) => membership.role === "property_admin")
      ? "Property administrator"
      : context.memberships.some((membership) => membership.role === "property_staff")
        ? "Property staff"
        : "Analyst";

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <Link className="admin-brand" href="/admin/overview" aria-label="Jardin du Desert admin">
          <BrandMark className="admin-brand-mark" />
          <span>Administration</span>
        </Link>

        <nav className="admin-navigation" aria-label="Administration">
          {navigation.filter((item) => !(item.superAdminOnly && !context.isSuperAdmin)).map((item) => item.enabled ? (
            <Link href={item.href} key={item.href}>{item.label}</Link>
          ) : (
            <span className="admin-nav-future" key={item.href}>{item.label}<small>Next phase</small></span>
          ))}
        </nav>

        <div className="admin-sidebar-footer">
          <Link href="/space">Return to My Space</Link>
          <form action={signOut}><button type="submit">Sign out</button></form>
        </div>
      </aside>

      <div className="admin-workspace">
        <header className="admin-topbar">
          <AdminPropertySelector properties={context.properties} allowAll={context.isSuperAdmin} />
          <div className="admin-account">
            <span>{context.user.fullName}</span>
            <small>{roleLabel}</small>
          </div>
        </header>
        <main className="admin-content">{children}</main>
      </div>
    </div>
  );
}
