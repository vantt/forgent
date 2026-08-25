import test from 'node:test';
import assert from 'node:assert/strict';
import { toUpperFirst } from './upper-case.mjs';

test('toUpperFirst uppercases first character', () => {
  assert.equal(toUpperFirst('agy'), 'Agy');
});

test('toUpperFirst handles empty string', () => {
  assert.equal(toUpperFirst(''), '');
});
