import { redirect } from "next/navigation";
import AuthShell from "../../components/auth/AuthShell";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";
import { createClient } from "../../lib/supabase/server";
import "../../components/auth/auth.css";

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect(`/sign-in?error=${encodeURIComponent("This recovery link is invalid or has expired. Please request a new one.")}`);
  }

  return (
    <AuthShell>
      <ResetPasswordForm />
    </AuthShell>
  );
}
