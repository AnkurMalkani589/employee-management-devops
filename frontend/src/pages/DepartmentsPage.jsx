import { Building2 } from 'lucide-react';
import EmptyState from '../components/ui/EmptyState.jsx';
import Badge from '../components/ui/Badge.jsx';
import { initials, avatarTone } from '../utils.js';

/**
 * DepartmentsPage - departments derived from live employee data, with the
 * members of each. Real data only; nothing fabricated.
 */
export default function DepartmentsPage({ data, onNavigate }) {
  const { employees, stats, loading } = data;

  if (!loading && employees.length === 0) {
    return (
      <>
        <div className="page-head">
          <div className="page-head__text">
            <h1 className="page-title">Departments</h1>
            <p className="page-desc">Understand how your organisation is structured.</p>
          </div>
        </div>
        <div className="card">
          <EmptyState
            icon={Building2}
            title="No departments yet"
            description="Departments appear automatically once employees are added with a department."
          />
        </div>
      </>
    );
  }

  const grouped = stats.departments.map((name) => ({
    name,
    members: employees.filter((e) => e.department === name),
  }));

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <h1 className="page-title">Departments</h1>
          <p className="page-desc">
            {stats.departmentCount} department{stats.departmentCount === 1 ? '' : 's'} across{' '}
            {stats.total} employee{stats.total === 1 ? '' : 's'}.
          </p>
        </div>
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))' }}>
        {grouped.map((dept) => (
          <button
            key={dept.name}
            className="card"
            style={{ textAlign: 'left', padding: 'var(--space-5)' }}
            onClick={() => onNavigate('employees')}
          >
            <div className="row gap-3" style={{ marginBottom: 'var(--space-4)' }}>
              <span className="stat__icon" aria-hidden="true">
                <Building2 size={17} />
              </span>
              <span>
                <span className="card__title" style={{ fontSize: 'var(--text-h3)' }}>
                  {dept.name}
                </span>
                <span className="muted" style={{ display: 'block', fontSize: 'var(--text-caption)' }}>
                  {dept.members.length} member{dept.members.length === 1 ? '' : 's'}
                </span>
              </span>
            </div>
            <div className="row gap-2" style={{ flexWrap: 'wrap' }}>
              {dept.members.slice(0, 5).map((m) => (
                <span
                  key={m.id}
                  className={`avatar avatar--tone-${avatarTone(m.name)}`}
                  title={m.name}
                  aria-hidden="true"
                >
                  {initials(m.name)}
                </span>
              ))}
              {dept.members.length > 5 && (
                <Badge tone="neutral">+{dept.members.length - 5}</Badge>
              )}
            </div>
          </button>
        ))}
      </div>

      <div className="card mt-5">
        <div className="card__head">
          <div>
            <h3 className="card__title">Team breakdown</h3>
            <p className="card__subtitle">Roles represented per department</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Members</th>
                <th>Roles</th>
              </tr>
            </thead>
            <tbody>
              {grouped.map((dept) => {
                const roles = [...new Set(dept.members.map((m) => m.role))];
                return (
                  <tr key={dept.name}>
                    <td style={{ fontWeight: 600 }}>{dept.name}</td>
                    <td className="muted">{dept.members.length}</td>
                    <td>
                      <span className="row gap-2" style={{ flexWrap: 'wrap' }}>
                        {roles.map((r) => (
                          <Badge key={r} tone="neutral">
                            {r}
                          </Badge>
                        ))}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
