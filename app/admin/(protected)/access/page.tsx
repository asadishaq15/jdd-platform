import AdminInviteForm from "../../../../components/admin/AdminInviteForm";
import { revokeAdminAccount } from "../../../../lib/admin-operations";
import { requireAdminRole } from "../../../../lib/admin-auth";
import { createAdminClient } from "../../../../lib/supabase/admin";

export default async function AdminAccessPage() {
  const context = await requireAdminRole(["super_admin"]);
  const admin = createAdminClient();
  const { data: memberships, error } = await admin.from("admin_memberships").select("id, user_id, property_id, role, is_active, property:properties(name)").order("created_at");
  if (error) throw new Error(`Unable to load administrative accounts: ${error.message}`);
  const users = await loadUsers(admin);
  const emailById = new Map(users.map((user) => [user.id, user.email || "Email unavailable"]));

  return <section>
    <div className="admin-page-heading"><div><p className="admin-kicker">Access control</p><h1>Invited accounts</h1><p>Property accounts cannot self-register. Each property can have one active account, and every administrative session requires two-step verification.</p></div></div>
    <div className="admin-access-management"><article><h2>Invite an account</h2><AdminInviteForm properties={context.properties} /></article><article><h2>Security policy</h2><ul><li>Internal staff can access all properties.</li><li>Property accounts are restricted to one assigned property.</li><li>One active administrative account is allowed per property.</li><li>Authenticator-app verification is mandatory.</li></ul></article></div>
    <div className="admin-table-wrap"><table className="admin-table"><thead><tr><th>Account</th><th>Role</th><th>Scope</th><th>Status</th><th>Action</th></tr></thead><tbody>{(memberships || []).map((membership) => { const property = Array.isArray(membership.property) ? membership.property[0] : membership.property; return <tr key={membership.id}><td><strong>{emailById.get(membership.user_id) || "Invited user"}</strong></td><td>{membership.role === "super_admin" ? "Internal staff" : "Property account"}</td><td>{property?.name || "All properties"}</td><td><span className={`admin-status ${membership.is_active ? "success" : "revoked"}`}>{membership.is_active ? "Active" : "Revoked"}</span></td><td>{membership.is_active && membership.role !== "super_admin" ? <form action={revokeAdminAccount}><input type="hidden" name="membershipId" value={membership.id} /><button className="admin-danger-link" type="submit">Revoke access</button></form> : <span className="admin-muted">—</span>}</td></tr>; })}</tbody></table></div>
  </section>;
}

async function loadUsers(admin: ReturnType<typeof createAdminClient>) {
  const users = [];
  let page = 1;
  while (true) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 1000 });
    if (error) throw error;
    users.push(...data.users);
    if (data.users.length < 1000) return users;
    page += 1;
  }
}
