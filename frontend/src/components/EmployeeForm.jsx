import { useState } from 'react';
import { emptyForm, validateEmployee } from '../validation.js';

/**
 * Create/edit form with client-side validation mirroring the backend rules.
 * Calls onSubmit(form) which may throw — errors are surfaced by App.
 */
export default function EmployeeForm({ initialValue, onSubmit, onCancel }) {
  const [form, setForm] = useState(initialValue || emptyForm);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  function change(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  }

  async function submit(e) {
    e.preventDefault();
    const found = validateEmployee(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setSubmitting(true);
    try {
      await onSubmit(form);
      if (!initialValue) setForm(emptyForm);
    } catch {
      /* parent surfaces the error; keep the form populated */
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form className="form" onSubmit={submit} noValidate>
      <Field
        label="Name"
        value={form.name}
        error={errors.name}
        onChange={(v) => change('name', v)}
        placeholder="Jane Doe"
      />
      <Field
        label="Email"
        type="email"
        value={form.email}
        error={errors.email}
        onChange={(v) => change('email', v)}
        placeholder="jane@example.com"
      />
      <Field
        label="Department"
        value={form.department}
        error={errors.department}
        onChange={(v) => change('department', v)}
        placeholder="Engineering"
      />
      <Field
        label="Role"
        value={form.role}
        error={errors.role}
        onChange={(v) => change('role', v)}
        placeholder="Engineer"
      />

      <div className="form__actions">
        <button className="btn btn--primary" type="submit" disabled={submitting}>
          {submitting ? 'Saving…' : initialValue ? 'Update' : 'Create'}
        </button>
        {onCancel && (
          <button type="button" className="btn btn--ghost" onClick={onCancel}>
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function Field({ label, value, onChange, error, type = 'text', placeholder }) {
  const id = `field-${label.toLowerCase()}`;
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        value={value}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span className="field__error">{error}</span>}
    </div>
  );
}
