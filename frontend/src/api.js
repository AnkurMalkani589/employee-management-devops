/**
 * Thin API client for the Employee Management backend.
 *
 * The base URL is configurable via the VITE_API_BASE_URL build-time variable.
 * It defaults to `/api`, which Nginx proxies to the backend, so the same build
 * works locally, in Docker and in production without hardcoded hosts/ports.
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '/api';

class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request(path, options = {}) {
  const url = `${API_BASE_URL}${path}`;
  let response;
  try {
    response = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      ...options,
    });
  } catch (err) {
    throw new ApiError(`Network error: ${err.message}`, 0);
  }

  if (response.status === 204) return null;

  const text = await response.text();
  const body = text ? JSON.parse(text) : null;

  if (!response.ok) {
    const detail = body?.detail;
    const message = Array.isArray(detail)
      ? detail.map((d) => d.msg).join(', ')
      : detail || `Request failed with status ${response.status}`;
    throw new ApiError(message, response.status);
  }
  return body;
}

export const api = {
  listEmployees: () => request('/employees'),
  getEmployee: (id) => request(`/employees/${id}`),
  createEmployee: (data) =>
    request('/employees', { method: 'POST', body: JSON.stringify(data) }),
  updateEmployee: (id, data) =>
    request(`/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteEmployee: (id) => request(`/employees/${id}`, { method: 'DELETE' }),
  health: () => request('/health'),
};

export { ApiError };
