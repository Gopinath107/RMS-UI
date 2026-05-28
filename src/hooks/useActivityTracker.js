import { useEffect, useRef, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { UserActivityService } from '../services/UserActivityService';
import { APIConfigurations } from '../constant/AuthPath';

// ─── Route → Module/Screen mapping ────────────────────────────────────────────
const ROUTE_MODULE_MAP = {
  '/admin': { module: 'System Admin', screen: 'User Management' },
  '/admin/resources': { module: 'System Admin', screen: 'Resource Management' },
  '/admin/resources/add': { module: 'System Admin', screen: 'Add Resource' },
  '/admin/interview-hub': { module: 'System Admin', screen: 'Interview Hub' },
  '/admin/user-activity': { module: 'System Admin', screen: 'User Activity' },
  '/admin/system-settings': { module: 'System Admin', screen: 'System Settings' },
  '/hr': { module: 'HR', screen: 'HR Dashboard' },
  '/hr/resources': { module: 'HR', screen: 'Resource Management' },
  '/hr/interviews': { module: 'HR', screen: 'Interviews Management' },
  '/hr/interview-hub': { module: 'HR', screen: 'Interview Hub' },
  '/hr/clients': { module: 'HR', screen: 'Clients' },
  '/hr/projects': { module: 'HR', screen: 'Projects' },
  '/hr/notifications': { module: 'HR', screen: 'Notifications' },
  '/pm': { module: 'Project Manager', screen: 'PM Dashboard' },
  '/pm/projects': { module: 'Project Manager', screen: 'Projects' },
  '/pm/resource-requests': { module: 'Project Manager', screen: 'Resource Requests' },
  '/pm/interview-hub': { module: 'Project Manager', screen: 'Interview Hub' },
  '/pm/clients': { module: 'Project Manager', screen: 'Clients' },
  '/pm/resource-allocation': { module: 'Project Manager', screen: 'Resource Allocation' },
  '/pmo': { module: 'PMO', screen: 'PMO Dashboard' },
  '/pmo/resource-requests': { module: 'PMO', screen: 'Resource Requests' },
  '/pmo/interview-hub': { module: 'PMO', screen: 'Interview Hub' },
  '/portfolio': { module: 'Portfolio Manager', screen: 'Portfolio Dashboard' },
  '/portfolio/projects': { module: 'Portfolio Manager', screen: 'Project Portfolio' },
  '/portfolio/clients': { module: 'Portfolio Manager', screen: 'Clients' },
  '/portfolio/interview-hub': { module: 'Portfolio Manager', screen: 'Interview Hub' },
  '/portfolio/reports': { module: 'Portfolio Manager', screen: 'Reports' },
  '/sales': { module: 'Sales Manager', screen: 'Opportunities' },
  '/sales/clients': { module: 'Sales Manager', screen: 'Clients' },
  '/sales/interview-hub': { module: 'Sales Manager', screen: 'Interview Hub' },
  '/panel': { module: 'Interview Panel', screen: 'Panel Dashboard' },
  '/panel/interview-hub': { module: 'Interview Panel', screen: 'Interview Hub' },
};

/**
 * Resolve a pathname to { module, screen }.
 * Uses exact match first, then tries longest prefix match for dynamic routes.
 */
function resolveRoute(pathname) {
  if (ROUTE_MODULE_MAP[pathname]) return ROUTE_MODULE_MAP[pathname];

  // Longest-prefix match for dynamic sub-routes
  const sorted = Object.keys(ROUTE_MODULE_MAP).sort((a, b) => b.length - a.length);
  for (const route of sorted) {
    if (pathname.startsWith(route + '/') || pathname === route) {
      return ROUTE_MODULE_MAP[route];
    }
  }
  return { module: 'Unknown', screen: pathname };
}

/**
 * useActivityTracker — Background activity tracker hook.
 *
 * @param {boolean} isAuthenticated — whether the user is currently authenticated.
 *
 * Behavior:
 * - On mount (when authenticated): generates a UUID sessionId, stores in sessionStorage,
 *   and sends a LOGIN event.
 * - On route change: sends a PAGE_VIEW event with module/screen info.
 * - Heartbeat: every 2 minutes sends a HEARTBEAT event.
 * - On unmount / window beforeunload: sends a LOGOUT event.
 * - Events are batched: queued for 5 seconds then sent as a single batch.
 * - All errors are swallowed — tracking must never break the app.
 */
export function useActivityTracker(isAuthenticated) {
  const location = useLocation();
  const sessionIdRef = useRef(null);
  const eventQueueRef = useRef([]);
  const flushTimerRef = useRef(null);
  const heartbeatRef = useRef(null);
  const mountedRef = useRef(false);

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const getUserInfo = useCallback(() => ({
    userId: localStorage.getItem('userId') || null,
    userName: localStorage.getItem('userName') || null,
    userRole: localStorage.getItem('userRole') || null,
    employeeId: localStorage.getItem('employeeId') || null,
    companyId: localStorage.getItem('companyId') || null,
  }), []);

  /**
   * Queue an event. Events accumulate for 5 s, then flush as a batch.
   * LOGOUT events are flushed immediately via sendBeacon fallback.
   */
  const queueEvent = useCallback((eventType, extra = {}) => {
    try {
      if (!sessionIdRef.current) return;

      const event = {
        sessionId: sessionIdRef.current,
        eventType,
        eventTime: new Date().toISOString(),
        ...getUserInfo(),
        ...extra,
      };

      // LOGOUT is time-critical — flush immediately (sync-safe)
      if (eventType === 'LOGOUT') {
        flushImmediately([event]);
        return;
      }

      eventQueueRef.current.push(event);

      // Debounce flush to 5 s
      if (!flushTimerRef.current) {
        flushTimerRef.current = setTimeout(() => {
          flushQueue();
        }, 5000);
      }
    } catch {
      // swallow
    }
  }, [getUserInfo]);

  /**
   * Flush the queued events via the batch endpoint.
   */
  const flushQueue = useCallback(() => {
    try {
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;

      const events = eventQueueRef.current.splice(0);
      if (events.length === 0) return;

      if (events.length === 1) {
        UserActivityService.trackEvent(events[0]).catch(() => {});
      } else {
        UserActivityService.trackBatchEvents(events).catch(() => {});
      }
    } catch {
      // swallow
    }
  }, []);

  /**
   * Fire-and-forget flush for critical events (LOGOUT) — uses sendBeacon
   * when available so the request survives page unload.
   */
  const flushImmediately = useCallback((events) => {
    try {
      // Also flush any remaining queued events
      const queued = eventQueueRef.current.splice(0);
      clearTimeout(flushTimerRef.current);
      flushTimerRef.current = null;

      const allEvents = [...queued, ...events];
      if (allEvents.length === 0) return;

      // Try sendBeacon first (survives page unload)
      if (navigator.sendBeacon) {
        const blob = new Blob([JSON.stringify(allEvents)], { type: 'application/json' });
        const rootURL = APIConfigurations.rootURL || '/api';
        navigator.sendBeacon(`${rootURL}/user-activity/track-batch`, blob);
      } else {
        // Fallback — fire and forget
        if (allEvents.length === 1) {
          UserActivityService.trackEvent(allEvents[0]).catch(() => {});
        } else {
          UserActivityService.trackBatchEvents(allEvents).catch(() => {});
        }
      }
    } catch {
      // swallow
    }
  }, []);

  // ── Mount / Unmount (LOGIN / LOGOUT) ─────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated) return;

    // Generate session
    let sid = sessionStorage.getItem('activitySessionId');
    if (!sid) {
      if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
        sid = crypto.randomUUID();
      } else {
        // Standard Math.random fallback (RFC4122 compliant)
        sid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
          const r = Math.random() * 16 | 0;
          const v = c === 'x' ? r : (r & 0x3 | 0x8);
          return v.toString(16);
        });
      }
      sessionStorage.setItem('activitySessionId', sid);
    }
    sessionIdRef.current = sid;
    mountedRef.current = true;

    // Send LOGIN event
    queueEvent('LOGIN');

    // ── Heartbeat every 2 min ──
    heartbeatRef.current = setInterval(() => {
      queueEvent('HEARTBEAT');
    }, 2 * 60 * 1000);

    // ── beforeunload → LOGOUT ──
    const handleBeforeUnload = () => {
      queueEvent('LOGOUT');
    };
    window.addEventListener('beforeunload', handleBeforeUnload);

    // ── Cleanup ──
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;

      // Flush remaining + LOGOUT on unmount
      if (mountedRef.current) {
        queueEvent('LOGOUT');
        mountedRef.current = false;
      }

      sessionStorage.removeItem('activitySessionId');
      sessionIdRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  // ── Route changes → PAGE_VIEW ────────────────────────────────────────────────

  useEffect(() => {
    if (!isAuthenticated || !sessionIdRef.current) return;

    const { module: moduleName, screen: screenName } = resolveRoute(location.pathname);

    queueEvent('PAGE_VIEW', {
      moduleName,
      screenName,
      path: location.pathname,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, isAuthenticated]);
}

export default useActivityTracker;
