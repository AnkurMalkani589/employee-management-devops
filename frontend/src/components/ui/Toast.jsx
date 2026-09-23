import { useCallback, useMemo, useRef, useState } from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { ToastContext } from '../../context/ToastContext.js';

const ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
};

/**
 * ToastProvider - app-wide, non-blocking notifications.
 * Consumer API: const toast = useToast(); toast.success('Employee created');
 */
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const push = useCallback(
    (variant, title, message, duration = 4200) => {
      const id = (idRef.current += 1);
      setToasts((prev) => [...prev, { id, variant, title, message }]);
      if (duration > 0) setTimeout(() => dismiss(id), duration);
    },
    [dismiss],
  );

  const api = useMemo(
    () => ({
      success: (title, message) => push('success', title, message),
      error: (title, message) => push('error', title, message),
      info: (title, message) => push('info', title, message),
      dismiss,
    }),
    [push, dismiss],
  );

  return (
    <ToastContext.Provider value={api}>
      {children}
      <div className="toast-region" role="region" aria-label="Notifications">
        {toasts.map((t) => {
          const Icon = ICONS[t.variant] || Info;
          return (
            <div key={t.id} className={`toast toast--${t.variant}`} role="status">
              <span className="toast__icon" aria-hidden="true">
                <Icon size={18} />
              </span>
              <div className="toast__body">
                <div className="toast__title">{t.title}</div>
                {t.message && <div className="toast__msg">{t.message}</div>}
              </div>
              <button
                className="icon-btn toast__close"
                onClick={() => dismiss(t.id)}
                aria-label="Dismiss notification"
              >
                <X size={15} aria-hidden="true" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}
