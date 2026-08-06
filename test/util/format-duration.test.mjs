import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatDuration } from '../../src/util/format-duration.mjs';

test('formatDuration renders zero as 0s', () => {
  assert.equal(formatDuration(0), '0s');
});

test('formatDuration truncates a sub-second remainder instead of rounding', () => {
  assert.equal(formatDuration(999), '0s');
  assert.equal(formatDuration(1999), '1s');
});

test('formatDuration renders a seconds-only value in seconds', () => {
  assert.equal(formatDuration(45_000), '45s');
});

test('formatDuration renders minutes with their leftover seconds', () => {
  assert.equal(formatDuration(150_000), '2m 30s');
});

test('formatDuration drops the smaller unit when it is zero', () => {
  assert.equal(formatDuration(120_000), '2m');
  assert.equal(formatDuration(3 * 3600_000), '3h');
});

test('formatDuration renders hours with their leftover minutes', () => {
  assert.equal(formatDuration(5 * 3600_000 + 12 * 60_000), '5h 12m');
});

test('formatDuration renders days with their leftover hours', () => {
  assert.equal(formatDuration(86_400_000 + 3 * 3600_000), '1d 3h');
});

test('formatDuration stops at two units, never spelling out every one', () => {
  assert.equal(formatDuration(86_400_000 + 3 * 3600_000 + 12 * 60_000 + 30_000), '1d 3h');
});
