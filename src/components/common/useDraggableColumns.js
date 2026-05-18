/**
 * useDraggableColumns
 *
 * Lightweight hook that adds drag-to-reorder column support to ANY existing table.
 * Persists column order to localStorage keyed by tableKey.
 * Works alongside the existing dataViewPreferences system.
 *
 * Usage:
 *   const { columnOrder, sensors, handleDragEnd, resetColumns } = useDraggableColumns(
 *     "interviews",             // unique key for localStorage
 *     ["type","date","candidate","levels","status","resources","onboard","actions"]  // default order
 *   );
 *
 *   Then wrap your <TableHeader> with <DndContext> + <SortableContext>
 *   and replace each <TableHead> with <DraggableTableHead>.
 */

import { useEffect, useState } from "react";
import {
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import { arrayMove, sortableKeyboardCoordinates } from "@dnd-kit/sortable";

const STORAGE_PREFIX = "rms-col-order-";

function readOrder(key, defaults) {
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + key);
    if (!raw) return defaults;
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return defaults;
    // Merge: keep user order for known keys, append any new keys at end
    const known = new Set(defaults);
    const filtered = parsed.filter((k) => known.has(k));
    const missing = defaults.filter((k) => !filtered.includes(k));
    return [...filtered, ...missing];
  } catch {
    return defaults;
  }
}

function writeOrder(key, order) {
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(order));
  } catch {
    // ignore storage errors
  }
}

export function useDraggableColumns(tableKey, defaultColumnKeys) {
  const [columnOrder, setColumnOrder] = useState(() =>
    readOrder(tableKey, defaultColumnKeys)
  );

  // Re-sync when table key changes
  useEffect(() => {
    setColumnOrder(readOrder(tableKey, defaultColumnKeys));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableKey]);

  // Persist on change
  useEffect(() => {
    writeOrder(tableKey, columnOrder);
  }, [tableKey, columnOrder]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setColumnOrder((cur) => {
      const oldIndex = cur.indexOf(active.id);
      const newIndex = cur.indexOf(over.id);
      if (oldIndex === -1 || newIndex === -1) return cur;
      return arrayMove(cur, oldIndex, newIndex);
    });
  };

  const resetColumns = () => {
    setColumnOrder(defaultColumnKeys);
    writeOrder(tableKey, defaultColumnKeys);
  };

  return { columnOrder, sensors, handleDragEnd, resetColumns };
}
