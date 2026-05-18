import { useEffect, useMemo, useState } from "react";
import { arrayMove } from "@dnd-kit/sortable";
import {
  buildDefaultPreferences,
  isForcedVisibleColumn,
  readDataViewPreferences,
  sanitizeDataViewPreferences,
  writeDataViewPreferences,
} from "./dataViewPreferences.js";

/**
 * Hook that manages all DataView toolbar state (view mode, column prefs, customizer).
 *
 * Usage in a page:
 *   const controls = useDataViewControls("clients", clientColumns, "table");
 *   // Place <DataViewToolbar controls={controls} /> in your filter row
 *   // Pass controls={controls} to <ReusableDataView />
 */
export function useDataViewControls(tableKey, columns, defaultViewMode = "table") {
  const storageKey = `data-view-preferences-${tableKey}`;

  const columnSignature = useMemo(
    () =>
      columns
        .map((col) => `${col.key}:${col.hideable === false}:${col.type || "field"}`)
        .join("|"),
    [columns],
  );

  const [preferences, setPreferences] = useState(() =>
    readDataViewPreferences(storageKey, columns, defaultViewMode),
  );
  const [customizerOpen, setCustomizerOpen] = useState(false);

  // Re-sync when table key or columns change
  useEffect(() => {
    setPreferences(readDataViewPreferences(storageKey, columns, defaultViewMode));
  }, [storageKey, columnSignature, defaultViewMode]);

  // Persist on every preferences change
  useEffect(() => {
    writeDataViewPreferences(storageKey, preferences);
  }, [preferences, storageKey]);

  const columnMap = useMemo(
    () => new Map(columns.map((col) => [col.key, col])),
    [columns],
  );

  const orderedColumns = useMemo(() => {
    const sanitized = sanitizeDataViewPreferences(preferences, columns, defaultViewMode);
    return sanitized.columnOrder.map((key) => columnMap.get(key)).filter(Boolean);
  }, [columnMap, columns, defaultViewMode, preferences]);

  const visibleColumns = useMemo(() => {
    const visibleSet = new Set(preferences.visibleColumnKeys);
    return orderedColumns.filter((col) => visibleSet.has(col.key));
  }, [orderedColumns, preferences.visibleColumnKeys]);

  const updateViewMode = (viewMode) => {
    setPreferences((current) => ({ ...current, viewMode }));
  };

  const resetLayout = () => {
    setPreferences(buildDefaultPreferences(columns, defaultViewMode));
    setCustomizerOpen(false);
  };

  /** Called by CustomizeColumnsModal when user clicks Apply */
  const applyColumnChanges = (newVisibleKeys, newColumnOrder) => {
    const visibleSet = new Set(newVisibleKeys);
    setPreferences((current) => ({
      ...current,
      columnOrder: newColumnOrder,
      visibleColumnKeys: newColumnOrder.filter((key) => visibleSet.has(key)),
    }));
  };

  /** Called when columns are reordered by dragging table headers directly */
  const handleTableHeaderDragEnd = ({ active, over }) => {
    if (!over || active.id === over.id) return;
    setPreferences((current) => {
      const oldIndex = current.columnOrder.indexOf(active.id);
      const newIndex = current.columnOrder.indexOf(over.id);
      if (oldIndex === -1 || newIndex === -1) return current;
      const columnOrder = arrayMove(current.columnOrder, oldIndex, newIndex);
      const visibleSet = new Set(current.visibleColumnKeys);
      return {
        ...current,
        columnOrder,
        visibleColumnKeys: columnOrder.filter((key) => visibleSet.has(key)),
      };
    });
  };

  return {
    // State
    preferences,
    orderedColumns,
    visibleColumns,
    customizerOpen,
    // Actions
    setCustomizerOpen,
    updateViewMode,
    resetLayout,
    applyColumnChanges,
    handleTableHeaderDragEnd,
    // Meta (needed by DataViewToolbar and ReusableDataView)
    columns,
    defaultViewMode,
    storageKey,
  };
}
