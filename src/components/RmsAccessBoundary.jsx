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
      if (pending) return;
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
      } finally {
        pending = false;
      }
    };

    void verify();
    return () => {
      controller.abort();
    };
  }, [version]);

  if (!access) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <section className="max-w-md w-full rounded-2xl border border-slate-200 bg-white p-8 shadow-sm text-center">
          <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z"></path>
            </svg>
          </div>
          <h1 className="text-lg font-semibold text-slate-800">
            {error ? 'RMS Access Verification' : 'Verifying RMS Access…'}
          </h1>
          {error && (
            <>
              <p role="alert" className="my-3 text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-100">
                {error}
              </p>
              <div className="flex gap-3 justify-center mt-5">
                <button
                  type="button"
                  onClick={() => setVersion((value) => value + 1)}
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                >
                  Retry Access
                </button>
                <button
                  type="button"
                  onClick={onLogout}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </section>
      </main>
    );
  }

  return <RmsAccessContext.Provider value={access}>{children}</RmsAccessContext.Provider>;
}
