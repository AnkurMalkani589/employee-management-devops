import { LifeBuoy, BookOpen, Users, Plus } from 'lucide-react';
import Button from '../components/ui/Button.jsx';

/**
 * HelpPage - genuinely useful guidance. Links point to the app's own API docs
 * (served by the backend at /docs via the edge proxy) and the project README,
 * rather than dead placeholders.
 */
export default function HelpPage({ onNavigate, onAddEmployee }) {
  const topics = [
    {
      icon: Plus,
      title: 'Adding employees',
      body: 'Open the Employees page and choose "Add Employee". Fill in the required fields — name, email, department and role — and save.',
      action: { label: 'Add an employee', run: onAddEmployee },
    },
    {
      icon: Users,
      title: 'Finding people',
      body: 'Use the search box to filter by name, email, department or role. Narrow results further with the department and role filters, or sort any column.',
      action: { label: 'Go to directory', run: () => onNavigate('employees') },
    },
    {
      icon: BookOpen,
      title: 'API documentation',
      body: 'The backend exposes interactive OpenAPI documentation. It is proxied by the edge server so it works locally and in production.',
      action: { label: 'Open API docs', href: '/docs' },
    },
  ];

  return (
    <>
      <div className="page-head">
        <div className="page-head__text">
          <h1 className="page-title">Help</h1>
          <p className="page-desc">Guides and resources for using the workspace.</p>
        </div>
      </div>

      <div className="card">
        <div className="card__head">
          <div className="row gap-3">
            <span className="stat__icon" aria-hidden="true">
              <LifeBuoy size={17} />
            </span>
            <div>
              <h3 className="card__title">Getting started</h3>
              <p className="card__subtitle">Common tasks in a few steps</p>
            </div>
          </div>
        </div>
        <div className="card__body stack gap-4">
          {topics.map((topic) => {
            const Icon = topic.icon;
            return (
              <div className="row gap-4" key={topic.title} style={{ alignItems: 'flex-start' }}>
                <span className="quick-action__icon" aria-hidden="true">
                  <Icon size={17} />
                </span>
                <div style={{ minWidth: 0 }}>
                  <div className="setting-row__title">{topic.title}</div>
                  <p className="muted" style={{ fontSize: 'var(--text-sm)', margin: '4px 0 10px' }}>
                    {topic.body}
                  </p>
                  {topic.action.href ? (
                    <a className="btn btn--secondary btn--sm" href={topic.action.href} target="_blank" rel="noreferrer">
                      {topic.action.label}
                    </a>
                  ) : (
                    <Button variant="secondary" size="sm" onClick={topic.action.run}>
                      {topic.action.label}
                    </Button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
