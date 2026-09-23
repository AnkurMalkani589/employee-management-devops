import {
  Users,
  Building2,
  Layers,
  RefreshCw,
  ArrowRight,
  Plus,
  Activity,
  Database,
  ServerCog,
  WifiOff,
  Sparkles,
} from 'lucide-react';
import Button from '../components/ui/Button.jsx';
import EmptyState from '../components/ui/EmptyState.jsx';
import Badge from '../components/ui/Badge.jsx';
import { Reveal } from '../components/animation/Reveal.jsx';
import { StaggerContainer, StaggerItem } from '../components/animation/Stagger.jsx';
import { AnimatedCounter } from '../components/animation/AnimatedCounter.jsx';
import { SpotlightCard } from '../components/animation/SpotlightCard.jsx';
import { MagneticButton } from '../components/animation/MagneticButton.jsx';
import WorkforceConstellation from '../components/dashboard/WorkforceConstellation.jsx';
import DistributionMeter from '../components/dashboard/DistributionMeter.jsx';
import { usePlatformStatus } from '../hooks/usePlatformStatus.js';
import { initials, avatarTone, relativeTime, formatDate } from '../utils.js';

/** A single metric inside the people-overview strip. */
function Metric({ icon, label, value, suffix, foot, decimals = 0, loading }) {
  const Icon = icon;
  return (
    <SpotlightCard className="metric">
      <div className="metric__top">
        <span className="text-eyebrow">{label}</span>
        <span className="metric__icon" aria-hidden="true">
          <Icon size={16} />
        </span>
      </div>
      <div className="metric__value">
        {loading ? (
          <span className="skeleton metric__skeleton" aria-hidden="true" />
        ) : (
          <>
            <AnimatedCounter value={value} decimals={decimals} />
            {suffix && <span className="metric__suffix">{suffix}</span>}
          </>
        )}
      </div>
      {foot && <div className="metric__foot">{foot}</div>}
    </SpotlightCard>
  );
}

/** Platform status row - only facts obtained from the real health endpoint. */
function StatusRow({ icon, label, value, tone }) {
  const Icon = icon;
  return (
    <div className="status-row">
      <span className="status-row__icon" aria-hidden="true">
        <Icon size={15} />
      </span>
      <span className="status-row__label">{label}</span>
      {tone ? <Badge tone={tone}>{value}</Badge> : <span className="status-row__value">{value}</span>}
    </div>
  );
}

/**
 * DashboardPage - the Workforce Command Center.
 *
 * Every figure is derived from the live API: employee records
 * (GET /api/employees) and the backend health document (GET /api/health).
 * Nothing is fabricated - there is no synthetic uptime, latency or headcount.
 */
