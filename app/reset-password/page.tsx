import { redirect } from "next/navigation";
import AuthShell from "../../components/auth/AuthShell";
import ResetPasswordForm from "../../components/auth/ResetPasswordForm";
import { safePasswordResetReturnTo } from "../../lib/password-reset";
import { createClient } from "../../lib/supabase/server";
import "../../components/auth/auth.css";

type ResetPasswordPageProps = {
  searchParams: Promise<{ returnTo?: string }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const returnTo = safePasswordResetReturnTo(params.returnTo);
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();

  if (!data.user) {
    redirect(`${returnTo}?error=${encodeURIComponent("This recovery link is invalid or has expired. Please request a new one.")}`);
  }

  return (
    <AuthShell>
      <ResetPasswordForm returnTo={returnTo} />
    </AuthShell>
  );
}
