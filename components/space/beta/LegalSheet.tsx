"use client";

import { useState } from "react";
import "./space-drawer.css";

type Doc = "terms" | "privacy";

export default function LegalSheet({
  open,
  initialDoc = "terms",
  onClose,
}: {
  open: boolean;
  initialDoc?: Doc;
  onClose: () => void;
}) {
  const [doc, setDoc] = useState<Doc>(initialDoc);

  if (!open) return null;

  return (
    <div
      className="space-legal-sheet"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="space-legal-in" role="dialog" aria-modal="true" aria-label="Legal">
        <div className="space-legal-top">
          <div className="space-legal-tabs">
            <button type="button" className={doc === "terms" ? "on" : ""} onClick={() => setDoc("terms")}>
              Terms of Use
            </button>
            <button type="button" className={doc === "privacy" ? "on" : ""} onClick={() => setDoc("privacy")}>
              Privacy Policy
            </button>
          </div>
          <button className="space-drawer-close" type="button" onClick={onClose}>Close</button>
        </div>

        {doc === "terms" ? (
          <article className="space-legal-doc">
            <p className="eyebrow">Jardin du Désert · Space</p>
            <h2 className="doc-title">Terms of Use</h2>
            <p className="doc-date">Draft · Last updated [date]</p>
            <h3>1. About Space</h3>
            <p>Space (space.jardindudesert.com) is a private digital service created by [Company legal name], [country] (“Jardin du Désert”, “we”). By creating an account or using Space, you agree to these Terms.</p>
            <h3>2. Your account</h3>
            <p>You may sign in with your email address, Apple or Google. You must be at least 18 years old, provide accurate information and keep access to your account secure. One account is for one person.</p>
            <h3>3. Preview, membership and guest access</h3>
            <p>Without membership, Space is offered as a Preview. Membership is by invitation; joining the waiting list is a request and does not guarantee membership. An access code received from a partner property opens guest access linked to that property and does not create a paid membership. Codes are personal and may not be shared or resold.</p>
            <h3>4. Your State, intention and guidance</h3>
            <p>Recommendations, States, rituals and guidance in Space are offered for personal reflection and well-being. They are not medical, psychological or professional advice and do not replace it.</p>
            <h3>5. Partner properties</h3>
            <p>Stays, events and services at partner properties are provided by those properties under their own terms. Jardin du Désert is not responsible for their services.</p>
            <h3>6. Acceptable use</h3>
            <p>Do not misuse Space, attempt to access other accounts, copy the service or use it for unlawful purposes. We may suspend accounts that breach these Terms.</p>
            <h3>7. Intellectual property</h3>
            <p>All content, names, scents, designs and texts in Space belong to Jardin du Désert or its licensors. Your intention and personal entries remain yours; you allow us to store and display them to you to provide the service.</p>
            <h3>8. Liability</h3>
            <p>Space is provided “as is”. To the extent permitted by law, our liability is limited to direct damages caused by our fault. Nothing limits rights you have under mandatory consumer law.</p>
            <h3>9. Ending your account</h3>
            <p>You can delete your account at any time from your Space or by writing to [contact email]. We may end access to the Preview or the service with reasonable notice.</p>
            <h3>10. Changes and law</h3>
            <p>We may update these Terms and will tell you about important changes. These Terms are governed by the laws of [country]. Contact: [contact email].</p>
          </article>
        ) : (
          <article className="space-legal-doc">
            <p className="eyebrow">Jardin du Désert · Space</p>
            <h2 className="doc-title">Privacy Policy</h2>
            <p className="doc-date">Draft · Last updated [date]</p>
            <h3>1. Who we are</h3>
            <p>[Company legal name], [address], is the controller of your personal data in Space. Contact for privacy: [privacy email].</p>
            <h3>2. What we collect</h3>
            <p>
              <b>Account:</b> email address and name. If you sign in with Apple or Google, we receive your name and email address from them (with Apple, possibly a private relay address). We do not receive your Apple or Google password.
              <br />
              <b>Discovery:</b> date of birth, your recommended State and property, your intention and ritual settings.
              <br />
              <b>Guest access:</b> property access codes and the property they belong to.
              <br />
              <b>Membership:</b> your waiting-list request.
              <br />
              <b>Technical:</b> device, browser, log and security data needed to keep your account safe.
            </p>
            <h3>3. Why we use it</h3>
            <p>To create and secure your account, sign you in, personalise your Space, link hotel access to your profile, handle your membership request and contact you about it. Legal bases: performance of our agreement with you, our legitimate interests in security and improving Space, and your consent where required.</p>
            <h3>4. Who processes it for us</h3>
            <p>Authentication is provided by Clerk, Inc. (sign-in, sessions, email codes). Hosting and email providers process data on our behalf under data-processing agreements. Apple and Google process your sign-in under their own privacy policies. Partner properties receive only what is needed for guest access you activate. We do not sell your data.</p>
            <h3>5. International transfers</h3>
            <p>Some providers are located outside your country, including the United States. Transfers are protected by appropriate safeguards such as the EU Standard Contractual Clauses.</p>
            <h3>6. How long we keep it</h3>
            <p>As long as your account is active. When you delete your account, we delete or anonymise your data within [30] days, unless the law requires us to keep it longer.</p>
            <h3>7. Your rights</h3>
            <p>You can access, correct, export or delete your data, object to or restrict its use, and withdraw consent at any time by writing to [privacy email]. You may also complain to your data-protection authority.</p>
            <h3>8. Cookies</h3>
            <p>We use only the cookies needed for sign-in and security. Any optional analytics will be used only with your consent.</p>
            <h3>9. Changes</h3>
            <p>We will publish updates here and tell you about important changes.</p>
          </article>
        )}
      </div>
    </div>
  );
}
