import { Menu, PanelLeft, Bell, Sun, Moon, Command } from 'lucide-react';
import { ROUTE_META } from '../navigation.js';

/**
 * Header - the global top bar.
 *
 * Left: navigation toggle (hamburger on mobile, rail collapse on desktop).
 * Centre: page context as a breadcrumb navigation landmark.
 * Right: theme, notifications and the account avatar - the same controls as
 * before, with the glass surface coming from the shell styles.
 *
 * `onToggleSidebar` opens the drawer on mobile / collapses the rail on desktop.
 */
export default function Header({ route, onToggleSidebar, theme, onToggleTheme }) {
  const meta = ROUTE_META[route] || ROUTE_META.dashboard;
  const isDark = theme === 'dark';

  return (
    <header className="app-header surface-glass">
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
        <span className="app-header__crumb-root">
          <Command size={14} aria-hidden="true" />
          <span className="sr-only">Current location: </span>
          {meta.title}
        </span>
        <span className="app-header__crumb-sep" aria-hidden="true">
          /
        </span>
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
