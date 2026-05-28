// src/components/common/AutocompleteInput.jsx
// Generic typeahead/autocomplete input component.
// Fully controlled: caller owns value, suggestions, and callbacks.
import React, { useRef } from 'react';

/**
 * @param {string} id
 * @param {string} value - current input text
 * @param {function} onChange - (e) => void
 * @param {function} onBlur - optional
 * @param {function} onFocus - optional
 * @param {Array<{id: string|number, label: string, sublabel?: string}>} suggestions
 * @param {function} onSelect - (suggestion) => void
 * @param {string|null} createLabel - if set, renders a create option at the bottom
 * @param {function} onCreate - () => void
 * @param {string} placeholder
 * @param {string} error - error message
 * @param {boolean} showDropdown - controlled by parent
 * @param {function} setShowDropdown
 * @param {boolean} isLoading
 */
export default function AutocompleteInput({
  id,
  value,
  onChange,
  onBlur,
  onFocus,
  suggestions = [],
  onSelect,
  createLabel,
  onCreate,
  placeholder = '',
  error,
  showDropdown,
  setShowDropdown,
  isLoading = false,
  inputRef: externalRef,
  autoComplete = 'off',
}) {
  const internalRef = useRef(null);
  const inputRef = externalRef || internalRef;
  const isHoveringRef = useRef(false);

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        id={id}
        type="text"
        value={value}
        onChange={onChange}
        onFocus={() => { setShowDropdown(true); onFocus?.(); }}
        onBlur={() => {
          setTimeout(() => {
            if (!isHoveringRef.current) setShowDropdown(false);
          }, 200);
          onBlur?.();
        }}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
          error ? 'border-red-500' : 'border-input'
        }`}
      />

      {showDropdown && (suggestions.length > 0 || createLabel) && (
        <div
          onMouseEnter={() => { isHoveringRef.current = true; }}
          onMouseLeave={() => { isHoveringRef.current = false; }}
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            width: '100%',
            zIndex: 9999,
            marginTop: '4px',
            maxHeight: '220px',
            overflowY: 'auto',
            background: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
          }}
        >
          {suggestions.map(s => (
            <div
              key={s.id}
              onMouseDown={e => { e.preventDefault(); onSelect(s); setShowDropdown(false); }}
              style={{ padding: '10px 14px', fontSize: '13.5px', cursor: 'pointer' }}
              className="hover:bg-violet-50 text-gray-900 transition-colors"
            >
              <div>{s.label}</div>
              {s.sublabel && <div style={{ fontSize: '11.5px', color: '#94a3b8', marginTop: '1px' }}>{s.sublabel}</div>}
            </div>
          ))}

          {createLabel && (
            <div
              onMouseDown={e => { e.preventDefault(); onCreate(); setShowDropdown(false); }}
              style={{
                padding: '10px 14px',
                fontSize: '13.5px',
                cursor: 'pointer',
                color: '#6366f1',
                fontWeight: 600,
                borderTop: suggestions.length > 0 ? '1px solid #f0f0f0' : 'none',
              }}
              className="hover:bg-violet-50 transition-colors"
            >
              {createLabel}
            </div>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}
