import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildDefaultPreferences,
  sanitizeDataViewPreferences,
} from './dataViewPreferences.js';

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'status', label: 'Status', type: 'status' },
  { key: 'email', label: 'Email' },
  { key: 'actions', label: 'Actions', type: 'actions', hideable: false },
];

test('builds table-first default preferences from column config', () => {
  assert.deepEqual(buildDefaultPreferences(columns, 'table'), {
    version: 1,
    viewMode: 'table',
    visibleColumnKeys: ['name', 'status', 'email', 'actions'],
    columnOrder: ['name', 'status', 'email', 'actions'],
  });
});

test('falls back to defaults when stored preferences are corrupted', () => {
  assert.deepEqual(sanitizeDataViewPreferences('not-json', columns, 'card'), {
    version: 1,
    viewMode: 'card',
    visibleColumnKeys: ['name', 'status', 'email', 'actions'],
    columnOrder: ['name', 'status', 'email', 'actions'],
  });
});

test('removes unknown columns and appends new columns', () => {
  const preferences = sanitizeDataViewPreferences(
    {
      version: 1,
      viewMode: 'table',
      visibleColumnKeys: ['ghost', 'email', 'actions'],
      columnOrder: ['ghost', 'email', 'name'],
    },
    columns,
    'table',
  );

  assert.deepEqual(preferences.columnOrder, ['email', 'name', 'status', 'actions']);
  assert.deepEqual(preferences.visibleColumnKeys, ['email', 'actions']);
});

test('keeps non-hideable action columns visible', () => {
  const preferences = sanitizeDataViewPreferences(
    {
      version: 1,
      viewMode: 'card',
      visibleColumnKeys: ['name'],
      columnOrder: ['name', 'status', 'email', 'actions'],
    },
    columns,
    'table',
  );

  assert.equal(preferences.viewMode, 'card');
  assert.ok(preferences.visibleColumnKeys.includes('actions'));
});

test('prevents hiding the final non-action field', () => {
  const preferences = sanitizeDataViewPreferences(
    {
      version: 1,
      viewMode: 'table',
      visibleColumnKeys: ['actions'],
      columnOrder: ['status', 'actions', 'email', 'name'],
    },
    columns,
    'table',
  );

  assert.deepEqual(preferences.visibleColumnKeys, ['status', 'actions']);
});
