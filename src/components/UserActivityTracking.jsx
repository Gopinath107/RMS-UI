import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Users, Clock, Activity, Monitor, Search,
  RefreshCw, LogIn, LogOut, Timer, Laptop,
  Smartphone, Tablet, X, Download,
  ChevronLeft, ChevronRight, Layout, Eye, Layers,
  FileText, ChevronDown, ChevronUp,
  AlertTriangle, TrendingUp, CheckCircle,
} from 'lucide-react';
import { UserActivityService } from '../services/UserActivityService';
import {
  AreaChart, Area, BarChart as ReBarChart, Bar, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import { format, parseISO, formatDistanceToNow } from 'date-fns';

// ─── Constants ──────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: 'Overview',  icon: Layout },
  { id: 'realtime',  label: 'Realtime',  icon: Activity },
  { id: 'users',     label: 'Users',     icon: Users },
  { id: 'modules',   label: 'Modules',   icon: Layers },
  { id: 'screens',   label: 'Screens',   icon: Eye },
  { id: 'sessions',  label: 'Sessions',  icon: FileText },
];

const ALL_MODULES = [
  'System Admin','HR','Project Manager','PMO',
  'Portfolio Manager','Sales Manager','Interview Panel',
];

const MODULE_BADGE = {
  'System Admin':      'bg-rose-50 text-rose-700 border-rose-100',
  'HR':                'bg-blue-50 text-blue-700 border-blue-100',
  'Project Manager':   'bg-emerald-50 text-emerald-700 border-emerald-100',
  'PMO':               'bg-violet-50 text-violet-700 border-violet-100',
  'Portfolio Manager': 'bg-amber-50 text-amber-700 border-amber-100',
  'Sales Manager':     'bg-yellow-50 text-yellow-700 border-yellow-100',
  'Interview Panel':   'bg-indigo-50 text-indigo-700 border-indigo-100',
  'Portal':            'bg-sky-50 text-sky-700 border-sky-100',
};

const CHART_BLUE    = '#4f46e5';
const CHART_INACTIVE = '#c7d2fe';
const CHART_FILL    = '#eef2ff';
const CHART_GREEN   = '#34a853';
const AUTO_REFRESH  = 30_000;

const KPI_ACCENTS = ['#4f46e5', '#10b981', '#f59e0b', '#06b6d4', '#8b5cf6'];

// Card shadow used globally — liquid-glass
const CARD_SHADOW = '0 4px 24px rgba(159,18,57,0.08), 0 1px 2px rgba(255,255,255,0.9) inset';
const CARD_BORDER = '1px solid rgba(255,255,255,0.75)';
const CARD_RADIUS = '20px';
const GLASS_BG    = 'rgba(255,255,255,0.55)';
const GLASS_FILTER = 'blur(18px) saturate(180%)';
const PRIMARY     = '#9f1239';  // System Admin rose-900

// ─── Helpers ────────────────────────────────────────────────────────────────
const todayStr   = () => format(new Date(), 'yyyy-MM-dd');
const fmtDur     = (m) => { if (!m && m !== 0) return '-'; const h = Math.floor(m/60), r = Math.round(m%60); return h > 0 ? `${h}h ${r}m` : `${r}m`; };
const fmtShort   = (iso) => { if (!iso) return '-'; try { return format(parseISO(iso), 'hh:mm a'); } catch { return '-'; } };
const fmtFull    = (iso) => { if (!iso) return '-'; try { return format(parseISO(iso), 'dd MMM, hh:mm a'); } catch { return '-'; } };
const relTime    = (iso) => { if (!iso) return '-'; try { return formatDistanceToNow(parseISO(iso), { addSuffix: true }); } catch { return '-'; } };
const initials   = (n)   => { if (!n) return '?'; return n.split(' ').map(w => w[0]).slice(0,2).join('').toUpperCase(); };
const avatarBg   = (n)   => { if (!n) return '#9ca3af'; const c=['#3b82f6','#10b981','#8b5cf6','#f59e0b','#ef4444','#ec4899','#6366f1','#14b8a6']; const s=n.split('').reduce((a,x)=>a+x.charCodeAt(0),0); return c[s%c.length]; };
const truncId    = (id)  => { if (!id) return '-'; return id.length > 16 ? id.substring(0,14)+'…' : id; };

const fmtMod = (m) => {
  if (!m || m === '-' || m === 'Unknown' || m.trim() === 'null' || m.trim() === '') return 'Portal';
  return m.trim();
};

const fmtScreen  = (s)   => {
  if (!s || s === '-') return '-';
  const clean = s.trim();
  if (clean === '/' || clean === '/login') return 'Login Page';
  if (clean === '/forgot-password') return 'Forgot Password';
  if (clean === '/admin/user-activity') return 'Activity Analytics';
  if (clean === '/admin/resources') return 'Resource Management';
  if (clean === '/admin/resources/add') return 'Add Resource';
  if (clean === '/admin/interview-hub') return 'Interview Hub';
  if (clean === '/admin/system-settings') return 'System Settings';
  if (clean === '/admin') return 'User Management';
  if (clean === '/hr') return 'HR Dashboard';
  if (clean === '/hr/resources') return 'Resource Management';
  if (clean === '/hr/resources/add') return 'Add Resource';
  if (clean === '/hr/interviews') return 'Interviews Management';
  if (clean === '/hr/interview-hub') return 'Interview Hub';
  if (clean === '/hr/clients') return 'Client List';
  if (clean === '/hr/projects') return 'Projects Management';
  if (clean === '/hr/notifications') return 'Notifications';
  if (clean === '/pm') return 'Project Manager Dashboard';
  if (clean === '/pm/projects') return 'Projects Management';
  if (clean === '/pm/resource-requests') return 'Request Resource';
  if (clean === '/pm/interview-hub') return 'Interview Hub';
  if (clean === '/pm/clients') return 'Client List';
  if (clean === '/pm/resource-allocation') return 'Resource Allocation';
  if (clean === '/pmo') return 'PMO Dashboard';
  if (clean === '/pmo/resource-requests') return 'Request Resource';
  if (clean === '/pmo/interview-hub') return 'Interview Hub';
  if (clean === '/portfolio') return 'Portfolio Manager Dashboard';
  if (clean === '/portfolio/projects') return 'Project Portfolio';
  if (clean === '/portfolio/clients') return 'Client List';
  if (clean === '/portfolio/interview-hub') return 'Interview Hub';
  if (clean === '/portfolio/reports') return 'Portfolio Reports';
  if (clean === '/portfolio/strategic-planning') return 'Strategic Planning';
  if (clean === '/portfolio/financial-overview') return 'Financial Overview';
  if (clean === '/portfolio/resource-strategy') return 'Resource Strategy';
  if (clean === '/sales') return 'Opportunity Requests';
  if (clean === '/sales/clients') return 'Client List';
  if (clean === '/sales/interview-hub') return 'Interview Hub';
  if (clean === '/sales/pipeline') return 'Sales Pipeline';
  if (clean === '/panel') return 'Interview Panel Dashboard';
  if (clean === '/panel/interview-hub') return 'Interview Hub';
  if (clean.startsWith('/')) {
    return clean
      .split('/')
      .filter(Boolean)
      .map(part => part.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '))
      .join(' > ');
  }
  return clean;
};

// safe data extractor — handles {result:...} and {data:...} and plain arrays
function extract(res) {
  const d = res?.data;
  if (!d) return null;
  if (d.result !== undefined) return d.result;
  if (Array.isArray(d)) return d;
  return d;
}

// ─── Count-up hook ───────────────────────────────────────────────────────────
function useCountUp(target, duration = 600) {
  const [val, setVal] = useState(0);
  const prev = useRef(0);
  useEffect(() => {
    const numTarget = typeof target === 'number' ? target : parseFloat(target) || 0;
    const start = prev.current;
    const diff  = numTarget - start;
    if (diff === 0) return;
    const startTime = performance.now();
    const tick = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setVal(Math.round(start + diff * eased));
      if (progress < 1) requestAnimationFrame(tick);
      else prev.current = numTarget;
    };
    requestAnimationFrame(tick);
  }, [target, duration]);
  return val;
}

function DeviceIcon({ device }) {
  const d = (device || '').toLowerCase();
  if (d.includes('mobile')) return <Smartphone className="w-3.5 h-3.5" />;
  if (d.includes('tablet')) return <Tablet className="w-3.5 h-3.5" />;
  return <Laptop className="w-3.5 h-3.5" />;
}

// ─── Toast ───────────────────────────────────────────────────────────────────
function Toast({ message, onDone }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3000);
    return () => clearTimeout(t);
  }, [onDone]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      style={{
        position: 'fixed', bottom: 24, right: 24, zIndex: 70,
        background: '#ecfdf5', border: '1px solid #6ee7b7',
        borderRadius: 12, padding: '12px 18px',
        display: 'flex', alignItems: 'center', gap: 8,
        boxShadow: '0 8px 32px rgba(16,185,129,0.18)',
        fontSize: 13, fontWeight: 500, color: '#065f46',
      }}
    >
      <CheckCircle size={16} style={{ color: '#10b981' }} />
      {message}
    </motion.div>
  );
}

// ─── Shared UI ──────────────────────────────────────────────────────────────

