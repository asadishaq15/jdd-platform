export default function StubSlide({ note }: { note: string }) {
  return (
    <article className="beta-stub" aria-label="Coming soon">
      <p className="beta-stub-note">{note}</p>
    </article>
  );
}
