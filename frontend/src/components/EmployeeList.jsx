export default function EmployeeList({ employees, loading, onEdit, onDelete }) {
  if (loading) {
    return <p className="muted">Loading employees…</p>;
  }
  if (employees.length === 0) {
    return <p className="muted">No employees yet. Add one using the form.</p>;
  }

  return (
    <table className="table">
      <thead>
        <tr>
          <th>ID</th>
          <th>Name</th>
          <th>Email</th>
          <th>Department</th>
          <th>Role</th>
          <th aria-label="Actions" />
        </tr>
      </thead>
      <tbody>
        {employees.map((emp) => (
          <tr key={emp.id}>
            <td>{emp.id}</td>
            <td>{emp.name}</td>
            <td>{emp.email}</td>
            <td>{emp.department}</td>
            <td>{emp.role}</td>
            <td className="table__actions">
              <button className="btn btn--small" onClick={() => onEdit(emp)}>
                Edit
              </button>
              <button
                className="btn btn--small btn--danger"
                onClick={() => onDelete(emp.id)}
              >
                Delete
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
