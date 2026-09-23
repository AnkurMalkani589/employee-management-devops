import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App.jsx';
import { ToastProvider } from '../components/ui/Toast.jsx';

const SAMPLE = [
  {
    id: 1,
    name: 'Ada Lovelace',
    email: 'ada@example.com',
    department: 'Engineering',
    role: 'Principal Engineer',
    created_at: '2025-03-01T10:00:00Z',
    updated_at: '2025-03-02T10:00:00Z',
  },
];

function renderApp() {
  return render(
    <ToastProvider>
      <App />
    </ToastProvider>,
  );
}

beforeEach(() => {
  window.location.hash = '#/employees';
  global.fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(SAMPLE),
  }));
});

afterEach(() => vi.restoreAllMocks());

describe('Employee detail panel', () => {
  it('opens from a row click and shows the full record', async () => {
    renderApp();
    const table = await screen.findByRole('table');
    await within(table).findByText('Ada Lovelace');

    await userEvent.click(within(table).getByText('Ada Lovelace'));

    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('Work email')).toBeInTheDocument();
    expect(within(dialog).getByText('ada@example.com')).toBeInTheDocument();
    expect(within(dialog).getByText('Department')).toBeInTheDocument();
    expect(within(dialog).getByText('Engineering')).toBeInTheDocument();
  });

  it('closes on Escape', async () => {
    renderApp();
    const table = await screen.findByRole('table');
    await within(table).findByText('Ada Lovelace');
    await userEvent.click(within(table).getByText('Ada Lovelace'));
    await screen.findByRole('dialog');

    await userEvent.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });
});

describe('Keyboard shortcut', () => {
  it('focuses the search box when "/" is pressed', async () => {
    renderApp();
    await screen.findByRole('table');

    await userEvent.keyboard('/');

    expect(screen.getByLabelText('Search employees')).toHaveFocus();
  });
});

describe('Sorting', () => {
  it('exposes aria-sort on the active column', async () => {
    renderApp();
    await screen.findByRole('table');

    await userEvent.click(screen.getByRole('button', { name: /sort by employee/i }));

    const header = screen.getByRole('columnheader', { name: /employee/i });
    expect(header).toHaveAttribute('aria-sort', 'ascending');
  });
});
