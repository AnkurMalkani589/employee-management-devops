import { useEffect, useState } from 'react';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';
import AmbientBackground from './AmbientBackground.jsx';

const MOBILE_BREAKPOINT = 1024;

/**
 * AppShell - ambient backdrop + navigation + header + page content.
 *
 * Layering (bottom to top):
 *   .ambient        fixed cinematic backdrop (--z-ambient)
 *   .ambient-content app UI wrapper     (--z-content)
 *
 * Desktop: the sidebar is a rail that can collapse to icons.
 * <=1024px: it becomes an off-canvas drawer with a scrim, closed by default.
 * The drawer auto-closes when the viewport crosses back to desktop.
 */
export default function AppShell({ route, onNavigate, children, theme, onToggleTheme, employeeCount }) {
  const [collapsed, setCollapsed] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    function onResize() {
      if (window.innerWidth > MOBILE_BREAKPOINT) setDrawerOpen(false);
    }
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function handleToggle() {
    if (window.innerWidth <= MOBILE_BREAKPOINT) {
      setDrawerOpen((v) => !v);
    } else {
      setCollapsed((v) => !v);
    }
  }

  function navigate(key) {
    onNavigate(key);
    setDrawerOpen(false);
  }

  return (
    <div className="app-shell" data-collapsed={collapsed} data-drawer={drawerOpen}>
      <AmbientBackground />

      <div className="ambient-content app-shell__content">
        <Sidebar
          route={route}
          onNavigate={navigate}
          collapsed={collapsed}
          employeeCount={employeeCount}
        />

        {drawerOpen && (
          <div
            className="drawer-scrim"
            onClick={() => setDrawerOpen(false)}
            aria-hidden="true"
          />
        )}

        <div className="main-col">
          <Header route={route} onToggleSidebar={handleToggle} theme={theme} onToggleTheme={onToggleTheme} />
          <main className="page" id="main-content">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
