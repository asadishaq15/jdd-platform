import AdminSignInForm from "../../../components/auth/AdminSignInForm";
import AuthShell from "../../../components/auth/AuthShell";
import "../../../components/auth/auth.css";

export default function StaffSignInPage() {
  return (
    <AuthShell className="admin-auth">
      <AdminSignInForm audience="staff" />
    </AuthShell>
  );
}
