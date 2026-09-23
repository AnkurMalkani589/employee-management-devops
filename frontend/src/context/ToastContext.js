import { createContext } from 'react';

/** Shared context for the toast system (provider + hook live in separate files). */
export const ToastContext = createContext(null);
