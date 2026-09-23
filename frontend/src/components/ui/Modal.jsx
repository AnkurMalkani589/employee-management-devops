import { useCallback, useEffect, useRef } from 'react';
import { X } from 'lucide-react';

/**
 * Modal - accessible dialog.
 *
 * - Renders into the overlay, centres itself, scrolls within the viewport.
 * - role="dialog" + aria-modal, labelled by the title.
 * - Closes on Escape and on overlay click; moves focus in on open and restores
 *   it on close; traps Tab within the dialog while open.
 */
export default function Modal({ title, description, onClose, children, footer, size = 'md' }) {
  const dialogRef = useRef(null);
  const previouslyFocused = useRef(null);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
        return;
      }
      if (e.key !== 'Tab') return;

      const focusable = dialogRef.current?.querySelectorAll(
        'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (!focusable || focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    // Focus the first focusable control (or the dialog itself).
    const target =
      dialogRef.current?.querySelector(
        'input, select, textarea, button:not(.modal__close)',
      ) || dialogRef.current;
    target?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = overflow;
      previouslyFocused.current?.focus?.();
    };
  }, []);

  return (
    <div
      className="overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className={`modal${size === 'sm' ? ' modal--sm' : ''}`}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby={description ? 'modal-desc' : undefined}
        onKeyDown={handleKeyDown}
      >
        <div className="modal__head">
          <div>
            <h2 className="modal__title" id="modal-title">
              {title}
            </h2>
            {description && (
              <p className="modal__desc" id="modal-desc">
                {description}
              </p>
            )}
          </div>
          <button className="icon-btn modal__close" onClick={onClose} aria-label="Close dialog">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="modal__body">{children}</div>

        {footer && <div className="modal__foot">{footer}</div>}
      </div>
    </div>
  );
}