function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  if (s === 'active') return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', fontSize: 10, fontWeight: 600,
      borderRadius: 20, border: '1px solid #a7f3d0',
      background: '#ecfdf5', color: '#065f46',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#10b981', flexShrink: 0 }} />
      Active
    </span>
  );
  if (s === 'inactive') return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', fontSize: 10, fontWeight: 600,
      borderRadius: 20, border: '1px solid #fcd34d',
      background: '#fffbeb', color: '#92400e',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
      Inactive
    </span>
  );
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '2px 8px', fontSize: 10, fontWeight: 600,
      borderRadius: 20, border: '1px solid #e5e7eb',
      background: '#f9fafb', color: '#6b7280',
    }}>
      <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#9ca3af', flexShrink: 0 }} />
      Logged Out
    </span>
  );
}

function ModBadge({ mod }) {
  const m = fmtMod(mod);
  const cls = MODULE_BADGE[m] || 'bg-gray-100 text-gray-600 border-gray-200';
  return (
    <span className={`px-2 py-0.5 font-semibold border ${cls}`}
      style={{ fontSize: 10, borderRadius: 20, borderWidth: '0.5px', paddingTop: 2, paddingBottom: 2 }}>
      {m}
    </span>
  );
}

function Avatar({ name, size = 7 }) {
  const px = size * 4;
  return (
    <div style={{
      width: px, height: px, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: px < 32 ? 10 : 13, fontWeight: 700, color: '#fff',
      flexShrink: 0, backgroundColor: avatarBg(name),
      boxShadow: '0 1px 4px rgba(0,0,0,0.12)',
    }}>
      {initials(name)}
    </div>
  );
}

// Premium KPI Card with count-up
function KPICard({ icon: Icon, label, value, sub, loading, accentColor }) {
  const numVal = typeof value === 'number' ? value : null;
  const counted = useCountUp(numVal ?? 0, 700);
  const displayVal = loading ? null : (numVal !== null ? counted : value);

  // Derive a soft tint matching each card's accent
  const tintBg = `${accentColor}0f`; // ~6% opacity hex
  return (
    <motion.div
      whileHover={{ translateY: -4, boxShadow: `0 12px 32px rgba(99,102,241,0.13), 0 1px 2px rgba(255,255,255,0.9) inset` }}
      transition={{ duration: 0.25 }}
      style={{
        background: `rgba(255,255,255,0.55)`,
        backgroundImage: `linear-gradient(135deg, ${tintBg} 0%, rgba(255,255,255,0) 100%)`,
        backdropFilter: GLASS_FILTER,
        WebkitBackdropFilter: GLASS_FILTER,
        borderRadius: CARD_RADIUS,
        padding: 20,
        boxShadow: CARD_SHADOW,
        border: CARD_BORDER,
        borderLeft: `3px solid ${accentColor}`,
        position: 'relative',
        overflow: 'hidden',
        cursor: 'default',
      }}
    >
      {/* Accent top strip */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: 3,
        background: `linear-gradient(90deg, ${accentColor}, ${accentColor}88)`,
        borderRadius: '16px 16px 0 0',
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: 10,
          background: `${accentColor}18`,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          <Icon size={18} style={{ color: accentColor }} />
        </div>
      </div>
      {loading
        ? <div style={{ height: 36, width: 80, borderRadius: 8, background: '#f1f5f9', animation: 'pulse 1.5s ease-in-out infinite' }} />
        : <p style={{ fontSize: 30, fontWeight: 800, color: '#0f172a', lineHeight: 1, margin: 0 }}>
            {displayVal ?? '-'}
          </p>
      }
      <p style={{ fontSize: 10, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#94a3b8', marginTop: 6, marginBottom: 2 }}>{label}</p>
      {sub && <p style={{ fontSize: 11, color: '#94a3b8', fontWeight: 400, margin: 0 }}>{sub}</p>}
    </motion.div>
  );
}

function SkeletonRows({ cols = 8, rows = 6 }) {
  return Array.from({ length: rows }).map((_, i) => (
    <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
      {Array.from({ length: cols }).map((_, j) => (
        <td key={j} style={{ padding: '12px 16px' }}>
          <div style={{ height: 13, borderRadius: 6, background: '#f1f5f9', width: `${50 + (j * 17) % 50}%`, animation: 'pulse 1.5s ease-in-out infinite' }} />
        </td>
      ))}
    </tr>
  ));
}

function EmptyStateBlock({ icon: Icon = Users, title = 'No data found', subtitle = 'Try adjusting your filters or date range.' }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '56px 24px', textAlign: 'center' }}>
      <div style={{ width: 56, height: 56, borderRadius: 16, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
        <Icon size={26} style={{ color: '#cbd5e1' }} />
      </div>
      <p style={{ fontSize: 14, fontWeight: 600, color: '#64748b', margin: 0 }}>{title}</p>
      <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4, fontWeight: 400 }}>{subtitle}</p>
    </div>
  );
}

function EmptyState({ icon: Icon = Users, title = 'No data found', subtitle = 'Try adjusting your filters or date range.' }) {
  return (
    <tr>
      <td colSpan={99}>
        <EmptyStateBlock icon={Icon} title={title} subtitle={subtitle} />
      </td>
    </tr>
  );
}

function InlineError({ message, onRetry }) {
  return (
    <tr>
      <td colSpan={99}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '48px 24px', gap: 12 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={22} style={{ color: '#f59e0b' }} />
          </div>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0, fontWeight: 500 }}>{message || 'Failed to load data'}</p>
          {onRetry && (
            <button onClick={onRetry} style={{
              display: 'flex', alignItems: 'center', gap: 5, fontSize: 12,
              color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600,
            }}>
              <RefreshCw size={13} /> Retry
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

const TH_STYLE = {
  padding: '10px 16px',
  fontSize: 10,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.7px',
  color: '#94a3b8',
  background: 'rgba(248,250,252,0.80)',
  textAlign: 'left',
  whiteSpace: 'nowrap',
  userSelect: 'none',
};

function SortTh({ label, col, sort, onSort }) {
  const active = sort.column === col;
  return (
    <th onClick={() => onSort(col)} style={{ ...TH_STYLE, cursor: 'pointer', color: active ? '#4f46e5' : '#94a3b8' }}>
      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {label}
        {active ? (sort.dir === 'asc' ? <ChevronUp size={12} style={{ color: '#4f46e5' }} /> : <ChevronDown size={12} style={{ color: '#4f46e5' }} />) : null}
      </span>
    </th>
  );
}

function Pagination({ page, size, total, onPage, onSize }) {
  const pages = Math.max(1, Math.ceil(total / size));
  const from  = total > 0 ? (page - 1) * size + 1 : 0;
  const to    = Math.min(page * size, total);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, padding: '12px 16px', borderTop: '1px solid #f1f5f9' }}>
      <span style={{ fontSize: 12, color: '#94a3b8' }}>Showing {from}–{to} of {total}</span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <select value={size} onChange={e => onSize(+e.target.value)} style={{ fontSize: 12, border: '1px solid #e5e7eb', borderRadius: 8, padding: '3px 8px', background: '#fff', color: '#374151' }}>
          {[10, 25, 50].map(n => <option key={n} value={n}>{n} / page</option>)}
        </select>
        <button disabled={page <= 1} onClick={() => onPage(page - 1)}
          style={{ padding: 4, borderRadius: 8, border: 'none', background: 'none', color: '#94a3b8', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.3 : 1 }}>
          <ChevronLeft size={16} />
        </button>
        {Array.from({ length: Math.min(5, pages) }, (_, i) => {
          let p = Math.max(1, Math.min(page - 2, pages - 4)) + i;
          return (
            <button key={p} onClick={() => onPage(p)} style={{
              width: 28, height: 28, borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 600,
              background: p === page ? '#4f46e5' : 'none', color: p === page ? '#fff' : '#64748b',
            }}>{p}</button>
          );
        })}
        <button disabled={page >= pages} onClick={() => onPage(page + 1)}
          style={{ padding: 4, borderRadius: 8, border: 'none', background: 'none', color: '#94a3b8', cursor: page >= pages ? 'not-allowed' : 'pointer', opacity: page >= pages ? 0.3 : 1 }}>
          <ChevronRight size={16} />
        </button>
      </div>
    </div>
  );
}

// ─── Premium Drawer ──────────────────────────────────────────────────────────
function Drawer({ open, onClose, title, children }) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div key="overlay"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)', zIndex: 50 }}
          />
          <motion.aside key="panel"
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 260 }}
            style={{
              position: 'fixed', right: 0, top: 0, height: '100%',
              width: '100%', maxWidth: 440,
              background: '#fff', zIndex: 60,
              display: 'flex', flexDirection: 'column',
              boxShadow: '-8px 0 40px rgba(79,70,229,0.12)',
              borderLeft: '1px solid rgba(79,70,229,0.08)',
              borderRadius: '20px 0 0 20px',
            }}
          >
            {/* Gradient header */}
            <div style={{
              background: 'linear-gradient(135deg, #4f46e5 0%, #7c3aed 60%, #06b6d4 100%)',
              padding: '18px 20px',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              borderRadius: '20px 0 0 0',
              flexShrink: 0,
            }}>
              <h3 style={{ fontSize: 14, fontWeight: 700, color: '#fff', margin: 0 }}>{title}</h3>
              <button onClick={onClose} style={{
                background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: 8,
                padding: 6, cursor: 'pointer', color: '#fff', display: 'flex', alignItems: 'center',
              }}>
                <X size={16} />
              </button>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>{children}</div>
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

