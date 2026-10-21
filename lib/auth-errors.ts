type AuthErrorLike = {
  code?: string;
  message?: string;
  status?: number;
};

export function friendlyAuthError(error: AuthErrorLike, fallback = "Something went wrong. Please try again.") {
  const message = error.message?.toLowerCase() || "";

  if (
    error.code === "over_email_send_rate_limit"
    || message.includes("email rate limit")
  ) {
    return "Too many emails were requested recently. Please wait up to an hour before trying again.";
  }

  if (
    error.code === "over_request_rate_limit"
    || error.status === 429
    || message.includes("rate limit")
    || message.includes("too many requests")
  ) {
    return "Too many attempts were made recently. Please wait a few minutes before trying again.";
  }

  return error.message || fallback;
}
