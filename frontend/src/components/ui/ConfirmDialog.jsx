import { AlertTriangle } from 'lucide-react';
import Modal from './Modal.jsx';
import Button from './Button.jsx';

/**
 * ConfirmDialog - destructive-action confirmation built on Modal.
 * Explicit, unambiguous copy; the destructive action is visually emphasised.
 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}) {
  return (
    <Modal
      size="sm"
      title={title}
      onClose={loading ? () => { } : onCancel}
      footer={
        <>
          <Button variant="ghost" onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="row gap-4" style={{ alignItems: 'flex-start' }}>
        <div className="confirm-icon" aria-hidden="true">
          <AlertTriangle size={22} />
        </div>
        <p className="muted" style={{ fontSize: 'var(--text-sm)' }}>
          {message}
        </p>
      </div>
    </Modal>
  );
}
