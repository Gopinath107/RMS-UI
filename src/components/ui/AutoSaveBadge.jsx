/**
 * AutoSaveBadge.jsx
 *
 * Small inline badge that reflects the current auto-save status.
 * Renders nothing when status is 'idle'.
 */

import React from 'react';
import { CheckCircle2, CloudUpload, AlertCircle, Clock } from 'lucide-react';

const CONFIG = {
  unsaved: {
    icon: <Clock className="h-3.5 w-3.5" />,
    label: 'Unsaved changes',
    className: 'text-amber-600 bg-amber-50 border-amber-200',
  },
  saving: {
    icon: <CloudUpload className="h-3.5 w-3.5 animate-bounce" />,
    label: 'Saving…',
    className: 'text-blue-600 bg-blue-50 border-blue-200',
  },
  saved: {
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    label: 'Saved automatically',
    className: 'text-emerald-600 bg-emerald-50 border-emerald-200',
  },
  failed: {
    icon: <AlertCircle className="h-3.5 w-3.5" />,
    label: 'Auto save failed',
    className: 'text-red-600 bg-red-50 border-red-200',
  },
};

/**
 * @param {{ status: 'idle'|'unsaved'|'saving'|'saved'|'failed' }} props
 */
export function AutoSaveBadge({ status }) {
  if (!status || status === 'idle') return null;

  const cfg = CONFIG[status];
  if (!cfg) return null;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full border shadow-2xs transition-all duration-300 ${cfg.className}`}
      role="status"
      aria-live="polite"
    >
      {cfg.icon}
      <span>{cfg.label}</span>
    </span>
  );
}
