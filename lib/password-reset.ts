const PASSWORD_RESET_RETURN_PATHS = ["/sign-in", "/staff/sign-in", "/property/sign-in"] as const;

export type PasswordResetReturnTo = (typeof PASSWORD_RESET_RETURN_PATHS)[number];

export function safePasswordResetReturnTo(value: string | null | undefined): PasswordResetReturnTo {
  return PASSWORD_RESET_RETURN_PATHS.includes(value as PasswordResetReturnTo) ? (value as PasswordResetReturnTo) : "/sign-in";
}
