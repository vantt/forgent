import { test } from 'node:test';
import assert from 'node:assert/strict';
import { formatBytes } from '../../src/util/format-bytes.mjs';

// Pure lib — every input here is a literal; no fs, no mkdtemp, no `.fgos/`
// writes anywhere in this file.

test('formatBytes(0) stays in bytes', () => {
  assert.equal(formatBytes(0), '0 B');
});

test('formatBytes under 1024 stays in bytes', () => {
  assert.equal(formatBytes(1), '1 B');
  assert.equal(formatBytes(512), '512 B');
  assert.equal(formatBytes(1023), '1023 B');
});

test('formatBytes steps up exactly at each 1024 boundary', () => {
  assert.equal(formatBytes(1024), '1 KB');
  assert.equal(formatBytes(1024 * 1024), '1 MB');
  assert.equal(formatBytes(1024 * 1024 * 1024), '1 GB');
});

// The case that would silently break if someone "fixed" the divisor to
// 1000: under base 1000 this reads `1.5 MB`, under CONTEXT.md D1's binary
// base it reads `1.43 MB`.
test('formatBytes uses the 1024 base, not 1000', () => {
  assert.equal(formatBytes(1_500_000), '1.43 MB');
  assert.equal(formatBytes(1000), '1000 B');
  assert.equal(formatBytes(1_000_000), '976.56 KB');
});

test('formatBytes trims a trailing zero decimal', () => {
  assert.equal(formatBytes(1536), '1.5 KB');
  assert.equal(formatBytes(2048), '2 KB');
});

test('formatBytes caps at GB, the largest unit', () => {
  assert.equal(formatBytes(2048 * 1024 * 1024 * 1024), '2048 GB');
});
