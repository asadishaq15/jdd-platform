export default function LoadingView({ title }: { title: string }) {
  return (
    <section className="auth-view" aria-label="Loading" aria-live="polite">
      <div className="loader" aria-hidden="true">
        <svg viewBox="0 0 120 120">
          <circle className="ring" cx="60" cy="60" r="46" />
          <circle className="arc" cx="60" cy="60" r="46" pathLength="1" />
        </svg>
      </div>
      <p className="load-title"><span className="load-1">One moment.</span><span> {title}</span></p>
    </section>
  );
}
