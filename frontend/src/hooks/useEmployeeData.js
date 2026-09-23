import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../api.js';
import { useToast } from './useToast.js';

/**
 * useEmployeeData - single source of truth for employee CRUD.
 *
 * Centralises loading/error state and mutations, and keeps the list fresh after
 * create/update/delete without a full page reload. Derives a few metrics and the
 * filter option lists from the live data (no fabricated values).
 */
export function useEmployeeData() {
  const toast = useToast();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [mutating, setMutating] = useState(false);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.listEmployees();
      if (mounted.current) setEmployees(Array.isArray(data) ? data : []);
    } catch {
      if (mounted.current) {
        setError('Unable to load employees.');
      }
    } finally {
      if (mounted.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const create = useCallback(
    async (payload) => {
      setMutating(true);
      try {
        const created = await api.createEmployee(payload);
        if (mounted.current && created) {
          // Reflect the new row instantly; no second round-trip needed.
          setEmployees((prev) => [...prev, created]);
        }
        toast.success('Employee created', `${payload.name} was added to your team.`);
      } catch (err) {
        toast.error('Could not create employee', err.message);
        throw err;
      } finally {
        if (mounted.current) setMutating(false);
      }
    },
    [toast],
  );

  const update = useCallback(
    async (id, payload) => {
      setMutating(true);
      try {
        const updated = await api.updateEmployee(id, payload);
        if (mounted.current && updated) {
          setEmployees((prev) => prev.map((e) => (e.id === id ? updated : e)));
        }
        toast.success('Changes saved', 'The employee record was updated.');
      } catch (err) {
        toast.error('Could not save changes', err.message);
        throw err;
      } finally {
        if (mounted.current) setMutating(false);
      }
    },
    [toast],
  );

  const remove = useCallback(
    async (employee) => {
      setMutating(true);
      try {
        await api.deleteEmployee(employee.id);
        if (mounted.current) {
          setEmployees((prev) => prev.filter((e) => e.id !== employee.id));
        }
        toast.success('Employee deleted', `${employee.name} was removed.`);
      } catch (err) {
        toast.error('Could not delete employee', err.message);
        throw err;
      } finally {
        if (mounted.current) setMutating(false);
      }
    },
    [toast],
  );

  const stats = useMemo(() => {
    const departments = new Set();
    employees.forEach((e) => e.department && departments.add(e.department));

    const byDepartment = {};
    employees.forEach((e) => {
      if (!e.department) return;
      byDepartment[e.department] = (byDepartment[e.department] || 0) + 1;
    });

    const sorted = [...employees].sort(
      (a, b) => new Date(b.created_at || 0) - new Date(a.created_at || 0),
    );

    const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
    const recentlyAdded = employees.filter(
      (e) => e.created_at && new Date(e.created_at).getTime() >= thirtyDaysAgo,
    ).length;

    return {
      total: employees.length,
      departmentCount: departments.size,
      recentlyAdded,
      byDepartment,
      recent: sorted.slice(0, 5),
      departments: [...departments].sort(),
    };
  }, [employees]);

  return { employees, loading, error, mutating, reload: load, create, update, remove, stats };
}
