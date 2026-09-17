import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';
import EmployeeForm from './components/EmployeeForm.jsx';
import EmployeeList from './components/EmployeeList.jsx';
import StatusBanner from './components/StatusBanner.jsx';

export default function App() {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);

  const loadEmployees = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setEmployees(await api.listEmployees());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadEmployees();
  }, [loadEmployees]);

  async function handleCreate(form) {
    try {
      await api.createEmployee(form);
      setError(null);
      await loadEmployees();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function handleUpdate(id, form) {
    try {
      await api.updateEmployee(id, form);
      setEditing(null);
      setError(null);
      await loadEmployees();
    } catch (err) {
      setError(err.message);
      throw err;
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this employee?')) return;
    try {
      await api.deleteEmployee(id);
      setError(null);
      await loadEmployees();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div className="app">
      <header className="app__header">
        <h1>Employee Management</h1>
        <p className="app__subtitle">
          React + FastAPI + PostgreSQL · deployed via CI/CD
        </p>
      </header>

      <StatusBanner error={error} onDismiss={() => setError(null)} />

      <main className="app__main">
        <section className="card">
          <h2>{editing ? `Edit employee #${editing.id}` : 'Add employee'}</h2>
          <EmployeeForm
            key={editing ? editing.id : 'new'}
            initialValue={editing}
            onSubmit={editing ? (f) => handleUpdate(editing.id, f) : handleCreate}
            onCancel={editing ? () => setEditing(null) : null}
          />
        </section>

        <section className="card">
          <div className="card__head">
            <h2>Employees</h2>
            <button className="btn btn--ghost" onClick={loadEmployees} disabled={loading}>
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
          <EmployeeList
            employees={employees}
            loading={loading}
            onEdit={setEditing}
            onDelete={handleDelete}
          />
        </section>
      </main>
    </div>
  );
}
