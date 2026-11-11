export default function Loading({ label = 'Carregando...' }) {
  return (
    <div
      className="d-flex flex-column justify-content-center align-items-center vh-100"
      role="status"
      aria-live="polite"
    >
      <div className="spinner-border text-primary mb-3" aria-hidden="true"></div>
      <span className="text-secondary">{label}</span>
    </div>
  );
}