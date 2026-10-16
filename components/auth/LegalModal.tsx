type LegalModalProps = {
  kind: "terms" | "privacy" | null;
  onClose: () => void;
};

export default function LegalModal({ kind, onClose }: LegalModalProps) {
  if (!kind) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <section className="legal-modal" role="dialog" aria-modal="true" aria-label={kind === "terms" ? "Terms of Use" : "Privacy Policy"}>
        <button className="modal-close" type="button" aria-label="Close" onClick={onClose}>×</button>
        <p className="eyebrow">Jardin du Desert · Space</p>
        <h2 className="doc-title">{kind === "terms" ? "Terms of Use" : "Privacy Policy"}</h2>
        <p>
          This shell is ready for the final legal copy. In production this content can be served from a CMS or legal document route while keeping the same modal surface.
        </p>
      </section>
    </div>
  );
}
