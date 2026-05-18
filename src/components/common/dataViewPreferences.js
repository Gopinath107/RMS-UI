export const DATA_VIEW_PREFERENCES_VERSION = 1;

const VALID_VIEW_MODES = new Set(["table", "card"]);

export function getColumnKeys(columns) {
  return columns.map((column) => column.key);
}

export function isForcedVisibleColumn(column) {
  return column.hideable === false || column.type === "actions";
}

export function buildDefaultPreferences(columns, defaultViewMode = "table") {
  const columnKeys = getColumnKeys(columns);

  return {
    version: DATA_VIEW_PREFERENCES_VERSION,
    viewMode: VALID_VIEW_MODES.has(defaultViewMode) ? defaultViewMode : "table",
    visibleColumnKeys: columnKeys,
    columnOrder: columnKeys,
  };
}

function parseStoredPreferences(storedPreferences) {
  if (!storedPreferences) return null;
  if (typeof storedPreferences === "string") {
    try {
      return JSON.parse(storedPreferences);
    } catch {
      return null;
    }
  }
  return storedPreferences;
}

export function sanitizeDataViewPreferences(storedPreferences, columns, defaultViewMode = "table") {
  const defaults = buildDefaultPreferences(columns, defaultViewMode);
  const parsed = parseStoredPreferences(storedPreferences);

  if (!parsed || typeof parsed !== "object") {
    return defaults;
  }

  const knownColumnKeys = new Set(defaults.columnOrder);
  const orderedKnownKeys = Array.isArray(parsed.columnOrder)
    ? parsed.columnOrder.filter((key) => knownColumnKeys.has(key))
    : [];
  const missingKeys = defaults.columnOrder.filter((key) => !orderedKnownKeys.includes(key));
  const columnOrder = [...orderedKnownKeys, ...missingKeys];

  const visibleSet = new Set(
    Array.isArray(parsed.visibleColumnKeys)
      ? parsed.visibleColumnKeys.filter((key) => knownColumnKeys.has(key))
      : defaults.visibleColumnKeys,
  );

  columns.forEach((column) => {
    if (isForcedVisibleColumn(column)) {
      visibleSet.add(column.key);
    }
  });

  const visibleNonActionKeys = columns
    .filter((column) => column.type !== "actions" && visibleSet.has(column.key))
    .map((column) => column.key);

  if (visibleNonActionKeys.length === 0) {
    const fallbackColumn = columnOrder
      .map((key) => columns.find((column) => column.key === key))
      .find((column) => column && column.type !== "actions");

    if (fallbackColumn) {
      visibleSet.add(fallbackColumn.key);
    }
  }

  return {
    version: DATA_VIEW_PREFERENCES_VERSION,
    viewMode: VALID_VIEW_MODES.has(parsed.viewMode) ? parsed.viewMode : defaults.viewMode,
    visibleColumnKeys: columnOrder.filter((key) => visibleSet.has(key)),
    columnOrder,
  };
}

export function readDataViewPreferences(storageKey, columns, defaultViewMode = "table", storage = globalThis.localStorage) {
  if (!storage || !storageKey) {
    return buildDefaultPreferences(columns, defaultViewMode);
  }

  return sanitizeDataViewPreferences(storage.getItem(storageKey), columns, defaultViewMode);
}

export function writeDataViewPreferences(storageKey, preferences, storage = globalThis.localStorage) {
  if (!storage || !storageKey) return;
  storage.setItem(storageKey, JSON.stringify(preferences));
}
