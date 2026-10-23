import { redirect } from "next/navigation";
import AdminMfaSetup from "../../../components/auth/AdminMfaSetup";
import BrandMark from "../../../components/brand/BrandMark";
import { getAdminContext } from "../../../lib/admin-auth";
import "../admin.css";

type SecurityPageProps = { searchParams: Promise<{ welcome?: string }> };

export default async function AdminSecurityPage({ searchParams }: SecurityPageProps) {
  const context = await getAdminContext();
  if (!context) redirect("/admin/unauthorized");
  const params = await searchParams;
  return <main className="admin-security-page"><BrandMark className="admin-security-mark" /><AdminMfaSetup requirePassword={params.welcome === "1"} /></main>;
}
