// src/components/common/ConfirmDialog.jsx
// Reusable confirmation dialog — replaces Swal.fire confirm prompts.
import React from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';
import { Button } from '../ui/button';

/**
 * @param {boolean} open
 * @param {function} onOpenChange
 * @param {string} title
 * @param {string} description
 * @param {string} confirmLabel
 * @param {string} cancelLabel
 * @param {'danger' | 'warning' | 'info'} variant
 * @param {function} onConfirm - async/sync called when user clicks confirm
 * @param {boolean} loading
 */
export default function ConfirmDialog({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  loading = false,
}) {
  const variantMap = {
    danger:  { icon: '⚠️', btnClass: 'bg-red-600 hover:bg-red-700 text-white',    iconBg: 'bg-red-100 text-red-600' },
    warning: { icon: '⚠️', btnClass: 'bg-orange-500 hover:bg-orange-600 text-white', iconBg: 'bg-orange-100 text-orange-600' },
    info:    { icon: 'ℹ️', btnClass: 'bg-blue-600 hover:bg-blue-700 text-white',    iconBg: 'bg-blue-100 text-blue-600' },
  };
  const v = variantMap[variant] ?? variantMap.danger;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[380px]">
        <DialogHeader>
          <div className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2 ${v.iconBg}`}>
            <span className="text-xl">{v.icon}</span>
          </div>
          <DialogTitle className="text-center">{title}</DialogTitle>
          <DialogDescription className="text-center">{description}</DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading} className="flex-1">
            {cancelLabel}
          </Button>
          <Button
            onClick={async () => { await onConfirm?.(); onOpenChange(false); }}
            disabled={loading}
            className={`flex-1 ${v.btnClass}`}
          >
            {loading ? 'Processing…' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
