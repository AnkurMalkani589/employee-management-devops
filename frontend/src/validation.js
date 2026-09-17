export const emptyForm = {
  name: '',
  email: '',
  department: '',
  role: 'Employee',
};

/**
 * Validate an employee form. Returns an object mapping field -> error message.
 * Empty object means the form is valid.
 */
export function validateEmployee(form) {
  const errors = {};

  if (!form.name || form.name.trim().length === 0) {
    errors.name = 'Name is required';
  } else if (form.name.length > 120) {
    errors.name = 'Name must be 120 characters or fewer';
  }

  if (!form.email || form.email.trim().length === 0) {
    errors.email = 'Email is required';
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
    errors.email = 'Enter a valid email address';
  }

  if (!form.department || form.department.trim().length === 0) {
    errors.department = 'Department is required';
  }

  if (!form.role || form.role.trim().length === 0) {
    errors.role = 'Role is required';
  }

  return errors;
}
