import { Monitor, Sun, Moon } from 'lucide-react';

/**
 * SettingsPage - appearance preferences. The theme control is real (it drives
 * [data-theme] and persists to localStorage via useTheme). Nothing here is a
 * fake toggle: each control performs the action it describes.
 */
export default function SettingsPage({ theme, onToggleTheme, data }) {
  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <h1 className="page-title">Settings</h1>
          <p className="page-desc">Preferences for your workspace.</p>
        </div>
      </div>

      <div className="card">
        <div className="card__head">
          <div>
            <h3 className="card__title">Appearance</h3>
            <p className="card__subtitle">Customise how the workspace looks</p>
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-row__text">
            <div className="setting-row__title">Theme</div>
            <div className="setting-row__desc">Switch between light and dark mode.</div>
          </div>
          <div className="segmented" role="group" aria-label="Theme">
            <button aria-pressed={theme === 'light'} onClick={() => theme !== 'light' && onToggleTheme()}>
              <Sun size={14} aria-hidden="true" /> Light
            </button>
            <button aria-pressed={theme === 'dark'} onClick={() => theme !== 'dark' && onToggleTheme()}>
              <Moon size={14} aria-hidden="true" /> Dark
            </button>
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-row__text">
            <div className="setting-row__title">Follow system</div>
            <div className="setting-row__desc">
              The first visit matches your operating system preference automatically.
            </div>
          </div>
          <Monitor size={18} aria-hidden="true" className="muted" />
        </div>
      </div>

      <div className="card mt-5">
        <div className="card__head">
          <div>
            <h3 className="card__title">Workspace</h3>
            <p className="card__subtitle">Read-only summary of your data</p>
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-row__text">
            <div className="setting-row__title">Employees in directory</div>
            <div className="setting-row__desc">Loaded live from the API</div>
          </div>
          <span className="badge badge--neutral">{data.stats.total}</span>
        </div>
        <div className="setting-row">
          <div className="setting-row__text">
            <div className="setting-row__title">Departments</div>
            <div className="setting-row__desc">Derived from employee records</div>
          </div>
          <span className="badge badge--neutral">{data.stats.departmentCount}</span>
        </div>
      </div>
    </>
  );
}
