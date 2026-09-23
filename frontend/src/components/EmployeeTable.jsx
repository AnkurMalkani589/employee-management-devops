import { ArrowUp, ArrowDown, ArrowUpDown, MoreVertical, Pencil, Trash2, Eye } from 'lucide-react';
import Menu from './ui/Menu.jsx';
import Badge from './ui/Badge.jsx';
import { initials, avatarTone, formatDate } from '../utils.js';

const TONES = ['badge--accent', 'badge--success', 'badge--warning', 'badge--neutral'];

function deptTone(department = '') {
  let sum = 0;
  for (let i = 0; i < department.length; i += 1) sum += department.charCodeAt(i);
  return TONES[sum % TONES.length];
}

function RowActions({ employee, onEdit, onDelete, onView }) {
  return (
    <Menu
      label={`Actions for ${employee.name}`}
      trigger={<MoreVertical size={17} aria-hidden="true" />}
      items={[
        { label: 'View details', icon: Eye, onSelect: () => onView(employee) },
        { label: 'Edit details', icon: Pencil, onSelect: () => onEdit(employee) },
        { separator: true },
        { label: 'Delete employee', icon: Trash2, danger: true, onSelect: () => onDelete(employee) },
      ]}
    />
  );
}

function SortHeader({ column, label, sort, onSort }) {
  const active = sort.key === column;
  const direction = active ? sort.direction : null;
  const Icon = direction === 'asc' ? ArrowUp : ArrowDown;
  return (
    <button
      className="th-sort"
      onClick={() => onSort(column)}
      aria-label={`Sort by ${label}${direction ? (direction === 'asc' ? ', ascending' : ', descending') : ''}`}
    >
      {label}
      {active ? (
        <Icon size={13} aria-hidden="true" />
      ) : (
        <ArrowUpDown className="th-sort__idle" size={13} aria-hidden="true" />
      )}
    </button>
  );
}

/**
 * EmployeeTable - responsive employee directory.
 *
 * Desktop: a proper table with sortable columns, hover states and an overflow
 * actions menu. Mobile (<=760px): each row becomes a card (via CSS) so nothing
 * gets compressed into unusable columns. Both share the same data + handlers.
 */
export default function EmployeeTable({ employees, sort, onSort, onEdit, onDelete, onView }) {
  const ariaSort = (key) =>
    sort.key === key ? (sort.direction === 'asc' ? 'ascending' : 'descending') : 'none';

  return (
    <>
      <div className="table-wrap">
        <table className="table">
          <caption className="sr-only">Employee directory</caption>
          <thead>
            <tr>
              <th aria-sort={ariaSort('name')}>
                <SortHeader column="name" label="Employee" sort={sort} onSort={onSort} />
              </th>
              <th aria-sort={ariaSort('department')}>
                <SortHeader column="department" label="Department" sort={sort} onSort={onSort} />
              </th>
              <th aria-sort={ariaSort('role')}>
                <SortHeader column="role" label="Role" sort={sort} onSort={onSort} />
              </th>
              <th aria-sort={ariaSort('created_at')}>
                <SortHeader column="created_at" label="Added" sort={sort} onSort={onSort} />
              </th>
              <th className="cell-actions">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {employees.map((emp) => (
              <tr
                key={emp.id}
                className="table__row--clickable"
                onClick={() => onView(emp)}
                tabIndex={0}
                role="button"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onView(emp);
                  }
                }}
              >
                <td>
                  <div className="person">
                    <span className={`avatar avatar--tone-${avatarTone(emp.name)}`} aria-hidden="true">
                      {initials(emp.name)}
                    </span>
                    <span className="person__meta">
                      <span className="person__name">{emp.name}</span>
                      <span className="person__email">{emp.email}</span>
                    </span>
                  </div>
                </td>
                <td>
                  <span className={`badge ${deptTone(emp.department)}`}>
                    <span className="badge__dot" aria-hidden="true" />
                    {emp.department}
                  </span>
                </td>
                <td className="muted">{emp.role}</td>
                <td className="muted nowrap">{formatDate(emp.created_at)}</td>
                <td className="cell-actions" onClick={(e) => e.stopPropagation()}>
                  <RowActions employee={emp} onEdit={onEdit} onDelete={onDelete} onView={onView} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card view */}
      <div className="emp-cards">
        {employees.map((emp) => (
          <article className="emp-card" key={emp.id}>
            <button className="emp-card__main" onClick={() => onView(emp)}>
              <span className={`avatar avatar--tone-${avatarTone(emp.name)}`} aria-hidden="true">
                {initials(emp.name)}
              </span>
              <span className="person__meta">
                <span className="person__name">{emp.name}</span>
                <span className="person__email">{emp.email}</span>
              </span>
            </button>
            <div className="emp-card__badges">
              <span className={`badge ${deptTone(emp.department)}`}>
                <span className="badge__dot" aria-hidden="true" />
                {emp.department}
              </span>
              <Badge tone="neutral">{emp.role}</Badge>
              <span className="emp-card__actions">
                <RowActions employee={emp} onEdit={onEdit} onDelete={onDelete} onView={onView} />
              </span>
            </div>
          </article>
        ))}
      </div>
    </>
  );
}
