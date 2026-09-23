import { NAV_ITEMS, SECONDARY_NAV } from '../navigation.js';
import { ChevronRight } from 'lucide-react';

/**
 * Sidebar - collapsible on desktop, off-canvas drawer on tablet/mobile.
 * Renders nav items with aria-current, an optional count badge, and a user chip.
 */
export default function Sidebar({ route, onNavigate, collapsed, employeeCount }) {
  const renderItem = (item) => {
    const Icon = item.icon;
    const active = route === item.key;
    return (
      <button
        key={item.key}
        className="nav-item"
        aria-current={active ? 'page' : undefined}
        onClick={() => onNavigate(item.key)}
        title={collapsed ? item.label : undefined}
      >
        <span className="nav-item__icon" aria-hidden="true">
          <Icon size={18} />
        </span>
        <span className="nav-item__label">{item.label}</span>
        {item.key === 'employees' && employeeCount > 0 && (
          <span className="nav-badge">{employeeCount}</span>
        )}
      </button>
    );
  };

  return (
    <aside className="sidebar" aria-label="Primary">
      <div className="sidebar__brand">
        <span className="brand-mark" aria-hidden="true">
          EM
        </span>
        <span className="brand-text">
          <span className="brand-name">Employee Management</span>
          <span className="brand-sub">People Operations</span>
        </span>
      </div>

      <nav className="sidebar__nav" aria-label="Main navigation">
        <span className="nav-section-label">Workspace</span>
        {NAV_ITEMS.map(renderItem)}

        <span className="nav-section-label">Support</span>
        {SECONDARY_NAV.map(renderItem)}
      </nav>

      <div className="sidebar__footer">
        <button className="user-chip" aria-label="Account menu">
          <span className="avatar">AD</span>
          <span className="user-chip__meta">
            <span className="user-chip__name">Admin User</span>
            <span className="user-chip__role">Administrator</span>
          </span>
          <ChevronRight size={16} aria-hidden="true" className="muted" />
        </button>
      </div>
    </aside>
  );
}
