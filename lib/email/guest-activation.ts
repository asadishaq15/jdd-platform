type GuestActivationEmailInput = {
  to: string;
  guestName: string | null;
  propertyName: string;
  activationUrl: string;
  expiresAt: string;
};

export type GuestActivationEmailResult =
  | { sent: true }
  | { sent: false; warning: string };

function formatExpiry(value: string) {
  return new Intl.DateTimeFormat("en", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(value));
}

export async function sendGuestActivationEmail(
  input: GuestActivationEmailInput,
): Promise<GuestActivationEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    return {
      sent: false,
      warning: "Email is not configured (set RESEND_API_KEY and EMAIL_FROM). Copy the link below.",
    };
  }

  const greeting = input.guestName?.trim() ? `Hello ${input.guestName.trim()},` : "Hello,";
  const expiryLabel = formatExpiry(input.expiresAt);
  const subject = `Your invitation to ${input.propertyName}`;
  const text = [
    greeting,
    "",
    `You have been invited to open your private stay with ${input.propertyName} on Jardin du Désert.`,
    "",
    "1. Create an account or sign in using this same email address.",
    "2. Open your activation link:",
    input.activationUrl,
    "",
    `This link expires on ${expiryLabel} UTC and can be used only once.`,
    "",
    "Jardin du Désert",
  ].join("\n");

  const html = `
    <div style="font-family: Georgia, serif; color: #272724; line-height: 1.6; max-width: 560px;">
      <p>${greeting}</p>
      <p>You have been invited to open your private stay with <strong>${escapeHtml(input.propertyName)}</strong> on Jardin du Désert.</p>
      <p>Use the <strong>same email address</strong> this message was sent to when you create your account or sign in.</p>
      <p style="margin: 28px 0;">
        <a href="${escapeHtml(input.activationUrl)}"
           style="display: inline-block; padding: 12px 20px; background: #272724; color: #fff; text-decoration: none;">
          Open my invitation
        </a>
      </p>
      <p style="font-size: 13px; color: #6b6b66;">
        Or paste this link into your browser:<br />
        <a href="${escapeHtml(input.activationUrl)}">${escapeHtml(input.activationUrl)}</a>
      </p>
      <p style="font-size: 13px; color: #6b6b66;">This link expires on ${escapeHtml(expiryLabel)} UTC and can be used only once.</p>
    </div>
  `;

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [input.to],
      subject,
      text,
      html,
    }),
  });

  if (!response.ok) {
    const detail = await response.text().catch(() => "");
    return {
      sent: false,
      warning: detail
        ? `Invitation email could not be sent (${response.status}). Copy the link below.`
        : "Invitation email could not be sent. Copy the link below.",
    };
  }

  return { sent: true };
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
