import {
  Users,
  Plus,
  RefreshCw,
  ArrowRight,
  Activity,
  Database,
  ServerCog,
  WifiOff,
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
import WorkforcePulse from '../components/dashboard/WorkforcePulse.jsx';
import { usePlatformStatus } from '../hooks/usePlatformStatus.js';
import { initials, avatarTone, relativeTime } from '../utils.js';

/**
 * DashboardPage - Workforce Intelligence.
 *
 * Composition:
 *   1. Asymmetric hero - editorial headline (left) + Workforce Pulse
 *      instrument (right). Both halves are filled at every desktop width, so
 *      the first viewport carries meaning rather than empty space.
 *   2. Bento intelligence - unequal cards with a clear primary (the
 *      constellation), a composition meter, platform state and activity.
 *
 * Data: GET /api/employees (directory) and GET /api/health (platform state).
 * Nothing is fabricated - see WorkforcePulse for the derivation notes.
 */
export default function DashboardPage({ data, onNavigate, onAddEmployee }) {
  const { loading, error, employees, stats, reload } = data;
  const platform = usePlatformStatus();
  const isEmpty = !loading && employees.length === 0;

  return (
    <div className="cc">
      {/* ================================================ 1. HERO (asymmetric) */}
      <section className="cc-hero" aria-labelledby="cc-hero-title">
        <div className="cc-hero__left">
          <Reveal direction="up" distance={10}>
            <span className="cc-eyebrow">
              <span className="cc-eyebrow__pulse" aria-hidden="true" />
              Workforce Operations
            </span>
          </Reveal>

          <Reveal direction="up" distance={18} delay={0.05}>
            <h1 className="cc-hero__title" id="cc-hero-title">
              Workforce
              <br />
              <span className="cc-hero__accent">Intelligence.</span>
            </h1>
          </Reveal>

          <Reveal direction="up" distance={12} delay={0.11}>
            <p className="cc-hero__lede">
              A live read on the people, structure and platform that keep your organisation
              running.
            </p>
          </Reveal>

          <Reveal direction="up" distance={12} delay={0.17}>
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
        </div>

        <Reveal className="cc-hero__right" direction="up" distance={18} delay={0.14}>
          <WorkforcePulse
            total={stats.total}
            departmentCount={stats.departmentCount}
            recentlyAdded={stats.recentlyAdded}
            employees={employees}
            platform={platform}
            loading={loading}
          />
        </Reveal>
      </section>

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
        <StaggerContainer className="cc-bento">
          {/* A - People count (large numeric, narrow) */}
          <StaggerItem className="cc-bento__a">
            <SpotlightCard className="panel panel--stat">
              <span className="text-eyebrow">People</span>
              <span className="panel__bignum">
                {loading ? (
                  <span className="skeleton panel__bignum-sk" aria-hidden="true" />
                ) : (
                  <AnimatedCounter value={stats.total} />
                )}
              </span>
              <span className="panel__sub">
                {stats.total === 1 ? 'person in the directory' : 'people in the directory'}
              </span>
            </SpotlightCard>
          </StaggerItem>

          {/* B - Department distribution (medium) */}
          <StaggerItem className="cc-bento__b">
            <SpotlightCard className="panel">
              <div className="panel__head">
                <div>
                  <h2 className="panel__title">Department mix</h2>
                  <p className="panel__sub">Share of total headcount</p>
                </div>
                <Badge tone="neutral">{stats.departmentCount}</Badge>
              </div>
              <div className="panel__body">
                {loading ? (
                  <div className="skeleton" style={{ height: 176 }} aria-hidden="true" />
                ) : (
                  <DistributionMeter byDepartment={stats.byDepartment} total={stats.total} />
                )}
              </div>
            </SpotlightCard>
          </StaggerItem>

          {/* C - Workforce constellation (feature card, wide) */}
          <StaggerItem className="cc-bento__c">
            <SpotlightCard className="panel panel--feature">
              <div className="panel__head">
                <div>
                  <h2 className="panel__title">Workforce constellation</h2>
                  <p className="panel__sub">Departments and the people within them</p>
                </div>
                <Badge tone="accent">{stats.total} people</Badge>
              </div>
              <div className="panel__body panel__body--center">
                {loading ? (
                  <div
                    className="skeleton"
                    style={{ height: 320, width: '100%' }}
                    aria-hidden="true"
                  />
                ) : (
                  <WorkforceConstellation byDepartment={stats.byDepartment} total={stats.total} />
                )}
              </div>
            </SpotlightCard>
          </StaggerItem>

          {/* D - Platform status (compact operational) */}
          <StaggerItem className="cc-bento__d">
            <SpotlightCard className="panel">
              <div className="panel__head">
                <div>
                  <h2 className="panel__title">Platform status</h2>
                  <p className="panel__sub">Live backend health</p>
                </div>
                <Badge
                  tone={
                    platform.reachable == null
                      ? 'neutral'
                      : platform.reachable
                        ? 'success'
                        : 'warning'
                  }
                  dot
                >
                  {platform.reachable == null
                    ? 'Checking'
                    : platform.reachable
                      ? 'Operational'
                      : 'Unreachable'}
                </Badge>
              </div>
              <div className="panel__body">
                <div className="status-row">
                  <span className="status-row__icon" aria-hidden="true">
                    <ServerCog size={15} />
                  </span>
                  <span className="status-row__label">API</span>
                  <span className="status-row__value">{platform.status?.status ?? '—'}</span>
                </div>
                <div className="status-row">
                  <span className="status-row__icon" aria-hidden="true">
                    <Database size={15} />
                  </span>
                  <span className="status-row__label">Database</span>
                  <span className="status-row__value">{platform.status?.database ?? '—'}</span>
                </div>
                <div className="status-row">
                  <span className="status-row__icon" aria-hidden="true">
                    <Activity size={15} />
                  </span>
                  <span className="status-row__label">Version</span>
                  <span className="status-row__value">
                    {platform.status?.version ? `v${platform.status.version}` : '—'}
                  </span>
                </div>
                <p className="panel__note">
                  {platform.lastCheckedAt
                    ? `Checked ${relativeTime(platform.lastCheckedAt)} · every 30s`
                    : 'Awaiting first health check…'}
                </p>
              </div>
            </SpotlightCard>
          </StaggerItem>

          {/* E - Recent activity (wide) */}
          <StaggerItem className="cc-bento__e">
            <SpotlightCard className="panel panel--flush">
              <div className="panel__head">
                <div>
                  <h2 className="panel__title">Recent activity</h2>
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
                    <div
                      className="skeleton"
                      key={i}
                      style={{ height: 44, marginBottom: 8 }}
                      aria-hidden="true"
                    />
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
          </StaggerItem>
        </StaggerContainer>
      )}
    </div>
  );
}