import { useState } from 'react';
import { emptyForm, validateEmployee } from '../validation.js';
import Field from './ui/Field.jsx';
import Button from './ui/Button.jsx';

/**
 * EmployeeForm - create/edit form used inside the modal.
 *
 * Client-side validation mirrors the backend rules and is shown inline.
 * `onSubmit` may throw (the parent surfaces a toast); the form stays populated.
 */
export default function EmployeeForm({ initialValue, onSubmit, onCancel, submitLabel }) {
  const [form, setForm] = useState(initialValue || emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const isEdit = Boolean(initialValue);

  function change(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function submit(e) {
    e.preventDefault();
    const found = validateEmployee(form);
    setErrors(found);
    if (Object.keys(found).length > 0) {
      document.getElementById(`field-${Object.keys(found)[0]}`)?.focus();
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(form);
    } catch {
      /* parent surfaces the error; keep the form populated */
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate>
      <div className="form-grid">
        <Field id="field-name" label="Full name" required error={errors.name}>
          {(props) => (
            <input
              className="input"
              type="text"
              autoComplete="name"
              placeholder="e.g. Jane Doe"
              value={form.name}
              onChange={(e) => change('name', e.target.value)}
              {...props}
            />
          )}
        </Field>

        <Field id="field-email" label="Work email" required error={errors.email}>
          {(props) => (
            <input
              className="input"
              type="email"
              autoComplete="email"
              placeholder="e.g. jane@company.com"
              value={form.email}
              onChange={(e) => change('email', e.target.value)}
              {...props}
            />
          )}
        </Field>

        <Field id="field-department" label="Department" required error={errors.department}>
          {(props) => (
            <input
              className="input"
              type="text"
              placeholder="e.g. Engineering"
              value={form.department}
              onChange={(e) => change('department', e.target.value)}
              {...props}
            />
          )}
        </Field>

        <Field id="field-role" label="Role" required error={errors.role}>
          {(props) => (
            <input
              className="input"
              type="text"
              placeholder="e.g. Software Engineer"
              value={form.role}
              onChange={(e) => change('role', e.target.value)}
              {...props}
            />
          )}
        </Field>
      </div>

      <div className="modal__foot" style={{ margin: '1.5rem -1.25rem -1.25rem' }}>
        <Button variant="ghost" onClick={onCancel} disabled={submitting}>
          Cancel
        </Button>
        <Button type="submit" variant="primary" loading={submitting}>
          {submitLabel || (isEdit ? 'Save changes' : 'Add employee')}
        </Button>
      </div>
    </form>
  );
}
