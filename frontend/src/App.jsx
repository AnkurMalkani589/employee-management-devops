import { useState } from 'react';
import AppShell from './components/AppShell.jsx';
import Modal from './components/ui/Modal.jsx';
import EmployeeForm from './components/EmployeeForm.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import EmployeesPage from './pages/EmployeesPage.jsx';
import DepartmentsPage from './pages/DepartmentsPage.jsx';
import ReportsPage from './pages/ReportsPage.jsx';
import SettingsPage from './pages/SettingsPage.jsx';
import HelpPage from './pages/HelpPage.jsx';
import { useEmployeeData } from './hooks/useEmployeeData.js';
import { useHashRoute } from './hooks/useHashRoute.js';
import { useTheme } from './hooks/useTheme.js';

/**
 * App - wires the shell, routing and the shared employee data hook together.
 *
 * A single useEmployeeData instance is the source of truth, so every page
 * reflects the same list and a create/update/delete anywhere refreshes all
 * views without a full reload.
 */
export default function App() {
  const [route, navigate] = useHashRoute('dashboard');
  const [theme, toggleTheme] = useTheme();
  const data = useEmployeeData();
  const [createOpen, setCreateOpen] = useState(false);

  async function handleCreate(form) {
    await data.create(form);
    setCreateOpen(false);
  }

  const shared = { data, onNavigate: navigate, onAddEmployee: () => setCreateOpen(true) };

  function renderPage() {
    switch (route) {
      case 'employees':
        return <EmployeesPage {...shared} />;
      case 'departments':
        return <DepartmentsPage {...shared} />;
      case 'reports':
        return <ReportsPage {...shared} />;
      case 'settings':
        return <SettingsPage {...shared} theme={theme} onToggleTheme={toggleTheme} />;
      case 'help':
        return <HelpPage {...shared} />;
      case 'dashboard':
      default:
        return <DashboardPage {...shared} />;
    }
  }

  return (
    <AppShell
      route={route}
      onNavigate={navigate}
      theme={theme}
      onToggleTheme={toggleTheme}
      employeeCount={data.stats.total}
    >
      {renderPage()}

      {createOpen && (
        <Modal
          title="Add employee"
          description="Create a new employee record for your organisation."
          onClose={() => setCreateOpen(false)}
        >
          <EmployeeForm onSubmit={handleCreate} onCancel={() => setCreateOpen(false)} />
        </Modal>
      )}
    </AppShell>
  );
}
