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

    await waitFor(() => expect(screen.getByText('Total Employees')).toBeInTheDocument());
    // Department distribution is derived from the same data
    expect(screen.getByText('Distinct departments')).toBeInTheDocument();
    expect(screen.getByText('DevOps')).toBeInTheDocument();
    expect(screen.getByText('HR')).toBeInTheDocument();
  });

  it('shows an empty state when there are no employees', async () => {
    mockList([]);
    renderApp();
    expect(await screen.findByText(/no employees yet/i)).toBeInTheDocument();
  });

  it('navigates to the Employees page and lists people', async () => {
    mockList(SAMPLE);
    renderApp();
    await waitFor(() => expect(screen.getByText('Total Employees')).toBeInTheDocument());

    await userEvent.click(screen.getByRole('button', { name: /^Employees/ }));

    const table = await screen.findByRole('table');
    expect(await within(table).findByText('Ankur Sharma')).toBeInTheDocument();
    expect(within(table).getByText('ankur@example.com')).toBeInTheDocument();
  });

  it('filters employees by search query', async () => {
    mockList(SAMPLE);
    renderApp();
    await waitFor(() => expect(screen.getByText('Total Employees')).toBeInTheDocument());
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

    await userEvent.click(screen.getByRole('button', { name: /add employee/i }));

    const dialog = await screen.findByRole('dialog');
    await userEvent.click(within(dialog).getByRole('button', { name: /add employee/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });
});
