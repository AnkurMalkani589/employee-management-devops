import {
  LayoutDashboard,
  Users,
  Building2,
  BarChart3,
  Settings,
  HelpCircle,
} from 'lucide-react';

/** Primary navigation. `key` is the route; icons come from lucide-react. */
export const NAV_ITEMS = [
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { key: 'employees', label: 'Employees', icon: Users },
  { key: 'departments', label: 'Departments', icon: Building2 },
  { key: 'reports', label: 'Reports', icon: BarChart3 },
  { key: 'settings', label: 'Settings', icon: Settings },
];

export const SECONDARY_NAV = [{ key: 'help', label: 'Help', icon: HelpCircle }];

export const ROUTE_META = {
  dashboard: { title: 'Dashboard', crumb: 'Overview' },
  employees: { title: 'Employees', crumb: 'Directory' },
  departments: { title: 'Departments', crumb: 'Organisation' },
  reports: { title: 'Reports', crumb: 'Analytics' },
  settings: { title: 'Settings', crumb: 'Preferences' },
  help: { title: 'Help', crumb: 'Support' },
};
