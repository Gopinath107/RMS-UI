// src/components/common/FilterBar.jsx
// Generic search + select filters + active chip display.
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, X, RotateCcw, Filter } from 'lucide-react';

/**
 * @param {string} searchValue
 * @param {function} onSearchChange
 * @param {string} searchPlaceholder
 * @param {Array<{ key: string, label: string, value: string, onChange: fn, options: Array<{value,label}>, defaultLabel: string }>} selects
 * @param {function} onClearAll
 */
export default function FilterBar({
  searchValue = '',
  onSearchChange,
  searchPlaceholder = 'Search…',
  selects = [],
  onClearAll,
  resultCount,
}) {
  const hasAnyFilter = searchValue || selects.some(s => s.value !== 'all' && s.value !== '');

  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-[2] min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchValue}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full h-10 pl-9 pr-9 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100 transition-all"
          />
          {searchValue && (
            <button type="button" onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Dynamic selects */}
        {selects.map(s => (
          <div key={s.key} className="flex-1 min-w-[140px]">
            <Select value={s.value} onValueChange={s.onChange}>
              <SelectTrigger className="h-10 rounded-xl bg-gray-50 border-gray-200 text-sm"><SelectValue placeholder={s.defaultLabel} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{s.defaultLabel}</SelectItem>
                {s.options.map(o => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        ))}

        {hasAnyFilter && (
          <button type="button" onClick={onClearAll} className="flex-shrink-0 flex items-center gap-1.5 px-4 h-10 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-sm font-medium transition-colors whitespace-nowrap">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        )}
      </div>

      {/* Active chips */}
      {hasAnyFilter && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1 uppercase tracking-wide"><Filter className="w-3 h-3" /> Filters</span>

          {searchValue && (
            <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
              &ldquo;{searchValue}&rdquo;
              <button onClick={() => onSearchChange('')} className="hover:text-red-500 ml-0.5 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          )}

          {selects.filter(s => s.value !== 'all' && s.value !== '').map(s => (
            <span key={s.key} className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
              {s.label}: <strong>{s.value}</strong>
              <button onClick={() => s.onChange('all')} className="hover:text-red-500 ml-0.5 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          ))}

          {resultCount !== undefined && (
            <span className="ml-auto text-xs text-gray-400 font-medium">
              {resultCount === 0 ? 'No results' : `${resultCount} result${resultCount !== 1 ? 's' : ''}`}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
