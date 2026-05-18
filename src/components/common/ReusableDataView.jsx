import React, { useEffect, useMemo, useState } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpDown,
  Columns3,
  GripVertical,
  LayoutGrid,
  List,
  RotateCcw,
} from "lucide-react";

import { Button } from "../ui/button.jsx";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table.jsx";
import {
  buildDefaultPreferences,
  isForcedVisibleColumn,
  readDataViewPreferences,
  sanitizeDataViewPreferences,
  writeDataViewPreferences,
} from "./dataViewPreferences.js";
import { useDataViewControls } from "./useDataViewControls.js";

const VIEW_MODES = { table: "table", card: "card" };

// ─── Sort helpers ─────────────────────────────────────────────────────────────
function getSortDirection(s) {
  return s?.direction || s?.order || s?.sortOrder || null;
}
function getSortKey(s) {
  return s?.key || s?.field || s?.sortField || null;
}
function renderSortIcon(column, sortState) {
  if (!column.sortable) return null;
  const active = getSortKey(sortState);
  const dir = getSortDirection(sortState);
  const key = column.sortKey || column.key;
  if (active !== key) return <ArrowUpDown className="h-3.5 w-3.5 opacity-50 shrink-0" />;
  return dir === "desc"
    ? <ArrowDown className="h-3.5 w-3.5 text-blue-600 shrink-0" />
    : <ArrowUp className="h-3.5 w-3.5 text-blue-600 shrink-0" />;
}

// ─── Sortable table header — NO drag dot icon ─────────────────────────────────
function SortableColumnHeader({ column, sortState, onSort, headerClassName }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id: column.key });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    cursor: isDragging ? "grabbing" : "grab",
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={[
        "select-none bg-inherit whitespace-nowrap",
        column.headerClassName,
        headerClassName,
        isDragging ? "opacity-70 shadow-lg" : "",
      ].filter(Boolean).join(" ")}
      {...attributes}
      {...listeners}
    >
      {/* Separate click target for sorting so it doesn't conflict with drag */}
      <div
        className={[
          "flex items-center gap-1.5",
          column.sortable ? "cursor-pointer hover:text-blue-700" : "",
        ].join(" ")}
        onClick={() => column.sortable && onSort?.(column.sortKey || column.key)}
      >
        <span className="truncate font-bold">{column.label}</span>
        {renderSortIcon(column, sortState)}
      </div>
    </TableHead>
  );
}

