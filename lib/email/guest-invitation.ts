type GuestInvitationEmailInput = {
  to: string;
  guestName: string | null;
  propertyName: string;
  eventTitle: string;
  eventTiming: string;
  spaceUrl: string;
};

export type GuestInvitationEmailResult =
  | { sent: true }
  | { sent: false; warning: string };

export async function sendGuestInvitationEmail(
  input: GuestInvitationEmailInput,
): Promise<GuestInvitationEmailResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const from = process.env.EMAIL_FROM?.trim();

  if (!apiKey || !from) {
    return {
      sent: false,
      warning: "Email is not configured (set RESEND_API_KEY and EMAIL_FROM).",
    };
  }

  const greeting = input.guestName?.trim() ? `Hello ${input.guestName.trim()},` : "Hello,";
  const subject = `You're invited · ${input.eventTitle} · ${input.propertyName}`;
  const text = [
    greeting,
    "",
    `${input.propertyName} has invited you to ${input.eventTitle}.`,
    input.eventTiming ? `When: ${input.eventTiming}` : "",
    "",
    "Open My Space to view the invitation and respond:",
    input.spaceUrl,
    "",
    "Jardin du Désert",
  ].filter((line, index, lines) => line !== "" || (index > 0 && lines[index - 1] !== "")).join("\n");

  const html = `
    <div style="font-family: Georgia, serif; color: #272724; line-height: 1.6; max-width: 560px;">
      <p>${greeting}</p>
      <p><strong>${escapeHtml(input.propertyName)}</strong> has invited you to <strong>${escapeHtml(input.eventTitle)}</strong>.</p>
      ${input.eventTiming ? `<p style="font-size: 13px; color: #6b6b66; letter-spacing: .08em; text-transform: uppercase;">${escapeHtml(input.eventTiming)}</p>` : ""}
      <p>Open My Space to view the invitation and accept if you wish to join.</p>
      <p style="margin: 28px 0;">
        <a href="${escapeHtml(input.spaceUrl)}"
           style="display: inline-block; padding: 12px 20px; background: #272724; color: #fff; text-decoration: none;">
          Open My Space
        </a>
      </p>
      <p style="font-size: 13px; color: #6b6b66;">
        Or paste this link into your browser:<br />
        <a href="${escapeHtml(input.spaceUrl)}">${escapeHtml(input.spaceUrl)}</a>
      </p>
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
    return {
      sent: false,
      warning: `Invitation email could not be sent (${response.status}).`,
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
