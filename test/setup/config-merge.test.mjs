import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mergeConfigDefaults } from '../../src/setup/config-merge.mjs';

test('mergeConfigDefaults adds a top-level key present in defaults but absent from existing', () => {
  const { merged, addedKeys } = mergeConfigDefaults({ a: 1 }, { a: 1, b: 2 });
  assert.deepEqual(merged, { a: 1, b: 2 });
  assert.deepEqual(addedKeys, ['b']);
});

test('mergeConfigDefaults never overwrites a value already present in existing, at the top level', () => {
  const { merged, addedKeys } = mergeConfigDefaults({ a: 99 }, { a: 1 });
  assert.deepEqual(merged, { a: 99 });
  assert.deepEqual(addedKeys, []);
});

test('mergeConfigDefaults returns an empty addedKeys list when existing already has everything', () => {
  const { merged, addedKeys } = mergeConfigDefaults({ a: 1, b: 2 }, { a: 1, b: 2 });
  assert.deepEqual(merged, { a: 1, b: 2 });
  assert.deepEqual(addedKeys, []);
});

test('mergeConfigDefaults fills a missing key nested inside an object present in existing (e.g. parallel.maxRoots)', () => {
  const existing = { parallel: { maxLeavesPerRoot: 4 } };
  const defaults = { parallel: { maxRoots: 4, maxLeavesPerRoot: 4 } };
  const { merged, addedKeys } = mergeConfigDefaults(existing, defaults);
  assert.deepEqual(merged, { parallel: { maxRoots: 4, maxLeavesPerRoot: 4 } });
  assert.deepEqual(addedKeys, ['parallel.maxRoots']);
});

test('mergeConfigDefaults never overwrites a nested value already present, even alongside a missing sibling key', () => {
  const existing = { parallel: { maxRoots: 99 } };
  const defaults = { parallel: { maxRoots: 4, maxLeavesPerRoot: 4 } };
  const { merged, addedKeys } = mergeConfigDefaults(existing, defaults);
  assert.deepEqual(merged, { parallel: { maxRoots: 99, maxLeavesPerRoot: 4 } });
  assert.deepEqual(addedKeys, ['parallel.maxLeavesPerRoot']);
});

test('mergeConfigDefaults adds a whole missing nested object wholesale, reporting only the top-level path', () => {
  const existing = {};
  const defaults = { parallel: { maxRoots: 4, maxLeavesPerRoot: 4 } };
  const { merged, addedKeys } = mergeConfigDefaults(existing, defaults);
  assert.deepEqual(merged, { parallel: { maxRoots: 4, maxLeavesPerRoot: 4 } });
  assert.deepEqual(addedKeys, ['parallel']);
});

test('mergeConfigDefaults treats an existing array as a leaf: never recursed into or partially merged, even when shorter than defaults', () => {
  const existing = { executor: { args: ['{prompt}'] } };
  const defaults = { executor: { args: ['{prompt}', '--model', '{model}'] } };
  const { merged, addedKeys } = mergeConfigDefaults(existing, defaults);
  assert.deepEqual(merged.executor.args, ['{prompt}']);
  assert.deepEqual(addedKeys, []);
});

test('mergeConfigDefaults copies a missing array key wholesale from defaults', () => {
  const existing = { executor: {} };
  const defaults = { executor: { args: ['{prompt}', '--model', '{model}'] } };
  const { merged, addedKeys } = mergeConfigDefaults(existing, defaults);
  assert.deepEqual(merged.executor.args, ['{prompt}', '--model', '{model}']);
  assert.deepEqual(addedKeys, ['executor.args']);
});

test('mergeConfigDefaults does not mutate its inputs', () => {
  const existing = { a: 1, parallel: { maxLeavesPerRoot: 4 } };
  const defaults = { a: 1, parallel: { maxRoots: 4, maxLeavesPerRoot: 4 }, b: 2 };
  const existingCopy = JSON.parse(JSON.stringify(existing));
  const defaultsCopy = JSON.parse(JSON.stringify(defaults));
  mergeConfigDefaults(existing, defaults);
  assert.deepEqual(existing, existingCopy);
  assert.deepEqual(defaults, defaultsCopy);
});

test('mergeConfigDefaults is general-purpose: works on an arbitrary config shape unrelated to runner fields', () => {
  const existing = { theme: { color: 'blue' } };
  const defaults = { theme: { color: 'red', fontSize: 12 }, locale: 'en' };
  const { merged, addedKeys } = mergeConfigDefaults(existing, defaults);
  assert.deepEqual(merged, { theme: { color: 'blue', fontSize: 12 }, locale: 'en' });
  assert.deepEqual(addedKeys.sort(), ['locale', 'theme.fontSize']);
});
