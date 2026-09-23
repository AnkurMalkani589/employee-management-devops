import { useContext } from 'react';
import { ToastContext } from '../context/ToastContext.js';

/**
 * useToast - access the toast API from any component.
 * Kept in its own module (away from the provider component) so fast-refresh
 * can update the provider without invalidating consumers.
 */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within a ToastProvider');
  return ctx;
}
