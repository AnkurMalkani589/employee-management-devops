import { Menu, PanelLeft, Bell, Sun, Moon } from 'lucide-react';
import { ROUTE_META } from '../navigation.js';

/**
 * Header - sticky topbar with a menu/collapse control, page title + breadcrumb,
 * theme toggle and notifications. `onToggleSidebar` opens the drawer on mobile
 * or collapses the rail on desktop.
 */
export default function Header({ route, onToggleSidebar, theme, onToggleTheme }) {
  const meta = ROUTE_META[route] || ROUTE_META.dashboard;
  const isDark = theme === 'dark';

  return (
    <header className="app-header">
      <button
        className="icon-btn menu-toggle"
        onClick={onToggleSidebar}
        aria-label="Open navigation menu"
      >
        <Menu size={19} aria-hidden="true" />
      </button>

      <button
        className="icon-btn collapse-toggle"
        onClick={onToggleSidebar}
        aria-label="Collapse navigation"
      >
        <PanelLeft size={19} aria-hidden="true" />
      </button>

      <nav className="app-header__crumb" aria-label="Breadcrumb">
        <span>{meta.title}</span>
        <span aria-hidden="true">/</span>
        <span className="muted">{meta.crumb}</span>
      </nav>

      <div className="app-header__actions">
        <button
          className="icon-btn"
          onClick={onToggleTheme}
          aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
        >
          {isDark ? <Sun size={19} aria-hidden="true" /> : <Moon size={19} aria-hidden="true" />}
        </button>
        <button className="icon-btn" aria-label="Notifications">
          <Bell size={19} aria-hidden="true" />
          <span className="icon-btn__dot" aria-hidden="true" />
        </button>
        <span className="avatar avatar--img" aria-hidden="true">
          AD
        </span>
      </div>
    </header>
  );
}
