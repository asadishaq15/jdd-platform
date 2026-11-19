"use client";

import { useEffect, useRef } from "react";
import { LEGAL, type LegalKind } from "../../lib/legal-content";

type LegalModalProps = {
  kind: LegalKind | null;
  onClose: () => void;
  onSwitch?: (kind: LegalKind) => void;
};

export default function LegalModal({ kind, onClose, onSwitch }: LegalModalProps) {
  const bodyRef = useRef<HTMLDivElement>(null);
  const ovRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!kind) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    ovRef.current?.scrollTo(0, 0);
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [kind]);

  useEffect(() => {
    if (!kind) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [kind, onClose]);

  if (!kind) return null;

  const html = LEGAL[kind] || LEGAL.terms;

  return (
    <div
      id="legalOv"
      ref={ovRef}
      role="dialog"
      aria-modal="true"
      aria-label={kind === "terms" ? "Terms of Use" : "Privacy Policy"}
    >
      <button className="lg-x" type="button" onClick={onClose}>
        Close
      </button>
      <div
        className="lg-in"
        ref={bodyRef}
        dangerouslySetInnerHTML={{ __html: html }}
        onClick={(event) => {
          const anchor = (event.target as HTMLElement).closest?.("a");
          if (!anchor) return;
          const href = anchor.getAttribute("href") || "";
          if (/jardindudesert\.com\/privacy/i.test(href)) {
            event.preventDefault();
            onSwitch?.("privacy");
          } else if (/jardindudesert\.com\/terms/i.test(href)) {
            event.preventDefault();
            onSwitch?.("terms");
          }
        }}
      />
    </div>
  );
}
