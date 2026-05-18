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
import { ArrowDown, ArrowUp, ArrowUpDown, RotateCcw } from "lucide-react";
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
        "select-none whitespace-nowrap bg-inherit cursor-grab active:cursor-grabbing",
        isDragging ? "opacity-60 shadow-lg ring-2 ring-blue-300 rounded" : "",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      title="Drag to reorder"
      {...attributes}
      {...listeners}
    >
      <div className="flex items-center gap-1 group">
        {/* Label / children — clicking here triggers sort */}
        <span
          className={[
            "flex items-center gap-1 min-w-0",
            sortable ? "cursor-pointer hover:text-blue-700" : "",
          ].join(" ")}
          onPointerDown={(e) => {
            // Let the drag events handle the pointer down, but we also want click to work.
            // Dnd-kit's PointerSensor with distance constraint handles this gracefully.
          }}
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
 * ColumnOrderResetButton — small icon-only button to reset layout.
 */
export function ColumnOrderResetButton({ onReset, className = "" }) {
  return (
    <button
      type="button"
      onClick={onReset}
      title="Reset Columns"
      className={[
        "inline-flex items-center justify-center rounded-md border border-gray-200 bg-white p-2",
        "text-gray-500 shadow-sm hover:bg-gray-50 hover:text-gray-700 transition-colors",
        className,
      ].join(" ")}
    >
      <RotateCcw className="h-4 w-4" />
    </button>
  );
}
