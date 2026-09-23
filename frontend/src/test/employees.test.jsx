import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App.jsx';
import { ToastProvider } from '../components/ui/Toast.jsx';

const SAMPLE = [
  {
    id: 7,
    name: 'Grace Hopper',
    email: 'grace@example.com',
    department: 'Engineering',
    role: 'Admiral',
    created_at: '2025-02-01T10:00:00Z',
    updated_at: '2025-02-01T10:00:00Z',
  },
];

function renderApp() {
  return render(
    <ToastProvider>
      <App />
    </ToastProvider>,
  );
}

/**
 * A fetch mock that tracks calls so we can assert the exact API contract the
 * UI uses: GET /api/employees, POST /api/employees, DELETE /api/employees/{id}.
 */
function mockApi(initial = SAMPLE) {
  const calls = [];
  let store = [...initial];
  global.fetch = vi.fn(async (url, opts = {}) => {
    calls.push({ url, method: opts.method || 'GET', body: opts.body });
    if (url.endsWith('/employees') && (!opts.method || opts.method === 'GET')) {
      return { ok: true, status: 200, text: async () => JSON.stringify(store) };
    }
    if (url.endsWith('/employees') && opts.method === 'POST') {
      const body = JSON.parse(opts.body);
      store = [...store, { id: 99, ...body, created_at: new Date().toISOString() }];
      return { ok: true, status: 201, text: async () => JSON.stringify(store.at(-1)) };
    }
    if (opts.method === 'DELETE') {
      store = store.filter((e) => !url.endsWith(`/${e.id}`));
      return { ok: true, status: 204, text: async () => '' };
    }
    return { ok: true, status: 200, text: async () => '{}' };
  });
  return calls;
}

describe('Employees workflow', () => {
  beforeEach(() => {
    window.location.hash = '#/employees';
  });

  afterEach(() => vi.restoreAllMocks());

  it('creates an employee through the modal and refreshes the list', async () => {
    const calls = mockApi([]);
    renderApp();

    await userEvent.click(await screen.findByRole('button', { name: /add employee/i }));
    const dialog = await screen.findByRole('dialog');

    await userEvent.type(within(dialog).getByLabelText(/full name/i), 'Ada Lovelace');
    await userEvent.type(within(dialog).getByLabelText(/work email/i), 'ada@example.com');
    await userEvent.type(within(dialog).getByLabelText(/^department/i), 'Engineering');
    await userEvent.type(within(dialog).getByLabelText(/^role/i), 'Engineer');

    await userEvent.click(within(dialog).getByRole('button', { name: /add employee/i }));

    await waitFor(() => {
      const post = calls.find((c) => c.method === 'POST');
      expect(post).toBeTruthy();
      expect(post.url).toBe('/api/employees');
    });

    // Success toast appears
    expect(await screen.findByText(/employee created/i)).toBeInTheDocument();
  });

  it('asks for confirmation before deleting and calls DELETE', async () => {
    const calls = mockApi();
    renderApp();
    const table = await screen.findByRole('table');
    await within(table).findByText('Grace Hopper');

    await userEvent.click(within(table).getByRole('button', { name: /actions for grace hopper/i }));
    await userEvent.click(screen.getByRole('menuitem', { name: /delete employee/i }));

    // Confirmation dialog must appear first
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/permanently remove/i)).toBeInTheDocument();

    await userEvent.click(within(dialog).getByRole('button', { name: /delete employee/i }));

    await waitFor(() => {
      const del = calls.find((c) => c.method === 'DELETE');
      expect(del?.url).toBe('/api/employees/7');
    });
    expect(await screen.findByText(/employee deleted/i)).toBeInTheDocument();
  });
});
