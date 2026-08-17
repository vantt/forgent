import test from 'node:test';
import assert from 'node:assert/strict';
import { doubleNumber } from './double-number.mjs';

test('doubleNumber doubles the input', () => {
  assert.strictEqual(doubleNumber(21), 42);
  assert.strictEqual(doubleNumber(0), 0);
});
