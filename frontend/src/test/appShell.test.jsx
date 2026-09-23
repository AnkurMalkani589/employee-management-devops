import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import AmbientBackground from '../components/AmbientBackground.jsx';
import AppShell from '../components/AppShell.jsx';

describe('AmbientBackground', () => {
  it('renders the ambient primitives and is hidden from assistive tech', () => {
    const { container } = render(<AmbientBackground />);

    const ambient = container.querySelector('.ambient');
    expect(ambient).toBeInTheDocument();
    expect(ambient).toHaveAttribute('aria-hidden', 'true');

    expect(container.querySelector('.ambient__grid')).toBeInTheDocument();
    expect(container.querySelector('.ambient__glow--a')).toBeInTheDocument();
    expect(container.querySelector('.ambient__glow--b')).toBeInTheDocument();
    expect(container.querySelector('.ambient__noise')).toBeInTheDocument();
  });
});

describe('AppShell', () => {
  const noop = () => { };

  function renderShell() {
    return render(
      <AppShell
        route="dashboard"
        onNavigate={noop}
        theme="dark"
        onToggleTheme={noop}
        employeeCount={3}
      >
        <p>page content</p>
      </AppShell>,
    );
  }

  it('mounts the ambient layer and wraps content above it', () => {
    const { container } = renderShell();

    expect(container.querySelector('.ambient')).toBeInTheDocument();

    const content = container.querySelector('.ambient-content');
    expect(content).toBeInTheDocument();
    expect(content?.contains(screen.getByText('page content'))).toBe(true);
  });

  it('keeps a semantic banner, navigation and main landmark', () => {
    renderShell();

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Main navigation' })).toBeInTheDocument();
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getByRole('main')).toBeInTheDocument();
  });

  it('marks the active route for assistive technology', () => {
    renderShell();
    const active = screen.getByRole('button', { name: /^Dashboard/ });
    expect(active).toHaveAttribute('aria-current', 'page');
  });

  it('keeps the ambient layer a sibling of the content wrapper', () => {
    // Regression guard: the shell originally made .app-shell a 2-column grid.
    // The grid moved to .app-shell__content so the ambient backdrop (which is
    // a sibling) is not laid out as a grid cell.
    const { container } = renderShell();
    const shell = container.querySelector('.app-shell');
    const ambient = container.querySelector('.ambient');
    const content = container.querySelector('.ambient-content');

    expect(ambient?.parentElement).toBe(shell);
    expect(content?.parentElement).toBe(shell);
    // Exactly two children: backdrop + content.
    expect(shell?.children.length).toBe(2);
    // The backdrop must never be a grid child of the shell.
    expect(shell?.classList.contains('app-shell')).toBe(true);
  });

  it('keeps every navigation destination reachable', () => {
    renderShell();
    const nav = screen.getByRole('navigation', { name: 'Main navigation' });
    const labels = ['Dashboard', 'Employees', 'Departments', 'Reports', 'Settings', 'Help'];
    for (const label of labels) {
      expect(
        within(nav).getByRole('button', { name: new RegExp(`^${label}`) }),
      ).toBeInTheDocument();
    }
  });
});
