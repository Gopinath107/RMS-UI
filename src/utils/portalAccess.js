import { createContext, useContext } from 'react';

export const RmsAccessContext = createContext({ managed: false, permissions: [] });
export const useRmsAccess = () => useContext(RmsAccessContext);

export function permissionForPath(path) {
  if (path === '/admin' || path.startsWith('/admin/')) return 'RMS_ADMIN';
  if (path.includes('resource-requests')) return 'RMS_DEMAND_READ';
  if (path.includes('interview')) return 'RMS_INTERVIEW_READ';
  if (path.includes('resource-allocation')) return 'RMS_ALLOCATION_READ';
  if (path.includes('system-settings')) return 'RMS_ADMIN';
  return null;
}
