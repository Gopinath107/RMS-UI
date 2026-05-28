// src/components/user-management/UserFilters.jsx
import React from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Search, X, RotateCcw, Filter } from 'lucide-react';

export default function UserFilters({
  searchTerm, onSearchChange,
  filterRole, onFilterRoleChange,
  filterStatus, onFilterStatusChange,
  roles, filteredCount,
}) {
  const hasFilters = searchTerm || filterRole !== 'all' || filterStatus !== 'all';
  const clearAll = () => { onSearchChange(''); onFilterRoleChange('all'); onFilterStatusChange('all'); };

  return (
    <div className="bg-white rounded-2xl border border-gray-100 px-5 py-4" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div className="flex flex-col sm:flex-row gap-3">
        {/* Search */}
        <div className="relative flex-[2] min-w-0">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4 pointer-events-none" />
          <input
            type="text"
            placeholder="Search name, email, username, role, company…"
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
            className="w-full h-10 pl-9 pr-9 text-sm rounded-xl border border-gray-200 bg-gray-50 text-gray-800 placeholder-gray-400 focus:outline-none focus:border-red-400 focus:bg-white focus:ring-2 focus:ring-red-100 transition-all"
          />
          {searchTerm && (
            <button type="button" onClick={() => onSearchChange('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Role filter */}
        <div className="flex-1 min-w-[160px]">
          <Select value={filterRole} onValueChange={onFilterRoleChange}>
            <SelectTrigger className="h-10 rounded-xl bg-gray-50 border-gray-200 text-sm"><SelectValue placeholder="All Roles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {[...new Map(roles.map(r => [r.roleName, r])).values()].map(role => (
                <SelectItem key={role.roleId} value={role.roleName}>{role.roleName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Status filter */}
        <div className="flex-1 min-w-[130px]">
          <Select value={filterStatus} onValueChange={onFilterStatusChange}>
            <SelectTrigger className="h-10 rounded-xl bg-gray-50 border-gray-200 text-sm"><SelectValue placeholder="All Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {hasFilters && (
          <button type="button" onClick={clearAll} className="flex-shrink-0 flex items-center gap-1.5 px-4 h-10 rounded-xl border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-sm font-medium transition-colors whitespace-nowrap">
            <RotateCcw className="w-3.5 h-3.5" /> Reset
          </button>
        )}
      </div>

      {/* Active filter chips */}
      {hasFilters && (
        <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <span className="text-[11px] text-gray-400 font-medium flex items-center gap-1 uppercase tracking-wide"><Filter className="w-3 h-3" /> Filters</span>
          {searchTerm && (
            <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-xs font-medium border border-slate-200">
              &ldquo;{searchTerm}&rdquo;
              <button onClick={() => onSearchChange('')} className="hover:text-red-500 ml-0.5 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filterRole !== 'all' && (
            <span className="inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-200">
              Role: <strong>{filterRole}</strong>
              <button onClick={() => onFilterRoleChange('all')} className="hover:text-red-500 ml-0.5 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          )}
          {filterStatus !== 'all' && (
            <span className={`inline-flex items-center gap-1 pl-2.5 pr-1.5 py-0.5 rounded-full text-xs font-medium border ${ filterStatus === 'Active' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-gray-100 text-gray-600 border-gray-200' }`}>
              {filterStatus}
              <button onClick={() => onFilterStatusChange('all')} className="hover:text-red-500 ml-0.5 transition-colors"><X className="w-3 h-3" /></button>
            </span>
          )}
          <span className="ml-auto text-xs text-gray-400 font-medium">
            {filteredCount === 0 ? 'No results' : `${filteredCount} user${filteredCount !== 1 ? 's' : ''} found`}
          </span>
        </div>
      )}
    </div>
  );
}
