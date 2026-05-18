/**
 * DraggableTableHead
 *
 * Drop-in replacement for <TableHead> that supports drag-to-reorder.
 * Must be used inside <SortableContext> and <DndContext>.
 *
 * Usage:
 *   <DraggableTableHead id="candidate" label="Candidate" />
 *   <DraggableTableHead id="status" label="Status" sortable sortKey="status"
 *     sortState={sortState} onSort={handleSort} />
 */

import React from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowDown, ArrowUp, ArrowUpDown, GripVertical } from "lucide-react";
import { TableHead } from "../ui/table.jsx";

function SortIcon({ columnId, sortState }) {
  const key = sortState?.key || sortState?.field || sortState?.sortField;
  const dir = sortState?.direction || sortState?.order || sortState?.sortOrder;
  if (key !== columnId)
    return <ArrowUpDown className="h-3 w-3 opacity-40 shrink-0" />;
  return dir === "desc" ? (
    <ArrowDown className="h-3 w-3 text-blue-600 shrink-0" />
  ) : (
    <ArrowUp className="h-3 w-3 text-blue-600 shrink-0" />
  );
}

export function DraggableTableHead({
  id,
  label,
  className = "",
  sortable = false,
  sortKey,
  sortState,
  onSort,
  children,
  style: externalStyle,
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 20 : undefined,
    ...externalStyle,
  };

  return (
    <TableHead
      ref={setNodeRef}
      style={style}
      className={[
        "select-none whitespace-nowrap bg-inherit",
        isDragging ? "opacity-60 shadow-lg ring-2 ring-blue-300 rounded" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="flex items-center gap-1 group">
        {/* Drag handle */}
        <span
          className="cursor-grab active:cursor-grabbing shrink-0 text-gray-300 group-hover:text-gray-500 transition-colors"
          title="Drag to reorder"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="h-3.5 w-3.5" />
        </span>

        {/* Label / children — clicking here triggers sort */}
        <span
          className={[
            "flex items-center gap-1 min-w-0",
            sortable ? "cursor-pointer hover:text-blue-700" : "",
          ].join(" ")}
          onClick={() => sortable && onSort?.(sortKey || id)}
        >
          <span className="truncate font-bold">{label ?? children}</span>
          {sortable && (
            <SortIcon columnId={sortKey || id} sortState={sortState} />
          )}
        </span>
      </div>
    </TableHead>
  );
}

/**
 * ColumnOrderResetButton — small "Reset Layout" button for use in toolbars.
 */
export function ColumnOrderResetButton({ onReset, className = "" }) {
  return (
    <button
      type="button"
      onClick={onReset}
      title="Reset column order"
      className={[
        "inline-flex items-center gap-1.5 rounded-md border border-gray-200 bg-white px-2.5 py-1.5",
        "text-xs font-medium text-gray-600 shadow-sm hover:bg-gray-50 transition-colors",
        className,
      ].join(" ")}
    >
      <svg
        className="h-3.5 w-3.5"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
        />
      </svg>
      Reset Columns
    </button>
  );
}
