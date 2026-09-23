import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App.jsx';
import { ToastProvider } from '../components/ui/Toast.jsx';

function renderApp() {
  return render(
    <ToastProvider>
      <App />
    </ToastProvider>,
  );
}

const SAMPLE = [
  {
    id: 1,
    name: 'Ankur Sharma',
    email: 'ankur@example.com',
    department: 'DevOps',
    role: 'Platform Engineer',
    created_at: '2025-01-05T10:00:00Z',
    updated_at: '2025-01-05T10:00:00Z',
  },
  {
    id: 2,
    name: 'Rahul Verma',
    email: 'rahul@example.com',
    department: 'HR',
    role: 'HR Manager',
    created_at: '2025-01-06T10:00:00Z',
    updated_at: '2025-01-06T10:00:00Z',
  },
];

function mockList(data) {
  global.fetch = vi.fn(async () => ({
    ok: true,
    status: 200,
    text: async () => JSON.stringify(data),
  }));
}

describe('App', () => {
  beforeEach(() => {
    window.location.hash = '#/dashboard';
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders the dashboard with metrics derived from employees', async () => {
    mockList(SAMPLE);
    renderApp();

    // Editorial hero + real derived metric labels.
    await waitFor(() =>
      expect(screen.getByRole('heading', { level: 1, name: /workforce/i })).toBeInTheDocument(),
    );
    expect(screen.getByText('Total employees')).toBeInTheDocument();
    expect(screen.getByText('Distinct organisational units')).toBeInTheDocument();
    // Both departments are represented in the workforce intelligence panel.
    expect(screen.getAllByText('DevOps').length).toBeGreaterThan(0);
    expect(screen.getAllByText('HR').length).toBeGreaterThan(0);
  });

  it('shows an empty state when there are no employees', async () => {
    mockList([]);
    renderApp();
    expect(await screen.findByText(/no employees yet/i)).toBeInTheDocument();
  });

  it('reports live platform status from the health endpoint', async () => {
    global.fetch = vi.fn(async (url) => {
      if (String(url).includes('/health')) {
        return {
          ok: true,
          status: 200,
          text: async () =>
            JSON.stringify({
              status: 'ok',
              database: 'ok',
              version: '1.0.0',
              environment: 'test',
            }),
        };
      }
      return { ok: true, status: 200, text: async () => JSON.stringify(SAMPLE) };
    });

    renderApp();

    // The status panel only ever shows real values from /health.
    expect(await screen.findByText('Operational')).toBeInTheDocument();
    expect(screen.getByText('Platform status')).toBeInTheDocument();
    expect(screen.getByText('Database')).toBeInTheDocument();
  });

  it('navigates to the Employees page and lists people', async () => {
    mockList(SAMPLE);
    renderApp();
    await waitFor(() => expect(screen.getByText('Total employees')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /^Employees/ }));

    const table = await screen.findByRole('table');
    expect(await within(table).findByText('Ankur Sharma')).toBeInTheDocument();
    expect(within(table).getByText('ankur@example.com')).toBeInTheDocument();
  });

  it('filters employees by search query', async () => {
    mockList(SAMPLE);
    renderApp();
    await waitFor(() => expect(screen.getByText('Total employees')).toBeInTheDocument());
    await userEvent.click(screen.getByRole('button', { name: /^Employees/ }));
    const table = await screen.findByRole('table');
    await within(table).findByText('Ankur Sharma');

    await userEvent.type(screen.getByLabelText('Search employees'), 'rahul');

    expect(within(table).queryByText('Ankur Sharma')).not.toBeInTheDocument();
    expect(within(table).getByText('Rahul Verma')).toBeInTheDocument();
  });

  it('opens the add-employee modal and validates required fields', async () => {
    mockList([]);
    renderApp();
    await screen.findByText(/no employees yet/i);

    // Both the hero CTA and the empty-state CTA are legitimate entry points.
    await userEvent.click(screen.getAllByRole('button', { name: /add employee/i })[0]);

    const dialog = await screen.findByRole('dialog');
    // Inside the dialog, the submit button shares the label - scope to it.
    await userEvent.click(within(dialog).getByRole('button', { name: /add employee/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });

  it('exposes multiple legitimate entry points to add an employee', async () => {
    mockList(SAMPLE);
    renderApp();
    await waitFor(() => expect(screen.getByText('Total employees')).toBeInTheDocument());

    // Hero CTA + quick action are both legitimate, real controls.
    const ctas = screen.getAllByRole('button', { name: /add employee/i });
    expect(ctas.length).toBeGreaterThanOrEqual(2);

    await userEvent.click(ctas[0]);
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
  });
});
