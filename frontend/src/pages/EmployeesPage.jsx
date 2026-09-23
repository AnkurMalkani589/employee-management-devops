import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, Users, RotateCw, SearchX, SlidersHorizontal, X } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import SearchInput from '../components/ui/SearchInput.jsx';
import EmployeeTable from '../components/EmployeeTable.jsx';
import TableSkeleton from '../components/ui/TableSkeleton.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Modal from '../components/ui/Modal.jsx';
import ConfirmDialog from '../components/ui/ConfirmDialog.jsx';
import EmployeeForm from '../components/EmployeeForm.jsx';
import EmployeeDetail from '../components/ui/EmployeeDetail.jsx';
import Alert from '../components/ui/Alert.jsx';

/**
 * EmployeesPage - search, filter, sort, and full CRUD over the directory.
 * All state is client-side over the data the API returns (no backend changes).
 */
export default function EmployeesPage({ data }) {
  const { employees, loading, error, mutating, reload, create, update, remove, stats } = data;

  const [query, setQuery] = useState('');
  const [department, setDepartment] = useState('');
  const [role, setRole] = useState('');
  const [sort, setSort] = useState({ key: 'created_at', direction: 'desc' });

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [confirming, setConfirming] = useState(null);
  const [viewing, setViewing] = useState(null);
  const searchRef = useRef(null);

  // Global shortcut: "/" or Ctrl/Cmd+K focuses search (ignored while typing).
  useEffect(() => {
    function onKeyDown(e) {
      const el = document.activeElement;
      const typing =
        el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);
      if (typing) return;
      const isSlash = e.key === '/';
      const isCmdK = (e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k';
      if (isSlash || isCmdK) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const roles = useMemo(
    () => [...new Set(employees.map((e) => e.role).filter(Boolean))].sort(),
    [employees],
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = employees.filter((e) => {
      const matchesQuery =
        !q ||
        [e.name, e.email, e.department, e.role]
          .filter(Boolean)
          .some((v) => v.toLowerCase().includes(q));
      const matchesDept = !department || e.department === department;
      const matchesRole = !role || e.role === role;
      return matchesQuery && matchesDept && matchesRole;
    });

    const dir = sort.direction === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      const av = a[sort.key] ?? '';
      const bv = b[sort.key] ?? '';
      if (sort.key === 'created_at') {
        return (new Date(av).getTime() - new Date(bv).getTime()) * dir;
      }
      return String(av).localeCompare(String(bv)) * dir;
    });
    return list;
  }, [employees, query, department, role, sort]);

  const activeFilters = [department && { type: 'department', value: department }].filter(Boolean);

  function toggleSort(key) {
    setSort((prev) =>
      prev.key === key
        ? { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' },
    );
  }

  function openCreate() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(emp) {
    setEditing(emp);
    setFormOpen(true);
  }
  function closeForm() {
    setFormOpen(false);
    setEditing(null);
  }

  function openEditFromDetail(emp) {
    setViewing(null);
    openEdit(emp);
  }

  function deleteFromDetail(emp) {
    setViewing(null);
    setConfirming(emp);
  }

  async function handleSubmit(form) {
    if (editing) {
      await update(editing.id, form);
    } else {
      await create(form);
    }
    closeForm();
  }

  async function handleDelete() {
    try {
      await remove(confirming);
    } finally {
      setConfirming(null);
    }
  }

  function clearFilters() {
    setDepartment('');
    setRole('');
    setQuery('');
  }

  const hasData = employees.length > 0;

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <h1 className="page-title">Employees</h1>
          <p className="page-desc">Manage your organisation&apos;s employees.</p>
        </div>
        <div className="page-head__actions">
          <Button
            variant="secondary"
            onClick={reload}
            disabled={loading}
            aria-label="Refresh employee list"
          >
            <RotateCw size={16} aria-hidden="true" />
            Refresh
          </Button>
          <Button variant="primary" onClick={openCreate}>
            <Plus size={16} aria-hidden="true" />
            Add Employee
          </Button>
        </div>
      </div>

      {error && (
        <div className="mt-4">
          <Alert
            variant="error"
            title="Unable to load employees"
            message="Please check your connection and try again."
            action={
              <Button variant="secondary" size="sm" onClick={reload}>
                Retry
              </Button>
            }
          />
        </div>
      )}

      <div className="card mt-5">
        <div className="toolbar">
          <div className="toolbar__search">
            <SearchInput
              ref={searchRef}
              value={query}
              onChange={setQuery}
              placeholder="Search by name, email, department or role…"
              label="Search employees"
              shortcutHint="/"
            />
          </div>

          <div className="toolbar__filters">
            <span className="muted" aria-hidden="true">
              <SlidersHorizontal size={16} />
            </span>
            <label className="sr-only" htmlFor="filter-department">
              Filter by department
            </label>
            <select
              id="filter-department"
              className="select"
              style={{ width: 'auto' }}
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">All departments</option>
              {stats.departments.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>

            <label className="sr-only" htmlFor="filter-role">
              Filter by role
            </label>
            <select
              id="filter-role"
              className="select"
              style={{ width: 'auto' }}
              value={role}
              onChange={(e) => setRole(e.target.value)}
            >
              <option value="">All roles</option>
              {roles.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            {(activeFilters.length > 0 || role) && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X size={14} aria-hidden="true" />
                Clear filters
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <TableSkeleton />
        ) : !hasData ? (
          <EmptyState
            icon={Users}
            title="No employees yet"
            description="Add your first employee to get started building your team directory."
            action={
              <Button variant="primary" onClick={openCreate}>
                <Plus size={16} aria-hidden="true" />
                Add Employee
              </Button>
            }
          />
        ) : visible.length === 0 ? (
          <EmptyState
            icon={SearchX}
            title="No matching employees"
            description="Try adjusting your search or filters to find who you're looking for."
            action={
              <Button variant="secondary" onClick={clearFilters}>
                Clear search and filters
              </Button>
            }
          />
        ) : (
          <>
            <EmployeeTable
              employees={visible}
              sort={sort}
              onSort={toggleSort}
              onEdit={openEdit}
              onDelete={setConfirming}
              onView={setViewing}
            />
            <div className="card__head table-foot">
              <span className="muted" style={{ fontSize: 'var(--text-caption)' }} aria-live="polite">
                Showing {visible.length} of {employees.length} employee{employees.length === 1 ? '' : 's'}
              </span>
            </div>
          </>
        )}
      </div>

      {formOpen && (
        <Modal
          title={editing ? 'Edit employee' : 'Add employee'}
          description={
            editing
              ? 'Update the details for this team member.'
              : 'Create a new employee record for your organisation.'
          }
          onClose={closeForm}
        >
          <EmployeeForm
            key={editing ? editing.id : 'new'}
            initialValue={editing}
            onSubmit={handleSubmit}
            onCancel={closeForm}
          />
        </Modal>
      )}

      {viewing && (
        <EmployeeDetail
          employee={viewing}
          onClose={() => setViewing(null)}
          onEdit={openEditFromDetail}
          onDelete={deleteFromDetail}
        />
      )}

      {confirming && (
        <ConfirmDialog
          title="Delete employee?"
          message={`This action will permanently remove ${confirming.name} from the system. This cannot be undone.`}
          confirmLabel="Delete employee"
          loading={mutating}
          onConfirm={handleDelete}
          onCancel={() => setConfirming(null)}
        />
      )}
    </>
  );
}
