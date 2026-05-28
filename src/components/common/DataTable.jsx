// src/components/common/DataTable.jsx
// Generic, reusable data table with built-in pagination.
import React from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';

/**
 * @param {Array<{key: string, label: string, render?: (row, idx) => ReactNode, className?: string, headerClassName?: string}>} columns
 * @param {Array<object>} data - the full data array
 * @param {function} rowKey - (row) => string|number, unique key for each row
 * @param {ReactNode} emptyState - optional node to show when data is empty
 * @param {boolean} paginate - enable/disable pagination (default true)
 * @param {number} page - 1-indexed current page
 * @param {number} pageSize - rows per page
 * @param {number} totalRows - total count (for display)
 * @param {function} onPageChange - (page) => void
 * @param {function} onPageSizeChange - (size) => void
 * @param {Array<number>} pageSizeOptions
 */
export default function DataTable({
  columns,
  data,
  rowKey = (row, i) => i,
  emptyState,
  paginate = true,
  page = 1,
  pageSize = 10,
  totalRows,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [5, 10, 25, 50],
}) {
  const total = totalRows ?? data.length;
  const totalPages = Math.ceil(total / pageSize) || 1;
  const startIndex = (page - 1) * pageSize + 1;
  const endIndex = Math.min(page * pageSize, total);

  return (
    <div>
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-gray-50 hover:bg-gray-50">
              {columns.map(col => (
                <TableHead key={col.key} className={`font-semibold text-gray-700 ${col.headerClassName ?? ''}`}>
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-16 text-center">
                  {emptyState ?? (
                    <p className="text-gray-500 text-sm">No data found.</p>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              data.map((row, i) => (
                <TableRow key={rowKey(row, i)} className="hover:bg-gray-50/70 transition-colors">
                  {columns.map(col => (
                    <TableCell key={col.key} className={col.className ?? ''}>
                      {col.render ? col.render(row, i) : row[col.key]}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {paginate && total > 0 && (
        <div className="flex flex-col sm:flex-row items-center justify-between px-4 py-3 border-t border-gray-100 gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <span>Showing <strong className="text-gray-700">{startIndex}–{endIndex}</strong> of <strong className="text-gray-700">{total}</strong></span>
            {onPageSizeChange && (
              <Select value={pageSize.toString()} onValueChange={v => onPageSizeChange(Number(v))}>
                <SelectTrigger className="h-8 w-[70px] rounded-lg text-xs"><SelectValue /></SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map(s => <SelectItem key={s} value={s.toString()}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            )}
            {onPageSizeChange && <span className="text-xs text-gray-400">per page</span>}
          </div>
          {onPageChange && (
            <div className="flex items-center gap-2">
              <button onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page === 1} className="px-3 h-8 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">← Previous</button>
              <div className="flex items-center justify-center text-sm font-medium text-gray-600 px-3 h-8 rounded-lg border border-gray-200 bg-gray-50 min-w-[110px]">Page {page} of {totalPages}</div>
              <button onClick={() => onPageChange(Math.min(totalPages, page + 1))} disabled={page === totalPages} className="px-3 h-8 rounded-lg border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors">Next →</button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
