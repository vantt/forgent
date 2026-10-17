import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatLockDurationMs } from '../../src/util/format-lock-duration.mjs';

test('formatLockDurationMs renders seconds-only under a minute', () => {
  assert.equal(formatLockDurationMs(45_000), '45s');
  assert.equal(formatLockDurationMs(0), '0s');
});

test('formatLockDurationMs renders minutes and seconds at or above a minute', () => {
  assert.equal(formatLockDurationMs(60_000), '1m0s');
  assert.equal(formatLockDurationMs(135_000), '2m15s');
});

test('formatLockDurationMs never fabricates a duration for non-numeric or negative input', () => {
  for (const value of [undefined, null, '5', NaN, -1]) assert.equal(formatLockDurationMs(value), 'unknown');
});