export default function DashboardPage({ data, onNavigate, onAddEmployee }) {
  const { loading, error, employees, stats, reload } = data;
  const platform = usePlatformStatus();

  const isEmpty = !loading && employees.length === 0;

  return (
    <div className="command-center">
      {/* ------------------------------------------------ Editorial opening */}
      <header className="cc-hero">
        <Reveal direction="up" distance={12}>
          <span className="text-eyebrow cc-hero__eyebrow">
            <span className="cc-hero__pulse" aria-hidden="true" />
            Workforce Operations
          </span>
        </Reveal>

        <Reveal direction="up" distance={18} delay={0.06}>
          <h1 className="text-hero cc-hero__title">
            Workforce
            <br />
            <span className="text-gradient">Command Center</span>
          </h1>
        </Reveal>

        <Reveal direction="up" distance={12} delay={0.12}>
          <p className="text-lede cc-hero__lede">
            Live visibility into the people, departments and platform that run your
            organisation.
          </p>
        </Reveal>

        <Reveal direction="up" distance={12} delay={0.18}>
          <div className="cc-hero__actions">
            <MagneticButton className="btn btn--primary" onClick={onAddEmployee}>
              <Plus size={16} aria-hidden="true" />
              Add employee
            </MagneticButton>
            <Button variant="secondary" onClick={reload} disabled={loading}>
              <RefreshCw size={16} aria-hidden="true" />
              {loading ? 'Syncing…' : 'Sync data'}
            </Button>
          </div>
        </Reveal>

        <Reveal direction="up" distance={12} delay={0.24}>
          <dl className="cc-hero__context">
            <div className="cc-context">
              <dt>Directory</dt>
              <dd>{loading ? '—' : `${stats.total} ${stats.total === 1 ? 'record' : 'records'}`}</dd>
            </div>
            <div className="cc-context">
              <dt>Departments</dt>
              <dd>{loading ? '—' : stats.departmentCount}</dd>
            </div>
            <div className="cc-context">
              <dt>Environment</dt>
              <dd>{platform.status?.environment ?? '—'}</dd>
            </div>
          </dl>
        </Reveal>
      </header>

      {error && (
        <Reveal>
          <div className="alert alert--error cc-alert" role="alert">
            <span className="alert__icon" aria-hidden="true">
              <WifiOff size={18} />
            </span>
            <div className="alert__content">
              <div className="alert__title">Unable to load workforce data</div>
              <div className="alert__msg">Please check your connection and try again.</div>
              <div className="alert__actions">
                <Button variant="secondary" size="sm" onClick={reload}>
                  Retry
                </Button>
              </div>
            </div>
          </div>
        </Reveal>
      )}

      {isEmpty ? (
        <div className="surface-panel cc-empty">
          <EmptyState
            icon={Users}
            title="No employees yet"
            description="Add your first employee and this command center will come alive with live workforce intelligence."
            action={
              <Button variant="primary" onClick={onAddEmployee}>
                <Plus size={16} aria-hidden="true" />
                Add employee
              </Button>
            }
          />
        </div>
      ) : (
        <>
          {/* -------------------------------------------------- People overview */}
          <section aria-labelledby="people-overview" className="cc-section">
            <h2 id="people-overview" className="sr-only">
              People overview
            </h2>
            <StaggerContainer className="bento cc-metrics">
              <StaggerItem className="bento--third">
                <Metric
                  icon={Users}
                  label="Total employees"
                  value={stats.total}
                  foot="Active directory records"
                  loading={loading}
                />
              </StaggerItem>
              <StaggerItem className="bento--third">
                <Metric
                  icon={Building2}
                  label="Departments"
                  value={stats.departmentCount}
                  foot="Distinct organisational units"
                  loading={loading}
                />
              </StaggerItem>
              <StaggerItem className="bento--third">
                <Metric
                  icon={Sparkles}
                  label="Added recently"
                  value={stats.recentlyAdded}
                  foot="Joined in the last 30 days"
                  loading={loading}
                />
              </StaggerItem>
            </StaggerContainer>
          </section>

          {/* ------------------------------ Workforce map + distribution (bento) */}
          <section aria-labelledby="workforce-intel" className="cc-section">
            <div className="cc-section__head">
              <h2 id="workforce-intel" className="text-section">
                Workforce intelligence
              </h2>
              <p className="text-lede cc-section__sub">
                How your people are distributed across the organisation.
              </p>
            </div>

            <div className="bento cc-intel">
              <Reveal className="bento--hero" direction="up" distance={14}>
                <SpotlightCard className="panel">
                  <div className="panel__head">
                    <div>
                      <h3 className="panel__title">Workforce map</h3>
                      <p className="panel__sub">Departments and their people</p>
                    </div>
                    <Badge tone="neutral">{stats.total} people</Badge>
                  </div>
                  <div className="panel__body panel__body--center">
                    {loading ? (
                      <div className="skeleton" style={{ height: 260, width: '100%' }} aria-hidden="true" />
                    ) : (
                      <WorkforceConstellation byDepartment={stats.byDepartment} total={stats.total} />
                    )}
                  </div>
                </SpotlightCard>
              </Reveal>

              <Reveal className="bento--aside" direction="up" distance={14} delay={0.06}>
                <SpotlightCard className="panel">
                  <div className="panel__head">
                    <div>
                      <h3 className="panel__title">Distribution</h3>
                      <p className="panel__sub">Share of total headcount</p>
                    </div>
                  </div>
                  <div className="panel__body">
                    {loading ? (
                      <div className="skeleton" style={{ height: 180 }} aria-hidden="true" />
                    ) : (
                      <DistributionMeter byDepartment={stats.byDepartment} total={stats.total} />
                    )}
                  </div>
                </SpotlightCard>
              </Reveal>
            </div>
          </section>

          {/* ---------------------- Activity + platform status + quick actions */}
          <section aria-labelledby="operations" className="cc-section">
            <h2 id="operations" className="sr-only">
              Operations
            </h2>
            <div className="bento cc-ops">
              {/* Recent activity - derived from real record timestamps */}
              <Reveal className="bento--half" direction="up" distance={14}>
                <SpotlightCard className="panel panel--flush">
                  <div className="panel__head">
                    <div>
                      <h3 className="panel__title">Recent activity</h3>
                      <p className="panel__sub">Latest directory changes</p>
                    </div>
                    <Button variant="ghost" size="sm" onClick={() => onNavigate('employees')}>
                      View all
                      <ArrowRight size={14} aria-hidden="true" />
                    </Button>
                  </div>
                  {loading ? (
                    <div style={{ padding: 'var(--space-4)' }}>
                      {[0, 1, 2].map((i) => (
                        <div className="skeleton" key={i} style={{ height: 44, marginBottom: 8 }} aria-hidden="true" />
                      ))}
                    </div>
                  ) : stats.recent.length === 0 ? (
                    <div className="cc-inline-empty">
                      <Activity size={18} aria-hidden="true" />
                      <span>No directory changes recorded yet.</span>
                    </div>
                  ) : (
                    <ul className="activity">
                      {stats.recent.map((emp) => {
                        const created = emp.created_at ? new Date(emp.created_at).getTime() : 0;
                        const updated = emp.updated_at ? new Date(emp.updated_at).getTime() : 0;
                        // A record edited after creation reads as "updated"; otherwise "added".
                        const isUpdate = updated - created > 60000;
                        return (
                          <li className="activity__item" key={emp.id}>
                            <span
                              className={`avatar avatar--tone-${avatarTone(emp.name)}`}
                              aria-hidden="true"
                            >
                              {initials(emp.name)}
                            </span>
                            <span className="activity__meta">
                              <span className="activity__name">{emp.name}</span>
                              <span className="activity__sub">
                                {isUpdate ? 'Record updated' : 'Added to'} · {emp.department}
                              </span>
                            </span>
                            <span className="activity__time">
                              {relativeTime(isUpdate ? emp.updated_at : emp.created_at)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </SpotlightCard>
              </Reveal>

              <div className="bento--half cc-ops__stack">
                {/* Platform status - real health endpoint only */}
                <Reveal direction="up" distance={14} delay={0.06}>
                  <SpotlightCard className="panel">
                    <div className="panel__head">
                      <div>
                        <h3 className="panel__title">Platform status</h3>
                        <p className="panel__sub">Live backend health</p>
                      </div>
                      <Badge
                        tone={
                          platform.reachable === null
                            ? 'neutral'
                            : platform.reachable
                              ? 'success'
                              : 'warning'
                        }
                        dot
                      >
                        {platform.reachable === null
                          ? 'Checking'
                          : platform.reachable
                            ? 'Operational'
                            : 'Unreachable'}
                      </Badge>
                    </div>
                    <div className="panel__body">
                      <StatusRow
                        icon={ServerCog}
                        label="API status"
                        value={platform.status?.status ?? (platform.reachable ? 'ok' : 'unknown')}
                      />
                      <StatusRow
                        icon={Database}
                        label="Database"
                        value={platform.status?.database ?? 'unknown'}
                        tone={platform.status?.database === 'ok' ? 'success' : 'warning'}
                      />
                      <StatusRow
                        icon={Activity}
                        label="API version"
                        value={platform.status?.version ? `v${platform.status.version}` : '—'}
                      />
                      <StatusRow
                        icon={RefreshCw}
                        label="Checks this session"
                        value={String(platform.checks)}
                      />
                      <p className="panel__note">
                        {platform.lastCheckedAt
                          ? `Last checked ${relativeTime(platform.lastCheckedAt)} · auto-refresh every 30s`
                          : 'Awaiting first health check…'}
                      </p>
                    </div>
                  </SpotlightCard>
                </Reveal>

                {/* Quick actions - existing navigation only */}
                <Reveal direction="up" distance={14} delay={0.12}>
                  <SpotlightCard className="panel">
                    <div className="panel__head">
                      <h3 className="panel__title">Quick actions</h3>
                    </div>
                    <div className="panel__body quick-actions">
                      <button className="quick-action" onClick={onAddEmployee}>
                        <span className="quick-action__icon" aria-hidden="true">
                          <Plus size={16} />
                        </span>
                        <span>
                          <span className="quick-action__label">Add employee</span>
                          <span className="quick-action__desc">Create a new record</span>
                        </span>
                      </button>
                      <button className="quick-action" onClick={() => onNavigate('employees')}>
                        <span className="quick-action__icon" aria-hidden="true">
                          <Users size={16} />
                        </span>
                        <span>
                          <span className="quick-action__label">Employee directory</span>
                          <span className="quick-action__desc">Search and manage people</span>
                        </span>
                      </button>
                      <button className="quick-action" onClick={() => onNavigate('departments')}>
                        <span className="quick-action__icon" aria-hidden="true">
                          <Layers size={16} />
                        </span>
                        <span>
                          <span className="quick-action__label">Departments</span>
                          <span className="quick-action__desc">Organisation structure</span>
                        </span>
                      </button>
                    </div>
                  </SpotlightCard>
                </Reveal>
              </div>
            </div>
          </section>

          {/* ------------------------------------------- Directory snapshot */}
          <section aria-labelledby="snapshot" className="cc-section">
            <div className="cc-section__head">
              <h2 id="snapshot" className="text-section">
                Directory snapshot
              </h2>
              <p className="text-lede cc-section__sub">
                The newest records in your workforce.
              </p>
            </div>
            <StaggerContainer className="bento cc-roster">
              {(loading ? [] : stats.recent.slice(0, 3)).map((emp) => (
                <StaggerItem className="bento--third" key={emp.id}>
                  <SpotlightCard className="roster-card">
                    <span
                      className={`avatar avatar--lg avatar--tone-${avatarTone(emp.name)}`}
                      aria-hidden="true"
                    >
                      {initials(emp.name)}
                    </span>
                    <div className="roster-card__meta">
                      <span className="roster-card__name">{emp.name}</span>
                      <span className="muted">{emp.role}</span>
                    </div>
                    <div className="roster-card__foot">
                      <Badge tone="accent">{emp.department}</Badge>
                      <span className="muted roster-card__date">{formatDate(emp.created_at)}</span>
                    </div>
                  </SpotlightCard>
                </StaggerItem>
              ))}
              {loading &&
                [0, 1, 2].map((i) => (
                  <StaggerItem className="bento--third" key={`sk-${i}`}>
                    <div className="skeleton" style={{ height: 132 }} aria-hidden="true" />
                  </StaggerItem>
                ))}
            </StaggerContainer>
          </section>
        </>
      )}
    </div>
  );
}
