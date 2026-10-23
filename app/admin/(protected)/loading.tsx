export default function AdminLoading() {
  return (
    <div className="admin-route-loader" role="status" aria-live="polite">
      <span className="admin-route-loader-mark" aria-hidden="true" />
      <span>Loading dashboard</span>
    </div>
  );
}
