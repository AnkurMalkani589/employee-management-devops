import { BarChart3, Download } from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Badge from '../components/ui/Badge.jsx';
import { formatDate } from '../utils.js';

/**
 * ReportsPage - analytics derived from live data.
 * The CSV export uses the real employee records (client-side, no backend change).
 */
export default function ReportsPage({ data }) {
  const { employees, stats, loading } = data;

  function exportCsv() {
    const headers = ['id', 'name', 'email', 'department', 'role', 'created_at'];
    const rows = employees.map((e) =>
      headers.map((h) => `"${String(e[h] ?? '').replace(/"/g, '""')}"`).join(','),
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `employees-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!loading && employees.length === 0) {
    return (
      <>
        <div className="page-head">
          <div className="page-head__text">
            <h1 className="page-title">Reports</h1>
            <p className="page-desc">Insights generated from your employee data.</p>
          </div>
        </div>
        <div className="card">
          <EmptyState
            icon={BarChart3}
            title="Nothing to report yet"
            description="Add employees and your workforce analytics will appear here."
          />
        </div>
      </>
    );
  }

  const deptEntries = Object.entries(stats.byDepartment).sort((a, b) => b[1] - a[1]);
  const largest = deptEntries[0];
  const newest = stats.recent[0];

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <h1 className="page-title">Reports</h1>
          <p className="page-desc">Insights generated from your employee data.</p>
        </div>
        <div className="page-head__actions">
          <Button variant="secondary" onClick={exportCsv} disabled={employees.length === 0}>
            <Download size={16} aria-hidden="true" />
            Export CSV
          </Button>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat">
          <div className="stat__top">
            <span className="stat__label">Total headcount</span>
          </div>
          <div className="stat__value">{stats.total}</div>
          <div className="stat__foot">Across {stats.departmentCount} departments</div>
        </div>
        <div className="stat">
          <div className="stat__top">
            <span className="stat__label">Largest department</span>
          </div>
          <div className="stat__value" style={{ fontSize: 'var(--text-h1)' }}>
            {largest ? largest[0] : '—'}
          </div>
          <div className="stat__foot">{largest ? `${largest[1]} people` : 'No data'}</div>
        </div>
        <div className="stat">
          <div className="stat__top">
            <span className="stat__label">Recent hires</span>
          </div>
          <div className="stat__value">{stats.recentlyAdded}</div>
          <div className="stat__foot">In the last 30 days</div>
        </div>
        <div className="stat">
          <div className="stat__top">
            <span className="stat__label">Newest member</span>
          </div>
          <div className="stat__value" style={{ fontSize: 'var(--text-h1)' }}>
            {newest ? newest.name : '—'}
          </div>
          <div className="stat__foot">{newest ? formatDate(newest.created_at) : 'No data'}</div>
        </div>
      </div>

      <div className="card mt-5">
        <div className="card__head">
          <div>
            <h3 className="card__title">Department summary</h3>
            <p className="card__subtitle">Headcount and share of organisation</p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Department</th>
                <th>Headcount</th>
                <th>Share</th>
              </tr>
            </thead>
            <tbody>
              {deptEntries.map(([name, count]) => (
                <tr key={name}>
                  <td style={{ fontWeight: 600 }}>{name}</td>
                  <td className="muted">{count}</td>
                  <td>
                    <Badge tone="accent">
                      {Math.round((count / stats.total) * 100)}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
