import AdminSignInForm from "../../../components/auth/AdminSignInForm";
import AuthShell from "../../../components/auth/AuthShell";
import "../../../components/auth/auth.css";

export default function PropertySignInPage() {
  return <AuthShell><AdminSignInForm audience="property" /></AuthShell>;
}
