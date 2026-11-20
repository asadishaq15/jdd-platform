"use client";

import { useEffect } from "react";
import { createPortal } from "react-dom";

export default function BetaExploreStayModal({
  property,
  open,
  onClose,
}: {
  property: string;
  open: boolean;
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="jmodal open beta-stay-note"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section className="jm-in glass" role="dialog" aria-modal="true" aria-label="Plan your stay">
        <p className="jm-text bn-lines">
          <span>In the live platform, this opens</span>
          <span>the booking page of {property}.</span>
        </p>
        <p className="jm-text bn-lines">
          <span>This demo is not connected to any booking system,</span>
          <span>and no card order is needed to plan a stay.</span>
        </p>
        <button className="beta-text-link" type="button" onClick={onClose}>
          Close
        </button>
      </section>
    </div>,
    document.body,
  );
}