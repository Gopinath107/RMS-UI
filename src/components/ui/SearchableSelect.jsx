import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Search, ChevronDown, Check, X } from 'lucide-react';

export function SearchableSelect({
  value = 'ALL',
  onChange,
  options = [],
  allLabel = 'All',
  searchPlaceholder = 'Search...',
  minWidth = '150px',
  maxWidth = '220px',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  const normalizedOptions = useMemo(() => {
    return options.map((opt) =>
      typeof opt === 'object' && opt !== null
        ? { value: String(opt.value), label: String(opt.label) }
        : { value: String(opt), label: String(opt) }
    );
  }, [options]);

  const selectedLabel = useMemo(() => {
    if (value === 'ALL' || value === '' || value == null) return allLabel;
    const found = normalizedOptions.find((o) => o.value === String(value));
    return found ? found.label : String(value);
  }, [value, allLabel, normalizedOptions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return normalizedOptions;
    return normalizedOptions.filter((o) => o.label.toLowerCase().includes(q));
  }, [normalizedOptions, query]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const handleEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [open]);

  const isFiltered = value !== 'ALL' && value !== '' && value != null;

  return (
    <div ref={containerRef} style={{ position: 'relative', display: 'inline-block', minWidth, maxWidth }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        style={{
          height: '36px',
          width: '100%',
          padding: '0 10px 0 12px',
          borderRadius: '10px',
          border: isFiltered ? '1.5px solid #2563eb' : '1.5px solid #e2e8f0',
          background: isFiltered ? '#eff6ff' : '#ffffff',
          color: isFiltered ? '#1d4ed8' : '#334155',
          fontSize: '12px',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          cursor: 'pointer',
          boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          whiteSpace: 'nowrap',
        }}
        title={selectedLabel}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedLabel}
        </span>
        <ChevronDown
          className="w-3.5 h-3.5"
          style={{
            flexShrink: 0,
            color: isFiltered ? '#2563eb' : '#64748b',
            transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s ease',
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            left: 0,
            minWidth: '220px',
            maxWidth: '280px',
            background: '#ffffff',
            border: '1.5px solid #e2e8f0',
            borderRadius: '12px',
            boxShadow: '0 12px 28px rgba(15, 23, 42, 0.14)',
            zIndex: 60,
            overflow: 'hidden',
          }}
        >
          {/* Search Input inside dropdown */}
          <div
            style={{
              padding: '8px',
              borderBottom: '1px solid #f1f5f9',
              background: '#f8fafc',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            <Search className="w-3.5 h-3.5" style={{ color: '#94a3b8', flexShrink: 0 }} />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={searchPlaceholder}
              style={{
                width: '100%',
                border: 'none',
                outline: 'none',
                background: 'transparent',
                fontSize: '12px',
                color: '#0f172a',
              }}
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                style={{ border: 'none', background: 'transparent', cursor: 'pointer', color: '#94a3b8', padding: 0 }}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Options List */}
          <div style={{ maxHeight: '220px', overflowY: 'auto', padding: '4px' }}>
            <button
              type="button"
              onClick={() => {
                onChange('ALL');
                setOpen(false);
              }}
              style={{
                width: '100%',
                textAlign: 'left',
                padding: '7px 10px',
                borderRadius: '8px',
                fontSize: '12px',
                fontWeight: value === 'ALL' ? 700 : 500,
                background: value === 'ALL' ? '#eff6ff' : 'transparent',
                color: value === 'ALL' ? '#1d4ed8' : '#334155',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '8px',
              }}
            >
              <span>{allLabel}</span>
              {value === 'ALL' && <Check className="w-3.5 h-3.5" style={{ color: '#2563eb', flexShrink: 0 }} />}
            </button>

            {filtered.length === 0 ? (
              <div style={{ padding: '12px 10px', textAlign: 'center', fontSize: '11.5px', color: '#94a3b8' }}>
                No matches found
              </div>
            ) : (
              filtered.map((opt) => {
                const isSelected = String(value) === opt.value;
                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                    }}
                    style={{
                      width: '100%',
                      textAlign: 'left',
                      padding: '7px 10px',
                      borderRadius: '8px',
                      fontSize: '12px',
                      fontWeight: isSelected ? 700 : 500,
                      background: isSelected ? '#eff6ff' : 'transparent',
                      color: isSelected ? '#1d4ed8' : '#334155',
                      border: 'none',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '8px',
                    }}
                  >
                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {opt.label}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5" style={{ color: '#2563eb', flexShrink: 0 }} />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
