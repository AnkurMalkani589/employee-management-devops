import { describe, expect, it, vi } from 'vitest';
import { api, ApiError } from '../api.js';

function mockFetchOnce(handler) {
  global.fetch = vi.fn(handler);
}

describe('api client', () => {
  it('lists employees from the configured base URL', async () => {
    mockFetchOnce(async () => ({
      ok: true,
      status: 200,
      text: async () => JSON.stringify([{ id: 1, name: 'A' }]),
    }));
    const result = await api.listEmployees();
    expect(result).toEqual([{ id: 1, name: 'A' }]);
    // default base is /api
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/employees',
      expect.objectContaining({ headers: { 'Content-Type': 'application/json' } }),
    );
  });

  it('creates an employee with POST + JSON body', async () => {
    mockFetchOnce(async () => ({
      ok: true,
      status: 201,
      text: async () => JSON.stringify({ id: 2 }),
    }));
    await api.createEmployee({ name: 'B', email: 'b@x.com', department: 'D', role: 'R' });
    const [url, opts] = global.fetch.mock.calls[0];
    expect(url).toBe('/api/employees');
    expect(opts.method).toBe('POST');
    expect(JSON.parse(opts.body)).toMatchObject({ name: 'B' });
  });

  it('surfaces backend validation detail as an ApiError', async () => {
    mockFetchOnce(async () => ({
      ok: false,
      status: 422,
      text: async () => JSON.stringify({ detail: [{ msg: 'field required' }] }),
    }));
    await expect(api.createEmployee({})).rejects.toBeInstanceOf(ApiError);
  });

  it('returns null for 204 responses (delete)', async () => {
    mockFetchOnce(async () => ({ ok: true, status: 204, text: async () => '' }));
    await expect(api.deleteEmployee(1)).resolves.toBeNull();
  });
});
