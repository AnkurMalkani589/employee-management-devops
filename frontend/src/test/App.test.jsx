import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App.jsx';

describe('App', () => {
  beforeEach(() => {
    global.fetch = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders employees returned by the backend', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () =>
        JSON.stringify([
          {
            id: 1,
            name: 'Ankur Sharma',
            email: 'ankur@example.com',
            department: 'DevOps',
            role: 'Platform Engineer',
          },
        ]),
    });

    render(<App />);

    expect(await screen.findByText('Ankur Sharma')).toBeInTheDocument();
    expect(screen.getByText('ankur@example.com')).toBeInTheDocument();
  });

  it('shows an empty state when there are no employees', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([]),
    });

    render(<App />);
    expect(await screen.findByText(/no employees yet/i)).toBeInTheDocument();
  });

  it('validates the form before submitting', async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([]),
    });

    render(<App />);
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));

    await userEvent.click(screen.getByRole('button', { name: /create/i }));

    expect(await screen.findByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/email is required/i)).toBeInTheDocument();
    // no create call was made
    expect(global.fetch).toHaveBeenCalledTimes(1);
  });
});
