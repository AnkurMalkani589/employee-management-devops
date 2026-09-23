import { AlertCircle } from 'lucide-react';

/**
 * Field - label + control + inline error/hint, wired for accessibility.
 *
 * Renders the label with `htmlFor`, sets aria-invalid/aria-describedby on the
 * control, and shows the error with role="alert" so screen readers announce it.
 */
export default function Field({
  id,
  label,
  error,
  hint,
  required = false,
  children,
}) {
  const errorId = error ? `${id}-error` : undefined;
  const hintId = hint ? `${id}-hint` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(' ') || undefined;

  return (
    <div className="field">
      <label className="field__label" htmlFor={id}>
        {label}
        {required && (
          <span className="field__req" aria-hidden="true">
            *
          </span>
        )}
      </label>
      {children({ id, 'aria-describedby': describedBy, 'aria-invalid': Boolean(error) || undefined })}
      {error && (
        <span className="field__error" id={errorId} role="alert">
          <AlertCircle size={14} aria-hidden="true" />
          {error}
        </span>
      )}
      {hint && !error && (
        <span className="field__hint" id={hintId}>
          {hint}
        </span>
      )}
    </div>
  );
}
