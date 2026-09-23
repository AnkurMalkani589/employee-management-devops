import { AlertCircle, X } from 'lucide-react';

/**
 * Alert - inline, non-blocking message with an optional action and dismiss.
 * Used for load failures (with Retry) and other page-level notices.
 */
export default function Alert({ variant = 'error', title, message, action, onDismiss }) {
  return (
    <div className={`alert alert--${variant}`} role="alert">
      <span className="alert__icon" aria-hidden="true">
        <AlertCircle size={18} />
      </span>
      <div className="alert__content">
        {title && <div className="alert__title">{title}</div>}
        {message && <div className="alert__msg">{message}</div>}
        {action && <div className="alert__actions">{action}</div>}
      </div>
      {onDismiss && (
        <button className="icon-btn alert__close" onClick={onDismiss} aria-label="Dismiss">
          <X size={15} aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
