import { redirect } from "next/navigation";
import AdminMfaSetup from "../../../components/auth/AdminMfaSetup";
import AuthShell from "../../../components/auth/AuthShell";
import { getAdminContext } from "../../../lib/admin-auth";
import "../../../components/auth/auth.css";
import "../admin.css";

type SecurityPageProps = { searchParams: Promise<{ welcome?: string }> };

export default async function AdminSecurityPage({ searchParams }: SecurityPageProps) {
  const context = await getAdminContext();
  if (!context) redirect("/admin/unauthorized");
  const params = await searchParams;
  return <AuthShell><AdminMfaSetup requirePassword={params.welcome === "1"} /></AuthShell>;
}