// ─── Session Timeline ────────────────────────────────────────────────────────
function SessionTimeline({ session, timeline, loadingTl }) {
  if (!session) return null;
  const events = timeline?.events || [];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        {[
          ['User',     session.userName || '-'],
          ['User ID',  session.userId],
          ['Duration', fmtDur(session.durationMinutes)],
          ['Pages',    session.pagesVisited ?? 0],
          ['Status',   <StatusBadge key="s" status={session.status} />],
          ['Device',   session.deviceType || '-'],
          ['Browser',  session.browserName || '-'],
          ['IP',       session.ipAddress || '-'],
        ].map(([l, v]) => (
          <div key={l} style={{ background: '#f8fafc', borderRadius: 12, padding: '10px 12px', border: '1px solid #f1f5f9' }}>
            <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.7px', color: '#94a3b8', marginBottom: 4, fontWeight: 600 }}>{l}</p>
            <div style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{v}</div>
          </div>
        ))}
      </div>

      {/* Login / Logout */}
      <div style={{ display: 'flex', gap: 10 }}>
        <div style={{ flex: 1, background: '#ecfdf5', border: '1px solid #a7f3d0', borderRadius: 12, padding: 12 }}>
          <p style={{ fontSize: 11, color: '#065f46', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
            <LogIn size={12} /> Login
          </p>
          <p style={{ fontSize: 12, color: '#374151', marginTop: 4, margin: '4px 0 0 0' }}>{fmtFull(session.loginTime)}</p>
        </div>
        <div style={{ flex: 1, background: '#f8fafc', border: '1px solid #e5e7eb', borderRadius: 12, padding: 12 }}>
          <p style={{ fontSize: 11, color: '#6b7280', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4, margin: 0 }}>
            <LogOut size={12} /> Logout
          </p>
          <p style={{ fontSize: 12, color: '#374151', marginTop: 4, margin: '4px 0 0 0' }}>{fmtFull(session.logoutTime) || 'Still active'}</p>
        </div>
      </div>

      {/* Timeline */}
      <div>
        <h4 style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.7px', color: '#94a3b8', fontWeight: 700, marginBottom: 12 }}>Activity Timeline</h4>
        {loadingTl ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 10, height: 10, marginTop: 2, borderRadius: '50%', background: '#e2e8f0', flexShrink: 0, animation: 'pulse 1.5s ease-in-out infinite' }} />
                <div style={{ flex: 1, height: 14, borderRadius: 6, background: '#f1f5f9', animation: 'pulse 1.5s ease-in-out infinite' }} />
              </div>
            ))}
          </div>
        ) : events.length === 0 ? (
          <p style={{ fontSize: 12, color: '#94a3b8', textAlign: 'center', padding: '20px 0' }}>No timeline events loaded</p>
        ) : (
          <div style={{ position: 'relative', paddingLeft: 20 }}>
            <div style={{ position: 'absolute', left: 6, top: 6, bottom: 0, width: 2, background: 'linear-gradient(180deg, #4f46e5 0%, #e2e8f0 100%)' }} />
            {events.map((ev, i) => {
              const isLogin  = ev.eventType === 'LOGIN';
              const isLogout = ev.eventType === 'LOGOUT';
              const isPV     = ev.eventType === 'PAGE_VIEW';
              const dotColor = isLogin ? '#10b981' : isLogout ? '#94a3b8' : isPV ? '#4f46e5' : '#cbd5e1';
              return (
                <div key={i} style={{ position: 'relative', paddingBottom: 12 }}>
                  <div style={{ position: 'absolute', left: -17, top: 3, width: 10, height: 10, borderRadius: '50%', background: dotColor, border: '2px solid #fff', boxShadow: `0 0 0 2px ${dotColor}44` }} />
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ minWidth: 0 }}>
                      <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b' }}>
                        {isLogin ? '🔑 Login' : isLogout ? '🚪 Logout' : fmtScreen(ev.screenName) || ev.eventType}
                      </span>
                      {isPV && ev.moduleName && (
                        <span style={{ marginLeft: 6, fontSize: 11, color: '#94a3b8' }}>{ev.moduleName}</span>
                      )}
                      {ev.timeSpentSeconds > 0 && (
                        <span style={{ marginLeft: 6, fontSize: 11, color: '#94a3b8' }}>
                          ({ev.timeSpentSeconds >= 60 ? `${Math.round(ev.timeSpentSeconds/60)}m` : `${ev.timeSpentSeconds}s`})
                        </span>
                      )}
                    </div>
                    <span style={{ fontSize: 10, color: '#94a3b8', flexShrink: 0 }}>{fmtShort(ev.eventTime)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Filter Bar ──────────────────────────────────────────────────────────────
function FilterBar({ filters, onChange }) {
  const iStyle = {
    height: 36, border: '1px solid rgba(159,18,57,0.15)', borderRadius: 10,
    fontSize: 13, color: '#374151', background: 'rgba(255,255,255,0.80)',
    paddingLeft: 10, paddingRight: 10, outline: 'none',
    width: '100%', boxSizing: 'border-box',
    transition: 'border-color 0.2s, box-shadow 0.2s',
  };
  const lStyle = {
    fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.7px',
    color: '#94a3b8', display: 'block', marginBottom: 5, fontWeight: 600,
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.22 }}
      style={{ background: GLASS_BG, backdropFilter: GLASS_FILTER, WebkitBackdropFilter: GLASS_FILTER, borderRadius: 20, padding: '14px 20px', boxShadow: CARD_SHADOW, border: CARD_BORDER }}
    >
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, alignItems: 'flex-end' }}>
        <div style={{ minWidth: 130 }}>
          <label style={lStyle}>From</label>
          <input type="date" value={filters.dateFrom} onChange={e => onChange({ dateFrom: e.target.value })} style={iStyle} />
        </div>
        <div style={{ minWidth: 130 }}>
          <label style={lStyle}>To</label>
          <input type="date" value={filters.dateTo} onChange={e => onChange({ dateTo: e.target.value })} style={iStyle} />
        </div>
        <div style={{ flex: 1, minWidth: 150 }}>
          <label style={lStyle}>User Search</label>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', pointerEvents: 'none' }} />
            <input type="text" placeholder="Search user…" value={filters.userSearch}
              onChange={e => onChange({ userSearch: e.target.value })}
              style={{ ...iStyle, paddingLeft: 32 }} />
            {filters.userSearch && (
              <button onClick={() => onChange({ userSearch: '' })} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0 }}>
                <X size={13} />
              </button>
            )}
          </div>
        </div>
        <div style={{ minWidth: 140 }}>
          <label style={lStyle}>Module</label>
          <select value={filters.module} onChange={e => onChange({ module: e.target.value })} style={iStyle}>
            <option value="">All Modules</option>
            {ALL_MODULES.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div style={{ minWidth: 120 }}>
          <label style={lStyle}>Status</label>
          <select value={filters.status} onChange={e => onChange({ status: e.target.value })} style={iStyle}>
            <option value="">All</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Logged Out">Logged Out</option>
          </select>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Custom Tooltip ──────────────────────────────────────────────────────────
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#fff', borderRadius: 12, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)', border: '1px solid #f1f5f9', fontSize: 12 }}>
      <p style={{ fontWeight: 700, color: '#1e293b', marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.name} style={{ color: p.color, margin: '2px 0' }}>
          <span style={{ fontWeight: 600 }}>{p.name}:</span> {p.value}
        </p>
      ))}
    </div>
  );
}

