export default function StatusBanner({ error, onDismiss }) {
  if (!error) return null;
  return (
    <div className="banner banner--error" role="alert">
      <span>{error}</span>
      <button className="banner__close" onClick={onDismiss} aria-label="Dismiss">
        ×
      </button>
    </div>
  );
}
