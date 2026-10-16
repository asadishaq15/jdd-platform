import AuthFlow from "../../components/auth/AuthFlow";
import AuthShell from "../../components/auth/AuthShell";
import "../../components/auth/auth.css";

export default function SignInPage() {
  return (
    <AuthShell>
      <AuthFlow />
    </AuthShell>
  );
}
