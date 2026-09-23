/**
 * TableSkeleton - shimmering placeholder rows shown while employees load.
 * Renders both the desktop table form and the mobile card form so the layout
 * does not jump when real data arrives.
 */
export default function TableSkeleton({ rows = 6 }) {
  return (
    <>
      <div className="table-wrap" aria-hidden="true">
        <table className="table">
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <tr key={i}>
                <td>
                  <div className="person">
                    <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 999 }} />
                    <div style={{ display: 'grid', gap: 6 }}>
                      <div className="skeleton" style={{ width: 140, height: 12 }} />
                      <div className="skeleton" style={{ width: 190, height: 10 }} />
                    </div>
                  </div>
                </td>
                <td><div className="skeleton" style={{ width: 96, height: 20, borderRadius: 999 }} /></td>
                <td><div className="skeleton" style={{ width: 80, height: 20, borderRadius: 999 }} /></td>
                <td><div className="skeleton" style={{ width: 90, height: 12 }} /></td>
                <td><div className="skeleton" style={{ width: 28, height: 28, marginLeft: 'auto' }} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="emp-cards" aria-hidden="true">
        {Array.from({ length: rows }).map((_, i) => (
          <div className="emp-card" key={i}>
            <div className="emp-card__top">
              <div className="skeleton" style={{ width: 34, height: 34, borderRadius: 999 }} />
              <div style={{ display: 'grid', gap: 6 }}>
                <div className="skeleton" style={{ width: 130, height: 12 }} />
                <div className="skeleton" style={{ width: 170, height: 10 }} />
              </div>
            </div>
            <div className="skeleton" style={{ width: 120, height: 18, borderRadius: 999 }} />
          </div>
        ))}
      </div>
    </>
  );
}
