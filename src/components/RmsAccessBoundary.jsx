import { useEffect, useState } from 'react';
import api from '../services/api';
import { RmsAccessContext } from '../utils/portalAccess';

export default function RmsAccessBoundary({ children, onLogout }) {
  const [access, setAccess] = useState(null);
  const [error, setError] = useState('');
  const [version, setVersion] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    let pending = false;
    const verify = async () => {
      if (pending || document.hidden) return;
      pending = true;
      try {
        const response = await api.get('/portal/access', { signal: controller.signal });
        if (controller.signal.aborted) return;
        if (response.status >= 400 || !response.data?.success) {
          setAccess(null);
          setError(response.data?.message || 'Your RMS access has not been granted in RIS Portal.');
        } else {
          setAccess(response.data.result);
          setError('');
        }
      } catch {
        if (!controller.signal.aborted) {
          setAccess(null);
          setError('Unable to verify RMS access. Please retry.');
        }
      } finally { pending = false; }
    };
    void verify();
    const timer = window.setInterval(() => { void verify(); }, 15000);
    const visible = () => { if (!document.hidden) void verify(); };
    document.addEventListener('visibilitychange', visible);
    return () => { controller.abort(); clearInterval(timer); document.removeEventListener('visibilitychange', visible); };
  }, [version]);
  if (!access) return <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
    <section className="max-w-lg rounded-xl border bg-white p-6 shadow-sm">
      <h1 className="text-xl font-semibold">{error ? 'RMS access unavailable' : 'Checking RMS access…'}</h1>
      {error && <><p role="alert" className="my-4">{error}</p><div className="flex gap-4"><button onClick={() => setVersion((value) => value + 1)}>Retry access</button><button onClick={onLogout}>Sign out</button></div></>}
    </section>
  </main>;
  return <RmsAccessContext.Provider value={access}>{children}</RmsAccessContext.Provider>;
}