// ─── Customize Columns Modal — sortable column rows ───────────────────────────
function SortableModalRow({ id, column, checked, forced, onToggle }) {
  const {
    attributes, listeners, setNodeRef, transform, transition, isDragging,
  } = useSortable({ id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.6 : 1,
      }}
      className="flex items-center gap-3 rounded-md px-2 py-2 hover:bg-gray-50"
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={forced}
        className="h-4 w-4 shrink-0 accent-blue-600 cursor-pointer"
        onChange={() => onToggle(column.key)}
        onClick={(e) => e.stopPropagation()}
      />
      <span className={`min-w-0 flex-1 truncate text-sm ${forced ? "text-gray-400" : "text-gray-800"}`}>
        {column.label}
      </span>
      {forced
        ? <span className="shrink-0 text-xs text-gray-400">fixed</span>
        : (
          <button
            type="button"
            className="shrink-0 cursor-grab touch-none text-gray-400 hover:text-gray-600 active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
    </div>
  );
}

function CustomizeColumnsModal({ open, onClose, columns, preferences, onApply, onReset }) {
  const [draftOrder, setDraftOrder] = useState([]);
  const [draftVisible, setDraftVisible] = useState(new Set());

  useEffect(() => {
    if (open) {
      setDraftOrder([...preferences.columnOrder]);
      setDraftVisible(new Set(preferences.visibleColumnKeys));
    }
  }, [open, preferences]);

  const modalSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const columnMap = useMemo(() => new Map(columns.map((c) => [c.key, c])), [columns]);
  const orderedDraft = draftOrder.map((k) => columnMap.get(k)).filter(Boolean);

  const handleModalDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setDraftOrder((cur) => {
      const oi = cur.indexOf(active.id);
      const ni = cur.indexOf(over.id);
      return oi === -1 || ni === -1 ? cur : arrayMove(cur, oi, ni);
    });
  };

  const handleToggle = (key) => {
    const col = columnMap.get(key);
    if (!col || isForcedVisibleColumn(col)) return;
    setDraftVisible((cur) => {
      const next = new Set(cur);
      if (next.has(key)) {
        const remaining = [...next].filter((k) => {
          const c = columnMap.get(k);
          return c && c.type !== "actions" && k !== key;
        });
        if (remaining.length === 0) return cur;
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-sm rounded-xl p-0 shadow-2xl gap-0" aria-describedby={undefined}>
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-gray-100">
          <DialogTitle className="text-base font-semibold text-gray-900">Customize Columns</DialogTitle>
          <p className="text-xs text-gray-500 mt-0.5">Choose visible columns and drag to reorder</p>
        </DialogHeader>

        <DndContext sensors={modalSensors} collisionDetection={closestCenter} onDragEnd={handleModalDragEnd}>
          <SortableContext items={draftOrder} strategy={verticalListSortingStrategy}>
            <div className="max-h-64 overflow-y-auto px-3 py-2">
              {orderedDraft.map((col) => (
                <SortableModalRow
                  key={col.key}
                  id={col.key}
                  column={col}
                  checked={draftVisible.has(col.key)}
                  forced={isForcedVisibleColumn(col)}
                  onToggle={handleToggle}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        <DialogFooter className="px-5 py-3 border-t border-gray-100 flex items-center justify-between gap-2 sm:justify-between">
          <Button type="button" variant="ghost" size="sm" onClick={() => { onReset(); onClose(); }} className="text-gray-500 hover:text-gray-700">
            Reset to Default
          </Button>
          <div className="flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
            <Button
              type="button"
              size="sm"
              className="bg-blue-600 hover:bg-blue-700 text-white"
              onClick={() => { onApply([...draftVisible], draftOrder); onClose(); }}
            >
              Apply
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── DataViewToolbar (named export) ──────────────────────────────────────────
/**
 * Embeddable view-controls toolbar. Place this anywhere in your page's filter row.
 * @param {object} controls - returned from useDataViewControls()
 * @param {string} className - optional additional classes
 */
export function DataViewToolbar({ controls, className = "" }) {
  const {
    preferences,
    orderedColumns,
    updateViewMode,
    resetLayout,
    applyColumnChanges,
    customizerOpen,
    setCustomizerOpen,
    columns,
  } = controls;

  const btnBase =
    "inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5 text-xs font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors";

  return (
    <div className={`flex items-center gap-1.5 flex-wrap ${className}`}>
      {/* List / Card toggle */}
      <div className="inline-flex rounded-md border border-gray-200 bg-gray-50 p-0.5 gap-0.5">
        <button
          type="button"
          title="List View"
          onClick={() => updateViewMode(VIEW_MODES.table)}
          className={[
            "inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors",
            preferences.viewMode === VIEW_MODES.table
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100",
          ].join(" ")}
        >
          <List className="h-3.5 w-3.5" />
          <span>List</span>
        </button>
        <button
          type="button"
          title="Card View"
          onClick={() => updateViewMode(VIEW_MODES.card)}
          className={[
            "inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition-colors",
            preferences.viewMode === VIEW_MODES.card
              ? "bg-blue-600 text-white shadow-sm"
              : "text-gray-600 hover:bg-gray-100",
          ].join(" ")}
        >
          <LayoutGrid className="h-3.5 w-3.5" />
          <span>Card</span>
        </button>
      </div>

      {/* Customize Columns */}
      <button type="button" title="Customize Columns" onClick={() => setCustomizerOpen(true)} className={btnBase}>
        <Columns3 className="h-3.5 w-3.5" />
        <span>Columns</span>
      </button>

      {/* Reset Layout */}
      <button type="button" title="Reset Layout" onClick={resetLayout} className={btnBase}>
        <RotateCcw className="h-3.5 w-3.5" />
        <span>Reset</span>
      </button>

      {/* Customize Modal */}
      <CustomizeColumnsModal
        open={customizerOpen}
        onClose={() => setCustomizerOpen(false)}
        columns={columns}
        preferences={preferences}
        onApply={applyColumnChanges}
        onReset={resetLayout}
      />
    </div>
  );
}

// ─── Pagination ───────────────────────────────────────────────────────────────
function DataViewPagination({ pagination }) {
  if (!pagination) return null;
  const {
    currentPage = 1,
    totalPages = 1,
    onPageChange,
    pageSize,
    onPageSizeChange,
    pageSizeOptions = [5, 10, 20, 50],
    totalItems,
    className = "",
  } = pagination;
  const safe = Math.max(totalPages || 1, 1);
  return (
    <div className={`flex flex-col gap-3 border-t bg-white/80 p-4 sm:flex-row sm:items-center sm:justify-between ${className}`}>
      <div className="flex flex-wrap items-center gap-3 text-sm text-gray-700">
        {typeof totalItems === "number" && <span className="font-medium">{totalItems} total</span>}
        {pageSize && onPageSizeChange && (
          <label className="flex items-center gap-2">
            <span>Rows per page:</span>
            <select
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
              className="h-8 rounded-md border border-gray-300 bg-white px-2 text-sm"
            >
              {pageSizeOptions.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          </label>
        )}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button variant="outline" size="sm" onClick={() => onPageChange?.(1)} disabled={currentPage <= 1}>First</Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange?.(currentPage - 1)} disabled={currentPage <= 1}>Prev</Button>
        <span className="px-2 text-sm font-medium text-gray-700">Page {currentPage} of {safe}</span>
        <Button variant="outline" size="sm" onClick={() => onPageChange?.(currentPage + 1)} disabled={currentPage >= safe}>Next</Button>
        <Button variant="outline" size="sm" onClick={() => onPageChange?.(safe)} disabled={currentPage >= safe}>Last</Button>
      </div>
    </div>
  );
}

// ─── Dynamic badge color helper ───────────────────────────────────────────────
function getStatusBadgeClass(value) {
  if (!value) return "bg-gray-100 text-gray-600 border-gray-200";
  const v = String(value).toLowerCase();
  if (["active", "shared", "completed", "bench"].includes(v)) return "bg-green-100 text-green-700 border-green-200";
  if (["rejected", "inactive", "cancelled"].includes(v)) return "bg-red-100 text-red-700 border-red-200";
  if (["notice period"].includes(v)) return "bg-orange-100 text-orange-700 border-orange-200";
  if (["pending", "in progress", "on hold", "planned", "new"].includes(v)) return "bg-yellow-100 text-yellow-700 border-yellow-200";
  return "bg-blue-100 text-blue-700 border-blue-200";
}

// ─── Dynamic Card ─────────────────────────────────────────────────────────────
function DynamicCard({
  row, index, fieldColumns, actionColumns,
  primaryField, secondaryField, badgeField, cardFields,
  renderCell, onRowClick, cardClassName,
  isExpanded, renderExpandedContent,
}) {
  const excludeKeys = new Set([
    ...(primaryField ? [primaryField] : []),
    ...(secondaryField ? [secondaryField] : []),
    ...(badgeField ? [badgeField] : []),
  ]);

  const primaryCol = useMemo(
    () => (primaryField ? fieldColumns.find((c) => c.key === primaryField) : fieldColumns[0]),
    [fieldColumns, primaryField],
  );
  const secondaryCol = useMemo(
    () => (secondaryField ? fieldColumns.find((c) => c.key === secondaryField) : null),
    [fieldColumns, secondaryField],
  );
  const badgeCol = useMemo(
    () => (badgeField ? fieldColumns.find((c) => c.key === badgeField) : null),
    [fieldColumns, badgeField],
  );

  const bodyColumns = useMemo(() => {
    if (cardFields?.length > 0) {
      return cardFields.map((k) => fieldColumns.find((c) => c.key === k)).filter(Boolean);
    }
    return fieldColumns.filter((c) => !excludeKeys.has(c.key) && c !== primaryCol).slice(0, 8);
  }, [fieldColumns, cardFields, primaryCol, excludeKeys]);

  const badgeRaw = badgeCol ? (row?.[badgeField] ?? null) : null;

  return (
    <div
      onClick={onRowClick ? () => onRowClick(row, index) : undefined}
      className={[
        "flex flex-col rounded-xl border border-gray-200 bg-white shadow-sm transition-all duration-200",
        "hover:shadow-md hover:-translate-y-0.5",
        onRowClick ? "cursor-pointer" : "",
        cardClassName,
      ].filter(Boolean).join(" ")}
    >
      {/* Card header */}
      <div className="flex items-start justify-between gap-2 px-4 pt-4 pb-3 border-b border-gray-100">
        <div className="min-w-0 flex-1">
          {primaryCol && (
            <div className="font-semibold text-gray-900 text-sm leading-snug truncate">
              {renderCell(primaryCol, row, index, VIEW_MODES.card)}
            </div>
          )}
          {secondaryCol && (
            <div className="text-xs text-gray-500 mt-0.5 truncate">
              {renderCell(secondaryCol, row, index, VIEW_MODES.card)}
            </div>
          )}
        </div>
        {badgeRaw && (
          <span className={`shrink-0 mt-0.5 inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${getStatusBadgeClass(badgeRaw)}`}>
            {badgeRaw}
          </span>
        )}
      </div>

      {/* Card body */}
      {bodyColumns.length > 0 && (
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 px-4 py-3 flex-1">
          {bodyColumns.map((col) => (
            <div key={col.key} className={col.cardClassName}>
              <p className="text-[10px] font-semibold uppercase tracking-wide text-gray-400 mb-0.5">{col.label}</p>
              <div className="text-sm text-gray-800 leading-snug">
                {renderCell(col, row, index, VIEW_MODES.card)}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Card actions */}
      {actionColumns.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-t border-gray-100 px-4 py-3">
          {actionColumns.map((col) => (
            <div key={col.key}>{renderCell(col, row, index, VIEW_MODES.card)}</div>
          ))}
        </div>
      )}

      {/* Expanded content */}
      {isExpanded && renderExpandedContent && (
        <div className="border-t border-gray-100 px-4 py-3">
          {renderExpandedContent(row, index)}
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
/**
 * ReusableDataView — universal list/card view component.
 *
 * Two usage modes:
 *  1. Self-contained (backward-compat): pass tableKey + columns + defaultViewMode,
 *     the component renders its own toolbar internally.
 *  2. Controlled: pass `controls` from useDataViewControls(). The component
 *     renders NO toolbar — you place <DataViewToolbar controls={controls}/> yourself.
 */
export default function ReusableDataView({
  // Identity
  tableKey,
  // Data
  data = [],
  columns = [],
  rowKey = "id",
  loading = false,
  emptyMessage = "No records found.",
  // View mode
  defaultViewMode = VIEW_MODES.table,
  // External controls (from useDataViewControls hook)
  controls: externalControls,
  // Sorting
  sortState,
  onSort,
  // Pagination
  pagination,
  // Row behaviour
  onRowClick,
  renderExpandedContent,
  expandedRowKeys,
  getRowClassName,
  // Toolbar (only used when controls are NOT external)
  toolbarLeft,
  // Card-view specific
  primaryField,
  secondaryField,
  badgeField,
  cardFields,
  renderCard,
  // Class names
  tableClassName = "",
  tableHeaderClassName = "",
  tableRowClassName = "",
  tableContainerClassName = "",
  cardGridClassName = "",
  cardClassName = "",
}) {
  // Use external controls if provided; otherwise create internal ones
  const internalControls = useDataViewControls(
    tableKey || "default",
    columns,
    defaultViewMode,
  );
  const controls = externalControls || internalControls;

  const { preferences, orderedColumns, visibleColumns, handleTableHeaderDragEnd } = controls;

  const tableSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const getRowId = (row, index) => {
    if (typeof rowKey === "function") return rowKey(row, index);
    return row?.[rowKey] ?? index;
  };

  const isExpanded = (row, index) => {
    if (!expandedRowKeys) return false;
    const key = getRowId(row, index);
    return expandedRowKeys instanceof Set ? expandedRowKeys.has(key) : expandedRowKeys.includes(key);
  };

  const renderCell = (column, row, index, viewMode) => {
    if (column.render) return column.render(row, index, viewMode);
    return row?.[column.key] ?? "N/A";
  };

  const fieldColumns = visibleColumns.filter((c) => c.type !== "actions");
  const actionColumns = visibleColumns.filter((c) => c.type === "actions");

  const showInternalToolbar = !externalControls;

  return (
    <div className="space-y-0">
      {/* Internal toolbar — only shown when no external controls provided */}
      {showInternalToolbar && (
        <div className="flex flex-col gap-3 rounded-lg border border-gray-200 bg-white/90 p-3 shadow-sm sm:flex-row sm:items-center sm:justify-between mb-3">
          <div className="min-w-0 flex-1">{toolbarLeft}</div>
          <DataViewToolbar controls={controls} />
        </div>
      )}

      {/* TABLE VIEW */}
      {preferences.viewMode === VIEW_MODES.table ? (
        <div className={`rounded-lg border border-gray-200 bg-white shadow-sm ${tableContainerClassName}`}>
          <div className="relative overflow-auto">
            <DndContext sensors={tableSensors} collisionDetection={closestCenter} onDragEnd={handleTableHeaderDragEnd}>
              <Table className={tableClassName}>
                <TableHeader className={tableHeaderClassName}>
                  <TableRow>
                    <SortableContext
                      items={visibleColumns.map((c) => c.key)}
                      strategy={horizontalListSortingStrategy}
                    >
                      {visibleColumns.map((col) => (
                        <SortableColumnHeader
                          key={col.key}
                          column={col}
                          sortState={sortState}
                          onSort={onSort}
                          headerClassName=""
                        />
                      ))}
                    </SortableContext>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={visibleColumns.length} className="py-12 text-center text-gray-500">
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : data.length > 0 ? (
                    data.map((row, index) => {
                      const rowId = getRowId(row, index);
                      const expanded = isExpanded(row, index);
                      return (
                        <React.Fragment key={rowId}>
                          <TableRow
                            onClick={onRowClick ? () => onRowClick(row, index) : undefined}
                            className={[
                              onRowClick ? "cursor-pointer" : "",
                              tableRowClassName,
                              getRowClassName?.(row, index) || "",
                            ].filter(Boolean).join(" ")}
                          >
                            {visibleColumns.map((col) => (
                              <TableCell key={col.key} className={col.cellClassName}>
                                {renderCell(col, row, index, VIEW_MODES.table)}
                              </TableCell>
                            ))}
                          </TableRow>
                          {expanded && renderExpandedContent && (
                            <TableRow>
                              <TableCell colSpan={visibleColumns.length} className="p-0">
                                {renderExpandedContent(row, index)}
                              </TableCell>
                            </TableRow>
                          )}
                        </React.Fragment>
                      );
                    })
                  ) : (
                    <TableRow>
                      <TableCell colSpan={visibleColumns.length} className="py-12 text-center text-gray-500">
                        {emptyMessage}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </DndContext>
          </div>
          <DataViewPagination pagination={pagination} />
        </div>
      ) : (
        /* CARD VIEW */
        <div className="rounded-lg border border-gray-200 bg-white/60 p-4 shadow-sm">
          {loading ? (
            <div className="py-12 text-center text-gray-500">Loading…</div>
          ) : data.length > 0 ? (
            <div className={`grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 ${cardGridClassName}`}>
              {data.map((row, index) => {
                const rowId = getRowId(row, index);
                if (renderCard) {
                  return <div key={rowId}>{renderCard(row, index)}</div>;
                }
                return (
                  <DynamicCard
                    key={rowId}
                    row={row}
                    index={index}
                    fieldColumns={fieldColumns}
                    actionColumns={actionColumns}
                    primaryField={primaryField}
                    secondaryField={secondaryField}
                    badgeField={badgeField}
                    cardFields={cardFields}
                    renderCell={renderCell}
                    onRowClick={onRowClick}
                    cardClassName={cardClassName}
                    isExpanded={isExpanded(row, index)}
                    renderExpandedContent={renderExpandedContent}
                  />
                );
              })}
            </div>
          ) : (
            <div className="py-12 text-center text-gray-500">{emptyMessage}</div>
          )}
          <DataViewPagination pagination={pagination} />
        </div>
      )}
    </div>
  );
}
