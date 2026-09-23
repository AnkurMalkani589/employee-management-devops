import { useEffect, useRef, useState } from 'react';

/**
 * Menu - accessible overflow/actions dropdown.
 *
 * - Trigger button with aria-haspopup/aria-expanded.
 * - Closes on outside click and Escape; returns focus to the trigger.
 * - Arrow keys navigate items.
 *
 * `items` is an array of { label, icon, onSelect, danger } or { separator: true }.
 */
export default function Menu({ trigger, items, label = 'Open menu' }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef(null);
  const triggerRef = useRef(null);
  const itemRefs = useRef([]);

  useEffect(() => {
    if (!open) return undefined;
    function onDocClick(e) {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setOpen(false);
    }
    function onKey(e) {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    document.addEventListener('mousedown', onDocClick);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDocClick);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  function focusItem(index) {
    const focusable = itemRefs.current.filter(Boolean);
    if (focusable.length === 0) return;
    const i = (index + focusable.length) % focusable.length;
    focusable[i].focus();
  }

  function onMenuKeyDown(e) {
    const focusable = itemRefs.current.filter(Boolean);
    const current = focusable.indexOf(document.activeElement);
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      focusItem(current + 1);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      focusItem(current - 1);
    }
  }

  return (
    <div className="menu-wrap" ref={wrapRef}>
      <button
        ref={triggerRef}
        className="icon-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
      >
        {trigger}
      </button>

      {open && (
        <div className="menu" role="menu" onKeyDown={onMenuKeyDown}>
          {items.map((item, index) => {
            if (item.separator) {
              return <div key={`sep-${index}`} className="menu__sep" role="separator" />;
            }
            const Icon = item.icon;
            return (
              <button
                key={item.label}
                role="menuitem"
                ref={(el) => {
                  itemRefs.current[index] = el;
                }}
                className={`menu__item${item.danger ? ' menu__item--danger' : ''}`}
                onClick={() => {
                  setOpen(false);
                  item.onSelect();
                }}
              >
                {Icon && <Icon size={16} aria-hidden="true" />}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
