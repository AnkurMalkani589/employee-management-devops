import { useEffect, useRef } from 'react';
import { X, Pencil, Trash2, Mail, Building2, Briefcase, CalendarClock, Clock } from 'lucide-react';
import Button from './Button.jsx';
import Badge from './Badge.jsx';
import { initials, avatarTone, formatDate, relativeTime } from '../../utils.js';

/**
 * EmployeeDetail - a slide-over panel showing one employee's full record.
 *
 * Opens from a table row / card. Accessible as a modal dialog: labelled, focus
 * moves in on open and is restored on close, ESC dismisses, and the scrim
 * closes it. Keeps the underlying list visible (lower visual weight than an
 * edit modal) since it is read-only.
 */
export default function EmployeeDetail({ employee, onClose, onEdit, onDelete }) {
  const panelRef = useRef(null);
  const previouslyFocused = useRef(null);

  useEffect(() => {
    previouslyFocused.current = document.activeElement;
    panelRef.current?.querySelector('button')?.focus();

    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    function onKey(e) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
      previouslyFocused.current?.focus?.();
    };
  }, [onClose]);

  const fields = [
    { icon: Mail, label: 'Work email', value: employee.email },
    { icon: Building2, label: 'Department', value: employee.department },
    { icon: Briefcase, label: 'Role', value: employee.role },
    { icon: CalendarClock, label: 'Added on', value: formatDate(employee.created_at) },
    { icon: Clock, label: 'Last updated', value: relativeTime(employee.updated_at) },
  ];

  return (
    <div className="overlay overlay--sheet" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div
        ref={panelRef}
        className="sheet"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
      >
        <div className="sheet__head">
          <span className={`avatar avatar--lg avatar--tone-${avatarTone(employee.name)}`} aria-hidden="true">
            {initials(employee.name)}
          </span>
          <div className="sheet__title-group">
            <h2 className="sheet__title" id="detail-title">
              {employee.name}
            </h2>
            <span className="muted">{employee.role}</span>
          </div>
          <button className="icon-btn sheet__close" onClick={onClose} aria-label="Close details">
            <X size={18} aria-hidden="true" />
          </button>
        </div>

        <div className="sheet__body">
          <div className="sheet__badges">
            <Badge tone="accent">{employee.department}</Badge>
          </div>

          <dl className="detail-list">
            {fields.map((f) => {
              const Icon = f.icon;
              return (
                <div className="detail-row" key={f.label}>
                  <dt className="detail-row__label">
                    <Icon size={16} aria-hidden="true" />
                    {f.label}
                  </dt>
                  <dd className="detail-row__value">{f.value || '—'}</dd>
                </div>
              );
            })}
          </dl>
        </div>

        <div className="sheet__foot">
          <Button variant="ghost" onClick={() => onDelete(employee)}>
            <Trash2 size={16} aria-hidden="true" />
            Delete
          </Button>
          <Button variant="primary" onClick={() => onEdit(employee)}>
            <Pencil size={16} aria-hidden="true" />
            Edit details
          </Button>
        </div>
      </div>
    </div>
  );
}
