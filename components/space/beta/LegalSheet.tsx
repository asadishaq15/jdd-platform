"use client";

import { useState } from "react";
import { LEGAL, type LegalKind } from "../../../lib/legal-content";
import "./space-drawer.css";

type Doc = LegalKind;

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

        <article
          className="space-legal-doc"
          dangerouslySetInnerHTML={{ __html: LEGAL[doc] }}
          onClick={(event) => {
            const anchor = (event.target as HTMLElement).closest?.("a");
            if (!anchor) return;
            const href = anchor.getAttribute("href") || "";
            if (/jardindudesert\.com\/privacy/i.test(href)) {
              event.preventDefault();
              setDoc("privacy");
            } else if (/jardindudesert\.com\/terms/i.test(href)) {
              event.preventDefault();
              setDoc("terms");
            }
          }}
        />
      </div>
    </div>
  );
}
