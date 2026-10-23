import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import AdminNavigation from "../../../components/admin/AdminNavigation";
import AdminPropertySelector from "../../../components/admin/AdminPropertySelector";
import BrandMark from "../../../components/brand/BrandMark";
import { requireAdmin } from "../../../lib/admin-auth";
import { createClient } from "../../../lib/supabase/server";
import "../admin.css";

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

        <AdminNavigation isSuperAdmin={context.isSuperAdmin} />

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
