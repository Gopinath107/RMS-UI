/**
 * useAutoSave.js
 *
 * Provides debounced auto-save functionality for the Add/Edit Resource form.
 *
 * Behaviour:
 * - Marks status as "unsaved" immediately when data changes.
 * - After DEBOUNCE_MS of inactivity, calls `onAutoSave(payload)`.
 * - Create flow: stores draftId in sessionStorage so refreshes don't create duplicates.
 * - Edit flow: always calls update via existingId.
 * - Validation errors are NEVER surfaced during auto-save – only during manual submit.
 */

import { useState, useEffect, useRef, useCallback } from 'react';

const DEBOUNCE_MS = 2500; // 2.5 s after last change

/**
 * @param {object} options
 * @param {object}   options.formData          Current form data snapshot
 * @param {Array}    options.socialLinks        Current social links
 * @param {Array}    options.selectedSkills     Current selected skills
 * @param {string}   options.resourceType       'internal' | 'external'
 * @param {boolean}  options.isEditMode         True when editing an existing record
 * @param {number|string|null} options.existingId  Employee/Candidate ID when in edit mode
 * @param {string}   options.draftStorageKey    sessionStorage key for draftId
 * @param {boolean}  options.isFormVisible      Only auto-save when the form step is shown
 * @param {function} options.onAutoSave         async (draftId | null) => { id: number } | null
 *                   Callback receives current draftId (null if first save),
 *                   should return { id } on success or throw on failure.
 * @returns {{ autoSaveStatus: string, draftResourceId: number|null, clearDraftId: function }}
 */
export function useAutoSave({
  formData,
  socialLinks,
  selectedSkills,
  resourceType,
  isEditMode,
  existingId,
  draftStorageKey,
  isFormVisible,
  onAutoSave,
}) {
  // 'idle' | 'unsaved' | 'saving' | 'saved' | 'failed'
  const [autoSaveStatus, setAutoSaveStatus] = useState('idle');

  // Track the created draft id so we PUT rather than POST on subsequent saves
  const draftIdRef = useRef(null);

  // Initialise draftId from sessionStorage (survives hot-reload / soft refresh)
  useEffect(() => {
    if (isEditMode) {
      draftIdRef.current = existingId ?? null;
      return;
    }
    try {
      const stored = sessionStorage.getItem(`${draftStorageKey}_autoSaveId`);
      if (stored) draftIdRef.current = Number(stored);
    } catch (_) { /* ignore */ }
  }, [isEditMode, existingId, draftStorageKey]);

  const clearDraftId = useCallback(() => {
    draftIdRef.current = null;
    try {
      sessionStorage.removeItem(`${draftStorageKey}_autoSaveId`);
    } catch (_) { /* ignore */ }
  }, [draftStorageKey]);

  // Debounce timer ref
  const timerRef = useRef(null);

  // True once at least one real user change has happened (prevents saving on mount)
  const hasChangedRef = useRef(false);

  // Track whether an auto-save is already running
  const isSavingRef = useRef(false);

  // Mark unsaved on every data change
  useEffect(() => {
    if (!isFormVisible) return;

    // Skip the very first render
    if (!hasChangedRef.current) {
      hasChangedRef.current = true;
      return;
    }

    setAutoSaveStatus('unsaved');

    // Clear any pending debounce
    if (timerRef.current) clearTimeout(timerRef.current);

    // Minimum viable check: don't send empty payloads
    const hasMinimumData = Boolean(formData?.firstName?.trim());
    if (!hasMinimumData) return;

    timerRef.current = setTimeout(async () => {
      if (isSavingRef.current) return;
      isSavingRef.current = true;
      setAutoSaveStatus('saving');

      try {
        const result = await onAutoSave(draftIdRef.current);
        if (result?.id) {
          // Persist draft ID for subsequent saves
          if (!isEditMode) {
            draftIdRef.current = result.id;
            try {
              sessionStorage.setItem(`${draftStorageKey}_autoSaveId`, String(result.id));
            } catch (_) { /* ignore */ }
          }
        }
        setAutoSaveStatus('saved');
        // Reset to idle after 3 s so the badge fades
        setTimeout(() => setAutoSaveStatus('idle'), 3000);
      } catch (err) {
        console.warn('[AutoSave] Failed:', err);
        setAutoSaveStatus('failed');
      } finally {
        isSavingRef.current = false;
      }
    }, DEBOUNCE_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [formData, socialLinks, selectedSkills, isFormVisible]);

  return {
    autoSaveStatus,
    draftResourceId: draftIdRef.current,
    clearDraftId,
  };
}
