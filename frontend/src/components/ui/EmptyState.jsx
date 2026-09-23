/** EmptyState - friendly, actionable empty view. */
export default function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="state">
      {Icon && (
        <div className="state__icon" aria-hidden="true">
          <Icon size={26} />
        </div>
      )}
      <h3 className="state__title">{title}</h3>
      {description && <p className="state__desc">{description}</p>}
      {action && <div className="state__actions">{action}</div>}
    </div>
  );
}