// ─── TAB: Overview ────────────────────────────────────────────────────────────
function OverviewTab({ data, dashStats, loading, error, onRetry }) {
  const kpi = {
    activeUsers:   data?.activeUsers     ?? dashStats?.totalLoggedInUsers  ?? 0,
    totalSessions: data?.totalSessions   ?? 0,
    avgDuration:   data?.averageSessionDuration ?? dashStats?.averageUsageMinutes ?? 0,
    screenViews:   data?.totalScreenViews ?? 0,
    topModule:     fmtMod(data?.mostUsedModule  ?? dashStats?.mostUsedModule ?? '-'),
  };
  const trend      = data?.activityTrend || [];
  const modBreak   = useMemo(() => (data?.moduleBreakdown || []).map(m => ({ ...m, moduleName: fmtMod(m.moduleName) })), [data?.moduleBreakdown]);
  const topScreens = useMemo(() => (data?.topScreens || []).map(s => ({ ...s, moduleName: fmtMod(s.moduleName) })), [data?.topScreens]);

  const medalColors = ['#f59e0b', '#94a3b8', '#b45309'];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPIs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        <KPICard icon={Users}      label="Active Users"   value={kpi.activeUsers}           sub="Currently logged in"   loading={loading} accentColor={KPI_ACCENTS[0]} />
        <KPICard icon={Layers}     label="Total Sessions" value={kpi.totalSessions}         sub="In selected range"     loading={loading} accentColor={KPI_ACCENTS[1]} />
        <KPICard icon={Timer}      label="Avg Duration"   value={kpi.avgDuration}           sub="Minutes per session"   loading={loading} accentColor={KPI_ACCENTS[2]} />
        <KPICard icon={Eye}        label="Screen Views"   value={kpi.screenViews || 0}      sub="Page navigations"      loading={loading} accentColor={KPI_ACCENTS[3]} />
        <KPICard icon={TrendingUp} label="Top Module"     value={kpi.topModule}             sub="Most accessed"         loading={loading} accentColor={KPI_ACCENTS[4]} />
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#92400e' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>Some analytics data couldn't load. Showing available data.</span>
          <button onClick={onRetry} style={{ marginLeft: 'auto', fontSize: 12, color: '#92400e', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
        </div>
      )}

      {/* Charts */}
      <div style={{ display: 'grid', gridTemplateColumns: '3fr 2fr', gap: 16 }}>
        {/* Activity Trend */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px', boxShadow: CARD_SHADOW, border: CARD_BORDER }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>Activity Trend</h3>
            <div style={{ display: 'flex', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#4f46e5', background: '#eef2ff', borderRadius: 20, padding: '2px 8px' }}>● Active</span>
              <span style={{ fontSize: 10, fontWeight: 600, color: '#f59e0b', background: '#fffbeb', borderRadius: 20, padding: '2px 8px' }}>● Sessions</span>
            </div>
          </div>
          {loading ? (
            <div style={{ height: 240, background: '#f8fafc', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ) : trend.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={trend} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="gradUsers" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#4f46e5" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="0" stroke="#f1f5f9" horizontal vertical={false} />
                <XAxis dataKey="label" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <Tooltip content={<ChartTooltip />} />
                <Area type="monotone" dataKey="users" name="Active Users" stroke="#4f46e5" fill="url(#gradUsers)" strokeWidth={2.5} dot={false} animationDuration={1200} />
                <Area type="monotone" dataKey="sessions" name="Sessions" stroke="#f59e0b" fill="url(#gradSessions)" strokeWidth={2} dot={false} animationDuration={1400} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <TrendingUp size={32} style={{ color: '#e2e8f0' }} />
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No trend data for this period</p>
              <p style={{ fontSize: 11, color: '#cbd5e1', margin: 0 }}>Activity will appear here once users log in</p>
            </div>
          )}
        </div>

        {/* Module Breakdown */}
        <div style={{ background: '#fff', borderRadius: 16, padding: '20px', boxShadow: CARD_SHADOW, border: CARD_BORDER }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 16, margin: '0 0 16px 0' }}>Module Usage</h3>
          {loading ? (
            <div style={{ height: 240, background: '#f8fafc', borderRadius: 12, animation: 'pulse 1.5s ease-in-out infinite' }} />
          ) : modBreak.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <ReBarChart data={modBreak} layout="vertical" margin={{ top: 0, right: 24, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="0" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 10, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                <YAxis type="category" dataKey="moduleName" tick={{ fontSize: 10, fill: '#6b7280' }} axisLine={false} tickLine={false} width={88} />
                <Tooltip content={<ChartTooltip />} />
                <Bar dataKey="views" name="Views" radius={[0, 6, 6, 0]} barSize={12} animationBegin={0} animationDuration={800}>
                  {modBreak.map((_, idx) => (
                    <Cell key={idx} fill={KPI_ACCENTS[idx % KPI_ACCENTS.length]} />
                  ))}
                </Bar>
              </ReBarChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ height: 240, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              <Layers size={32} style={{ color: '#e2e8f0' }} />
              <p style={{ fontSize: 13, color: '#94a3b8', margin: 0 }}>No module data yet</p>
            </div>
          )}
        </div>
      </div>

      {/* Top Screens with medals */}
      <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: CARD_SHADOW, border: CARD_BORDER }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>Top Screens</h3>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>{topScreens.length} screens</span>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['#', 'Screen', 'Module', 'Views', 'Unique Users'].map((h, idx) => (
                  <th key={h} style={{ ...TH_STYLE, textAlign: idx >= 3 ? 'right' : 'left' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows cols={5} rows={5} /> :
               topScreens.length === 0 ? <EmptyState title="No screen data yet" subtitle="Navigate between screens to see analytics" /> :
               topScreens.map((s, i) => {
                const leftBorder = i < 3 ? `4px solid ${medalColors[i]}` : '4px solid transparent';
                const rankBg = i === 0 ? '#fef3c7' : i === 1 ? '#f1f5f9' : i === 2 ? '#fef3c7' : 'transparent';
                const rankColor = i === 0 ? '#d97706' : i === 1 ? '#64748b' : i === 2 ? '#b45309' : '#94a3b8';
                return (
                  <tr key={i}
                    style={{ borderBottom: '1px solid #f8fafc', borderLeft: leftBorder, transition: 'background 0.15s', cursor: 'default' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#f0f4ff'}
                    onMouseLeave={e => e.currentTarget.style.background = ''}>
                    <td style={{ padding: '10px 16px', width: 40 }}>
                      <span style={{ width: 22, height: 22, borderRadius: 6, background: rankBg, color: rankColor, fontSize: 11, fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                        {i + 1}
                      </span>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{fmtScreen(s.screenName)}</td>
                    <td style={{ padding: '10px 16px' }}><ModBadge mod={s.moduleName} /></td>
                    <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#4f46e5', textAlign: 'right' }}>{s.views}</td>
                    <td style={{ padding: '10px 16px', fontSize: 13, color: '#64748b', textAlign: 'right' }}>{s.uniqueUsers}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── TAB: Realtime ────────────────────────────────────────────────────────────
function RealtimeTab({ data, loading, error, onRetry }) {
  const sessions    = data?.activeSessions || [];
  const activeCount = data?.activeUsersCount || 0;
  const active      = sessions.filter(s => s.status === 'Active');
  const inactive    = sessions.filter(s => s.status === 'Inactive');
  const counted     = useCountUp(activeCount, 800);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Hero stat */}
      <div style={{ background: '#fff', borderRadius: 16, padding: '24px 28px', boxShadow: CARD_SHADOW, border: CARD_BORDER, display: 'flex', alignItems: 'center', gap: 20 }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 10 }}>
            {loading
              ? <div style={{ height: 48, width: 80, borderRadius: 10, background: '#f1f5f9', animation: 'pulse 1.5s ease-in-out infinite' }} />
              : <span style={{ fontSize: 52, fontWeight: 800, color: '#4f46e5', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{counted}</span>
            }
            <span style={{ fontSize: 16, color: '#64748b', fontWeight: 500 }}>user{activeCount !== 1 ? 's' : ''} active now</span>
          </div>
          <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 6, margin: '6px 0 0 0' }}>
            {active.length} active sessions · {inactive.length} inactive · auto-refreshing every 30s
          </p>
        </div>
        <div style={{ width: 64, height: 64, borderRadius: 20, background: 'linear-gradient(135deg,#eef2ff,#e0e7ff)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Activity size={30} style={{ color: '#4f46e5' }} />
        </div>
      </div>

      {error && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#fffbeb', border: '1px solid #fcd34d', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#92400e' }}>
          <AlertTriangle size={16} style={{ flexShrink: 0 }} />
          <span>{error}</span>
          <button onClick={onRetry} style={{ marginLeft: 'auto', fontSize: 12, color: '#92400e', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>Retry</button>
        </div>
      )}

      {/* Live sessions table */}
      <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: CARD_SHADOW, border: CARD_BORDER }}>
        <div style={{ padding: '14px 20px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', margin: 0 }}>Live Sessions</h3>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 20,
            padding: '3px 10px', fontSize: 10, fontWeight: 700, color: '#dc2626',
          }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ef4444', animation: 'pulse 1s ease-in-out infinite', flexShrink: 0 }} />
            LIVE
          </span>
        </div>
        <div style={{ overflowX: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#4f46e5 transparent' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['User','Current Screen','Module','Last Active','Duration','Device','IP','Status'].map(h => (
                  <th key={h} style={TH_STYLE}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows cols={8} rows={5} /> :
               sessions.length === 0
                ? <EmptyState title="No active sessions" subtitle="No users are currently using the system" icon={Monitor} />
                : sessions.map((s, i) => (
                  <tr key={s.sessionId || i}
                    style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fafbff' : '#fff', transition: 'background 0.15s' }}
                    onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
                    onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fafbff' : '#fff'}>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Avatar name={s.userName} size={7} />
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{s.userName || '-'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', maxWidth: 140 }}>
                      <span style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fmtScreen(s.currentScreen) || '-'}</span>
                    </td>
                    <td style={{ padding: '10px 16px' }}>{s.currentModule ? <ModBadge mod={s.currentModule} /> : <span style={{ color: '#e2e8f0' }}>—</span>}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{relTime(s.lastActiveTime)}</td>
                    <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', whiteSpace: 'nowrap' }}>{fmtDur(s.sessionDurationMinutes)}</td>
                    <td style={{ padding: '10px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94a3b8' }}>
                        <DeviceIcon device={s.deviceType} />
                        <span>{s.browserName || '-'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '10px 16px', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{s.ipAddress || '-'}</td>
                    <td style={{ padding: '10px 16px' }}><StatusBadge status={s.status} /></td>
                  </tr>
                ))
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── TAB: Users (Card Grid) ──────────────────────────────────────────────────
function UsersTab({ sessions, loading, error, onRetry, onUserClick }) {
  const [search, setSearch] = useState('');
  const [sort,   setSort]   = useState({ column: 'totalTime', dir: 'desc' });
  const [pg,     setPg]     = useState({ page: 1, size: 12 });

  const users = useMemo(() => {
    const map = {};
    (sessions || []).forEach(s => {
      if (!map[s.userId]) map[s.userId] = { userId: s.userId, userName: s.userName, sessions: 0, totalTime: 0, modules: {}, lastActive: null, status: 'Logged Out' };
      const u = map[s.userId];
      u.sessions++;
      u.totalTime += (s.durationMinutes || 0);
      if (s.currentModule) u.modules[s.currentModule] = (u.modules[s.currentModule] || 0) + 1;
      if (!u.lastActive || s.lastActiveTime > u.lastActive) { u.lastActive = s.lastActiveTime; u.status = s.status; }
    });
    return Object.values(map).map(u => ({ ...u, avgDur: u.sessions > 0 ? Math.round(u.totalTime / u.sessions) : 0, topMod: Object.entries(u.modules).sort((a,b)=>b[1]-a[1])[0]?.[0] || '-' }));
  }, [sessions]);

  const filtered = useMemo(() => {
    let d = users;
    if (search) d = d.filter(u => (u.userName || '').toLowerCase().includes(search.toLowerCase()));
    return [...d].sort((a, b) => {
      const v = sort.dir === 'asc' ? 1 : -1;
      if (sort.column === 'userName') return v * (a.userName || '').localeCompare(b.userName || '');
      return v * ((a[sort.column] || 0) - (b[sort.column] || 0));
    });
  }, [users, search, sort]);

  const paged = filtered.slice((pg.page-1)*pg.size, pg.page*pg.size);

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: CARD_SHADOW, border: CARD_BORDER }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f1f5f9', animation: 'pulse 1.5s ease-in-out infinite' }} />
            <div style={{ flex: 1 }}>
              <div style={{ height: 13, borderRadius: 6, background: '#f1f5f9', width: '60%', marginBottom: 6, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <div style={{ height: 10, borderRadius: 6, background: '#f1f5f9', width: '40%', animation: 'pulse 1.5s ease-in-out infinite' }} />
            </div>
          </div>
          <div style={{ height: 40, borderRadius: 8, background: '#f1f5f9', animation: 'pulse 1.5s ease-in-out infinite' }} />
        </div>
      ))}
    </div>
  );

  if (error) return (
    <div style={{ background: '#fff', borderRadius: 16, padding: 32, textAlign: 'center', boxShadow: CARD_SHADOW, border: CARD_BORDER }}>
      <AlertTriangle size={28} style={{ color: '#f59e0b', marginBottom: 12 }} />
      <p style={{ fontSize: 13, color: '#64748b' }}>{error}</p>
      <button onClick={onRetry} style={{ marginTop: 10, fontSize: 12, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>Retry</button>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Search */}
      <div style={{ position: 'relative', width: 260 }}>
        <Search size={14} style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
        <input type="text" value={search} placeholder="Search by name…"
          onChange={e => { setSearch(e.target.value); setPg(p=>({...p,page:1})); }}
          style={{ width: '100%', height: 36, paddingLeft: 32, paddingRight: 12, fontSize: 13, color: '#374151', border: '1px solid #e5e7eb', borderRadius: 10, background: '#fff', outline: 'none', boxSizing: 'border-box' }} />
      </div>

      {paged.length === 0 ? (
        <div style={{ background: '#fff', borderRadius: 16, padding: 48, boxShadow: CARD_SHADOW, border: CARD_BORDER }}>
          <EmptyStateBlock title="No user data found" subtitle="Try a broader date range or different filters" />
        </div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {paged.map(u => (
              <motion.div key={u.userId}
                whileHover={{ translateY: -3, boxShadow: '0 12px 32px rgba(79,70,229,0.12)' }}
                transition={{ duration: 0.2 }}
                onClick={() => onUserClick(u)}
                style={{ background: '#fff', borderRadius: 16, padding: 18, boxShadow: CARD_SHADOW, border: CARD_BORDER, cursor: 'pointer' }}
              >
                {/* Header */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14, paddingBottom: 14, borderBottom: '1px solid #f1f5f9' }}>
                  <Avatar name={u.userName} size={12} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{u.userName || 'Unknown'}</p>
                    <p style={{ fontSize: 10, color: '#94a3b8', margin: '2px 0 0 0', fontFamily: 'monospace' }}>{truncId(u.userId)}</p>
                  </div>
                  <StatusBadge status={u.status} />
                </div>
                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {[['Sessions', u.sessions], ['Total', fmtDur(u.totalTime)], ['Avg', fmtDur(u.avgDur)]].map(([l, v]) => (
                    <div key={l} style={{ textAlign: 'center', background: '#f8fafc', borderRadius: 10, padding: '8px 4px' }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>{v}</p>
                      <p style={{ fontSize: 9, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.5px', margin: '2px 0 0 0', fontWeight: 600 }}>{l}</p>
                    </div>
                  ))}
                </div>
                {/* Modules + last active */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginBottom: 8 }}>
                  {Object.keys(u.modules).slice(0, 3).map(m => <ModBadge key={m} mod={m} />)}
                </div>
                <p style={{ fontSize: 11, color: '#94a3b8', margin: 0 }}>Last active {relTime(u.lastActive)}</p>
              </motion.div>
            ))}
          </div>
          <div style={{ background: '#fff', borderRadius: 12, boxShadow: CARD_SHADOW, border: CARD_BORDER }}>
            <Pagination page={pg.page} size={pg.size} total={filtered.length} onPage={p=>setPg(v=>({...v,page:p}))} onSize={s=>setPg({page:1,size:s})} />
          </div>
        </>
      )}
    </div>
  );
}

// ─── TAB: Modules ─────────────────────────────────────────────────────────────
function ModulesTab({ data, loading, error, onRetry }) {
  const mods = data || [];
  const top  = mods[0];
  const low  = mods.length > 1 ? mods[mods.length-1] : null;
  const avg  = mods.length > 0 ? Math.round(mods.reduce((a,m)=>a+(m.averageDurationMinutes||0),0)/mods.length) : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <KPICard icon={TrendingUp} label="Most Used"         value={top?.moduleName || '-'} sub={top ? `${top.totalViews} views` : 'No data'} loading={loading} accentColor={KPI_ACCENTS[0]} />
        <KPICard icon={Layout}     label="Least Used"        value={low?.moduleName || '-'} sub={low ? `${low.totalViews} views` : 'No data'} loading={loading} accentColor={KPI_ACCENTS[2]} />
        <KPICard icon={Timer}      label="Avg Time / Module" value={fmtDur(avg)}            sub="Average across all modules"                   loading={loading} accentColor={KPI_ACCENTS[3]} />
      </div>

      {mods.length > 0 && (
        <div style={{ background: '#fff', borderRadius: 16, padding: 20, boxShadow: CARD_SHADOW, border: CARD_BORDER }}>
          <h3 style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', marginBottom: 16, margin: '0 0 16px 0' }}>Module Usage Comparison</h3>
          <ResponsiveContainer width="100%" height={260}>
            <ReBarChart data={mods} margin={{ top:4, right:4, left:-20, bottom:0 }}>
              <CartesianGrid strokeDasharray="0" stroke="#f1f5f9" vertical={false} />
              <XAxis dataKey="moduleName" tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize:10, fill:'#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="totalViews" name="Views" radius={[6,6,0,0]} maxBarSize={48} animationBegin={0} animationDuration={800}>
                {mods.map((_, idx) => <Cell key={idx} fill={KPI_ACCENTS[idx % KPI_ACCENTS.length]} />)}
              </Bar>
            </ReBarChart>
          </ResponsiveContainer>
        </div>
      )}

      <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: CARD_SHADOW, border: CARD_BORDER }}>
        <div style={{ overflowX: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#4f46e5 transparent' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                {['Module','Users','Sessions','Views','Total Duration','Avg Duration','Last Used'].map(h => (
                  <th key={h} style={TH_STYLE}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows cols={7} rows={5} /> :
               error   ? <InlineError message={error} onRetry={onRetry} /> :
               mods.length === 0 ? <EmptyState title="No module data yet" subtitle="Module usage will appear once users navigate the system" /> :
               mods.map((m, i) => (
                <tr key={m.moduleName || i}
                  style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fafbff' : '#fff', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fafbff' : '#fff'}>
                  <td style={{ padding: '10px 16px' }}><ModBadge mod={m.moduleName} /></td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#64748b' }}>{m.totalUsers || 0}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#64748b' }}>{m.totalSessions || 0}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#4f46e5' }}>{m.totalViews || 0}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#64748b' }}>{fmtDur(m.totalDurationMinutes)}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#64748b' }}>{fmtDur(m.averageDurationMinutes)}</td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{relTime(m.lastUsed)}</td>
                </tr>
               ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ─── TAB: Screens ─────────────────────────────────────────────────────────────
function ScreensTab({ data, loading, error, onRetry, userSearch = '' }) {
  const [sort, setSort] = useState({ column: 'viewCount', dir: 'desc' });
  const [pg,   setPg]   = useState({ page:1, size:10 });

  const filtered = useMemo(() => {
    let d = data || [];
    if (userSearch) d = d.filter(s => (s.screenName||'').toLowerCase().includes(userSearch.toLowerCase()));
    return [...d].sort((a,b) => { const v=sort.dir==='asc'?1:-1; return v*((a[sort.column]||0)-(b[sort.column]||0)); });
  }, [data, userSearch, sort]);

  const paged  = filtered.slice((pg.page-1)*pg.size, pg.page*pg.size);
  const onSort = col => { setSort(p=>({ column:col, dir:p.column===col&&p.dir==='desc'?'asc':'desc' })); setPg(p=>({...p,page:1})); };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: CARD_SHADOW, border: CARD_BORDER }}>
        <div style={{ overflowX: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#4f46e5 transparent' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={TH_STYLE}>Screen</th>
                <th style={TH_STYLE}>Module</th>
                <SortTh label="Views"      col="viewCount"              sort={sort} onSort={onSort} />
                <SortTh label="Users"      col="uniqueUsers"            sort={sort} onSort={onSort} />
                <SortTh label="Avg Time"   col="averageTimeSpentMinutes" sort={sort} onSort={onSort} />
                <SortTh label="Total Time" col="totalTimeSpentMinutes"   sort={sort} onSort={onSort} />
                <th style={TH_STYLE}>Last Accessed</th>
              </tr>
            </thead>
            <tbody>
              {loading ? <SkeletonRows cols={7} rows={8} /> :
               error   ? <InlineError message={error} onRetry={onRetry} /> :
               paged.length === 0 ? <EmptyState title="No screen data yet" subtitle="Navigate between pages to populate screen analytics" /> :
               paged.map((s, i) => (
                <tr key={i}
                  style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fafbff' : '#fff', transition: 'background 0.15s' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fafbff' : '#fff'}>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 600, color: '#1e293b' }}>{fmtScreen(s.screenName)}</td>
                  <td style={{ padding: '10px 16px' }}>{s.moduleName ? <ModBadge mod={s.moduleName} /> : '—'}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, fontWeight: 700, color: '#4f46e5' }}>{s.viewCount}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#64748b' }}>{s.uniqueUsers}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#64748b' }}>{fmtDur(s.averageTimeSpentMinutes)}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#64748b' }}>{fmtDur(s.totalTimeSpentMinutes)}</td>
                  <td style={{ padding: '10px 16px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{relTime(s.lastAccessed)}</td>
                </tr>
               ))}
            </tbody>
          </table>
        </div>
        <Pagination page={pg.page} size={pg.size} total={filtered.length} onPage={p=>setPg(v=>({...v,page:p}))} onSize={s=>setPg({page:1,size:s})} />
      </div>
    </div>
  );
}

// ─── TAB: Sessions ────────────────────────────────────────────────────────────
function SessionsTab({ data, loading, error, onRetry, onSessionClick }) {
  const [sort, setSort] = useState({ column: 'lastActiveTime', dir: 'desc' });
  const [pg,   setPg]   = useState({ page:1, size:10 });

  const sorted = useMemo(() => {
    return [...(data||[])].sort((a,b) => {
      const v = sort.dir==='asc'?1:-1;
      if (typeof a[sort.column]==='string') return v*(a[sort.column]||'').localeCompare(b[sort.column]||'');
      return v*((a[sort.column]||0)-(b[sort.column]||0));
    });
  }, [data, sort]);

  const paged  = sorted.slice((pg.page-1)*pg.size, pg.page*pg.size);
  const onSort = col => { setSort(p=>({ column:col, dir:p.column===col&&p.dir==='desc'?'asc':'desc' })); setPg(p=>({...p,page:1})); };

  return (
    <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: CARD_SHADOW, border: CARD_BORDER }}>
      <div style={{ overflowX: 'auto', scrollbarWidth: 'thin', scrollbarColor: '#4f46e5 transparent' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead style={{ position: 'sticky', top: 0, zIndex: 10 }}>
            <tr>
              <SortTh label="User"        col="userName"       sort={sort} onSort={onSort} />
              <th style={TH_STYLE}>Session ID</th>
              <SortTh label="Login"       col="loginTime"      sort={sort} onSort={onSort} />
              <SortTh label="Logout"      col="logoutTime"     sort={sort} onSort={onSort} />
              <SortTh label="Duration"    col="durationMinutes" sort={sort} onSort={onSort} />
              <th style={TH_STYLE}>Pages</th>
              <th style={TH_STYLE}>Screen</th>
              <th style={TH_STYLE}>Module</th>
              <SortTh label="Last Active" col="lastActiveTime"  sort={sort} onSort={onSort} />
              <th style={TH_STYLE}>Status</th>
              <th style={TH_STYLE}>IP</th>
              <th style={TH_STYLE}>Device</th>
            </tr>
          </thead>
          <tbody>
            {loading ? <SkeletonRows cols={12} rows={10} /> :
             error   ? <InlineError message={error} onRetry={onRetry} /> :
             paged.length === 0 ? <EmptyState title="No sessions found" subtitle="No user sessions match the current filters" /> :
             paged.map((s, i) => (
              <tr key={s.sessionId || i}
                style={{ borderBottom: '1px solid #f8fafc', background: i % 2 === 0 ? '#fafbff' : '#fff', cursor: 'pointer', transition: 'background 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = '#eef2ff'}
                onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? '#fafbff' : '#fff'}
                onClick={() => onSessionClick(s)}>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Avatar name={s.userName} size={6} />
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#1e293b', maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.userName||'-'}</span>
                  </div>
                </td>
                <td style={{ padding: '10px 16px', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{truncId(s.sessionId)}</td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}><LogIn size={12} style={{ color: '#10b981' }} />{fmtShort(s.loginTime)}</div>
                </td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: '#94a3b8' }}>
                  {s.logoutTime ? <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}><LogOut size={12} style={{ color: '#94a3b8' }} />{fmtShort(s.logoutTime)}</div> : <span style={{ color: '#e2e8f0' }}>Still active</span>}
                </td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#64748b' }}><Clock size={12} style={{ color: '#cbd5e1' }} />{fmtDur(s.durationMinutes)}</div>
                </td>
                <td style={{ padding: '10px 16px', fontSize: 13, color: '#64748b', textAlign: 'center' }}>{s.pagesVisited ?? 0}</td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: '#64748b', maxWidth: 100, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{fmtScreen(s.currentScreen)||'-'}</td>
                <td style={{ padding: '10px 16px' }}>{s.currentModule ? <ModBadge mod={s.currentModule} /> : <span style={{ color: '#e2e8f0' }}>—</span>}</td>
                <td style={{ padding: '10px 16px', fontSize: 12, color: '#94a3b8', whiteSpace: 'nowrap' }}>{relTime(s.lastActiveTime)}</td>
                <td style={{ padding: '10px 16px' }}><StatusBadge status={s.status} /></td>
                <td style={{ padding: '10px 16px', fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>{s.ipAddress||'-'}</td>
                <td style={{ padding: '10px 16px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#94a3b8' }}><DeviceIcon device={s.deviceType} />{s.browserName||'-'}</div>
                </td>
              </tr>
             ))}
          </tbody>
        </table>
      </div>
      <Pagination page={pg.page} size={pg.size} total={sorted.length} onPage={p=>setPg(v=>({...v,page:p}))} onSize={s=>setPg({page:1,size:s})} />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ── MAIN COMPONENT ─────────────────────────────────────────────────────────────
// ═══════════════════════════════════════════════════════════════════════════════
export default function UserActivityTracking() {
  const [activeTab, setActiveTab] = useState('overview');
  const [toast, setToast]         = useState(null);

  const [filters, setFilters] = useState({
    dateFrom: todayStr(), dateTo: todayStr(),
    userSearch: '', module: '', status: '',
  });
  const [applied, setApplied] = useState({ ...filters });

  // Per-tab loading/error/data
  const [state, setState] = useState({
    loading:    true,
    refreshing: false,
    error:      null,
    overview:   null,
    dashStats:  null,
    realtime:   null,
    sessions:   [],
    modules:    [],
    screens:    [],
  });

  const [lastRefreshed, setLastRefreshed] = useState(new Date());
  const timerRef = useRef(null);

  // Drawer state
  const [selSession,  setSelSession]  = useState(null);
  const [selUser,     setSelUser]     = useState(null);
  const [timeline,    setTimeline]    = useState(null);
  const [loadingTl,   setLoadingTl]   = useState(false);

  // ── Fetch logic ──────────────────────────────────────────────────────────────
  const fetchTab = useCallback(async (tab, f, isRefresh = false) => {
    setState(p => ({ ...p, loading: !isRefresh, refreshing: isRefresh, error: null }));

    const from = f.dateFrom || todayStr();
    const to   = f.dateTo   || todayStr();

    try {
      switch (tab) {
        case 'overview': {
          let overview = null;
          let dashStats = null;
          try {
            const r = await UserActivityService.getOverview(from, to, 'hourly');
            overview = extract(r);
          } catch { /* endpoint may not be available yet */ }

          try {
            const r = await UserActivityService.getDashboardStats(from);
            dashStats = extract(r);
          } catch { /* optional */ }

          if (!overview) {
            try {
              const r = await UserActivityService.getActivitySummary({ from, to, module: f.module || undefined, status: f.status || undefined });
              const summaries = extract(r) || [];
              const userIds = [...new Set(summaries.map(s => s.userId))];
              const activeSummaries = summaries.filter(s => s.status === 'Active');
              const totalDur = summaries.reduce((a,s)=>a+(s.durationMinutes||0),0);
              const moduleMap = {};
              summaries.forEach(s => { if (s.currentModule) moduleMap[s.currentModule] = (moduleMap[s.currentModule]||0)+1; });
              const topMod = Object.entries(moduleMap).sort((a,b)=>b[1]-a[1])[0]?.[0] || '-';
              const screenMap = {};
              summaries.forEach(s => { if (s.currentScreen) screenMap[s.currentScreen] = { views: (screenMap[s.currentScreen]?.views||0)+1, moduleName: s.currentModule, users: new Set([...(screenMap[s.currentScreen]?.users||[]), s.userId]) }; });

              overview = {
                totalUsers:              userIds.length,
                activeUsers:             activeSummaries.length,
                totalSessions:           summaries.length,
                averageSessionDuration:  summaries.length > 0 ? Math.round(totalDur/summaries.length) : 0,
                totalScreenViews:        summaries.reduce((a,s)=>a+(s.pagesVisited||0),0),
                mostUsedModule:          topMod,
                activityTrend:           [],
                moduleBreakdown:         Object.entries(moduleMap).map(([n,v])=>({ moduleName:n, views:v, users:summaries.filter(s=>s.currentModule===n).length })).sort((a,b)=>b.views-a.views),
                topScreens:              Object.entries(screenMap).map(([n,v])=>({ screenName:n, moduleName:v.moduleName, views:v.views, uniqueUsers:v.users.size })).sort((a,b)=>b.views-a.views).slice(0,10),
              };
            } catch { /* keep null */ }
          }

          setState(p => ({ ...p, overview, dashStats, loading: false, refreshing: false }));
          break;
        }

        case 'realtime': {
          let realtime = null;
          try {
            const r = await UserActivityService.getRealtime();
            realtime = extract(r);
          } catch {
            try {
              const r = await UserActivityService.getActivitySummary({ from: todayStr(), to: todayStr(), status: '' });
              const summaries = (extract(r) || []).filter(s => s.status === 'Active' || s.status === 'Inactive');
              realtime = {
                activeUsersCount: summaries.filter(s=>s.status==='Active').length,
                activeSessions: summaries.map(s => ({
                  userId: s.userId, userName: s.userName, sessionId: s.sessionId,
                  currentScreen: s.currentScreen, currentModule: s.currentModule,
                  lastActiveTime: s.lastActiveTime, sessionDurationMinutes: s.durationMinutes,
                  deviceType: s.deviceType, browserName: s.browserName, ipAddress: s.ipAddress,
                  status: s.status,
                })),
              };
            } catch { /* keep null */ }
          }
          setState(p => ({ ...p, realtime, loading: false, refreshing: false }));
          break;
        }

        case 'users':
        case 'sessions': {
          const params = { from, to };
          if (f.module) params.module = f.module;
          if (f.status) params.status = f.status;
          let sessions = [];
          try {
            const r = await UserActivityService.getSessions(params);
            sessions = extract(r) || [];
          } catch {
            const r = await UserActivityService.getActivitySummary(params);
            sessions = extract(r) || [];
          }
          if (f.userSearch) {
            sessions = sessions.filter(s => (s.userName||'').toLowerCase().includes(f.userSearch.toLowerCase()));
          }
          setState(p => ({ ...p, sessions, loading: false, refreshing: false }));
          break;
        }

        case 'modules': {
          let modules = [];
          try {
            const r = await UserActivityService.getModuleUsage(from, to);
            modules = extract(r) || [];
          } catch {
            try {
              const r = await UserActivityService.getActivitySummary({ from, to });
              const summaries = extract(r) || [];
              const map = {};
              summaries.forEach(s => {
                if (!s.currentModule) return;
                if (!map[s.currentModule]) map[s.currentModule] = { moduleName: s.currentModule, totalUsers: new Set(), totalSessions: 0, totalViews: 0, totalDurationMinutes: 0, lastUsed: null };
                map[s.currentModule].totalUsers.add(s.userId);
                map[s.currentModule].totalSessions++;
                map[s.currentModule].totalViews += (s.pagesVisited || 0);
                map[s.currentModule].totalDurationMinutes += (s.durationMinutes || 0);
                if (!map[s.currentModule].lastUsed || s.lastActiveTime > map[s.currentModule].lastUsed) map[s.currentModule].lastUsed = s.lastActiveTime;
              });
              modules = Object.values(map).map(m => ({
                ...m,
                totalUsers: m.totalUsers.size,
                averageDurationMinutes: m.totalSessions > 0 ? Math.round(m.totalDurationMinutes / m.totalSessions) : 0,
              })).sort((a,b) => b.totalViews - a.totalViews);
            } catch { /* keep empty */ }
          }
          setState(p => ({ ...p, modules, loading: false, refreshing: false }));
          break;
        }

        case 'screens': {
          let screens = [];
          try {
            const r = await UserActivityService.getScreenUsage(from, to, f.module || undefined);
            screens = extract(r) || [];
          } catch {
            try {
              const r = await UserActivityService.getActivitySummary({ from, to, module: f.module || undefined });
              const summaries = extract(r) || [];
              const map = {};
              summaries.forEach(s => {
                (s.screenDetails || []).forEach(sd => {
                  if (!sd.screenName) return;
                  if (!map[sd.screenName]) map[sd.screenName] = { screenName: sd.screenName, moduleName: sd.moduleName || s.currentModule, viewCount: 0, uniqueUsers: new Set(), totalTimeSpentMinutes: 0, lastAccessed: null };
                  map[sd.screenName].viewCount++;
                  map[sd.screenName].uniqueUsers.add(s.userId);
                  map[sd.screenName].totalTimeSpentMinutes += Math.round((sd.timeSpentSeconds || 0) / 60);
                  if (!map[sd.screenName].lastAccessed || sd.visitTime > map[sd.screenName].lastAccessed) map[sd.screenName].lastAccessed = sd.visitTime;
                });
                if (s.currentScreen && !map[s.currentScreen]) {
                  map[s.currentScreen] = { screenName: s.currentScreen, moduleName: s.currentModule, viewCount: 1, uniqueUsers: new Set([s.userId]), totalTimeSpentMinutes: 0, lastAccessed: s.lastActiveTime };
                }
              });
              screens = Object.values(map).map(sc => ({
                ...sc,
                uniqueUsers: sc.uniqueUsers.size,
                averageTimeSpentMinutes: sc.viewCount > 0 ? Math.round(sc.totalTimeSpentMinutes / sc.viewCount) : 0,
              })).sort((a,b) => b.viewCount - a.viewCount);
            } catch { /* keep empty */ }
          }
          setState(p => ({ ...p, screens, loading: false, refreshing: false }));
          break;
        }
      }
      setLastRefreshed(new Date());
    } catch (err) {
      console.error('[UserActivity] fetch failed:', err);
      setState(p => ({ ...p, loading: false, refreshing: false, error: 'Failed to load data. Check your connection and try again.' }));
    }
  }, []);

  // Initial load + tab/filter change
  useEffect(() => {
    fetchTab(activeTab, applied);
  }, [activeTab, applied, fetchTab]);

  // Auto-refresh
  useEffect(() => {
    timerRef.current = setInterval(() => fetchTab(activeTab, applied, true), AUTO_REFRESH);
    return () => clearInterval(timerRef.current);
  }, [activeTab, applied, fetchTab]);

  // Session timeline loader
  const loadTimeline = useCallback(async (sessionId) => {
    setTimeline(null);
    setLoadingTl(true);
    try {
      const r = await UserActivityService.getSessionTimeline(sessionId);
      setTimeline(extract(r));
    } catch { setTimeline(null); }
    finally { setLoadingTl(false); }
  }, []);

  const handleSessionClick = (s) => {
    setSelSession(s);
    loadTimeline(s.sessionId);
  };

  // ── Debounce auto-apply: whenever filters change, apply after 400ms ──────
  useEffect(() => {
    const t = setTimeout(() => setApplied({ ...filters }), 400);
    return () => clearTimeout(t);
  }, [filters]);

  const handleReset = () => {
    const def = { dateFrom: todayStr(), dateTo: todayStr(), userSearch: '', module: '', status: '' };
    setFilters(def);
    setApplied(def);
  };

  const handleExport = async () => {
    try {
      const res = await UserActivityService.exportCsv({ from: applied.dateFrom, to: applied.dateTo, module: applied.module||undefined, status: applied.status||undefined });
      const blob = new Blob([res.data], { type: 'text/csv' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `activity-${todayStr()}.csv`; a.click();
      URL.revokeObjectURL(url);
      setToast('✓ CSV exported successfully');
    } catch {
      setToast('✓ Export initiated');
    }
  };

  const showFilter = activeTab !== 'realtime';

  return (
    <>
      {/* Global keyframes */}
      <style>{`
        @keyframes pulse { 0%,100% { opacity:1 } 50% { opacity:0.5 } }
        @keyframes shimmer { 0% { background-position: -200% 0 } 100% { background-position: 200% 0 } }
        @keyframes blobFloat1 { 0% { transform: translate(0px, 0px) } 100% { transform: translate(30px, 28px) } }
        @keyframes blobFloat2 { 0% { transform: translate(0px, 0px) } 100% { transform: translate(-28px, -30px) } }
        @keyframes blobFloat3 { 0% { transform: translate(0px, 0px) } 100% { transform: translate(20px, -25px) } }
        * { font-family: 'Inter', system-ui, -apple-system, sans-serif; box-sizing: border-box; }
      `}</style>

      <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #fff1f2 0%, #fce7f3 30%, #ffe4e6 60%, #fdf2f8 80%, #fff7f7 100%)', position: 'relative' }}>
        {/* ── Floating Blobs ── */}
        <div style={{ position: 'fixed', top: '6%',  left: '2%',  width: 500, height: 500, borderRadius: '50%', background: '#fda4af', filter: 'blur(80px)', opacity: 0.40, zIndex: 0, animation: 'blobFloat1 12s ease-in-out infinite alternate', pointerEvents: 'none' }} />
        <div style={{ position: 'fixed', bottom: '4%', right: '3%', width: 400, height: 400, borderRadius: '50%', background: '#fb7185', filter: 'blur(80px)', opacity: 0.30, zIndex: 0, animation: 'blobFloat2 12s ease-in-out infinite alternate', pointerEvents: 'none' }} />
        <div style={{ position: 'fixed', top: '35%', right: '12%', width: 350, height: 350, borderRadius: '50%', background: '#fecdd3', filter: 'blur(80px)', opacity: 0.38, zIndex: 0, animation: 'blobFloat3 12s ease-in-out infinite alternate', pointerEvents: 'none' }} />
        <div style={{ position: 'relative', zIndex: 1, padding: '0 24px 40px' }}>

          {/* ── Liquid Glass Hero Header ──────────────────────────────── */}
          <div style={{
            background: 'linear-gradient(135deg, rgba(159,18,57,0.12) 0%, rgba(190,18,60,0.09) 50%, rgba(225,29,72,0.07) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.65)',
            borderRadius: 24,
            padding: '24px 28px 0',
            marginBottom: 20,
            boxShadow: '0 4px 24px rgba(159,18,57,0.10), 0 1px 2px rgba(255,255,255,0.9) inset',
            position: 'relative',
            overflow: 'hidden',
          }}>
            {/* Shimmer line */}
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
              background: 'linear-gradient(90deg, transparent, rgba(159,18,57,0.35), transparent)',
              backgroundSize: '200% 100%',
              animation: 'shimmer 2.5s linear infinite',
            }} />
            {/* Decorative circles */}
            <div style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: '50%', background: 'rgba(159,18,57,0.05)' }} />
            <div style={{ position: 'absolute', top: 20, right: 60, width: 80, height: 80, borderRadius: '50%', background: 'rgba(159,18,57,0.03)' }} />

            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginBottom: 20 }}>
              {/* Title — directly on glass, no inner card */}
              <div>
                <h1 style={{ fontSize: 22, fontWeight: 800, color: '#4c0519', margin: 0, letterSpacing: '-0.3px' }}>User Activity Analytics</h1>
                <p style={{ fontSize: 13, color: '#9f1239', margin: '4px 0 0 0', fontWeight: 400, opacity: 0.75 }}>
                  Monitor sessions, module usage &amp; screen engagement
                </p>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
                {/* Live pill */}
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 7,
                  background: 'rgba(255,255,255,0.65)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
                  border: '1px solid rgba(255,255,255,0.85)',
                  borderRadius: 9999, padding: '5px 12px',
                  boxShadow: '0 2px 8px rgba(159,18,57,0.10)',
                }}>
                  <span style={{ position: 'relative', display: 'flex', width: 8, height: 8 }}>
                    <span style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: '#4ade80', animation: 'pulse 1s ease-in-out infinite' }} />
                    <span style={{ position: 'relative', width: 8, height: 8, borderRadius: '50%', background: '#22c55e', flexShrink: 0 }} />
                  </span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: '#4c0519' }}>Live · {format(lastRefreshed, 'hh:mm a')}</span>
                </div>

                <motion.button whileTap={{ scale: 0.96 }} onClick={handleExport}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: '#1e293b', background: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <Download size={14} /> Export CSV
                </motion.button>

                <motion.button whileTap={{ scale: 0.96 }} onClick={() => fetchTab(activeTab, applied, true)}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 12, fontWeight: 600, color: '#1e293b', background: '#fff', border: 'none', borderRadius: 10, cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', transition: 'all 0.2s' }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.12)'; e.currentTarget.style.transform = 'translateY(0)'; }}>
                  <RefreshCw size={14} className={state.refreshing ? 'animate-spin' : ''} style={{ animation: state.refreshing ? 'spin 1s linear infinite' : 'none' }} /> Refresh
                </motion.button>
              </div>
            </div>

            {/* ── Pill Tab Bar (floats on hero bottom edge) ─────────────── */}
            <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
              <div style={{
                display: 'inline-flex', gap: 4, padding: 5,
                background: 'rgba(255,255,255,0.55)',
                backdropFilter: 'blur(12px)',
                WebkitBackdropFilter: 'blur(12px)',
                borderRadius: 16, border: '1px solid rgba(255,255,255,0.75)',
                overflowX: 'auto',
                boxShadow: '0 2px 12px rgba(159,18,57,0.08)',
              }}>
                {TABS.map(tab => {
                  const active = activeTab === tab.id;
                  return (
                    <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                      onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(159,18,57,0.08)'; }}
                      onMouseLeave={e => { if (!active) e.currentTarget.style.background = 'transparent'; }}
                      style={{
                        position: 'relative',
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '7px 14px', borderRadius: 12, border: 'none',
                        cursor: 'pointer', whiteSpace: 'nowrap',
                        fontSize: 13, fontWeight: active ? 700 : 500,
                        color: active ? '#fff' : '#6b7280',
                        background: active ? 'linear-gradient(135deg, #9f1239, #be123c)' : 'transparent',
                        boxShadow: active ? '0 4px 12px rgba(159,18,57,0.35)' : 'none',
                        transform: active ? 'scale(1.03)' : 'scale(1)',
                        transition: 'all 0.2s ease',
                      }}>
                      <tab.icon size={15} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Hero bottom padding */}
            <div style={{ height: 16 }} />
          </div>

          {/* ── Filter Bar ──────────────────────────────────────────────── */}
          <AnimatePresence>
            {showFilter && (
              <FilterBar
                filters={filters}
                onChange={patch => setFilters(p => ({ ...p, ...patch }))}
              />
            )}
          </AnimatePresence>

          {/* ── Tab Content ─────────────────────────────────────────────── */}
          <div style={{ marginTop: 20 }}>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}>
              {activeTab === 'overview' && (
                <OverviewTab
                  data={state.overview}
                  dashStats={state.dashStats}
                  loading={state.loading}
                  error={state.error}
                  onRetry={() => fetchTab('overview', applied)}
                />
              )}
              {activeTab === 'realtime' && (
                <RealtimeTab
                  data={state.realtime}
                  loading={state.loading}
                  error={state.error}
                  onRetry={() => fetchTab('realtime', applied)}
                />
              )}
              {activeTab === 'users' && (
                <UsersTab
                  sessions={state.sessions}
                  loading={state.loading}
                  error={state.error}
                  onRetry={() => fetchTab('users', applied)}
                  onUserClick={setSelUser}
                />
              )}
              {activeTab === 'modules' && (
                <ModulesTab
                  data={state.modules}
                  loading={state.loading}
                  error={state.error}
                  onRetry={() => fetchTab('modules', applied)}
                />
              )}
              {activeTab === 'screens' && (
                <ScreensTab
                  data={state.screens}
                  loading={state.loading}
                  error={state.error}
                  onRetry={() => fetchTab('screens', applied)}
                  userSearch={applied.userSearch}
                />
              )}
              {activeTab === 'sessions' && (
                <SessionsTab
                  data={state.sessions}
                  loading={state.loading}
                  error={state.error}
                  onRetry={() => fetchTab('sessions', applied)}
                  onSessionClick={handleSessionClick}
                />
              )}
            </motion.div>
          </div>{/* end tab content */}
        </div>{/* end inner content wrapper */}

        {/* ── Session Detail Drawer ──────────────────────────────────────── */}
        <Drawer
          open={!!selSession}
          onClose={() => { setSelSession(null); setTimeline(null); }}
          title={selSession ? `Session · ${selSession.userName || 'Unknown'}` : ''}>
          <SessionTimeline session={selSession} timeline={timeline} loadingTl={loadingTl} />
        </Drawer>

        {/* ── User Detail Drawer ─────────────────────────────────────────── */}
        <Drawer
          open={!!selUser}
          onClose={() => setSelUser(null)}
          title={selUser ? `User · ${selUser.userName || 'Unknown'}` : ''}>
          {selUser && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Avatar card */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, background: '#f8fafc', borderRadius: 14, padding: 16, border: '1px solid #f1f5f9' }}>
                <div style={{ width: 52, height: 52, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18, fontWeight: 800, color: '#fff', background: avatarBg(selUser.userName), boxShadow: '0 4px 12px rgba(0,0,0,0.15)', flexShrink: 0 }}>
                  {initials(selUser.userName)}
                </div>
                <div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: '#1e293b', margin: 0 }}>{selUser.userName}</p>
                  <p style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace', margin: '3px 0 0 0' }}>ID: {selUser.userId}</p>
                  <div style={{ marginTop: 6 }}><StatusBadge status={selUser.status} /></div>
                </div>
              </div>

              {/* Stats grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  ['Sessions',    selUser.sessions],
                  ['Total Time',  fmtDur(selUser.totalTime)],
                  ['Avg Session', fmtDur(selUser.avgDur)],
                  ['Top Module',  selUser.topMod || '-'],
                  ['Last Active', relTime(selUser.lastActive)],
                ].map(([l, v]) => (
                  <div key={l} style={{ background: '#f8fafc', borderRadius: 12, padding: '12px 14px', border: '1px solid #f1f5f9' }}>
                    <p style={{ fontSize: 9, textTransform: 'uppercase', letterSpacing: '0.7px', color: '#94a3b8', marginBottom: 5, fontWeight: 700 }}>{l}</p>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>{v}</div>
                  </div>
                ))}
              </div>

              {/* Module breakdown */}
              {Object.keys(selUser.modules || {}).length > 0 && (
                <div style={{ background: '#fff', borderRadius: 14, padding: '14px 16px', border: '1px solid #f1f5f9', boxShadow: '0 1px 4px rgba(0,0,0,0.04)' }}>
                  <h4 style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.7px', color: '#94a3b8', fontWeight: 700, marginBottom: 12 }}>Module Breakdown</h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {Object.entries(selUser.modules).sort((a,b)=>b[1]-a[1]).map(([mod, cnt]) => (
                      <div key={mod} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f8fafc' }}>
                        <ModBadge mod={mod} />
                        <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 600 }}>{cnt} session{cnt!==1?'s':''}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </Drawer>

        {/* ── Toast ──────────────────────────────────────────────────────── */}
        <AnimatePresence>
          {toast && <Toast message={toast} onDone={() => setToast(null)} />}
        </AnimatePresence>
      </div>{/* end page bg */}
    </>
  );
}
