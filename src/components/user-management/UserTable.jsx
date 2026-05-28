// src/components/user-management/UserTable.jsx
import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Edit, Trash2, Users, RotateCcw } from 'lucide-react';
import { getRoleCode, getRoleBadgeColor } from '../../utils/userMapper';

export default function UserTable({
  paginatedUsers, filteredUsers,
  totalUsers, totalPages, safeCurrentPage, startIndex, rowsPerPage,
  setRowsPerPage, setCurrentPage,
  searchTerm, filterRole, filterStatus,
  onEdit, onToggleStatus, onDelete,
}) {
  return (
    <Card className="rounded-2xl border border-gray-100" style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <CardHeader className="pb-3 border-b border-gray-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-50 flex items-center justify-center">
              <Users className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <CardTitle className="text-base font-semibold text-gray-900">
                Users
                <span className="ml-2 inline-flex items-center justify-center px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-bold">{filteredUsers.length}</span>
              </CardTitle>
              <CardDescription className="text-xs mt-0.5">Manage user accounts and their access permissions</CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 hover:bg-gray-50">
                <TableHead className="font-semibold text-gray-700 pl-5">Name</TableHead>
                <TableHead className="font-semibold text-gray-700">Email</TableHead>
                <TableHead className="font-semibold text-gray-700">Role(s)</TableHead>
                <TableHead className="font-semibold text-gray-700">Company</TableHead>
                <TableHead className="font-semibold text-gray-700">Status</TableHead>
                <TableHead className="font-semibold text-gray-700">Last Login</TableHead>
                <TableHead className="font-semibold text-gray-700 text-right pr-5">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedUsers.length > 0 ? (
                paginatedUsers.map(user => (
                  <TableRow key={user.id} className="hover:bg-gray-50/70 transition-colors group">
                    <TableCell className="pl-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-400 to-red-600 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {(user.name || '?').charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium text-gray-900 text-sm truncate">{user.name}</div>
                          <div className="text-xs text-gray-400 truncate">@{user.username}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-[200px]">
                      <span className="truncate block" title={user.email}>{user.email}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1 max-w-[200px]">
                        {user.roles.map((role, idx) => (
                          <span key={`${user.id}-${role.roleId}-${idx}`} className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ${getRoleBadgeColor(getRoleCode(role.roleName))}`} title={role.roleName}>
                            {role.roleName}
                          </span>
                        ))}
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600">
                      <span className="truncate block max-w-[140px]" title={user.companyName}>{user.companyName || '—'}</span>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${ user.status === 'Active' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-gray-100 text-gray-500 border border-gray-200' }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${ user.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-400' }`} />
                        {user.status}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-gray-400">{user.lastLogin === 'N/A' ? '—' : user.lastLogin}</TableCell>
                    <TableCell className="text-right pr-5">
                      <div className="flex items-center justify-end gap-1.5">
                        <button title="Edit user" onClick={() => onEdit(user)} className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-blue-50 hover:border-blue-300 flex items-center justify-center text-gray-500 hover:text-blue-600 transition-all">
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button title={user.status === 'Active' ? 'Deactivate user' : 'Activate user'} onClick={() => onToggleStatus(user.id)} className={`w-8 h-8 rounded-lg border flex items-center justify-center transition-all text-xs font-bold ${ user.status === 'Active' ? 'border-orange-200 bg-white hover:bg-orange-50 text-orange-500 hover:text-orange-700 hover:border-orange-300' : 'border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-500 hover:text-emerald-700 hover:border-emerald-300' }`}>
                          {user.status === 'Active' ? '✕' : '✓'}
                        </button>
                        <button title="Delete user" onClick={() => onDelete(user.id)} className="w-8 h-8 rounded-lg border border-gray-200 bg-white hover:bg-red-50 hover:border-red-300 flex items-center justify-center text-gray-500 hover:text-red-600 transition-all">
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center">
                        <Users className="w-7 h-7 text-gray-300" />
                      </div>
                      <div>
                        <p className="text-base font-semibold text-gray-700">No users found</p>
                        <p className="text-sm text-gray-400 mt-1">Try changing your search keyword or clearing filters.</p>
                      </div>
                      {(searchTerm || filterRole !== 'all' || filterStatus !== 'all') && (
                        <button
                          type="button"
                          onClick={() => { /* handled by parent via onSearchChange etc */ }}
                          className="mt-1 flex items-center gap-1.5 px-4 py-2 rounded-lg border border-red-200 text-red-600 bg-red-50 hover:bg-red-100 text-sm font-medium transition-colors"
                        >
                          <RotateCcw className="w-3.5 h-3.5" /> Clear Filters
                        </button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalUsers > 0 && (
          <div className="flex flex-col sm:flex-row items-center justify-between px-5 py-3 border-t border-gray-100">
            <div className="flex items-center gap-2 text-sm text-gray-500 mb-3 sm:mb-0">
              <span>Showing <strong className="text-gray-700">{startIndex + 1}–{Math.min(startIndex + rowsPerPage, totalUsers)}</strong> of <strong className="text-gray-700">{totalUsers}</strong> user{totalUsers !== 1 ? 's' : ''}</span>
              <Select value={rowsPerPage.toString()} onValueChange={val => { setRowsPerPage(Number(val)); setCurrentPage(1); }}>
                <SelectTrigger className="h-8 w-[70px] rounded-lg text-xs"><SelectValue /></SelectTrigger>
                <SelectContent side="top">
                  {[5, 10, 25, 50].map(size => <SelectItem key={size} value={size.toString()}>{size}</SelectItem>)}
                </SelectContent>
              </Select>
              <span className="text-xs text-gray-400">per page</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={safeCurrentPage === 1} className="px-3 h-8 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">← Previous</button>
              <div className="flex items-center justify-center text-sm font-medium text-gray-600 px-3 h-8 rounded-lg border border-gray-200 bg-gray-50 min-w-[110px]">Page {safeCurrentPage} of {totalPages}</div>
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={safeCurrentPage === totalPages} className="px-3 h-8 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next →</button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
