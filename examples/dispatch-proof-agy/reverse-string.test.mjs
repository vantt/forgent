import { test } from 'node:test';
import assert from 'node:assert/strict';
import { reverseString } from './reverse-string.mjs';

test('reverseString reverses string correctly', () => {
  assert.strictEqual(reverseString('agy'), 'yga');
  assert.strictEqual(reverseString(''), '');
});
