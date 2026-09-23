import { Users, Building2, UserPlus, Activity, Plus, RefreshCw, ArrowRight } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import { initials, avatarTone, relativeTime } from '../utils.js';

function StatCard({ icon, label, value, foot }) {
  const IconComponent = icon;
  return (
    <div className="stat">
      <div className="stat__top">
        <span className="stat__label">{label}</span>
        <span className="stat__icon" aria-hidden="true">
          <IconComponent size={17} />
        </span>
      </div>
      <div className="stat__value">{value}</div>
      {foot && <div className="stat__foot">{foot}</div>}
    </div>
  );
}

/**
 * DashboardPage - overview derived entirely from live employee data.
 * Every number is calculated from the API response; nothing is fabricated.
 */
export default function DashboardPage({ data, onNavigate, onAddEmployee }) {
  const { loading, employees, stats, reload } = data;

  if (!loading && employees.length === 0) {
    return (
      <>
        <div className="page-head">
          <div className="page-head__text">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-desc">A live overview of your organisation.</p>
          </div>
        </div>
        <div className="card">
          <EmptyState
            icon={Users}
            title="No employees yet"
            description="Once you add employees, this dashboard will show live counts, departments and recent activity."
            action={
              <Button variant="primary" onClick={onAddEmployee}>
                <Plus size={16} aria-hidden="true" />
                Add Employee
              </Button>
            }
          />
        </div>
      </>
    );
  }

  const deptEntries = Object.entries(stats.byDepartment).sort((a, b) => b[1] - a[1]);
  const maxDept = deptEntries.length ? deptEntries[0][1] : 1;

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-desc">A live overview of your organisation.</p>
        </div>
        <div className="page-head__actions">
          <Button variant="secondary" onClick={reload} disabled={loading}>
            <RefreshCw size={16} aria-hidden="true" />
            Refresh
          </Button>
          <Button variant="primary" onClick={onAddEmployee}>
            <Plus size={16} aria-hidden="true" />
            Add Employee
          </Button>
        </div>
      </div>

      <div className="stat-grid">
        <StatCard
          icon={Users}
          label="Total Employees"
          value={loading ? '—' : stats.total}
          foot="People in the directory"
        />
        <StatCard
          icon={Building2}
          label="Departments"
          value={loading ? '—' : stats.departmentCount}
          foot="Distinct departments"
        />
        <StatCard
          icon={UserPlus}
          label="Recently Added"
          value={loading ? '—' : stats.recentlyAdded}
          foot="In the last 30 days"
        />
        <StatCard
          icon={Activity}
          label="Active Employees"
          value={loading ? '—' : stats.total}
          foot="All records are active"
        />
      </div>

      <div className="dash-grid">
        <div className="card">
          <div className="card__head">
            <div>
              <h3 className="card__title">Employee distribution</h3>
              <p className="card__subtitle">Headcount by department</p>
            </div>
          </div>
          <div className="card__body">
            {deptEntries.length === 0 ? (
              <p className="muted">No department data available yet.</p>
            ) : (
              <div className="bar-list">
                {deptEntries.map(([name, count]) => (
                  <div className="bar-row" key={name}>
                    <div className="bar-row__head">
                      <span className="bar-row__label">{name}</span>
                      <span className="bar-row__count">
                        {count} {count === 1 ? 'person' : 'people'}
                      </span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${Math.round((count / maxDept) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="stack gap-4">
          <div className="card">
            <div className="card__head">
              <h3 className="card__title">Quick actions</h3>
            </div>
            <div className="card__body quick-actions">
              <button className="quick-action" onClick={onAddEmployee}>
                <span className="quick-action__icon" aria-hidden="true">
                  <Plus size={17} />
                </span>
                <span>
                  <span className="quick-action__label">Add employee</span>
                  <span className="quick-action__desc">Create a new record</span>
                </span>
              </button>
              <button className="quick-action" onClick={() => onNavigate('employees')}>
                <span className="quick-action__icon" aria-hidden="true">
                  <Users size={17} />
                </span>
                <span>
                  <span className="quick-action__label">View directory</span>
                  <span className="quick-action__desc">Browse all employees</span>
                </span>
              </button>
              <button className="quick-action" onClick={reload}>
                <span className="quick-action__icon" aria-hidden="true">
                  <RefreshCw size={17} />
                </span>
                <span>
                  <span className="quick-action__label">Sync data</span>
                  <span className="quick-action__desc">Reload from the server</span>
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="card mt-5">
        <div className="card__head">
          <div>
            <h3 className="card__title">Recently added</h3>
            <p className="card__subtitle">Latest team members</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('employees')}>
            View all
            <ArrowRight size={15} aria-hidden="true" />
          </Button>
        </div>
        {stats.recent.length === 0 ? (
          <div className="card__body">
            <p className="muted">No recent employees.</p>
          </div>
        ) : (
          <div className="recent-list">
            {stats.recent.map((emp) => (
              <div className="recent-item" key={emp.id}>
                <span className={`avatar avatar--tone-${avatarTone(emp.name)}`} aria-hidden="true">
                  {initials(emp.name)}
                </span>
                <span className="recent-item__meta">
                  <span className="recent-item__name">{emp.name}</span>
                  <span className="recent-item__sub">
                    {emp.role} · {emp.department}
                  </span>
                </span>
                <span className="recent-item__time">{relativeTime(emp.created_at)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
