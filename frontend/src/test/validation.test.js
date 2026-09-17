import { describe, expect, it } from 'vitest';
import { emptyForm, validateEmployee } from '../validation.js';

describe('validateEmployee', () => {
  it('accepts a fully populated valid form', () => {
    const errors = validateEmployee({
      name: 'Jane',
      email: 'jane@example.com',
      department: 'Engineering',
      role: 'Engineer',
    });
    expect(errors).toEqual({});
  });

  it('requires name, email and department', () => {
    const errors = validateEmployee(emptyForm);
    expect(errors.name).toBeTruthy();
    expect(errors.email).toBeTruthy();
    expect(errors.department).toBeTruthy();
  });

  it('rejects a malformed email', () => {
    const errors = validateEmployee({
      name: 'Jane',
      email: 'nope',
      department: 'Eng',
      role: 'Engineer',
    });
    expect(errors.email).toMatch(/valid email/i);
  });

  it('rejects a name longer than 120 characters', () => {
    const errors = validateEmployee({
      name: 'x'.repeat(121),
      email: 'jane@example.com',
      department: 'Eng',
      role: 'Engineer',
    });
    expect(errors.name).toMatch(/120/);
  });
});
